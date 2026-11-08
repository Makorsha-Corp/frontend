import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  applyDocumentUiLanguage,
  readStoredUiLanguage,
  type UiLanguage,
} from '@/i18n/uiLanguage';

import enCommon from './locales/en/common.json';
import enNav from './locales/en/nav.json';
import enAuth from './locales/en/auth.json';
import enSettings from './locales/en/settings.json';
import enOrders from './locales/en/orders.json';
import enAccounts from './locales/en/accounts.json';
import enItems from './locales/en/items.json';
import enMachines from './locales/en/machines.json';
import enProduction from './locales/en/production.json';
import enInventory from './locales/en/inventory.json';
import enMisc from './locales/en/misc.json';
import enDashboard from './locales/en/dashboard.json';
import enNotifications from './locales/en/notifications.json';
import enFactories from './locales/en/factories.json';

import bnCommon from './locales/bn/common.json';
import bnNav from './locales/bn/nav.json';
import bnAuth from './locales/bn/auth.json';
import bnSettings from './locales/bn/settings.json';
import bnOrders from './locales/bn/orders.json';
import bnAccounts from './locales/bn/accounts.json';
import bnItems from './locales/bn/items.json';
import bnMachines from './locales/bn/machines.json';
import bnProduction from './locales/bn/production.json';
import bnInventory from './locales/bn/inventory.json';
import bnMisc from './locales/bn/misc.json';
import bnDashboard from './locales/bn/dashboard.json';
import bnNotifications from './locales/bn/notifications.json';
import bnFactories from './locales/bn/factories.json';

export const I18N_NAMESPACES = [
  'common',
  'nav',
  'auth',
  'settings',
  'orders',
  'accounts',
  'items',
  'machines',
  'production',
  'inventory',
  'misc',
  'dashboard',
  'notifications',
  'factories',
] as const;

const initialLng = readStoredUiLanguage();

void i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: enCommon,
      nav: enNav,
      auth: enAuth,
      settings: enSettings,
      orders: enOrders,
      accounts: enAccounts,
      items: enItems,
      machines: enMachines,
      production: enProduction,
      inventory: enInventory,
      misc: enMisc,
      dashboard: enDashboard,
      notifications: enNotifications,
      factories: enFactories,
    },
    bn: {
      common: bnCommon,
      nav: bnNav,
      auth: bnAuth,
      settings: bnSettings,
      orders: bnOrders,
      accounts: bnAccounts,
      items: bnItems,
      machines: bnMachines,
      production: bnProduction,
      inventory: bnInventory,
      misc: bnMisc,
      dashboard: bnDashboard,
      notifications: bnNotifications,
      factories: bnFactories,
    },
  },
  lng: initialLng,
  fallbackLng: 'en',
  supportedLngs: ['en', 'bn'],
  ns: [...I18N_NAMESPACES],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

void applyDocumentUiLanguage(initialLng);

export async function setUiLanguage(lang: UiLanguage): Promise<void> {
  await i18n.changeLanguage(lang);
  await applyDocumentUiLanguage(lang);
}

export default i18n;
