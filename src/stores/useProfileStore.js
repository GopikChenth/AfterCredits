import { create } from 'zustand';
import { getUserProfile } from '../services/profile';

const DEFAULT_STALE_TIME_MS = 2 * 60 * 1000;

let inFlightProfileRequest = null;

export const useProfileStore = create((set, get) => ({
  profile: null,
  loading: false,
  error: null,
  lastFetchedAt: 0,
  staleTimeMs: DEFAULT_STALE_TIME_MS,

  setStaleTime: (staleTimeMs) => set({ staleTimeMs }),

  isFresh: () => {
    const { lastFetchedAt, staleTimeMs } = get();
    if (!lastFetchedAt) return false;
    return Date.now() - lastFetchedAt < staleTimeMs;
  },

  fetchProfile: async ({ force = false } = {}) => {
    if (!force && get().isFresh()) {
      return { success: true, profile: get().profile, fromCache: true };
    }

    if (inFlightProfileRequest) {
      return inFlightProfileRequest;
    }

    set({ loading: true, error: null });

    inFlightProfileRequest = (async () => {
      const result = await getUserProfile();

      if (result.success && result.profile) {
        set({
          profile: result.profile,
          loading: false,
          error: null,
          lastFetchedAt: Date.now(),
        });
      } else {
        set({
          profile: null,
          loading: false,
          error: result.error || null,
          lastFetchedAt: Date.now(),
        });
      }

      return result;
    })();

    try {
      return await inFlightProfileRequest;
    } finally {
      inFlightProfileRequest = null;
    }
  },

  upsertProfile: (partialProfile) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...partialProfile } : partialProfile,
      lastFetchedAt: Date.now(),
    })),

  clearProfile: () =>
    set({
      profile: null,
      error: null,
      loading: false,
      lastFetchedAt: 0,
    }),
}));

