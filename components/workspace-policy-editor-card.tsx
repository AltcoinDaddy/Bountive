import { FormSubmitButton } from "@/components/form-submit-button";
import { SectionHeading } from "@/components/section-heading";
import { SurfaceCard } from "@/components/surface-card";

type WorkspacePolicyEditorCardProps = {
  workspace: {
    operatorEmail: string;
    approvalPolicy: {
      requireHumanApprovalForLive: boolean;
      allowAutoApproveDryRun: boolean;
      allowApproveFailedChecks: boolean;
      maxPatchFiles: number;
      allowedTaskCategories: string[];
    } | null;
  } | null;
  action: (formData: FormData) => void;
  errorMessage?: string | null;
  success?: boolean;
};

export function WorkspacePolicyEditorCard({
  workspace,
  action,
  errorMessage,
  success = false
}: WorkspacePolicyEditorCardProps) {
  return (
    <SurfaceCard>
      <SectionHeading
        title="Edit Workspace Policy"
        description="Persist operator identity, approval thresholds, and allowed task categories so mission guardrails stay consistent across launches."
      />

      <form action={action} className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Operator email</span>
          <input
            name="operatorEmail"
            type="email"
            defaultValue={workspace?.operatorEmail ?? ""}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Max patch files</span>
          <input
            name="maxPatchFiles"
            type="number"
            min={1}
            max={50}
            defaultValue={workspace?.approvalPolicy?.maxPatchFiles ?? 8}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Allowed task categories</span>
          <input
            name="allowedTaskCategories"
            defaultValue={workspace?.approvalPolicy?.allowedTaskCategories.join(", ") ?? ""}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-3 md:col-span-2">
          <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] px-4 py-3 text-sm text-[var(--foreground)]">
            <input
              name="requireHumanApprovalForLive"
              type="checkbox"
              defaultChecked={workspace?.approvalPolicy?.requireHumanApprovalForLive ?? true}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            Require human approval for live mode
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] px-4 py-3 text-sm text-[var(--foreground)]">
            <input
              name="allowAutoApproveDryRun"
              type="checkbox"
              defaultChecked={workspace?.approvalPolicy?.allowAutoApproveDryRun ?? true}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            Allow auto-approve for dry run
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] px-4 py-3 text-sm text-[var(--foreground)]">
            <input
              name="allowApproveFailedChecks"
              type="checkbox"
              defaultChecked={workspace?.approvalPolicy?.allowApproveFailedChecks ?? false}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            Allow failed-check approval
          </label>
        </div>

        {errorMessage ? (
          <div className="md:col-span-2 rounded-2xl border border-[rgba(180,35,24,0.2)] bg-[rgba(180,35,24,0.06)] px-4 py-3 text-sm text-[var(--foreground)]">
            {errorMessage}
          </div>
        ) : null}

        {success ? (
          <div className="md:col-span-2 rounded-2xl border border-[rgba(31,58,95,0.14)] bg-[rgba(31,58,95,0.06)] px-4 py-3 text-sm text-[var(--foreground)]">
            Workspace approval policy updated.
          </div>
        ) : null}

        <div className="md:col-span-2">
          <FormSubmitButton label="Save policy" pendingLabel="Saving policy..." />
        </div>
      </form>
    </SurfaceCard>
  );
}
