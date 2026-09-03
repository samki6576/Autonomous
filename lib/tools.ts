export type ToolName =
  | "fetch_commodity_prices"
  | "calculate_landed_cost"
  | "analyze_supplier_health"
  | "simulate_bulk_discount"
  | "get_inventory_status"
  | "assess_port_risk"
  | "generate_po_draft"
  | "request_approval_token"
  | "execute_approved_po"
  | "list_audit_log";

/**
 * Calls a tool's execute logic via the local API route. This is what actually
 * runs the "backend" for the demo (mocked external data — swap the route
 * handlers in app/api/agent/route.ts for real API calls in production).
 */
export async function callTool(tool: ToolName, args: Record<string, unknown> = {}) {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool, args }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Tool ${tool} failed (${res.status})`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// WebMCP tool registration
//
// document.modelContext is an experimental Chrome API (chrome://flags/
// #enable-webmcp-testing). When present, we register real tools so an
// in-browser MCP client/agent can call them directly. When absent (any
// normal browser), the app still works — the UI calls callTool() itself.
// ---------------------------------------------------------------------------

type ModelContextTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (args: any) => Promise<unknown>;
  annotations?: Record<string, unknown>;
};

declare global {
  interface Document {
    modelContext?: {
      registerTool: (tool: ModelContextTool, opts?: { signal?: AbortSignal }) => Promise<void> | void;
    };
  }
}

export function isWebMCPAvailable(): boolean {
  return typeof document !== "undefined" && !!document.modelContext;
}

export function buildToolDefinitions(
  onLog: (entry: { tool: string; note: string }) => void
): ModelContextTool[] {
  const wrap = (name: ToolName, note: string, fn: (args: any) => Promise<unknown>) => ({
    execute: async (args: any) => {
      onLog({ tool: name, note });
      return fn(args);
    },
  });

  return [
    {
      name: "fetch_commodity_prices",
      description:
        "Fetches real-time spot prices for copper, lithium, crude oil, natural gas, and precious metals from multiple commodity exchanges.",
      inputSchema: {
        type: "object",
        properties: {
          commodities: {
            type: "array",
            items: { type: "string", enum: ["copper", "lithium", "crude_oil", "natural_gas", "gold", "silver"] },
          },
          currency: { type: "string", enum: ["USD", "EUR", "GBP"], default: "USD" },
        },
        required: ["commodities"],
      },
      annotations: { readOnlyHint: true },
      ...wrap("fetch_commodity_prices", "Checking live commodity prices…", (a) =>
        callTool("fetch_commodity_prices", a)
      ),
    },
    {
      name: "calculate_landed_cost",
      description:
        "Calculates total landed cost including base price, shipping, tariffs, insurance, and FX conversion for a given supplier-port pair.",
      inputSchema: {
        type: "object",
        properties: {
          supplier_id: { type: "string" },
          origin_port: { type: "string" },
          destination_port: { type: "string" },
          sku: { type: "string" },
          quantity: { type: "number", minimum: 1 },
        },
        required: ["supplier_id", "origin_port", "destination_port", "sku", "quantity"],
      },
      annotations: { readOnlyHint: true },
      ...wrap("calculate_landed_cost", "Recalculating landed cost…", (a) => callTool("calculate_landed_cost", a)),
    },
    {
      name: "analyze_supplier_health",
      description:
        "Analyzes supplier financial health, bankruptcy risk, and performance history from payment records and quality data.",
      inputSchema: {
        type: "object",
        properties: {
          supplier_id: { type: "string" },
          lookback_months: { type: "number", default: 12, minimum: 1, maximum: 36 },
        },
        required: ["supplier_id"],
      },
      annotations: { readOnlyHint: true },
      ...wrap("analyze_supplier_health", "Scoring supplier health…", (a) => callTool("analyze_supplier_health", a)),
    },
    {
      name: "simulate_bulk_discount",
      description:
        "Models volume-based discount curves for a given SKU and supplier, returning optimal order quantity for cost minimization.",
      inputSchema: {
        type: "object",
        properties: {
          supplier_id: { type: "string" },
          sku: { type: "string" },
          min_qty: { type: "number", minimum: 1 },
          max_qty: { type: "number", minimum: 1 },
          step: { type: "number", default: 100 },
        },
        required: ["supplier_id", "sku", "min_qty", "max_qty"],
      },
      annotations: { readOnlyHint: true },
      ...wrap("simulate_bulk_discount", "Modeling bulk discount curve…", (a) => callTool("simulate_bulk_discount", a)),
    },
    {
      name: "get_inventory_status",
      description:
        "Returns current inventory levels, safety stock thresholds, and days of supply for given SKUs across all warehouses.",
      inputSchema: {
        type: "object",
        properties: {
          skus: { type: "array", items: { type: "string" } },
          warehouse_ids: { type: "array", items: { type: "string" } },
        },
        required: ["skus"],
      },
      annotations: { readOnlyHint: true },
      ...wrap("get_inventory_status", "Checking safety stock…", (a) => callTool("get_inventory_status", a)),
    },
    {
      name: "assess_port_risk",
      description:
        "Assesses real-time port congestion, strike risk, and weather-related disruption risk for a given port.",
      inputSchema: {
        type: "object",
        properties: { port_code: { type: "string" } },
        required: ["port_code"],
      },
      annotations: { readOnlyHint: true },
      ...wrap("assess_port_risk", "Assessing port risk…", (a) => callTool("assess_port_risk", a)),
    },
    {
      name: "generate_po_draft",
      description:
        "[REQUIRES HUMAN APPROVAL] Generates a purchase order draft with T&Cs for a supplier and line items. Creates a draft only — does NOT execute it.",
      inputSchema: {
        type: "object",
        properties: {
          supplier_id: { type: "string" },
          line_items: { type: "array" },
          delivery_date: { type: "string", format: "date" },
          delivery_terms: { type: "string", enum: ["EXW", "FOB", "CIF", "DDP"], default: "FOB" },
          payment_terms: { type: "string", enum: ["Net 30", "Net 60", "COD"], default: "Net 30" },
        },
        required: ["supplier_id", "line_items", "delivery_date"],
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      ...wrap("generate_po_draft", "Drafting purchase order (pending human approval)…", (a) =>
        callTool("generate_po_draft", a)
      ),
    },
    {
      name: "execute_approved_po",
      description:
        "[HUMAN-ONLY] Executes a previously approved purchase order draft. Requires a one-time approval token generated by a human UI click — the agent cannot generate this token itself.",
      inputSchema: {
        type: "object",
        properties: {
          po_draft_id: { type: "string" },
          human_approval_token: { type: "string" },
        },
        required: ["po_draft_id", "human_approval_token"],
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      ...wrap("execute_approved_po", "Executing approved PO…", (a) => callTool("execute_approved_po", a)),
    },
  ];
}
