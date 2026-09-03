<img width="1920" height="949" alt="Screenshot (91)" src="https://github.com/user-attachments/assets/2a1f29ee-cd5b-47f4-b69c-dfafc1b47db6" />

```markdown
# Autonomous Procurement & Supply Chain Negotiator

> **An AI-powered procurement dashboard that helps supply chain managers respond to disruptions in seconds instead of hours.**

![Uploading Screenshot (92).png…]()

---

## 🎯 What This Does

Supply chain disruptions cost manufacturers **15-20% of EBITDA**. When a port closes or commodity prices spike, procurement teams scramble across 5+ separate systems—checking inventory, calling freight forwarders, reviewing supplier health, and manually calculating costs in Excel.

**This dashboard fixes that.**

It uses **WebMCP**—a new web standard that lets AI agents use websites like a set of power tools. The AI does all the heavy lifting (data aggregation, scenario modeling, and drafting), while humans keep final control over spending decisions.

---

## ✨ Key Features

| Feature | What It Does |
|---------|--------------|
| 🌍 **Global Risk Heatmap** | See port congestion, supplier health, and shipping delays in real-time |
| 🎚️ **Priority Slider** | Drag between "Cost" and "Speed" to instantly recalculate sourcing options |
| 🤖 **8 WebMCP Tools** | AI checks commodities, inventory, shipping, suppliers, and discounts in parallel |
| 📋 **Live Agent Reasoning** | See exactly what the AI is doing and why |
| 🔒 **Human-Only Approvals** | AI drafts POs but **cannot** execute them—only humans can approve |
| 📊 **3 Alternative Routes** | Compare supplier options side-by-side with full cost breakdowns |

---

## 🛠️ How It Works

### The 8 WebMCP Tools

The app registers these tools with the browser via `document.modelContext.registerTool()`:

| # | Tool Name | What It Does |
|---|-----------|--------------|
| 1 | `fetch_commodity_prices` | Checks real-time prices for copper, oil, lithium, gold, etc. |
| 2 | `calculate_landed_cost` | Total cost including shipping, tariffs, and FX |
| 3 | `analyze_supplier_health` | Scores suppliers on financial health and reliability |
| 4 | `simulate_bulk_discount` | Finds the optimal order quantity for best pricing |
| 5 | `get_inventory_status` | Checks current stock levels and safety stock |
| 6 | `assess_port_risk` | Checks port congestion, strikes, and weather delays |
| 7 | `generate_po_draft` | **Drafts** a purchase order—does NOT send it |
| 8 | `execute_approved_po` | **Human-only**—sends the PO after approval |

### The Human + AI Workflow

```
1. Human opens dashboard → sees global map with live alerts
2. Red alert appears: "Port of Rotterdam congested — 72hr delay"
3. Human drags "Cost ↔ Speed" slider
4. AI fires 6 tools in parallel (<800ms response)
5. 3 alternative sourcing routes appear as cards
6. Human clicks best route → AI generates PO draft
7. PO appears in approval queue
8. Human reviews and clicks "Approve"
9. PO is sent to supplier (AI cannot do this alone)
```

### Security: Human-in-the-Loop (HITL)

The agent **cannot** spend money without human approval:

1. `generate_po_draft` creates a draft but never sends it
2. When human clicks "Approve," a **cryptographic token** is generated
3. `execute_approved_po` verifies the token before executing
4. All approvals are logged in an **audit trail**

```javascript
// Example: Token verification
const isValid = verifyToken(po_draft_id, human_approval_token);
if (!isValid) throw new Error("Invalid or expired approval token");
// ... execute PO
```

---

## 🚀 Live Demo

**Try it yourself:** [https://autonomous-pied.vercel.app/](https://autonomous-pied.vercel.app/)
<img width="1920" height="934" alt="Screenshot (93)" src="https://github.com/user-attachments/assets/7926f1e7-0c8d-4cd5-992b-1d48128f057b" />

**Requirements:**
- Open in **ChatGPT desktop app** (WebMCP is built-in — no setup needed)
- OR open in **Chrome 146+** with `chrome://flags/#enable-webmcp-testing` enabled

> ⚠️ **Note:** If WebMCP isn't enabled, the app runs in fallback mode with simulated data so you can still see the UI.

---

## 📦 Tech Stack

| Category | Technologies |
|----------|--------------|
| **Frontend** | Next.js 15, React, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui |
| **State** | Zustand, React Query |
| **Charts** | Recharts |
| **Maps** | Mapbox GL |
| **Deployment** | Vercel (frontend), Cloudflare (caching) |
| **API** | WebMCP, CommodityPriceAPI, CerebroChain (planned) |

---
<img width="5899" height="4639" alt="deepseek_mermaid_20260903_3ac284" src="https://github.com/user-attachments/assets/265f43cd-4744-490b-bfab-a8a7627c59a0" />

## 🏃 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- npm or yarn
- Chrome 146+ (for WebMCP testing)

### Clone & Install

