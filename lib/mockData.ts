export type Supplier = {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  healthScore: number; // 0-100
  onTimeRate: number; // %
  qualityRejectRate: number; // %
  basePriceUsd: number; // per unit, for the demo SKU
};

export type Port = {
  code: string;
  name: string;
  lat: number;
  lng: number;
  congestion: "LOW" | "MEDIUM" | "HIGH";
  riskScore: number;
};

export const DEMO_SKU = "SKU-COPPER-WIRE-14AWG";

export const SUPPLIERS: Supplier[] = [
  {
    id: "sup-rotterdam-cu",
    name: "Nordic Cable & Wire B.V.",
    country: "Netherlands",
    lat: 51.9225,
    lng: 4.47917,
    healthScore: 82,
    onTimeRate: 94,
    qualityRejectRate: 1.2,
    basePriceUsd: 4.85,
  },
  {
    id: "sup-hamburg-cu",
    name: "Elbe Metalworks GmbH",
    country: "Germany",
    lat: 53.5511,
    lng: 9.9937,
    healthScore: 91,
    onTimeRate: 97,
    qualityRejectRate: 0.6,
    basePriceUsd: 5.1,
  },
  {
    id: "sup-antwerp-cu",
    name: "Scheldt Industrial Supply",
    country: "Belgium",
    lat: 51.2194,
    lng: 4.4025,
    healthScore: 76,
    onTimeRate: 89,
    qualityRejectRate: 2.1,
    basePriceUsd: 4.65,
  },
  {
    id: "sup-shanghai-cu",
    name: "Yangtze Copper Fabricators",
    country: "China",
    lat: 31.2304,
    lng: 121.4737,
    healthScore: 68,
    onTimeRate: 85,
    qualityRejectRate: 3.4,
    basePriceUsd: 3.95,
  },
];

export const PORTS: Port[] = [
  {
    code: "NLRTM",
    name: "Port of Rotterdam",
    lat: 51.9496,
    lng: 4.1453,
    congestion: "HIGH",
    riskScore: 78,
  },
  {
    code: "DEHAM",
    name: "Port of Hamburg",
    lat: 53.5459,
    lng: 9.9695,
    congestion: "MEDIUM",
    riskScore: 42,
  },
  {
    code: "BEANR",
    name: "Port of Antwerp",
    lat: 51.2637,
    lng: 4.3467,
    congestion: "LOW",
    riskScore: 21,
  },
  {
    code: "CNSHA",
    name: "Port of Shanghai",
    lat: 31.3416,
    lng: 121.5087,
    congestion: "MEDIUM",
    riskScore: 55,
  },
];

export const COMMODITIES: Record<
  string,
  { price: number; unit: string; change24h: number }
> = {
  copper: { price: 4.32, unit: "USD/lb", change24h: 4.2 },
  lithium: { price: 13.8, unit: "USD/kg", change24h: -1.1 },
  crude_oil: { price: 78.4, unit: "USD/bbl", change24h: 0.8 },
  natural_gas: { price: 2.61, unit: "USD/MMBtu", change24h: -2.3 },
  gold: { price: 2385, unit: "USD/oz", change24h: 0.3 },
  silver: { price: 29.1, unit: "USD/oz", change24h: 0.9 },
};

export const INVENTORY: Record<
  string,
  { totalStock: number; safetyStock: number; daysOfSupply: number }
> = {
  [DEMO_SKU]: { totalStock: 42000, safetyStock: 15000, daysOfSupply: 11 },
};
