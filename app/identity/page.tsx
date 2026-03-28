import { signOutAction } from "@/app/auth/actions";
import { unstable_noStore as noStore } from "next/cache";
import { IdentityCard } from "@/components/identity-card";
import { OperatorSessionCard } from "@/components/operator-session-card";
import { PageHeader } from "@/components/page-header";
import { ProofRecordList } from "@/components/proof-record-list";
import { ProofPublishingCard } from "@/components/proof-publishing-card";
import { getOperatorSession } from "@/lib/auth";
import { getIdentityData } from "@/lib/mission-store";
import { getProofPublishingStatus } from "@/lib/proof-publisher";

export default async function IdentityPage() {
  noStore();
  const [{ identity, proofs, currentMode }, session] = await Promise.all([
    getIdentityData(),
    getOperatorSession()
  ]);
  const proofPublishing = getProofPublishingStatus();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Identity"
        title="Operator identity and proof"
        description="Track the operator wallet, manifest, identity reference, registration metadata, and proof history for completed missions."
      />
      <OperatorSessionCard session={session} signOutAction={signOutAction} />
      <IdentityCard identity={identity} currentMode={currentMode} />
      <ProofPublishingCard status={proofPublishing} />
      <ProofRecordList proofs={proofs} />
    </div>
  );
}
