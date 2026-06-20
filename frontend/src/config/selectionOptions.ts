export const PRODUCT_OPTIONS = [{ label: 'Payment', value: 'PAYMENT' },{ label: 'Loan', value: 'LOAN' },];

export const CHANNEL_OPTIONS: Record<string, { label: string; value: string }[]> =
  {
    PAYMENT: [
      { label: 'Web', value: 'WEB' },
      { label: 'Mobile', value: 'MOBILE' },
    ],
  };

export const SUB_CHANNEL_OPTIONS: Record<
  string,
  { label: string; value: string }[]
> = {
  WEB: [
    { label: 'Standard', value: 'STANDARD' },
    { label: 'Premium', value: 'PREMIUM' },
  ],
  MOBILE: [{ label: 'Standard', value: 'STANDARD' }],
};
