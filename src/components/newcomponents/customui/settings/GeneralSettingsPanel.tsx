import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import TimezoneSettingsPanel from './TimezoneSettingsPanel';
import TimeFormatSettingsPanel from './TimeFormatSettingsPanel';
import SavedStampSettingsPanel from './SavedStampSettingsPanel';
import ProductionMachinePickPolicyPanel from './ProductionMachinePickPolicyPanel';
import HelpGuidesSettingsPanel from './HelpGuidesSettingsPanel';

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
      <AccordionItem value="time-format" className="border-border">
        <AccordionTrigger className="py-4 hover:no-underline">
          <div className="flex flex-1 flex-col items-start gap-1 pr-2 text-left">
            <span className="text-base font-semibold text-card-foreground">Time format</span>
            <span className="text-sm font-normal text-muted-foreground">
              Choose 24-hour clock or 12-hour with AM/PM for time pickers across the app.
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-6">
          <TimeFormatSettingsPanel />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="production-machine-pick" className="border-border">
        <AccordionTrigger className="py-4 hover:no-underline">
          <div className="flex flex-1 flex-col items-start gap-1 pr-2 text-left">
            <span className="text-base font-semibold text-card-foreground">Production machine picks</span>
            <span className="text-sm font-normal text-muted-foreground">
              When assigning a machine to a batch step, choose warn-only or block rules for off,
              maintenance, and schedule overlap.
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-6">
          <ProductionMachinePickPolicyPanel />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="page-guides" className="border-border">
        <AccordionTrigger className="py-4 hover:no-underline">
          <div className="flex flex-1 flex-col items-start gap-1 pr-2 text-left">
            <span className="text-base font-semibold text-card-foreground">Page guides</span>
            <span className="text-sm font-normal text-muted-foreground">
              First-visit walkthroughs on Orders and other pages. Reset to see them again.
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-6">
          <HelpGuidesSettingsPanel />
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
