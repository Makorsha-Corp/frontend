/** Product brand — single source of truth for user-facing ERP copy. */
export const BRAND_NAME = 'Kolom';
export const BRAND_DOMAIN = 'kolom.app';
export const BRAND_PRODUCT = `${BRAND_NAME} ERP`;

export const supportEmail = (): string => `support@${BRAND_DOMAIN}`;
export const appOrigin = (): string => `https://app.${BRAND_DOMAIN}`;
