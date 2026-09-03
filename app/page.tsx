"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Heatmap from "@/components/Heatmap";
import PrioritySlider from "@/components/PrioritySlider";
import AgentSidebar, { LogEntry } from "@/components/AgentSidebar";
import SupplierCards, { Route } from "@/components/SupplierCards";
import ApprovalQueue, { PoDraft } from "@/components/ApprovalQueue";
import ActivityFeed, { ActivityItem } from "@/components/ActivityFeed";
import { buildToolDefinitions, callTool, isWebMCPAvailable } from "@/lib/tools";
import { PORTS, SUPPLIERS, DEMO_SKU } from "@/lib/mockData";

const CANDIDATE_ROUTES: { supplierId: string; portCode: string }[] = [
  { supplierId: "sup-rotterdam-cu", portCode: "NLRTM" },
  { supplierId: "sup-hamburg-cu", portCode: "DEHAM" },
  { supplierId: "sup-antwerp-cu", portCode: "BEANR" },
];

const ORDER_QTY = 20000;

function nowLabel() {
  return new Date().toLocaleTimeString();
}
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function Page() {
  const [priority, setPriority] = useState(30); // 0 = cost, 100 = speed
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [drafts, setDrafts] = useState<PoDraft[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [webmcpActive, setWebmcpActive] = useState(false);
  const [inspect, setInspect] = useState<{ kind: "port" | "supplier"; data: any } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const log = useCallback((tool: string, note: string) => {
    setLogEntries((prev) => [...prev.slice(-30), { id: uid(), tool, note, ts: nowLabel() }]);
  }, []);

  const pushActivity = useCallback((type: ActivityItem["type"], detail: string) => {
    setActivity((prev) => [...prev.slice(-40), { id: uid(), ts: nowLabel(), type, detail }]);
  }, []);

  // Register WebMCP tools if the browser supports document.modelContext
  // (Chrome 146+ with chrome://flags/#enable-webmcp-testing). Safe no-op otherwise.
  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    setWebmcpActive(isWebMCPAvailable());

    if (isWebMCPAvailable()) {
      const tools = buildToolDefinitions((entry) => log(entry.tool, entry.note));
      (async () => {
        for (const tool of tools) {
          await document.modelContext!.registerTool(tool, { signal: controller.signal });
        }
      })();
    }
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    pushActivity("SYSTEM_ALERT", "Port of Rotterdam congestion detected — est. 72-hour delay.");
  }, [pushActivity]);

  const runOrchestration = useCallback(
    async (priorityValue: number) => {
      setIsOrchestrating(true);
      setSelectedRoute(null);
      try {
        log("fetch_commodity_prices", "Checking whether copper prices moved…");
        const commodityRes = await callTool("fetch_commodity_prices", { commodities: ["copper"] });
        const copperChange = commodityRes.prices?.copper?.change_24h ?? 0;
        pushActivity("AGENT_ACTION", `Copper ${copperChange >= 0 ? "up" : "down"} ${Math.abs(copperChange)}% in 24h. Recalculating landed costs…`);

        log("get_inventory_status", "Checking current safety stock…");
        await callTool("get_inventory_status", { skus: [DEMO_SKU] });

        const results = await Promise.all(
          CANDIDATE_ROUTES.map(async ({ supplierId, portCode }) => {
            const supplier = SUPPLIERS.find((s) => s.id === supplierId)!;
            const port = PORTS.find((p) => p.code === portCode)!;

            log("calculate_landed_cost", `Pricing route via ${port.name}…`);
            const cost = await callTool("calculate_landed_cost", {
              supplier_id: supplierId,
              origin_port: portCode,
              destination_port: portCode,
              sku: DEMO_SKU,
              quantity: ORDER_QTY,
            });

            log("assess_port_risk", `Checking congestion at ${port.name}…`);
            const risk = await callTool("assess_port_risk", { port_code: portCode });

            log("analyze_supplier_health", `Scoring ${supplier.name}…`);
            const health = await callTool("analyze_supplier_health", { supplier_id: supplierId });

            const estDeliveryDays = Math.round(5 + risk.risk_score / 8);

            const route: Route = {
              id: `${supplierId}-${portCode}`,
              supplierId,
              supplierName: supplier.name,
              portCode,
              portName: port.name,
              landedCost: cost.total_landed_cost,
              estDeliveryDays,
              healthScore: health.health_score,
            };
            return route;
          })
        );

        log("simulate_bulk_discount", "Modeling bulk-order savings on the top candidate…");
        await callTool("simulate_bulk_discount", {
          supplier_id: results[0].supplierId,
          sku: DEMO_SKU,
          min_qty: ORDER_QTY,
          max_qty: ORDER_QTY * 3,
          step: 5000,
        });

        // Weighted score: priority=0 => pure cost, priority=100 => pure speed.
        const maxCost = Math.max(...results.map((r) => r.landedCost));
        const maxDays = Math.max(...results.map((r) => r.estDeliveryDays));
        const scored = results
          .map((r) => {
            const costScore = 1 - r.landedCost / maxCost;
            const speedScore = 1 - r.estDeliveryDays / maxDays;
            const weight = priorityValue / 100;
            const score = costScore * (1 - weight) + speedScore * weight;
            return { ...r, score };
          })
          .sort((a, b) => b.score - a.score)
          .map((r, i) => ({ ...r, recommended: i === 0 }));

        setRoutes(scored);
        pushActivity(
          "AGENT_ACTION",
          `Ranked ${scored.length} sourcing routes (${priorityValue < 50 ? "cost" : "speed"}-weighted). Top pick: ${scored[0].supplierName}.`
        );
      } catch (err) {
        pushActivity("SYSTEM_ALERT", `Agent orchestration failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      } finally {
        setIsOrchestrating(false);
      }
    },
    [log, pushActivity]
  );

  // Run once on load so the dashboard isn't empty.
  useEffect(() => {
    runOrchestration(priority);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectRoute = useCallback(
    async (route: Route) => {
      setSelectedRoute(route);
      try {
        log("generate_po_draft", `Drafting PO for ${route.supplierName} (pending human approval)…`);
        const deliveryDate = new Date(Date.now() + route.estDeliveryDays * 86400000).toISOString().slice(0, 10);
        const unitPrice = Number((route.landedCost / ORDER_QTY).toFixed(3));
        const draftRes = await callTool("generate_po_draft", {
          supplier_id: route.supplierId,
          line_items: [{ sku: DEMO_SKU, quantity: ORDER_QTY, agreed_price: unitPrice }],
          delivery_date: deliveryDate,
          delivery_terms: "FOB",
          payment_terms: "Net 30",
        });
        setDrafts((prev) => [
          ...prev,
          {
            po_draft_id: draftRes.po_draft_id,
            po_number: draftRes.po_number,
            supplier_name: draftRes.supplier_name,
            total_amount: draftRes.total_amount,
            status: "PENDING_APPROVAL",
          },
        ]);
        pushActivity("AGENT_ACTION", `${draftRes.po_number} drafted for ${draftRes.supplier_name} — awaiting human approval.`);
      } catch (err) {
        pushActivity("SYSTEM_ALERT", `Failed to draft PO: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    },
    [log, pushActivity]
  );

  const handleApprove = useCallback(
    async (draft: PoDraft) => {
      try {
        const tokenRes = await callTool("request_approval_token", {
          po_draft_id: draft.po_draft_id,
          human_user_id: "demo-user",
        });
        pushActivity("HUMAN_APPROVAL", `Approval token issued for ${draft.po_number}.`);

        log("execute_approved_po", `Executing ${draft.po_number}…`);
        const execRes = await callTool("execute_approved_po", {
          po_draft_id: draft.po_draft_id,
          human_approval_token: tokenRes.human_approval_token,
        });

        setDrafts((prev) =>
          prev.map((d) => (d.po_draft_id === draft.po_draft_id ? { ...d, status: "EXECUTED" } : d))
        );
        pushActivity("HUMAN_APPROVAL", `${execRes.po_number} executed and sent to supplier. Audit ID ${execRes.audit_id.slice(0, 8)}.`);
      } catch (err) {
        pushActivity("SYSTEM_ALERT", `Execution failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    },
    [log, pushActivity]
  );

  const handleSelectPort = useCallback(async (code: string) => {
    log("assess_port_risk", `Inspecting ${code}…`);
    const res = await callTool("assess_port_risk", { port_code: code });
    setInspect({ kind: "port", data: res });
  }, [log]);

  const handleSelectSupplier = useCallback(async (id: string) => {
    log("analyze_supplier_health", `Inspecting supplier ${id}…`);
    const res = await callTool("analyze_supplier_health", { supplier_id: id });
    setInspect({ kind: "supplier", data: res });
  }, [log]);

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-5">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-100">
            Autonomous Procurement &amp; Supply Chain Negotiator
          </h1>
          <p className="text-sm text-base-600">Agent-assisted sourcing decisions. Human approval required to spend.</p>
        </div>
        <div className="text-xs px-3 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 fade-in-up">
          🚨 Port of Rotterdam congestion detected — 72h delay
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Heatmap
            onSelectPort={handleSelectPort}
            onSelectSupplier={handleSelectSupplier}
            highlightPortCodes={["NLRTM"]}
          />

          {inspect && (
            <div className="rounded-xl border border-base-700 bg-base-900 p-3 text-xs fade-in-up flex items-start justify-between">
              <pre className="whitespace-pre-wrap text-gray-300">{JSON.stringify(inspect.data, null, 2)}</pre>
              <button onClick={() => setInspect(null)} className="text-base-600 hover:text-gray-300 ml-3">
                ✕
              </button>
            </div>
          )}

          <PrioritySlider
            value={priority}
            disabled={isOrchestrating}
            onChangeCommitted={(v) => {
              setPriority(v);
              runOrchestration(v);
            }}
          />

          <div>
            <h2 className="text-sm font-semibold text-gray-200 mb-2">
              Sourcing Routes {isOrchestrating && <span className="text-sky-400">— recalculating…</span>}
            </h2>
            <SupplierCards routes={routes} selectedId={selectedRoute?.id ?? null} onSelect={handleSelectRoute} />
          </div>

          <ApprovalQueue drafts={drafts} onApprove={handleApprove} />
        </div>

        <div className="space-y-5 lg:h-[calc(100vh-140px)] lg:sticky lg:top-6 flex flex-col">
          <div className="flex-1 min-h-[280px]">
            <AgentSidebar entries={logEntries} webmcpActive={webmcpActive} />
          </div>
          <ActivityFeed items={activity} />
        </div>
      </div>
    </main>
  );
}
