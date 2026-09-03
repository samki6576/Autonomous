import { NextRequest, NextResponse } from "next/server";
import {
  SUPPLIERS,
  PORTS,
  COMMODITIES,
  INVENTORY,
  DEMO_SKU,
} from "@/lib/mockData";
import crypto from "crypto";

// In-memory "database" for the demo. Resets on cold start / redeploy.
// Swap this for Postgres (Vercel Postgres / Neon) in production.
type PoDraft = {
  po_draft_id: string;
  po_number: string;
  supplier_id: string;
  line_items: { sku: string; quantity: number; agreed_price: number }[];
  delivery_date: string;
  delivery_terms: string;
  payment_terms: string;
  total_amount: number;
  status: "PENDING_APPROVAL" | "EXECUTED";
  created_at: string;
};

const g = globalThis as unknown as {
  __poDrafts?: Map<string, PoDraft>;
  __auditLog?: { id: string; ts: string; action: string; detail: string }[];
};
g.__poDrafts ??= new Map();
g.__auditLog ??= [];

function jitter(base: number, pct: number) {
  return base * (1 + (Math.random() * 2 - 1) * pct);
}

function findSupplier(id: string) {
  const s = SUPPLIERS.find((s) => s.id === id);
  if (!s) throw new Error(`Unknown supplier_id: ${id}`);
  return s;
}

function findPort(code: string) {
  const p = PORTS.find((p) => p.code === code);
  if (!p) throw new Error(`Unknown port_code: ${code}`);
  return p;
}

