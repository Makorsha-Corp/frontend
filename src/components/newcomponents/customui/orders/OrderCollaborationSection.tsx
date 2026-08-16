import { useEffect, useState } from 'react';
import { ChevronRight, Paperclip } from 'lucide-react';

import { Tabs } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  EmphasisTabPanel,
  EmphasisTabsList,
  EmphasisTabsProvider,
  EmphasisTabsTrigger,
} from '@/components/newcomponents/customui/EmphasisTabSwitcher';
import AttachmentPanel from '@/components/newcomponents/customui/AttachmentPanel';
import AttachmentsManageDialog from '@/components/newcomponents/customui/AttachmentsManageDialog';
import DiscussionThread from '@/components/newcomponents/customui/DiscussionThread';
import { useListAttachmentsQuery } from '@/features/attachments/attachmentsApi';
import { useIsLgScreen } from '@/hooks/useIsLgScreen';
import { cn } from '@/lib/utils';
import { ORDER_DISCUSSION_SECTION_ID, DISCUSSION_URL_HASH } from '@/constants/discussion';
import type { AttachmentEntityType } from '@/types/attachment';
import type { DiscussionEntityType } from '@/types/discussion';

type CollaborationTab = 'discussion' | 'attachments';

/** Fixed collaboration card body height (~273px: scroll area + input). */
const COLLABORATION_BODY_HEIGHT = 'h-[17.0625rem]';
/** Scrollable message / empty area within collaboration body. */
const COLLABORATION_CONTENT_MIN_H = 'min-h-[11.05rem]';

export interface OrderCollaborationSectionProps {
  discussionEntityType: DiscussionEntityType;
  attachmentEntityType: AttachmentEntityType;
  entityId: number;
  readOnly?: boolean;
  className?: string;
}

interface OrderAttachmentsCardProps {
  entityType: AttachmentEntityType;
  entityId: number;
  readOnly?: boolean;
  enabled?: boolean;
  count?: number;
  bodyHeightClass?: string;
  className?: string;
  /** Inside collaboration tab card — omit outer card + section title. */
  embeddedInTabs?: boolean;
}

