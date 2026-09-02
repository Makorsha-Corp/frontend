import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import TimezoneSettingsPanel from './TimezoneSettingsPanel';
import SavedStampSettingsPanel from './SavedStampSettingsPanel';

const GeneralSettingsPanel: React.FC = () => {
  return (
    <Accordion type="single" collapsible defaultValue="timezone" className="w-full">
      <AccordionItem value="timezone" className="border-border">
        <AccordionTrigger className="py-4 hover:no-underline">
          <div className="flex flex-1 flex-col items-start gap-1 pr-2 text-left">
            <span className="text-base font-semibold text-card-foreground">Timezone</span>
            <span className="text-sm font-normal text-muted-foreground">
              Event logs, discussions, and notifications display in this timezone. Calendar dates
              (due dates, planned work) stay as entered.
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-6">
          <TimezoneSettingsPanel />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="saved-stamp" className="border-border">
        <AccordionTrigger className="py-4 hover:no-underline">
          <div className="flex flex-1 flex-col items-start gap-1 pr-2 text-left">
            <span className="text-base font-semibold text-card-foreground">Saved stamp</span>
            <span className="text-sm font-normal text-muted-foreground">
              Draw or upload a personal stamp to place on attachment markups.
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-6">
          <SavedStampSettingsPanel />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default GeneralSettingsPanel;
