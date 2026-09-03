"use client";

export type Route = {
  id: string;
  supplierId: string;
  supplierName: string;
  portCode: string;
  portName: string;
  landedCost: number;
  estDeliveryDays: number;
  healthScore: number;
  recommended?: boolean;
};

export default function SupplierCards({
  routes,
  selectedId,
  onSelect,
}: {
  routes: Route[];
  selectedId: string | null;
  onSelect: (route: Route) => void;
}) {
  if (routes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-base-700 p-6 text-center text-sm text-base-600">
        Drag the priority slider to generate alternative sourcing routes.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {routes.map((r) => (
        <button
          key={r.id}
          onClick={() => onSelect(r)}
          className={`text-left rounded-xl border p-4 transition-colors fade-in-up ${
            selectedId === r.id
              ? "border-sky-400 bg-sky-500/10"
              : "border-base-700 bg-base-900 hover:border-base-600"
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-gray-100 text-sm">{r.supplierName}</p>
              <p className="text-xs text-base-600">via {r.portName}</p>
            </div>
            {r.recommended && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Recommended
              </span>
            )}
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-base-600">Landed cost</span>
              <span className="text-gray-200 font-medium">${r.landedCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-600">Est. delivery</span>
              <span className="text-gray-200 font-medium">{r.estDeliveryDays} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-600">Supplier health</span>
              <span className="text-gray-200 font-medium">{r.healthScore}/100</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
