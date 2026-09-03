"use client";

export type ActivityItem = {
  id: string;
  ts: string;
  type: "AGENT_ACTION" | "HUMAN_APPROVAL" | "SYSTEM_ALERT";
  detail: string;
};

const badgeStyle: Record<ActivityItem["type"], string> = {
  AGENT_ACTION: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  HUMAN_APPROVAL: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  SYSTEM_ALERT: "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="rounded-xl border border-base-700 bg-base-900 p-4">
      <h3 className="text-sm font-semibold text-gray-200 mb-3">Activity Feed</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {items.length === 0 && <p className="text-xs text-base-600">No activity yet.</p>}
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-2 text-xs fade-in-up">
            <span className={`shrink-0 mt-0.5 px-1.5 py-0.5 rounded border text-[9px] font-semibold ${badgeStyle[item.type]}`}>
              {item.type.replace("_", " ")}
            </span>
            <div>
              <p className="text-gray-300">{item.detail}</p>
              <p className="text-[10px] text-base-600">{item.ts}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
