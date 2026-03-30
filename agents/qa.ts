import { captureBaselineVerification, verifyWorkspace } from "@/lib/verification-engine";
import type { GuardrailsSnapshot, VerificationResult, VerificationSnapshot, WorkspacePreparation } from "@/lib/types";

export class QAAgent {
  readonly name = "QA Agent";

  async captureBaseline(input: { workspace: WorkspacePreparation }): Promise<VerificationSnapshot> {
    return captureBaselineVerification(input.workspace);
  }

  async run(input: {
    workspace: WorkspacePreparation;
    guardrails: GuardrailsSnapshot;
    baselineVerification?: VerificationSnapshot;
  }): Promise<VerificationResult> {
    return verifyWorkspace(input.workspace, input.guardrails, input.baselineVerification);
  }
}