export async function POST(req: NextRequest) {
  const { tool, args } = await req.json();

  try {
    switch (tool) {
      case "fetch_commodity_prices": {
        const commodities: string[] = args.commodities ?? [];
        const result: Record<string, unknown> = {};
        for (const c of commodities) {
          const base = COMMODITIES[c];
          if (!base) continue;
          result[c] = {
            price: Number(jitter(base.price, 0.01).toFixed(2)),
            unit: base.unit,
            change_24h: base.change24h,
            change_7d: Number(jitter(base.change24h * 2.4, 0.2).toFixed(2)),
          };
        }
        return NextResponse.json({ prices: result, currency: args.currency ?? "USD" });
      }

      case "calculate_landed_cost": {
        const supplier = findSupplier(args.supplier_id);
        const destPort = findPort(args.destination_port);
        const originPort = PORTS.find((p) => p.code === args.origin_port);
        const base = supplier.basePriceUsd * args.quantity;
        const shipping = jitter(
          (originPort?.riskScore ?? 40) * 6 + args.quantity * 0.02,
          0.1
        );
        const tariff = base * 0.032;
        const insurance = base * 0.006;
        const fxRate = 1.0;
        const total = base + shipping + tariff + insurance;
        return NextResponse.json({
          total_landed_cost: Number(total.toFixed(2)),
          breakdown: {
            base: Number(base.toFixed(2)),
            shipping: Number(shipping.toFixed(2)),
            tariff: Number(tariff.toFixed(2)),
            insurance: Number(insurance.toFixed(2)),
            fx_rate: fxRate,
          },
          destination_port: destPort.name,
        });
      }

      case "analyze_supplier_health": {
        const supplier = findSupplier(args.supplier_id);
        const riskFactors: string[] = [];
        if (supplier.qualityRejectRate > 2) riskFactors.push("Elevated quality rejection rate");
        if (supplier.onTimeRate < 90) riskFactors.push("On-time delivery below 90%");
        if (supplier.healthScore < 70) riskFactors.push("Financial health below internal threshold");
        const recommendation =
          supplier.healthScore >= 80
            ? "APPROVED"
            : supplier.healthScore >= 65
            ? "WATCH"
            : "FLAGGED";
        return NextResponse.json({
          supplier_id: supplier.id,
          health_score: supplier.healthScore,
          on_time_rate: supplier.onTimeRate,
          quality_reject_rate: supplier.qualityRejectRate,
          risk_factors: riskFactors,
          recommendation,
        });
      }

      case "simulate_bulk_discount": {
        const supplier = findSupplier(args.supplier_id);
        const step = args.step ?? 100;
        const curve: { qty: number; unit_cost: number; total: number }[] = [];
        let best = { qty: args.min_qty, unit_cost: supplier.basePriceUsd, total: Infinity };
        for (let q = args.min_qty; q <= args.max_qty; q += step) {
          const discount = Math.min(0.18, Math.log10(q / args.min_qty + 1) * 0.09);
          const unitCost = supplier.basePriceUsd * (1 - discount);
          const total = unitCost * q;
          curve.push({ qty: q, unit_cost: Number(unitCost.toFixed(3)), total: Number(total.toFixed(2)) });
          if (unitCost < best.unit_cost) best = { qty: q, unit_cost: unitCost, total };
        }
        const currentTotal = supplier.basePriceUsd * args.min_qty;
        return NextResponse.json({
          optimal_qty: best.qty,
          optimal_unit_cost: Number(best.unit_cost.toFixed(3)),
          savings_vs_current: Number((currentTotal - best.total).toFixed(2)),
          discount_curve: curve,
        });
      }

      case "get_inventory_status": {
        const skus: string[] = args.skus ?? [DEMO_SKU];
        const result: Record<string, unknown> = {};
        for (const sku of skus) {
          const inv = INVENTORY[sku] ?? INVENTORY[DEMO_SKU];
          result[sku] = {
            ...inv,
            reorder_point: inv.safetyStock * 1.2,
            warehouses: [
              { id: "wh-eu-1", stock: Math.round(inv.totalStock * 0.6) },
              { id: "wh-eu-2", stock: Math.round(inv.totalStock * 0.4) },
            ],
          };
        }
        return NextResponse.json(result);
      }

      case "assess_port_risk": {
        const port = findPort(args.port_code);
        const alerts: string[] = [];
        if (port.congestion === "HIGH") alerts.push(`${port.name}: severe congestion, est. 48-96h berth delay`);
        if (port.riskScore > 60) alerts.push(`${port.name}: elevated labor action risk this week`);
        return NextResponse.json({
          port_code: port.code,
          port_name: port.name,
          congestion_level: port.congestion,
          risk_score: port.riskScore,
          alerts,
        });
      }

      case "generate_po_draft": {
        const supplier = findSupplier(args.supplier_id);
        const total = (args.line_items as { quantity: number; agreed_price: number }[]).reduce(
          (sum, li) => sum + li.quantity * li.agreed_price,
          0
        );
        const id = crypto.randomUUID();
        const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`;
        const draft: PoDraft = {
          po_draft_id: id,
          po_number: poNumber,
          supplier_id: supplier.id,
          line_items: args.line_items,
          delivery_date: args.delivery_date,
          delivery_terms: args.delivery_terms ?? "FOB",
          payment_terms: args.payment_terms ?? "Net 30",
          total_amount: Number(total.toFixed(2)),
          status: "PENDING_APPROVAL",
          created_at: new Date().toISOString(),
        };
        g.__poDrafts!.set(id, draft);
        g.__auditLog!.push({
          id: crypto.randomUUID(),
          ts: new Date().toISOString(),
          action: "PO_DRAFT_CREATED",
          detail: `${poNumber} for ${supplier.name} — $${draft.total_amount.toLocaleString()}`,
        });
        return NextResponse.json({
          po_draft_id: draft.po_draft_id,
          po_number: draft.po_number,
          total_amount: draft.total_amount,
          supplier_name: supplier.name,
          status: draft.status,
          requires_approval: true,
        });
      }

      case "request_approval_token": {
        // Simulates the human clicking "Approve" in the UI.
        const draft = g.__poDrafts!.get(args.po_draft_id);
        if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
        const nonce = crypto.randomBytes(8).toString("hex");
        const payload = `${draft.po_draft_id}:${args.human_user_id ?? "demo-user"}:${Date.now()}:${nonce}`;
        const token = crypto.createHash("sha256").update(payload).digest("hex");
        g.__auditLog!.push({
          id: crypto.randomUUID(),
          ts: new Date().toISOString(),
          action: "HUMAN_APPROVAL",
          detail: `Approval token issued for ${draft.po_number} by ${args.human_user_id ?? "demo-user"}`,
        });
        return NextResponse.json({ human_approval_token: token });
      }

      case "execute_approved_po": {
        const draft = g.__poDrafts!.get(args.po_draft_id);
        if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
        if (!args.human_approval_token || typeof args.human_approval_token !== "string" || args.human_approval_token.length < 10) {
          return NextResponse.json({ error: "Missing or invalid human_approval_token" }, { status: 403 });
        }
        draft.status = "EXECUTED";
        const auditId = crypto.randomUUID();
        g.__auditLog!.push({
          id: auditId,
          ts: new Date().toISOString(),
          action: "PO_EXECUTED",
          detail: `${draft.po_number} sent to supplier. Total $${draft.total_amount.toLocaleString()}`,
        });
        return NextResponse.json({
          po_number: draft.po_number,
          status: draft.status,
          execution_timestamp: new Date().toISOString(),
          audit_id: auditId,
        });
      }

      case "list_audit_log": {
        return NextResponse.json({ log: g.__auditLog!.slice(-50).reverse() });
      }

      default:
        return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
