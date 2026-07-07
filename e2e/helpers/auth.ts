import type { APIRequestContext, Page } from '@playwright/test';
import { apiURL } from '../../playwright.config';

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: { id: number; name: string; email: string };
};

type WorkspaceListItem = {
  id: number;
  name: string;
  slug: string;
  role: string;
  subscription_status?: string | null;
};

type Factory = {
  id: number;
  name: string;
  abbreviation: string;
};

export function getTestCredentials() {
  return {
    email: process.env.PLAYWRIGHT_EMAIL ?? 'shohanc@hotmail.com',
    password: process.env.PLAYWRIGHT_PASSWORD ?? 'shohan123',
  };
}

let cachedLogin: LoginResponse | null = null;
let cachedLoginAt = 0;
const LOGIN_CACHE_MS = 5 * 60 * 1000;

export async function loginViaApi(request: APIRequestContext): Promise<LoginResponse> {
  if (cachedLogin && Date.now() - cachedLoginAt < LOGIN_CACHE_MS) {
    return cachedLogin;
  }
  const { email, password } = getTestCredentials();
  const res = await request.post(`${apiURL}auth/login/`, {
    data: { email, password },
  });
  if (!res.ok()) {
    throw new Error(`Login failed (${res.status()}): ${await res.text()}`);
  }
  cachedLogin = await res.json();
  cachedLoginAt = Date.now();
  return cachedLogin;
}

export async function listWorkspaces(
  request: APIRequestContext,
  token: string,
): Promise<WorkspaceListItem[]> {
  const res = await request.get(`${apiURL}workspaces/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`List workspaces failed (${res.status()}): ${await res.text()}`);
  }
  return res.json();
}

export async function listFactories(
  request: APIRequestContext,
  token: string,
  workspaceId: number,
): Promise<Factory[]> {
  const res = await request.get(`${apiURL}factories/?skip=0&limit=100`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Workspace-ID': String(workspaceId),
    },
  });
  if (!res.ok()) {
    throw new Error(`List factories failed (${res.status()}): ${await res.text()}`);
  }
  return res.json();
}

/** Seed localStorage so the app opens already authenticated with a workspace. */
export async function seedAuthenticatedSession(
  page: Page,
  request: APIRequestContext,
): Promise<{ workspaceId: number; factoryId: number | null; factoryName: string | null }> {
  const login = await loginViaApi(request);
  const workspaces = await listWorkspaces(request, login.access_token);
  if (!workspaces.length) {
    throw new Error('No workspaces available for test user. Create one first.');
  }
  const workspace = workspaces[0];
  const factories = await listFactories(request, login.access_token, workspace.id);
  const factory = factories[0] ?? null;

  await page.goto('/');
  await page.evaluate(
    ({ login, workspace, factory }) => {
      localStorage.setItem('auth_token', login.access_token);
      localStorage.setItem('refresh_token', login.refresh_token);
      localStorage.setItem('user_data', JSON.stringify(login.user));
      localStorage.setItem('workspace_id', String(workspace.id));
      localStorage.setItem(
        'workspace_data',
        JSON.stringify({
          id: workspace.id,
          name: workspace.name,
          role: workspace.role,
          status: workspace.subscription_status ?? 'active',
        }),
      );
      if (factory) {
        localStorage.setItem('selected_factory', JSON.stringify(factory));
      }
    },
    { login, workspace, factory },
  );
  await page.reload();

  return {
    workspaceId: workspace.id,
    factoryId: factory?.id ?? null,
    factoryName: factory?.name ?? null,
  };
}
