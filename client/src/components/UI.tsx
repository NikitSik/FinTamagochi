export function Card({ children, className = "" }: any) {
  return (
    <div
      className={`rounded-3xl p-6 shadow-lg border
        [background:var(--card)] [border-color:var(--card-border)]
        ${className}`}
    >
      {children}
    </div>
  );
}

export function Button({
  children, onClick, className = "", disabled = false, type = "button"
}: any) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-2xl py-4 text-lg font-semibold transition
        ${disabled ? "opacity-50" : "active:scale-[0.98]"}
        [background:var(--accent)] text-white hover:opacity-95 shadow-md ${className}`}
    >
      {children}
    </button>
  );
}

export function Pill({ children }: any) {
  return (
    <span className="rounded-full px-3 py-1 text-xs
                     [background:var(--chip)] [color:var(--chip-text)]">
      {children}
    </span>
  );
}

export function Screen({ children }: any) {
  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-24">
      {children}
    </div>
  );
}
