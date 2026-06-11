import type { AppDispatch } from '@/app/store';
import { projectsApi } from '@/features/projects/projectsApi';

type MutationLifecycleApi = {
  dispatch: AppDispatch;
  queryFulfilled: Promise<unknown>;
};

/** Refresh project-level event log after component-scoped mutations. */
export async function invalidateProjectEventsOnFulfilled(
  _arg: unknown,
  api: MutationLifecycleApi
): Promise<void> {
  try {
    await api.queryFulfilled;
    api.dispatch(projectsApi.util.invalidateTags(['ProjectEvents']));
  } catch {
    /* mutation failed */
  }
}
