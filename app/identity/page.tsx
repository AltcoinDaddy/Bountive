import { unstable_noStore as noStore } from "next/cache";
import { IdentityCard } from "@/components/identity-card";
import { PageHeader } from "@/components/page-header";
import { ProofRecordList } from "@/components/proof-record-list";
import { getIdentityData } from "@/lib/mission-store";

export default async function IdentityPage() {
  noStore();
  const { identity, proofs } = await getIdentityData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Identity"
        title="Operator identity and proof"
        description="Track the operator wallet, manifest, identity reference, registration metadata, and proof history for completed missions."
      />
      <IdentityCard identity={identity} />
      <ProofRecordList proofs={proofs} />
    </div>
  );
}
