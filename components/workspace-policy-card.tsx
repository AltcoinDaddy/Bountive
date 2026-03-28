import { LockKeyhole, Users } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { SurfaceCard } from "@/components/surface-card";

type WorkspacePolicyCardProps = {
  workspace: {
    name: string;
    slug: string;
    authMode: string;
    operatorEmail: string;
    approvalPolicy: {
      requireHumanApprovalForLive: boolean;
      allowAutoApproveDryRun: boolean;
      allowApproveFailedChecks: boolean;
      maxPatchFiles: number;
      allowedTaskCategories: string[];
    } | null;
  } | null;
};

export function WorkspacePolicyCard({ workspace }: WorkspacePolicyCardProps) {
  return (
    <SurfaceCard>
      <div className="flex items-start justify-between gap-4">
        <SectionHeading
          title="Workspace And Policy"
          description="Current operator context, local auth mode, and approval policy settings for autonomous mission execution."
        />
        <div className="flex items-center gap-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-2">
            <Users className="h-5 w-5 text-[var(--primary)]" />
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-2">
            <LockKeyhole className="h-5 w-5 text-[var(--primary)]" />
          </div>
        </div>
      </div>

      {workspace ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Workspace</div>
            <div className="mt-2 text-sm font-medium text-[var(--foreground)]">{workspace.name}</div>
            <div className="mt-1 text-sm text-[var(--muted-foreground)]">{workspace.slug}</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Auth Mode</div>
            <div className="mt-2"><StatusBadge value={workspace.authMode} /></div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Operator</div>
            <div className="mt-2 text-sm font-medium text-[var(--foreground)]">{workspace.operatorEmail}</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Live Approval</div>
            <div className="mt-2">
              <StatusBadge value={workspace.approvalPolicy?.requireHumanApprovalForLive ? "pending" : "approved"} />
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Patch Limit</div>
            <div className="mt-2 text-sm font-medium text-[var(--foreground)]">
              {workspace.approvalPolicy?.maxPatchFiles ?? "—"} files
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:col-span-2 xl:col-span-5">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Allowed Task Categories</div>
            <div className="mt-2 text-sm leading-6 text-[var(--foreground)]">
              {workspace.approvalPolicy?.allowedTaskCategories?.length
                ? workspace.approvalPolicy.allowedTaskCategories.join(", ")
                : "No task categories are configured yet."}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-[var(--muted-foreground)]">No workspace configuration is available yet.</div>
      )}
    </SurfaceCard>
  );
}
