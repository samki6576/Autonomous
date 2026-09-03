"use client";

export default function PrioritySlider({
  value,
  onChangeCommitted,
  disabled,
}: {
  value: number;
  onChangeCommitted: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-xl border border-base-700 bg-base-900 p-4">
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="font-medium text-gray-200">💰 Cost Priority</span>
        <span className="font-medium text-gray-200">Speed Priority ⚡</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        defaultValue={value}
        disabled={disabled}
        onMouseUp={(e) => onChangeCommitted(Number((e.target as HTMLInputElement).value))}
        onTouchEnd={(e) => onChangeCommitted(Number((e.target as HTMLInputElement).value))}
        onKeyUp={(e) => onChangeCommitted(Number((e.target as HTMLInputElement).value))}
        className="w-full accent-sky-400 cursor-pointer"
      />
      <p className="text-xs text-base-600 mt-2">
        Release the slider to have the agent re-run cost, inventory, and port-risk tools in parallel.
      </p>
    </div>
  );
}
