import { isAddress, isHash } from "viem";
import type { IdentityRecord, Mission, Submission, VerificationReport } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { buildAgentManifest } from "@/lib/manifest-generator";
import { hashPayload, writeArtifact } from "@/lib/artifacts";
import { publishProofOnchain } from "@/lib/proof-publisher";
import { signProofHash } from "@/lib/proof-signing";

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

  const registrationTxHash = env.registrationTxHash && isHash(env.registrationTxHash)
    ? env.registrationTxHash
    : null;

  return prisma.identityRecord.create({
    data: {
      agentName: "Bountive Operator",
      operatorWallet,
      network: env.network,
      registrationTxHash,
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
  const proofHash = hashPayload({
    missionId: input.mission.id,
    verificationHash,
    logHash
  });
  const proofSignature = await signProofHash(proofHash);
  const onchainPublication = await publishProofOnchain({
    proofHash: proofHash as `0x${string}`,
    missionId: input.mission.id,
    identityReference: input.identity.identityReference,
    repoUrl: input.mission.selectedRepo ? `https://github.com/${input.mission.selectedRepo}` : "",
    issueUrl: input.mission.selectedIssueUrl ?? ""
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
  await writeArtifact(`proof-records/${proof.id}.bundle.json`, {
    proof_format: "bountive-proof/v1",
    proof_id: proof.id,
    created_at: proof.createdAt.toISOString(),
    identity: {
      agent_name: input.identity.agentName,
      operator_wallet: input.identity.operatorWallet,
      network: input.identity.network,
      identity_reference: input.identity.identityReference,
      registration_tx_hash: input.identity.registrationTxHash,
      manifest_uri: input.identity.manifestUri
    },
    mission: {
      mission_id: input.mission.id,
      title: input.mission.title,
      mode: input.mission.mode,
      status: input.mission.status,
      selected_issue_url: input.mission.selectedIssueUrl,
      selected_repo: input.mission.selectedRepo
    },
    submission: {
      branch_name: input.submission.branchName,
      commit_hash: input.submission.commitHash,
      pr_url: input.submission.prUrl,
      submission_status: input.submission.submissionStatus
    },
    verification: {
      install_status: input.verification.installStatus,
      build_status: input.verification.buildStatus,
      lint_status: input.verification.lintStatus,
      test_status: input.verification.testStatus,
      criteria_met: input.verification.criteriaMet,
      qa_decision: input.verification.qaDecision,
      qa_notes: input.verification.qaNotes
    },
    proofs: {
      proof_hash: proofHash,
      verification_hash: verificationHash,
      log_hash: logHash,
      signature: proofSignature.signature,
      signer_address: proofSignature.signerAddress
    },
    signing: proofSignature,
    onchain: onchainPublication,
    references: {
      proof_record_artifact: `artifacts/proof-records/${proof.id}.json`,
      mission_summary_artifact: `artifacts/missions/${input.mission.id}.summary.json`,
      verification_artifact: `artifacts/missions/${input.mission.id}.verification.json`,
      submission_artifact: `artifacts/missions/${input.mission.id}.submission.json`,
      agent_manifest_artifact: "artifacts/generated/agent.json"
    }
  });
  await writeArtifact(`proof-records/${proof.id}.signature.json`, {
    proof_id: proof.id,
    proof_hash: proofHash,
    ...proofSignature
  });
  await writeArtifact(`proof-records/${proof.id}.onchain.json`, {
    proof_id: proof.id,
    proof_hash: proofHash,
    ...onchainPublication
  });
  return proof;
}
