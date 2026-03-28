import { createPublicClient, createWalletClient, http, isAddress, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { env } from "@/lib/env";

const proofRegistryAbi = parseAbi([
  "function recordProof(bytes32 proofHash, string missionId, string identityReference, string repoUrl, string issueUrl) returns (bytes32)"
]);

export type ProofPublishingStatus = {
  status: "inactive" | "ready" | "blocked" | "published" | "failed";
  network: string;
  registryAddress: string | null;
  note: string;
  txHash: string | null;
};

export function getProofPublishingStatus(): ProofPublishingStatus {
  if (!env.enableProofPublishing) {
    return {
      status: "inactive",
      network: env.network,
      registryAddress: env.proofRegistryAddress || null,
      note: "Onchain proof publishing is disabled.",
      txHash: null
    };
  }

  if (!env.chainRpcUrl) {
    return {
      status: "blocked",
      network: env.network,
      registryAddress: env.proofRegistryAddress || null,
      note: "Configure BOUNTIVE_CHAIN_RPC_URL before publishing proofs.",
      txHash: null
    };
  }

  if (!isAddress(env.proofRegistryAddress)) {
    return {
      status: "blocked",
      network: env.network,
      registryAddress: env.proofRegistryAddress || null,
      note: "Configure a valid BOUNTIVE_PROOF_REGISTRY_ADDRESS before publishing proofs.",
      txHash: null
    };
  }

  if (!env.proofSigningKey) {
    return {
      status: "blocked",
      network: env.network,
      registryAddress: env.proofRegistryAddress,
      note: "Configure BOUNTIVE_PROOF_SIGNING_KEY before publishing proofs.",
      txHash: null
    };
  }

  return {
    status: "ready",
    network: env.network,
    registryAddress: env.proofRegistryAddress,
    note: "Onchain proof publishing is configured and ready.",
    txHash: null
  };
}

export async function publishProofOnchain(input: {
  proofHash: `0x${string}`;
  missionId: string;
  identityReference: string;
  repoUrl: string;
  issueUrl: string;
}): Promise<ProofPublishingStatus> {
  const readiness = getProofPublishingStatus();

  if (readiness.status !== "ready") {
    return readiness;
  }

  try {
    const account = privateKeyToAccount(env.proofSigningKey as `0x${string}`);
    const transport = http(env.chainRpcUrl);
    const publicClient = createPublicClient({
      transport
    });
    const walletClient = createWalletClient({
      account,
      chain: undefined,
      transport
    });

    const hash = await walletClient.writeContract({
      address: env.proofRegistryAddress as `0x${string}`,
      abi: proofRegistryAbi,
      chain: undefined,
      functionName: "recordProof",
      args: [input.proofHash, input.missionId, input.identityReference, input.repoUrl, input.issueUrl]
    });

    await publicClient.waitForTransactionReceipt({
      hash
    });

    return {
      status: "published",
      network: env.network,
      registryAddress: env.proofRegistryAddress,
      note: "Proof hash recorded onchain through the configured proof registry.",
      txHash: hash
    };
  } catch (error) {
    return {
      status: "failed",
      network: env.network,
      registryAddress: env.proofRegistryAddress || null,
      note: error instanceof Error ? error.message : "Onchain proof publishing failed.",
      txHash: null
    };
  }
}
