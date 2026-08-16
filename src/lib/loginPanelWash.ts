/** CSS-only frosted wash for login left panel — no backdrop-filter (perf + no edge fringing). */

export type LoginPanelTheme = 'light' | 'dark';

const ASIDE_WASH: Record<LoginPanelTheme, string> = {
  light: 'bg-gradient-to-br from-white/75 via-white/55 to-primary/5',
  dark: 'bg-gradient-to-br from-background/65 via-background/50 to-primary/10',
};

export function loginAsideWashClass(theme: LoginPanelTheme): string {
  return ASIDE_WASH[theme];
}
