import type { ReactNode } from "react";
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  logo = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  logo?: boolean;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 items-center gap-4">
        {logo && (
          <img
            src="/logo.jpg"
            alt="Alumni Association logo"
            className="h-16 w-16 shrink-0 rounded-2xl border border-white/10 object-cover shadow-[0_0_28px_rgba(124,107,255,.22)]"
          />
        )}
        <div>
          {eyebrow && (
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200/10 bg-cyan-200/[.05] px-3 py-1 text-[10px] font-bold uppercase tracking-[.2em] text-teal">
              <span className="h-1.5 w-1.5 rounded-full bg-pink shadow-[0_0_9px_#f45dcc]" />
              {eyebrow}
            </div>
          )}
          <h1 className="text-3xl font-extrabold tracking-tight text-ink md:text-[2.1rem]">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {description}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
