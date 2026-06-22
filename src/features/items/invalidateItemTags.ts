import type { AppDispatch } from '@/app/store';
import { itemTagsApi } from './itemTagsApi';

/** Refetch item tag lists (usage counts) after item CRUD changes tag assignments. */
export function invalidateItemTags(dispatch: AppDispatch) {
  dispatch(itemTagsApi.util.invalidateTags(['ItemTag']));
}
