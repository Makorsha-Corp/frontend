import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase_client } from "@/services/SupabaseClient";
import { getUserProfile } from "@/services/ProfilesService";
import type { ApplicationSettings, Profile, Status, AccessRole } from "@/types";
import { fetchAppSettings } from "@/services/AppSettingsService";
import FullScreenLoader from "@/pages/FullScreenLoader";
import { fetchStatuses } from "@/services/StatusesService";

// Access helpers
import {
  fetchRoleAccessSnapshot,
  makeAccessCheckers,
  type RoleAccessSnapshot,
  type FeatureKey,
} from "@/services/AccessControlService";

interface AuthContextType {
  session: Session | null;
  profile: Profile | null;
  role: AccessRole | null;

  allStatuses: Status[] | null;
  appSettings: ApplicationSettings[] | null;

  // access snapshot + checkers
  accessSnapshot: RoleAccessSnapshot | null;
  canViewPage: (pageKey: string) => boolean;
  canAccessManageOrder: (statusId: number) => boolean;
  hasFeatureAccess: (key: FeatureKey) => boolean;

  /** true until the first ACL snapshot for the current role has been loaded */
  accessLoading: boolean;

  loading: boolean;

  // setters
  setSession: React.Dispatch<React.SetStateAction<Session | null>>;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  setAppSettings: React.Dispatch<React.SetStateAction<ApplicationSettings[] | null>>;
  setAllStatuses: React.Dispatch<React.SetStateAction<Status[] | null>>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [allStatuses, setAllStatuses] = useState<Status[] | null>(null);
  const [appSettings, setAppSettings] = useState<ApplicationSettings[] | null>(null);

  const [accessSnapshot, setAccessSnapshot] = useState<RoleAccessSnapshot | null>(null);
  const [accessLoading, setAccessLoading] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(true);

  /* ---------------------------- bootstrap session ---------------------------- */
  useEffect(() => {
    const loadSession = async () => {
      const { data: { session } } = await supabase_client.auth.getSession();
      if (session) {
        setSession(session);
        await Promise.all([
          loadProfile(session.user.id),
          loadAppSettings(),
          loadStatuses(),
        ]);
      }
      setLoading(false);
    };

    loadSession();

    const { data } = supabase_client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setSession(null);
        setProfile(null);
        setAppSettings(null);
        setAllStatuses(null);
        setAccessSnapshot(null);
        setAccessLoading(false);
      } else if (event === "SIGNED_IN" && session) {
        setSession(prevSession => {
          const isNewUser = !prevSession || prevSession.user.id !== session.user.id;

          if (isNewUser) {
            (async () => {
              setLoading(true);
              await Promise.all([
                loadProfile(session.user.id),
                loadAppSettings(),
                loadStatuses(),
              ]);
              setLoading(false);
            })();
          }

          return session;
        });
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  /* ---------------------------- realtime listeners --------------------------- */
  useEffect(() => {
    if (!session?.user?.id) return;

    const profileChannel = supabase_client
      .channel("user_profile_updates")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "profiles",
        filter: `id=eq.${session.user.id}`,
      }, (payload) => {
        if (payload.eventType === "UPDATE" && payload.new) {
          setProfile(prev => prev ? { ...prev, ...(payload.new as Partial<Profile>) } : (payload.new as Profile));
        } else if (payload.eventType === "DELETE") {
          setProfile(null);
        }
      })
      .subscribe();

    const settingsChannel = supabase_client
      .channel("app_settings_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_settings" }, (payload) => {
        setAppSettings(prevSettings => {
          if (!prevSettings) return prevSettings;
          if (payload.eventType === "UPDATE" && payload.new) {
            return prevSettings.map(s =>
              s.id === (payload.new as any).id ? { ...s, ...(payload.new as Partial<ApplicationSettings>) } : s
            );
          } else if (payload.eventType === "INSERT" && payload.new) {
            return [...prevSettings, payload.new as ApplicationSettings];
          } else if (payload.eventType === "DELETE" && payload.old) {
            return prevSettings.filter(s => s.id !== (payload.old as any).id);
          }
          return prevSettings;
        });
      })
      .subscribe();

    const statusesChannel = supabase_client
      .channel("statuses_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "statuses" }, (payload) => {
        setAllStatuses(prev => {
          if (!prev) return prev;
          if (payload.eventType === "UPDATE" && payload.new) {
            return prev.map(st =>
              st.id === (payload.new as any).id ? { ...st, ...(payload.new as Partial<Status>) } : st
            );
          } else if (payload.eventType === "INSERT" && payload.new) {
            return [...prev, payload.new as Status];
          } else if (payload.eventType === "DELETE" && payload.old) {
            return prev.filter(st => st.id !== (payload.old as any).id);
          }
          return prev;
        });
      })
      .subscribe();

