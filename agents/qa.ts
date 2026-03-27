import { verifyWorkspace } from "@/lib/verification-engine";
import type { GuardrailsSnapshot, VerificationResult, WorkspacePreparation } from "@/lib/types";

export class QAAgent {
  readonly name = "QA Agent";

  async run(input: { workspace: WorkspacePreparation; guardrails: GuardrailsSnapshot }): Promise<VerificationResult> {
    return verifyWorkspace(input.workspace, input.guardrails);
  }
}