function OrderAttachmentsCard({
  entityType,
  entityId,
  readOnly = false,
  enabled = true,
  count,
  bodyHeightClass,
  className,
  embeddedInTabs = false,
}: OrderAttachmentsCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const canOpenDialog = entityId > 0;

  const openDialog = () => {
    if (!canOpenDialog) return;
    setDialogOpen(true);
  };

  const headerLabel =
    count != null && count > 0
      ? `Open attachments manager (${count} files)`
      : 'Open attachments manager';

  if (embeddedInTabs) {
    return (
      <>
        {canOpenDialog ? (
          <div className="mb-3 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 text-xs text-muted-foreground"
              onClick={openDialog}
            >
              Manage
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </div>
        ) : null}
        <AttachmentPanel
          entityType={entityType}
          entityId={entityId}
          enabled={enabled}
          readOnly={readOnly}
          compact
          className={cn('w-full', className)}
        />
        <AttachmentsManageDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          entityType={entityType}
          entityId={entityId}
          readOnly={readOnly}
          count={count}
        />
      </>
    );
  }

  return (
    <>
      <Card className={cn('flex h-full flex-col', className)}>
        <CardHeader
          role="button"
          tabIndex={canOpenDialog ? 0 : -1}
          aria-label={headerLabel}
          aria-disabled={!canOpenDialog}
          onClick={openDialog}
          onKeyDown={(event) => {
            if (!canOpenDialog) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openDialog();
            }
          }}
          className={cn(
            'p-4 pb-3 shrink-0 rounded-t-lg transition-colors',
            canOpenDialog &&
              'cursor-pointer hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            !canOpenDialog && 'cursor-default opacity-60',
          )}
        >
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            Attachments
            {count != null && count > 0 ? (
              <Badge variant="outline" className="ml-1 font-normal">
                {count}
              </Badge>
            ) : null}
            {canOpenDialog ? (
              <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" aria-hidden />
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className={cn('flex min-h-0 flex-col p-4 pt-0', bodyHeightClass)}>
          <AttachmentPanel
            entityType={entityType}
            entityId={entityId}
            enabled={enabled}
            readOnly={readOnly}
            compact
            className="h-full"
          />
        </CardContent>
      </Card>

      <AttachmentsManageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entityType={entityType}
        entityId={entityId}
        readOnly={readOnly}
        count={count}
      />
    </>
  );
}

export default function OrderCollaborationSection({
  discussionEntityType,
  attachmentEntityType,
  entityId,
  readOnly = false,
  className,
}: OrderCollaborationSectionProps) {
  const isLgScreen = useIsLgScreen();
  const [mobileTab, setMobileTab] = useState<CollaborationTab>('discussion');

  const canQueryAttachments = entityId > 0;
  const { data: attachmentList } = useListAttachmentsQuery(
    { entity_type: attachmentEntityType, entity_id: entityId },
    { skip: !canQueryAttachments },
  );
  const attachmentCount = attachmentList?.items.length ?? 0;

  useEffect(() => {
    if (window.location.hash !== `#${DISCUSSION_URL_HASH}`) return;
    if (isLgScreen) return;
    setMobileTab('discussion');
  }, [entityId, isLgScreen]);

  useEffect(() => {
    if (window.location.hash !== `#${DISCUSSION_URL_HASH}`) return;

    const scrollToSection = () => {
      document.getElementById(ORDER_DISCUSSION_SECTION_ID)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    };

    const timeoutId = window.setTimeout(scrollToSection, 150);
    return () => window.clearTimeout(timeoutId);
  }, [entityId, discussionEntityType, attachmentEntityType]);

  if (isLgScreen) {
    return (
      <div
        id={ORDER_DISCUSSION_SECTION_ID}
        className={cn(
          'grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3 scroll-mt-6',
          className,
        )}
      >
        <div className="flex min-h-0 flex-col lg:col-span-2">
          <DiscussionThread
            entityType={discussionEntityType}
            entityId={entityId}
            readOnly={readOnly}
            compactBody
            compactBodyHeightClass={COLLABORATION_BODY_HEIGHT}
            compactBodyMinHeightClass={COLLABORATION_CONTENT_MIN_H}
            className="h-full"
          />
        </div>
        <div className="flex min-h-0 flex-col lg:col-span-1">
          <OrderAttachmentsCard
            entityType={attachmentEntityType}
            entityId={entityId}
            readOnly={readOnly}
            count={attachmentCount}
            bodyHeightClass={COLLABORATION_BODY_HEIGHT}
            className="h-full"
          />
        </div>
      </div>
    );
  }

  return (
    <Card id={ORDER_DISCUSSION_SECTION_ID} className={cn('scroll-mt-6 overflow-hidden', className)}>
      <EmphasisTabsProvider value={mobileTab}>
        <Tabs
          value={mobileTab}
          onValueChange={(value) => setMobileTab(value as CollaborationTab)}
          className="flex flex-col"
        >
          <div className="shrink-0 border-b border-border px-3 py-2">
            <EmphasisTabsList className="mb-0 gap-0.5 p-0.5">
              <EmphasisTabsTrigger
                value="discussion"
                title="Discussion"
                className="px-2 text-[11px] leading-tight data-[state=active]:text-xs"
              >
                Discuss
              </EmphasisTabsTrigger>
              <EmphasisTabsTrigger
                value="attachments"
                title="Attachments"
                className="px-2 text-[11px] leading-tight data-[state=active]:text-xs"
              >
                <span className="inline-flex items-center gap-1">
                  Files
                  {attachmentCount > 0 ? (
                    <Badge
                      variant="outline"
                      className="h-4 min-w-4 shrink-0 px-1 py-0 text-[10px] font-normal leading-none"
                    >
                      {attachmentCount}
                    </Badge>
                  ) : null}
                </span>
              </EmphasisTabsTrigger>
            </EmphasisTabsList>
          </div>

          <div className="px-3 pb-3 pt-2.5">
            <EmphasisTabPanel panelKey={mobileTab}>
              {mobileTab === 'discussion' ? (
                <DiscussionThread
                  entityType={discussionEntityType}
                  entityId={entityId}
                  readOnly={readOnly}
                  embeddedInTabs
                />
              ) : (
                <OrderAttachmentsCard
                  entityType={attachmentEntityType}
                  entityId={entityId}
                  readOnly={readOnly}
                  count={attachmentCount}
                  enabled={mobileTab === 'attachments'}
                  embeddedInTabs
                />
              )}
            </EmphasisTabPanel>
          </div>
        </Tabs>
      </EmphasisTabsProvider>
    </Card>
  );
}
