import React, { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { useAppSelector } from "@/app/hooks";
import type { User } from "@/types/auth";
import type { Workspace } from "@/types/workspace";
import type { ApplicationSettings, Profile, Status, AccessRole } from "@/types";
import type { FeatureKey, RoleAccessSnapshot } from "@/services/AccessControlService";

/** Minimal session shape for legacy PrivateRoute checks */
export type LegacyAuthSession = {
  user: { id: string };
};

interface AuthContextType {
  session: LegacyAuthSession | null;
  profile: Profile | null;
  role: AccessRole | null;

  allStatuses: Status[] | null;
  appSettings: ApplicationSettings[] | null;

  accessSnapshot: RoleAccessSnapshot | null;
  canViewPage: (pageKey: string) => boolean;
  canAccessManageOrder: (statusId: number) => boolean;
  hasFeatureAccess: (key: FeatureKey) => boolean;

  accessLoading: boolean;
  loading: boolean;

  setSession: React.Dispatch<React.SetStateAction<LegacyAuthSession | null>>;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  setAppSettings: React.Dispatch<React.SetStateAction<ApplicationSettings[] | null>>;
  setAllStatuses: React.Dispatch<React.SetStateAction<Status[] | null>>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const VALID_ROLES: AccessRole[] = ["owner", "finance", "ground-team", "ground-team-manager"];

function mapRoleToAccessRole(role: string | undefined): AccessRole {
  const normalized = role?.toLowerCase().replace(/_/g, "-");
  if (normalized && VALID_ROLES.includes(normalized as AccessRole)) {
    return normalized as AccessRole;
  }
  return "owner";
}

function buildProfile(user: User | null, workspace: Workspace | null): Profile | null {
  if (!user) return null;
  const permission = mapRoleToAccessRole(workspace?.role);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    permission,
    position: workspace?.role || permission,
    user_id: String(user.id),
  };
}

const openAccessCheckers = {
  canViewPage: (_pageKey: string) => true,
  canAccessManageOrder: (_statusId: number) => true,
  hasFeatureAccess: (_key: FeatureKey) => true,
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, isAuthenticated, workspace } = useAppSelector((state) => state.auth);

  const [profileOverride, setProfile] = useState<Profile | null>(null);
  const [allStatuses, setAllStatuses] = useState<Status[] | null>(null);
  const [appSettings, setAppSettings] = useState<ApplicationSettings[] | null>(null);

  const profile = profileOverride ?? buildProfile(user, workspace);

  const session = useMemo<LegacyAuthSession | null>(() => {
    if (!isAuthenticated || !user) return null;
    return { user: { id: String(user.id) } };
  }, [isAuthenticated, user]);

  const role = (profile?.permission as AccessRole) ?? null;

  const setSession: React.Dispatch<React.SetStateAction<LegacyAuthSession | null>> = () => {
    // Legacy pages may call this; auth state lives in Redux now.
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        role,
        appSettings,
        allStatuses,

        accessSnapshot: null,
        canViewPage: openAccessCheckers.canViewPage,
        canAccessManageOrder: openAccessCheckers.canAccessManageOrder,
        hasFeatureAccess: openAccessCheckers.hasFeatureAccess,

        accessLoading: false,
        loading: false,

        setSession,
        setProfile,
        setAppSettings,
        setAllStatuses,
      }}
    >
      {children}
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
