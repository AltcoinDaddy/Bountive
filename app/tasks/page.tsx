import { unstable_noStore as noStore } from "next/cache";
import { CandidateTaskTable } from "@/components/candidate-task-table";
import { PageHeader } from "@/components/page-header";
import { getCandidateTasks } from "@/lib/mission-store";

export default async function TasksPage() {
  noStore();
  const tasks = await getCandidateTasks();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Scouting"
        title="Candidate tasks"
        description="Review discovered GitHub issues, Bountive scores, confidence thresholds, and the explicit selection or rejection reasoning for each task."
      />
      <CandidateTaskTable tasks={tasks} />
    </div>
  );
}