```bash
git clone https://github.com/yourusername/webmcp-procurement-negotiator.git
cd webmcp-procurement-negotiator
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
NEXT_PUBLIC_COMMODITY_API_KEY=your_commodity_api_key  # Optional
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> **Note:** WebMCP only works in Chrome 146+ with the flag enabled. For local testing, the app falls back to simulation mode.

### Enable WebMCP in Chrome

1. Open Chrome and go to `chrome://flags/#enable-webmcp-testing`
2. Set **"WebMCP for testing"** to **Enabled**
3. Restart Chrome

---

## 📁 Project Structure

```
webmcp-procurement-negotiator/
├── app/
│   ├── page.tsx              # Main dashboard
│   ├── layout.tsx            # Root layout
│   └── api/                  # API routes
├── components/
│   ├── dashboard/
│   │   ├── RiskHeatmap.tsx   # Global map
│   │   ├── PrioritySlider.tsx # Cost↔Speed control
│   │   ├── SupplierCards.tsx # Sourcing options
│   │   ├── ApprovalQueue.tsx # PO drafts
│   │   └── AgentReasoning.tsx # Tool call log
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── webmcp/
│   │   ├── tools.ts          # All 8 tool registrations
│   │   └── orchestrator.ts   # Parallel tool orchestration
│   └── store/
│       └── dashboardStore.ts # Zustand state
├── hooks/
│   └── useWebMCP.ts          # Tool registration hook
├── types/
│   └── index.ts              # TypeScript types
└── public/
    └── assets/
```

---

## 🧠 WebMCP Implementation

### Registering Tools

Each tool is registered with the browser:

```javascript
// lib/webmcp/tools.ts
import { registerTool } from './registry';

export const tools = [
  {
    name: "fetch_commodity_prices",
    description: "Fetches real-time spot prices for commodities.",
    inputSchema: {
      type: "object",
      properties: {
        commodities: {
          type: "array",
          items: { type: "string", enum: ["copper", "oil", "gold", "silver"] }
        }
      },
      required: ["commodities"]
    },
    execute: async ({ commodities }) => {
      // API call to CommodityPriceAPI
      // Returns { copper: { price, change } }
    },
    annotations: { readOnlyHint: true }
  },
  // ... 7 more tools
];

// Register all tools
export function registerAllTools() {
  tools.forEach(tool => {
    document.modelContext.registerTool(tool);
  });
}
```

### Parallel Orchestration

When the slider changes, the agent orchestrates all tools:

```javascript
// lib/webmcp/orchestrator.ts
export async function orchestrateAnalysis(params) {
  const [prices, inventory, landedCosts, portRisks, supplierHealth, discounts] =
    await Promise.allSettled([
      fetchCommodityPrices(params.commodities),
      getInventoryStatus(params.skus),
      calculateLandedCost(params.supplierId, params.origin, params.dest),
      assessPortRisk(params.portCode),
      analyzeSupplierHealth(params.supplierId),
      simulateBulkDiscount(params.supplierId, params.sku)
    ]);

  return { prices, inventory, landedCosts, portRisks, supplierHealth, discounts };
}
```

---

## 🔐 Security

### Human-in-the-Loop (HITL) Pattern

The system uses a **two-tool split** to prevent AI from spending money:

1. **Tool 7:** `generate_po_draft` — Creates a draft, stores it as `PENDING_APPROVAL`
2. **Tool 8:** `execute_approved_po` — Requires a valid approval token

**Token Generation (Human Click):**

```javascript
const token = crypto.createHash('sha256')
  .update(`${poDraftId}-${userId}-${Date.now()}-${nonce}`)
  .digest('hex');
```

**Token Verification (Tool 8):**

```javascript
const isValid = verifyToken(poDraftId, token);
if (!isValid) throw new Error('Invalid approval token');
// Execute PO
```

### Audit Trail

All actions are logged:

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMP,
  user_id VARCHAR(255),
  action VARCHAR(255),
  details JSONB
);
```

---

## 📝 Deployment

### Deploy to Vercel (Recommended)

```bash
npm run build
npx vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deployments.

### Deploy to Other Platforms

| Platform | Instructions |
|----------|--------------|
| **Cloudflare** | `npm create cloudflare@latest -- my-next-app --framework=next` |
| **Netlify** | Import from Git → Auto-detect Next.js |
| **Render** | New Web Service → Connect repo → Auto-detect |

---

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

### WebMCP Testing

1. Enable the flag in Chrome
2. Open DevTools → Console → Type `document.modelContext`
3. You should see registered tools

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

This project is open source under the **MIT License**.

---

## 🙏 Acknowledgements

Built for the [WebMCP Challenge](https://devpost.com/software/the-webmcp-challenge).

**Sponsors:**
- OpenAI
- Cloudflare
- Vercel
- Google Chrome
- Shopify
- Render
- Netlify

---

## 📬 Contact

- **Project Link:** [https://autonomous-pied.vercel.app/](https://autonomous-pied.vercel.app/)
- **GitHub:** [https://github.com/samki6576/Autonomous](https://github.com/samki6576/Autonomous)
  

---

## ⭐ Support

If you found this useful, please give the repo a star ⭐ and share it!

---

**Made with ❤️ for the WebMCP Challenge**
```

