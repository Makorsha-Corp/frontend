import type { DriveStep } from 'driver.js';
import {
  HELP_GUIDE_AFTER_CLICK_ACTION,
  HELP_GUIDE_AFTER_CLICK_CHAIN,
  HELP_GUIDE_CHAIN_ON_HIGHLIGHT,
  HELP_GUIDE_FOCUS_ADVANCE,
  HELP_GUIDE_FOCUS_FILL_ACTION,
  HELP_GUIDE_HIGHLIGHT_ONLY,
  HELP_GUIDE_COACH_LABEL,
  HELP_GUIDE_HINT_BODY,
  HELP_GUIDE_JOB_INDEX,
  HELP_GUIDE_SHORT_HINT,
  HELP_GUIDE_SHOW_COACH_DOT,
  HELP_GUIDE_SHOW_TOUR_BAR,
  HELP_GUIDE_STEP_NUMBER,
  HELP_GUIDE_STEP_TOTAL,
  type HelpGuidePoTourAction,
  type HelpGuidePoTourChainSpec,
} from '@/features/helpGuides/helpGuideSession';

export type ClickHintStepData = Record<string, unknown> & {
  [HELP_GUIDE_FOCUS_ADVANCE]?: boolean;
  [HELP_GUIDE_FOCUS_FILL_ACTION]?: HelpGuidePoTourAction;
  [HELP_GUIDE_CHAIN_ON_HIGHLIGHT]?: HelpGuidePoTourChainSpec;
  [HELP_GUIDE_AFTER_CLICK_CHAIN]?: HelpGuidePoTourChainSpec;
  [HELP_GUIDE_AFTER_CLICK_ACTION]?: HelpGuidePoTourAction;
  [HELP_GUIDE_JOB_INDEX]?: number;
  [HELP_GUIDE_SHOW_TOUR_BAR]?: boolean;
};

export type ClickHintStepOptions = {
  advanceOnClick?: boolean;
  chainOnHighlight?: HelpGuidePoTourChainSpec;
  chainAfterClick?: HelpGuidePoTourChainSpec;
  afterClickAction?: HelpGuidePoTourAction;
  jobIndex?: number;
  showTourBar?: boolean;
  stepNumber?: number;
  stepTotal?: number;
  coachLabel?: string;
  showCoachDot?: boolean;
  shortHint?: string;
};

function clickHintTitle(options?: ClickHintStepOptions): string {
  if (options?.coachLabel) return options.coachLabel;
  if (options?.stepNumber != null && options?.stepTotal != null) {
    return `Step ${options.stepNumber} of ${options.stepTotal}`;
  }
  return '';
}

const clickHintPopover = (hint: string, options?: ClickHintStepOptions) =>
  ({
    title: clickHintTitle(options),
    description: hint,
    showButtons: [] as const,
    showProgress: false,
    popoverClass: 'help-guide-popover help-guide-spotlight help-guide-click-hint',
  }) as const;

/** One-line hint on the ring; no Next/Back. Real click (or focus-advance) moves forward. */
export function clickHintStep(
  element: string | (() => Element),
  hint: string,
  data: ClickHintStepData,
  options?: ClickHintStepOptions,
): DriveStep {
  return {
    element,
    advanceOnClick: options?.advanceOnClick,
    waitForElement: 120_000,
    skipMissingElement: false,
    data: {
      ...data,
      [HELP_GUIDE_HIGHLIGHT_ONLY]: true,
      ...(options?.chainOnHighlight
        ? { [HELP_GUIDE_CHAIN_ON_HIGHLIGHT]: options.chainOnHighlight }
        : {}),
      ...(options?.chainAfterClick
        ? { [HELP_GUIDE_AFTER_CLICK_CHAIN]: options.chainAfterClick }
        : {}),
      ...(options?.afterClickAction
        ? { [HELP_GUIDE_AFTER_CLICK_ACTION]: options.afterClickAction }
        : {}),
      ...(options?.jobIndex != null ? { [HELP_GUIDE_JOB_INDEX]: options.jobIndex } : {}),
      ...(options?.showTourBar ? { [HELP_GUIDE_SHOW_TOUR_BAR]: true } : {}),
      ...(options?.stepNumber != null ? { [HELP_GUIDE_STEP_NUMBER]: options.stepNumber } : {}),
      ...(options?.stepTotal != null ? { [HELP_GUIDE_STEP_TOTAL]: options.stepTotal } : {}),
      ...(options?.coachLabel ? { [HELP_GUIDE_COACH_LABEL]: options.coachLabel } : {}),
      ...(options?.showCoachDot === false ? { [HELP_GUIDE_SHOW_COACH_DOT]: false } : {}),
      ...(options?.shortHint ? { [HELP_GUIDE_SHORT_HINT]: options.shortHint } : {}),
      [HELP_GUIDE_HINT_BODY]: hint,
    },
    popover: clickHintPopover(hint, options),
  };
}

export const PO_TOUR_CLICK_STEP_TOTAL = 6;

export const PO_TOUR_WORKFLOW_JOBS = [
  'Create',
  'Confirm',
  'Approve',
  'Finalize',
  'Receive',
  'Complete',
] as const;

export function clickHintFocusFill(
  fillAction: HelpGuidePoTourAction,
): Pick<ClickHintStepData, typeof HELP_GUIDE_FOCUS_ADVANCE | typeof HELP_GUIDE_FOCUS_FILL_ACTION> {
  return {
    [HELP_GUIDE_FOCUS_ADVANCE]: true,
    [HELP_GUIDE_FOCUS_FILL_ACTION]: fillAction,
  };
}

export function clickHintFocusAdvance(): Pick<ClickHintStepData, typeof HELP_GUIDE_FOCUS_ADVANCE> {
  return { [HELP_GUIDE_FOCUS_ADVANCE]: true };
}
