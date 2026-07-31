import { and, eq, ne } from "drizzle-orm";
import { db } from "../../db";
import { agentComponentRegistry } from "@shared/schema";
import type { ComponentContract, ComponentKind } from "./schemas/plan-schemas";
import { hashArtifact, hashStructured } from "./codegen/hash";

/**
 * Per-project component registry — every generated component becomes a
 * validated, versioned building block. Later runs (and screen additions)
 * reuse registry components instead of regenerating them.
 */

export interface RegistryComponent {
  name: string;
  kind: ComponentKind;
  ownerScreen: string | null;
  contract: ComponentContract;
  source: string;
  sourceHash: string;
  version: number;
  status: "validated" | "fallback" | "deprecated";
}

export async function listRegistry(projectId: string): Promise<RegistryComponent[]> {
  try {
    const rows = await db
      .select()
      .from(agentComponentRegistry)
      .where(and(eq(agentComponentRegistry.projectId, projectId), ne(agentComponentRegistry.status, "deprecated")));
    return rows.map((row) => ({
      name: row.name,
      kind: row.kind as ComponentKind,
      ownerScreen: (row.contract as { ownerScreen?: string })?.ownerScreen ?? null,
      contract: row.contract as unknown as ComponentContract,
      source: row.source,
      sourceHash: row.sourceHash,
      version: row.version,
      status: row.status as RegistryComponent["status"],
    }));
  } catch (err) {
    console.warn("[pastel-agent] listRegistry failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * A registry component can be reused when its contract is unchanged and it
 * was previously validated. Contract hashing keeps reuse deterministic.
 */
export function reusableComponent(
  registry: RegistryComponent[],
  contract: ComponentContract,
): RegistryComponent | null {
  const hit = registry.find((entry) => entry.name === contract.name);
  if (!hit || hit.status === "deprecated" || !hit.source.trim()) return null;
  const currentHash = hashStructured(hit.contract);
  const wantedHash = hashStructured(contract);
  if (currentHash !== wantedHash) return null;
  return hit;
}

export async function upsertRegistryComponent(
  projectId: string,
  component: {
    name: string;
    kind: ComponentKind;
    contract: ComponentContract;
    source: string;
    status: RegistryComponent["status"];
  },
): Promise<void> {
  try {
    const sourceHash = hashArtifact(component.source);
    const existing = await db
      .select({ version: agentComponentRegistry.version })
      .from(agentComponentRegistry)
      .where(and(eq(agentComponentRegistry.projectId, projectId), eq(agentComponentRegistry.name, component.name)))
      .limit(1);
    const nextVersion = (existing[0]?.version ?? 0) + 1;
    await db
      .insert(agentComponentRegistry)
      .values({
        projectId,
        name: component.name,
        kind: component.kind,
        spec: component.contract as unknown as Record<string, unknown>,
        contract: component.contract as unknown as Record<string, unknown>,
        source: component.source,
        sourceHash,
        version: nextVersion,
        status: component.status,
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [agentComponentRegistry.projectId, agentComponentRegistry.name],
        set: {
          kind: component.kind,
          spec: component.contract as unknown as Record<string, unknown>,
          contract: component.contract as unknown as Record<string, unknown>,
          source: component.source,
          sourceHash,
          version: nextVersion,
          status: component.status,
          verifiedAt: new Date(),
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    console.warn("[pastel-agent] upsertRegistryComponent failed:", err instanceof Error ? err.message : err);
  }
}
