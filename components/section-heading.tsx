export function SectionHeading({
  title,
  description
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--foreground)]">{title}</h2>
      {description ? <p className="mt-1 text-sm text-[var(--muted-foreground)]">{description}</p> : null}
    </div>
  );
}
