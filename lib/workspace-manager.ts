import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { safeJsonParse } from "@/lib/utils";

export async function ensureDefaultWorkspace() {
  const existing = await prisma.workspace.findUnique({
    where: {
      slug: "default"
    },
    include: {
      approvalPolicy: true
    }
  });

  if (existing) {
    return existing;
  }

  return prisma.workspace.create({
    data: {
      name: "Default Workspace",
      slug: "default",
      authMode: env.authMode,
      operatorEmail: env.operatorEmail,
      approvalPolicy: {
        create: {
          requireHumanApprovalForLive: true,
          allowAutoApproveDryRun: true,
          allowApproveFailedChecks: env.allowApproveWithFailedChecks,
          maxPatchFiles: env.maxChangedFiles,
          allowedTaskCategories: JSON.stringify(["documentation", "developer-experience copy", "configuration", "tests"])
        }
      }
    },
    include: {
      approvalPolicy: true
    }
  });
}

export function readAllowedTaskCategories(value: string | null | undefined) {
  return safeJsonParse<string[]>(value, []);
}

export async function getWorkspaceOverview() {
  const workspace = await prisma.workspace.findFirst({
    orderBy: {
      createdAt: "asc"
    },
    include: {
      approvalPolicy: true,
      missions: {
        orderBy: {
          updatedAt: "desc"
        },
        take: 5
      }
    }
  });

  if (!workspace) {
    return null;
  }

  return {
    ...workspace,
    approvalPolicy: workspace.approvalPolicy
      ? {
          ...workspace.approvalPolicy,
          allowedTaskCategories: readAllowedTaskCategories(workspace.approvalPolicy.allowedTaskCategories)
        }
      : null
  };
}

export async function updateDefaultWorkspacePolicy(input: {
  operatorEmail: string;
  requireHumanApprovalForLive: boolean;
  allowAutoApproveDryRun: boolean;
  allowApproveFailedChecks: boolean;
  maxPatchFiles: number;
  allowedTaskCategories: string[];
}) {
  const workspace = await ensureDefaultWorkspace();

  return prisma.workspace.update({
    where: {
      id: workspace.id
    },
    data: {
      operatorEmail: input.operatorEmail,
      approvalPolicy: {
        upsert: {
          create: {
            requireHumanApprovalForLive: input.requireHumanApprovalForLive,
            allowAutoApproveDryRun: input.allowAutoApproveDryRun,
            allowApproveFailedChecks: input.allowApproveFailedChecks,
            maxPatchFiles: input.maxPatchFiles,
            allowedTaskCategories: JSON.stringify(input.allowedTaskCategories)
          },
          update: {
            requireHumanApprovalForLive: input.requireHumanApprovalForLive,
            allowAutoApproveDryRun: input.allowAutoApproveDryRun,
            allowApproveFailedChecks: input.allowApproveFailedChecks,
            maxPatchFiles: input.maxPatchFiles,
            allowedTaskCategories: JSON.stringify(input.allowedTaskCategories)
          }
        }
      }
    },
    include: {
      approvalPolicy: true
    }
  });
}
