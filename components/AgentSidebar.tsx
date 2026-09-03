"use client";

export type LogEntry = { id: string; tool: string; note: string; ts: string };

export default function AgentSidebar({ entries, webmcpActive }: { entries: LogEntry[]; webmcpActive: boolean }) {
  return (
    <div className="rounded-xl border border-base-700 bg-base-900 p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-200">Agent Reasoning</h3>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full border ${
            webmcpActive
              ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
              : "border-base-600 text-base-600 bg-base-800"
          }`}
        >
          {webmcpActive ? "WebMCP live" : "WebMCP flag off — using local tool calls"}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs font-mono">
        {entries.length === 0 && <p className="text-base-600">No agent activity yet. Try the priority slider.</p>}
        {entries.map((e) => (
          <div key={e.id} className="fade-in-up rounded-lg bg-base-850 border border-base-700 px-2.5 py-2">
            <div className="flex items-center gap-1.5 text-sky-400">
              <span>🔄</span>
              <span className="font-semibold">{e.tool}</span>
            </div>
            <p className="text-gray-300 mt-0.5">{e.note}</p>
            <p className="text-[10px] text-base-600 mt-1">{e.ts}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