    const accessChannel = supabase_client
      .channel("access_control_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "access_control" }, async () => {
        // refresh snapshot in the background (no spinner/flicker)
        if (profile?.permission) {
          try {
            const snap = await fetchRoleAccessSnapshot(profile.permission as AccessRole);
            setAccessSnapshot(snap);
          } catch {/* ignore transient errors */}
        }
      })
      .subscribe();

    return () => {
      profileChannel.unsubscribe();
      settingsChannel.unsubscribe();
      statusesChannel.unsubscribe();
      accessChannel.unsubscribe();
    };
  }, [session?.user?.id, profile?.permission]);

  /* ---------------------- load role access when role ready ------------------- */
  useEffect(() => {
    let cancelled = false;

    const loadAccess = async () => {
      if (!profile?.permission) {
        setAccessSnapshot(null);
        setAccessLoading(false);
        return;
      }

      setAccessLoading(true);
      try {
        const snap = await fetchRoleAccessSnapshot(profile.permission as AccessRole);
        if (!cancelled) setAccessSnapshot(snap);
      } catch (e) {
        console.warn("⚠️ Could not load role access snapshot", e);
        if (!cancelled) setAccessSnapshot(null);
      } finally {
        if (!cancelled) setAccessLoading(false);
      }
    };

    void loadAccess();
    return () => { cancelled = true; };
  }, [profile?.permission]);

  /* ------------------------------- loaders ---------------------------------- */
  const loadProfile = async (user_id: string) => {
    const curr_profile = await getUserProfile(user_id);
    if (curr_profile) setProfile(curr_profile);
    else console.warn("⚠️ Could not load profile");
  };

  const loadAppSettings = async () => {
    const curr_settings = await fetchAppSettings();
    if (curr_settings) setAppSettings(curr_settings);
    else console.warn("⚠️ Could not load app settings");
  };

  const loadStatuses = async () => {
    const statuses = await fetchStatuses();
    if (statuses) setAllStatuses(statuses);
    else console.warn("⚠️ Could not load all statuses");
  };

  const role = (profile?.permission as AccessRole) ?? null;

  /* --------------------------- derived checkers ----------------------------- */
  const checkers = useMemo(() => {
    if (!accessSnapshot) {
      // before snapshot: closed gates (PrivateRoute will wait on accessLoading)
      return {
        canViewPage: (_page: string) => false,
        canAccessManageOrder: (_statusId: number) => false,
        hasFeatureAccess: (_key: FeatureKey) => false,
      };
    }
    const { canViewPage, canAccessManageOrder, hasFeature } = makeAccessCheckers(accessSnapshot);
    return {
      canViewPage,
      canAccessManageOrder,
      hasFeatureAccess: (key: FeatureKey) => hasFeature(key),
    };
  }, [accessSnapshot]);

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        role,
        appSettings,
        allStatuses,

        accessSnapshot,
        canViewPage: checkers.canViewPage,
        canAccessManageOrder: checkers.canAccessManageOrder,
        hasFeatureAccess: checkers.hasFeatureAccess,

        accessLoading,
        loading,

        setSession,
        setProfile,
        setAppSettings,
        setAllStatuses,
      }}
    >
      {loading ? <FullScreenLoader /> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
