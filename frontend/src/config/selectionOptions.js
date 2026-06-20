/**
 * Static dropdown options for Product / Channel / Sub-Channel selectors.
 * These live on the frontend only — they are NOT fetched from the API.
 * The API is called only after all three values are chosen (Load Form).
 *
 * DB `product_code`, `channel_code`, and `sub_channel_code` must match these values exactly.
 */

/** @type {{ label: string, value: string }[]} */
export const PRODUCT_OPTIONS = [
  { label: 'Super Protect Plus Plan', value: 'SUPER_PROTECT_PLUS_PLAN' },
  { label: 'Super Protect Plan', value: 'SUPER_PROTECT_PLAN' },
  { label: 'Magic Savings Plan', value: 'MAGIC_SAVINGS_PLAN' },
  { label: 'Life Advantage Plus Plan', value: 'LIFE_ADVANTAGE_PLUS_PLAN' },
  { label: 'Wealth Gain Insurance Plan', value: 'WEALTH_GAIN_INSURANCE_PLAN' },
  {
    label: 'Wealthsurance Growth Insurance Plan SP II',
    value: 'WEALTHSURANCE_GROWTH_INSURANCE_PLAN_SP_II',
  },
  { label: 'Super Cash Plan', value: 'SUPER_CASH_PLAN' },
  { label: 'Assured Income Plan', value: 'ASSURED_INCOME_PLAN' },
  { label: 'iSecure Plan', value: 'ISECURE_PLAN' },
];

/** Channels shared across all products. */
const SHARED_CHANNELS = [
  { label: 'Banca', value: 'banca' },
  { label: 'Agency', value: 'agency' },
  { label: 'DST', value: 'dst' },
  { label: 'Broker', value: 'broker' },
  { label: 'Corporate', value: 'corporate' },
  { label: 'Vakrangee', value: 'vakrangee' },
];

/** Sub-channels shared across all channels. */
const SHARED_SUB_CHANNELS = [
  { label: 'Zopper', value: 'zopper' },
  { label: 'Insurance-Dekho', value: 'insurance-dekho' },
  { label: 'Policy-Bazaar', value: 'policy-bazaar' },
];

/**
 * Channels available per product code (same list for every product).
 * @type {Record<string, { label: string, value: string }[]>}
 */
export const CHANNEL_OPTIONS = Object.fromEntries(
  PRODUCT_OPTIONS.map((product) => [product.value, SHARED_CHANNELS])
);

/**
 * Sub-channels available per channel code (same list for every channel).
 * @type {Record<string, { label: string, value: string }[]>}
 */
export const SUB_CHANNEL_OPTIONS = Object.fromEntries(
  SHARED_CHANNELS.map((channel) => [channel.value, SHARED_SUB_CHANNELS])
);

/**
 * Resolves channel dropdown options for a selected product.
 * @param {string} productCode
 * @returns {{ label: string, value: string }[]}
 */
export function getChannelOptions(productCode) {
  if (!productCode) return [];
  return CHANNEL_OPTIONS[productCode] ?? SHARED_CHANNELS;
}

/**
 * Resolves sub-channel dropdown options for a selected channel.
 * @param {string} channelCode
 * @returns {{ label: string, value: string }[]}
 */
export function getSubChannelOptions(channelCode) {
  if (!channelCode) return [];
  return SUB_CHANNEL_OPTIONS[channelCode] ?? SHARED_SUB_CHANNELS;
}

/**
 * Returns true when the combination exists in selectionOptions.
 * @param {string} productCode
 * @param {string} channelCode
 * @param {string} subChannelCode
 * @returns {boolean}
 */
export function isValidCombination(productCode, channelCode, subChannelCode) {
  const productOk = PRODUCT_OPTIONS.some((p) => p.value === productCode);
  const channelOk = getChannelOptions(productCode).some(
    (c) => c.value === channelCode
  );
  const subChannelOk = getSubChannelOptions(channelCode).some(
    (s) => s.value === subChannelCode
  );
  return productOk && channelOk && subChannelOk;
}
