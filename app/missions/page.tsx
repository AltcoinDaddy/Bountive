import { unstable_noStore as noStore } from "next/cache";
import { MissionHistoryTable } from "@/components/mission-history-table";
import { MissionLaunchForm } from "@/components/mission-launch-form";
import { PageHeader } from "@/components/page-header";
import { SafetyPanel } from "@/components/safety-panel";
import { EmptyState } from "@/components/empty-state";
import { getMissionHistory, getMissionSummary } from "@/lib/mission-store";
import { launchMissionAction } from "@/app/missions/actions";

export default async function MissionsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  noStore();

  const params = await searchParams;
  const missionId = typeof params.missionId === "string" ? params.missionId : undefined;

  const [missions, selectedMission] = await Promise.all([
    getMissionHistory(),
    missionId ? getMissionSummary(missionId) : Promise.resolve(null)
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Control"
        title="Mission runner"
        description="Launch new missions, choose dry-run or live mode, and audit the execution history against the active safety and compute policies."
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <MissionLaunchForm action={launchMissionAction} />
        {selectedMission ? (
          <SafetyPanel guardrailsJson={selectedMission.guardrailsJson} />
        ) : (
          <EmptyState
            title="Select a mission run"
            description="After a mission completes, choose it from the query string or launch a new one to inspect the exact guardrails that were applied."
          />
        )}
      </div>

      <MissionHistoryTable missions={missions} />
    </div>
  );
}
