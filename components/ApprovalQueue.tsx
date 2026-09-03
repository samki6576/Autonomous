"use client";

import { useState } from "react";

export type PoDraft = {
  po_draft_id: string;
  po_number: string;
  supplier_name: string;
  total_amount: number;
  status: "PENDING_APPROVAL" | "EXECUTED";
};

export default function ApprovalQueue({
  drafts,
  onApprove,
}: {
  drafts: PoDraft[];
  onApprove: (draft: PoDraft) => Promise<void>;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const pending = drafts.filter((d) => d.status === "PENDING_APPROVAL");

  return (
    <div className="rounded-xl border border-base-700 bg-base-900 p-4">
      <h3 className="text-sm font-semibold text-gray-200 mb-3">
        Approval Queue {pending.length > 0 && <span className="text-sky-400">({pending.length})</span>}
      </h3>
      {pending.length === 0 && <p className="text-xs text-base-600">No purchase orders awaiting approval.</p>}
      <div className="space-y-2">
        {pending.map((d) => (
          <div key={d.po_draft_id} className="rounded-lg border border-base-700 bg-base-850 p-3 fade-in-up">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-100">{d.po_number}</p>
                <p className="text-xs text-base-600">{d.supplier_name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-100">
                  ${d.total_amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <button
                  onClick={() => setOpenId(openId === d.po_draft_id ? null : d.po_draft_id)}
                  className="text-xs text-sky-400 hover:underline"
                >
                  Review &amp; Approve
                </button>
              </div>
            </div>

            {openId === d.po_draft_id && (
              <div className="mt-3 border-t border-base-700 pt-3 fade-in-up">
                <p className="text-xs text-base-600 mb-3">
                  This purchase order was drafted by the agent and has <strong>not</strong> been sent. Confirming
                  execution generates a one-time human approval token — the agent cannot generate this itself.
                </p>
                <button
                  disabled={confirming === d.po_draft_id}
                  onClick={async () => {
                    setConfirming(d.po_draft_id);
                    await onApprove(d);
                    setConfirming(null);
                    setOpenId(null);
                  }}
                  className="w-full rounded-lg bg-emerald-500/90 hover:bg-emerald-500 text-black text-xs font-semibold py-2 disabled:opacity-50"
                >
                  {confirming === d.po_draft_id ? "Executing…" : "Confirm Execution"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
