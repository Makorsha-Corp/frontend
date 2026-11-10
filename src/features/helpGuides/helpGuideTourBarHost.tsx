import { createRoot, type Root } from 'react-dom/client';
import HelpGuideTourBar, {
  type HelpGuideTourBarProps,
} from '@/components/newcomponents/customui/helpGuides/HelpGuideTourBar';

let hostEl: HTMLDivElement | null = null;
let reactRoot: Root | null = null;

export function mountHelpGuideTourBar(props: HelpGuideTourBarProps): void {
  if (!hostEl) {
    hostEl = document.createElement('div');
    hostEl.id = 'help-guide-tour-bar-host';
    document.body.appendChild(hostEl);
    reactRoot = createRoot(hostEl);
  }
  reactRoot?.render(<HelpGuideTourBar {...props} />);
}

export function unmountHelpGuideTourBar(): void {
  reactRoot?.render(null);
  hostEl?.remove();
  reactRoot = null;
  hostEl = null;
}
