type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
};

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-[28px] border border-[var(--border)] bg-[rgba(255,255,255,0.85)] px-6 py-6 shadow-[var(--shadow)] backdrop-blur sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <div className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--primary)]">{eyebrow}</div>
        ) : null}
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
          {description}
        </p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
