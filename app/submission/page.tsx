import { unstable_noStore as noStore } from "next/cache";
import { PageHeader } from "@/components/page-header";
import { SubmissionCard } from "@/components/submission-card";
import { getSubmissionData } from "@/lib/mission-store";

export default async function SubmissionPage() {
  noStore();
  const submissions = await getSubmissionData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Artifacts"
        title="Submission artifacts"
        description="Review generated branches, commit messages, PR drafts, changed files, and the current draft or live submission state."
      />
      <div className="space-y-6">
        {submissions.map((submission) => (
          <SubmissionCard key={submission.id} submission={submission} />
        ))}
      </div>
    </div>
  );
}
