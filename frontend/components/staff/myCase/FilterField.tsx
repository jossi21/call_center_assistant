"use client";

export function FilterField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
        {label}
      </span>
      {children}
    </div>
  );
}
