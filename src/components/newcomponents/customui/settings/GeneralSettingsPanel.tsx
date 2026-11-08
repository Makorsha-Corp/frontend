import React from 'react';
import { useTranslation } from 'react-i18next';
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
import LanguageSettingsPanel from './LanguageSettingsPanel';

const GeneralSettingsPanel: React.FC = () => {
  const { t } = useTranslation('settings');
  return (
    <Accordion type="single" collapsible defaultValue="language" className="w-full">
      <AccordionItem value="language" className="border-border">
        <AccordionTrigger className="py-4 hover:no-underline">
          <div className="flex flex-1 flex-col items-start gap-1 pr-2 text-left">
            <span className="text-base font-semibold text-card-foreground">{t('languageTitle')}</span>
            <span className="text-sm font-normal text-muted-foreground">{t('languageDescription')}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-6">
          <LanguageSettingsPanel />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="timezone" className="border-border">
        <AccordionTrigger className="py-4 hover:no-underline">
          <div className="flex flex-1 flex-col items-start gap-1 pr-2 text-left">
            <span className="text-base font-semibold text-card-foreground">{t('timezoneTitle')}</span>
            <span className="text-sm font-normal text-muted-foreground">{t('timezoneDescription')}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-6">
          <TimezoneSettingsPanel />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="time-format" className="border-border">
        <AccordionTrigger className="py-4 hover:no-underline">
          <div className="flex flex-1 flex-col items-start gap-1 pr-2 text-left">
            <span className="text-base font-semibold text-card-foreground">{t('timeFormatTitle')}</span>
            <span className="text-sm font-normal text-muted-foreground">{t('timeFormatDescription')}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-6">
          <TimeFormatSettingsPanel />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="production-machine-pick" className="border-border">
        <AccordionTrigger className="py-4 hover:no-underline">
          <div className="flex flex-1 flex-col items-start gap-1 pr-2 text-left">
            <span className="text-base font-semibold text-card-foreground">{t('productionMachinePicksTitle')}</span>
            <span className="text-sm font-normal text-muted-foreground">{t('productionMachinePicksDescription')}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-6">
          <ProductionMachinePickPolicyPanel />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="page-guides" className="border-border">
        <AccordionTrigger className="py-4 hover:no-underline">
          <div className="flex flex-1 flex-col items-start gap-1 pr-2 text-left">
            <span className="text-base font-semibold text-card-foreground">{t('pageGuidesTitle')}</span>
            <span className="text-sm font-normal text-muted-foreground">{t('pageGuidesDescription')}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-6">
          <HelpGuidesSettingsPanel />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="saved-stamp" className="border-border">
        <AccordionTrigger className="py-4 hover:no-underline">
          <div className="flex flex-1 flex-col items-start gap-1 pr-2 text-left">
            <span className="text-base font-semibold text-card-foreground">{t('savedStampTitle')}</span>
            <span className="text-sm font-normal text-muted-foreground">{t('savedStampDescription')}</span>
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
