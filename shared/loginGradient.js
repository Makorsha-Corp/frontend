/**
 * Login page Lavender (default) gradient — static linear mode.
 * Synced from repo-root shared/ (see shared/README.md).
 */

const LAVENDER_LINEAR = {
  light:
    'linear-gradient(to bottom right, hsl(var(--background)) 8%, hsl(var(--background)) 45%, hsl(var(--primary) / 0.28) 100%)',
  dark:
    'linear-gradient(to bottom right, hsl(var(--background)) 8%, hsl(var(--background)) 48%, hsl(var(--primary) / 0.28) 100%)',
}

export const LAVENDER_RADIAL =
  'radial-gradient(ellipse 320% 280% at var(--login-grad-x, 72%) var(--login-grad-y, 65%), hsl(var(--primary) / 0.32) 0%, hsl(var(--background)) 46%, hsl(var(--background)) 100%)'

/** @param {'light' | 'dark' | string} theme */
export function getLoginGradientStyle(theme) {
  const bg = theme === 'dark' ? LAVENDER_LINEAR.dark : LAVENDER_LINEAR.light
  return { background: bg }
}

export function getLoginRadialGradientStyle() {
  return { background: LAVENDER_RADIAL }
}
