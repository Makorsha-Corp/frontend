import React, { useState } from 'react';
import { CircleHelp, Loader2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import { useMarkHelpGuideSeenMutation, useUnmarkHelpGuidesSeenMutation } from '@/features/auth/authApi';
import {
  HELP_GUIDE_HUB_TOUR_LEGACY_IDS,
  type HelpGuideTourId,
} from '@/features/helpGuides/helpGuideTourIds';
import { replayHelpGuideTour } from '@/features/helpGuides/replayHelpGuideTour';

export interface HelpGuidePageReplayButtonProps {
  tourId: HelpGuideTourId;
  compact?: boolean;
  /** @deprecated Use tourId only */
  listTourId?: HelpGuideTourId;
  /** @deprecated */
  detailTourId?: HelpGuideTourId;
  /** @deprecated */
  showDetailTour?: boolean;
}

/** DEV-only: clear seen state for this page and replay the matching tour. */
const HelpGuidePageReplayButton: React.FC<HelpGuidePageReplayButtonProps> = ({
  tourId: tourIdProp,
  compact = false,
  listTourId,
  detailTourId,
  showDetailTour = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [unmarkSeen] = useUnmarkHelpGuidesSeenMutation();
  const [markSeen] = useMarkHelpGuideSeenMutation();
  const [busy, setBusy] = useState(false);

  if (!import.meta.env.DEV) {
    return null;
  }

  const tourId =
    tourIdProp ??
    (showDetailTour && detailTourId != null ? detailTourId : listTourId!);

  const legacyPair = HELP_GUIDE_HUB_TOUR_LEGACY_IDS[tourId];
  const tourIdsToClear = [
    tourId,
    ...(legacyPair ?? []),
    ...(listTourId && detailTourId && !legacyPair ? [listTourId, detailTourId] : []),
  ].filter((id, index, arr) => arr.indexOf(id) === index);

  const handleReplay = async () => {
    setBusy(true);
    try {
      await unmarkSeen({ tour_ids: tourIdsToClear }).unwrap();
      await replayHelpGuideTour(
        tourId,
        navigate,
        () => ({ pathname: location.pathname, search: location.search }),
        (seenTourId) => {
          void markSeen({ tour_id: seenTourId });
        },
      );
    } catch {
      // toast optional for dev tool
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? 'icon' : 'sm'}
      className={compact ? `${appShellHeaderControlClass} h-9 w-9 shrink-0` : appShellHeaderControlClass}
      disabled={busy}
      onClick={() => void handleReplay()}
      title="Replay page help tour (dev)"
      aria-label="Replay page help tour"
    >
      {busy ? (
        <Loader2 className={compact ? 'h-4 w-4 animate-spin' : 'mr-2 h-4 w-4 animate-spin'} />
      ) : (
        <CircleHelp className={compact ? 'h-4 w-4' : 'mr-2 h-4 w-4'} />
      )}
      {!compact ? 'Replay guide' : null}
    </Button>
  );
};

export default HelpGuidePageReplayButton;
