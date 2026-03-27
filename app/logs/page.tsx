import { unstable_noStore as noStore } from "next/cache";
import { LogViewer } from "@/components/log-viewer";
import { PageHeader } from "@/components/page-header";
import { getLogData } from "@/lib/mission-store";

export default async function LogsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  noStore();

  const params = await searchParams;
  const stage = typeof params.stage === "string" ? params.stage : "";
  const agent = typeof params.agent === "string" ? params.agent : "";
  const success = typeof params.success === "string" ? params.success : "";

  const logs = (await getLogData()).filter((log) => {
    if (stage && log.stage !== stage) {
      return false;
    }

    if (agent && log.agentName !== agent) {
      return false;
    }

    if (success === "true" && !log.success) {
      return false;
    }

    if (success === "false" && log.success) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Audit"
        title="Execution logs"
        description="Inspect structured event logs, filter by stage or agent, and compare the narrative view with the raw JSON payload."
      />

      <form className="grid gap-4 rounded-[24px] border border-[var(--border)] bg-[rgba(255,255,255,0.92)] p-5 shadow-[var(--shadow)] md:grid-cols-4">
        <input
          name="stage"
          defaultValue={stage}
          placeholder="Stage"
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
        />
        <input
          name="agent"
          defaultValue={agent}
          placeholder="Agent"
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
        />
        <select
          name="success"
          defaultValue={success}
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
        >
          <option value="">All outcomes</option>
          <option value="true">Successful only</option>
          <option value="false">Failed only</option>
        </select>
        <button type="submit" className="rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white">
          Apply filters
        </button>
      </form>

      <LogViewer logs={logs} />
    </div>
  );
}
