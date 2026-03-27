import { unstable_noStore as noStore } from "next/cache";
import { PageHeader } from "@/components/page-header";
import { TimelineList } from "@/components/timeline-list";
import { getTimelineEvents } from "@/lib/mission-store";

export default async function TimelinePage() {
  noStore();
  const events = await getTimelineEvents();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lifecycle"
        title="Execution timeline"
        description="Trace discover, plan, execute, verify, and submit with timestamped outcomes, responsible agent names, and retry indexes."
      />
      <TimelineList events={events} />
    </div>
  );
}
