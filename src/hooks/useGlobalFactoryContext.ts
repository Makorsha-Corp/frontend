import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useAppSelector } from '@/app/hooks';
import type { Factory } from '@/types/factory';

/** Navbar / auth-scoped factory selection (localStorage-backed). */
export function useGlobalFactory(): Factory | null {
  return useAppSelector((state) => state.auth.factory);
}

export function resolveFactoryId(
  explicitFactoryId?: number | null,
  globalFactoryId?: number | null
): number | undefined {
  if (explicitFactoryId != null && Number.isFinite(explicitFactoryId)) {
    return explicitFactoryId;
  }
  if (globalFactoryId != null && Number.isFinite(globalFactoryId)) {
    return globalFactoryId;
  }
  return undefined;
}

/**
 * Pre-fill factory id when a dialog opens. Re-applies while the field is empty
 * until the user changes it; does not overwrite a manual selection or clear.
 */
export function useAutoSelectGlobalFactory(
  open: boolean,
  setFactoryId: Dispatch<SetStateAction<string>>,
  explicitFactoryId?: number | null,
  enabled = true
) {
  const globalFactory = useGlobalFactory();
  const userEditedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      userEditedRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (!open || !enabled || userEditedRef.current) return;

    const resolved = resolveFactoryId(explicitFactoryId, globalFactory?.id ?? null);
    if (resolved != null) {
      setFactoryId((current) => (current ? current : String(resolved)));
    }
  }, [open, enabled, explicitFactoryId, globalFactory?.id, setFactoryId]);

  return {
    markFactoryEdited: () => {
      userEditedRef.current = true;
    },
  };
}

/** Pre-fill numeric factory id when a dialog opens. */
export function useAutoSelectGlobalFactoryNumber(
  open: boolean,
  setFactoryId: Dispatch<SetStateAction<number | undefined>>,
  explicitFactoryId?: number | null,
  enabled = true
) {
  const globalFactory = useGlobalFactory();
  const userEditedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      userEditedRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (!open || !enabled || userEditedRef.current) return;

    const resolved = resolveFactoryId(explicitFactoryId, globalFactory?.id ?? null);
    if (resolved != null) {
      setFactoryId((current) => (current ?? resolved));
    }
  }, [open, enabled, explicitFactoryId, globalFactory?.id, setFactoryId]);

  return {
    markFactoryEdited: () => {
      userEditedRef.current = true;
    },
  };
}

/** Seed factory + section from page context / navbar factory until the user edits. */
export function useSeedFactorySectionOnOpen(options: {
  open: boolean;
  explicitFactoryId?: number | null;
  explicitSectionId?: number | null;
  selectedFactoryId: number | null;
  selectedSectionId: number | null;
  setFactoryId: Dispatch<SetStateAction<number | null>>;
  setSectionId: Dispatch<SetStateAction<number | null>>;
}) {
  const {
    open,
    explicitFactoryId,
    explicitSectionId,
    selectedFactoryId,
    selectedSectionId,
    setFactoryId,
    setSectionId,
  } = options;
  const globalFactory = useGlobalFactory();
  const userEditedFactory = useRef(false);
  const userEditedSection = useRef(false);

  useEffect(() => {
    if (!open) {
      userEditedFactory.current = false;
      userEditedSection.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (!open || userEditedFactory.current) return;

    const resolved = resolveFactoryId(explicitFactoryId, globalFactory?.id ?? null);
    if (resolved != null && selectedFactoryId !== resolved) {
      setFactoryId(resolved);
    }
  }, [open, explicitFactoryId, globalFactory?.id, selectedFactoryId, setFactoryId]);

  useEffect(() => {
    if (!open || userEditedSection.current) return;

    if (explicitSectionId != null && selectedSectionId !== explicitSectionId) {
      setSectionId(explicitSectionId);
    }
  }, [open, explicitSectionId, selectedSectionId, setSectionId]);

  return {
    markFactoryEdited: () => {
      userEditedFactory.current = true;
    },
    markSectionEdited: () => {
      userEditedSection.current = true;
    },
  };
}
