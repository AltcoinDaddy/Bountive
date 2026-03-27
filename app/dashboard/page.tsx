import { unstable_noStore as noStore } from "next/cache";
import { EventFeed } from "@/components/event-feed";
import { PageHeader } from "@/components/page-header";
import { SafetyPanel } from "@/components/safety-panel";
import { StatCard } from "@/components/stat-card";
import { SubmissionCard } from "@/components/submission-card";
import { VerificationPanel } from "@/components/verification-panel";
import { getDashboardData } from "@/lib/mission-store";
import { formatDuration, formatNumber } from "@/lib/utils";

export default async function DashboardPage() {
  noStore();

  const data = await getDashboardData();
  const latestMission = data.latestMission;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Mission dashboard"
        description="Monitor the active autonomous mission loop from discovery through submission, including compute budgets, QA gates, and proof generation."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Mission status"
          value={latestMission?.status.replaceAll("_", " ") ?? "No mission"}
          detail={latestMission ? `Current stage: ${latestMission.currentStage.replaceAll("_", " ")}` : "Seed or launch a mission to begin."}
        />
        <StatCard
          label="Compute usage"
          value={`${formatNumber(data.totals.modelCallsUsed + data.totals.toolCallsUsed)}`}
          detail={`${data.totals.modelCallsUsed} model calls and ${data.totals.toolCallsUsed} tool calls recorded`}
        />
        <StatCard
          label="Candidates scanned"
          value={formatNumber(data.totals.candidateTasksScanned)}
          detail="Issues evaluated across mission runs"
        />
        <StatCard
          label="Runtime"
          value={formatDuration(data.totals.durationMs)}
          detail="Total recorded mission duration"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr,0.9fr]">
        <div className="space-y-6">
          <SafetyPanel guardrailsJson={latestMission?.guardrailsJson} />
          <VerificationPanel report={latestMission?.verificationReport} />
          <SubmissionCard submission={latestMission?.submission} />
        </div>
        <EventFeed events={latestMission?.eventLogs ?? []} />
      </div>
    </div>
  );
}
