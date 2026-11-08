import type { HelpGuidesSeen, User } from '@/types/auth';
import type { HelpGuideTourId } from '@/features/helpGuides/helpGuideTourIds';

export function getSeenTourIdsForWorkspace(
  seen: HelpGuidesSeen | null | undefined,
  workspaceId: number | undefined,
): string[] {
  if (workspaceId == null) return [];
  const ids = seen?.by_workspace?.[String(workspaceId)];
  return Array.isArray(ids) ? ids : [];
}

export function hasSeenHelpGuide(
  tourId: HelpGuideTourId | string,
  workspaceId: number | undefined,
  user: User | null | undefined,
): boolean {
  if (!user || workspaceId == null) return true;
  return getSeenTourIdsForWorkspace(user.help_guides_seen, workspaceId).includes(tourId);
}

export function mergeHelpGuideSeenLocal(
  seen: HelpGuidesSeen | null | undefined,
  workspaceId: number,
  tourId: string,
): HelpGuidesSeen {
  const wsKey = String(workspaceId);
  const current = [...getSeenTourIdsForWorkspace(seen, workspaceId)];
  if (!current.includes(tourId)) {
    current.push(tourId);
  }
  return {
    by_workspace: {
      ...(seen?.by_workspace ?? {}),
      [wsKey]: current,
    },
  };
}

export function removeHelpGuidesSeenLocal(
  seen: HelpGuidesSeen | null | undefined,
  workspaceId: number,
  tourIds: string[],
): HelpGuidesSeen {
  const wsKey = String(workspaceId);
  const remove = new Set(tourIds);
  const current = getSeenTourIdsForWorkspace(seen, workspaceId).filter((id) => !remove.has(id));
  const byWorkspace = { ...(seen?.by_workspace ?? {}) };
  if (current.length > 0) {
    byWorkspace[wsKey] = current;
  } else {
    delete byWorkspace[wsKey];
  }
  return { by_workspace: byWorkspace };
}

export function resetHelpGuidesSeenLocal(
  seen: HelpGuidesSeen | null | undefined,
  scope: 'workspace' | 'all',
  workspaceId: number,
): HelpGuidesSeen {
  if (scope === 'all') {
    return { by_workspace: {} };
  }
  const next = { ...(seen?.by_workspace ?? {}) };
  delete next[String(workspaceId)];
  return { by_workspace: next };
}
