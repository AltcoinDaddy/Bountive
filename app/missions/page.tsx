import { unstable_noStore as noStore } from "next/cache";
import { ExecutionCapabilityCard } from "@/components/execution-capability-card";
import { LiveSubmissionReadinessCard } from "@/components/live-submission-readiness-card";
import { LiveRepoValidationCard } from "@/components/live-repo-validation-card";
import { MissionHistoryTable } from "@/components/mission-history-table";
import { MissionLaunchForm } from "@/components/mission-launch-form";
import { MissionOperationsCard } from "@/components/mission-operations-card";
import { PageHeader } from "@/components/page-header";
import { RuntimeProfileCard } from "@/components/runtime-profile-card";
import { SafetyPanel } from "@/components/safety-panel";
import { EmptyState } from "@/components/empty-state";
import { WorkspacePolicyEditorCard } from "@/components/workspace-policy-editor-card";
import { WorkspacePolicyCard } from "@/components/workspace-policy-card";
import { WorkerQueueCard } from "@/components/worker-queue-card";
import { getQueueMetrics } from "@/lib/mission-queue";
import { getMissionHistory, getMissionSummary, readMissionConfig } from "@/lib/mission-store";
import { validateLiveRepoTarget } from "@/lib/github/live-validation";
import { getRuntimeProfile } from "@/lib/runtime-profile";
import { getWorkspaceOverview } from "@/lib/workspace-manager";
import { abortMissionAction, launchMissionAction, processQueuedMissionAction, recoverStaleMissionsAction, updateWorkspacePolicyAction } from "@/app/missions/actions";

export default async function MissionsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  noStore();

  const params = await searchParams;
  const missionId = typeof params.missionId === "string" ? params.missionId : undefined;
  const launchError = typeof params.launchError === "string" ? params.launchError : null;
  const policyError = typeof params.policyError === "string" ? params.policyError : null;
  const policyUpdated = params.policyUpdated === "1";

  const [missions, selectedMission, queue, workspace] = await Promise.all([
    getMissionHistory(),
    missionId ? getMissionSummary(missionId) : Promise.resolve(null),
    getQueueMetrics(),
    getWorkspaceOverview()
  ]);
  const selectedMissionConfig = selectedMission ? readMissionConfig(selectedMission.configJson) : null;
  const runtimeProfile = getRuntimeProfile();
  const liveValidation = await validateLiveRepoTarget(
    selectedMission?.selectedRepo ?? null,
    Array.isArray(selectedMissionConfig?.allowlistedRepos)
      ? selectedMissionConfig.allowlistedRepos.filter((value): value is string => typeof value === "string")
      : []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Control"
        title="Mission runner"
        description="Launch new missions, choose dry-run or live mode, and audit the execution history against the active safety and compute policies."
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <MissionLaunchForm action={launchMissionAction} errorMessage={launchError} />
        {selectedMission ? (
          <SafetyPanel guardrailsJson={selectedMission.guardrailsJson} />
        ) : (
          <EmptyState
            title="Select a mission run"
            description="After a mission completes, choose it from the query string or launch a new one to inspect the exact guardrails that were applied."
          />
        )}
      </div>

      <WorkerQueueCard
        queue={queue}
        processAction={processQueuedMissionAction}
        recoverAction={recoverStaleMissionsAction}
      />

      <RuntimeProfileCard profile={runtimeProfile} />

      <LiveRepoValidationCard validation={liveValidation} />

      <WorkspacePolicyCard workspace={workspace} />

      <WorkspacePolicyEditorCard
        workspace={workspace}
        action={updateWorkspacePolicyAction}
        errorMessage={policyError}
        success={policyUpdated}
      />

      {selectedMission ? <MissionOperationsCard mission={selectedMission} abortAction={abortMissionAction} /> : null}

      <LiveSubmissionReadinessCard
        missionConfig={selectedMissionConfig}
        selectedRepo={selectedMission?.selectedRepo ?? null}
      />

      <ExecutionCapabilityCard />

      <MissionHistoryTable missions={missions} />
    </div>
  );
}
