import { isAddress } from "viem";
import type { IdentityRecord, Mission, Submission, VerificationReport } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { buildAgentManifest } from "@/lib/manifest-generator";
import { hashPayload, writeArtifact } from "@/lib/artifacts";

export async function ensureIdentityRecord() {
  const existing = await prisma.identityRecord.findUnique({
    where: {
      identityReference: env.identityReference
    }
  });

  if (existing) {
    return existing;
  }

  const operatorWallet = isAddress(env.operatorWallet) ? env.operatorWallet : "0x0000000000000000000000000000000000000000";

  return prisma.identityRecord.create({
    data: {
      agentName: "Bountive Operator",
      operatorWallet,
      network: env.network,
      registrationTxHash: env.registrationTxHash || null,
      manifestUri: env.manifestUri,
      identityReference: env.identityReference
    }
  });
}

export async function syncAgentManifest(identity: IdentityRecord) {
  const manifest = buildAgentManifest(identity);
  await writeArtifact("generated/agent.json", manifest);
  return manifest;
}

export async function createProofRecord(input: {
  identity: IdentityRecord;
  mission: Mission;
  submission: Submission;
  verification: VerificationReport;
}) {
  const verificationHash = hashPayload({
    missionId: input.mission.id,
    verification: input.verification
  });

  const logHash = hashPayload({
    missionId: input.mission.id,
    submission: input.submission
  });

  const proof = await prisma.proofRecord.create({
    data: {
      missionId: input.mission.id,
      identityRecordId: input.identity.id,
      issueUrl: input.mission.selectedIssueUrl ?? "",
      repoUrl: input.mission.selectedRepo ? `https://github.com/${input.mission.selectedRepo}` : "",
      commitHash: input.submission.commitHash,
      prUrl: input.submission.prUrl,
      verificationHash,
      logHash
    }
  });

  await writeArtifact(`proof-records/${proof.id}.json`, proof);
  return proof;
}
