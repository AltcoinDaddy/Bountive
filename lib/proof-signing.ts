import { privateKeyToAccount } from "viem/accounts";
import { env } from "@/lib/env";

export async function signProofHash(hash: string) {
  if (!env.proofSigningKey) {
    return {
      signed: false,
      signerAddress: null,
      signature: null,
      note: "Proof signing key is not configured."
    };
  }

  try {
    const account = privateKeyToAccount(env.proofSigningKey as `0x${string}`);
    const signature = await account.signMessage({
      message: hash
    });

    return {
      signed: true,
      signerAddress: account.address,
      signature,
      note: "Proof hash signed with the configured operator key."
    };
  } catch {
    return {
      signed: false,
      signerAddress: null,
      signature: null,
      note: "Proof signing key is configured but invalid."
    };
  }
}
