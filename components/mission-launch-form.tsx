import { defaultMissionInput } from "@/lib/orchestrator";
import { FormSubmitButton } from "@/components/form-submit-button";
import { SectionHeading } from "@/components/section-heading";
import { SurfaceCard } from "@/components/surface-card";

type MissionLaunchFormProps = {
  action: (formData: FormData) => void;
};

export function MissionLaunchForm({ action }: MissionLaunchFormProps) {
  const defaults = defaultMissionInput();

  return (
    <SurfaceCard>
      <SectionHeading title="Launch Mission" description="Start a new autonomous mission with explicit safety budgets, repository allowlists, and dry-run-first defaults." />
      <form action={action} className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Mission title</span>
          <input
            name="title"
            defaultValue={defaults.title}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none ring-0 transition-colors focus:border-[var(--primary)]"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Mode</span>
          <select
            name="mode"
            defaultValue={defaults.mode}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          >
            <option value="dry_run">Dry run</option>
            <option value="live">Live</option>
          </select>
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Discovery labels</span>
          <input
            name="labels"
            defaultValue={defaults.labels.join(", ")}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Retries</span>
          <input
            name="retries"
            type="number"
            min={0}
            max={5}
            defaultValue={defaults.retries}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Confidence threshold</span>
          <input
            name="confidenceThreshold"
            type="number"
            min={0}
            max={1}
            step={0.01}
            defaultValue={defaults.confidenceThreshold}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Tool-call limit</span>
          <input
            name="toolCallLimit"
            type="number"
            min={1}
            defaultValue={defaults.toolCallLimit}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Model-call limit</span>
          <input
            name="modelCallLimit"
            type="number"
            min={1}
            defaultValue={defaults.modelCallLimit}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Allowlisted repositories</span>
          <input
            name="allowlistedRepos"
            defaultValue={defaults.allowlistedRepos.join(", ")}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2 md:col-span-2">
          <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] px-4 py-3 text-sm text-[var(--foreground)]">
            <input name="liveSubmissionEnabled" type="checkbox" defaultChecked={defaults.liveSubmissionEnabled} className="h-4 w-4 accent-[var(--primary)]" />
            Enable live submission when mode is live
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] px-4 py-3 text-sm text-[var(--foreground)]">
            <input name="allowApproveOnFailure" type="checkbox" defaultChecked={defaults.allowApproveOnFailure} className="h-4 w-4 accent-[var(--primary)]" />
            Allow approval on failed checks
          </label>
        </div>

        <div className="md:col-span-2">
          <FormSubmitButton label="Launch mission" pendingLabel="Running mission..." />
        </div>
      </form>
    </SurfaceCard>
  );
}
