import { FormConfiguration } from '../types';

/**
 * Base insurance proposal form — visibility driven by _channel_code and _sub_channel_code.
 */
export const insuranceProposalFormConfig: FormConfiguration = {
  title: 'Customer Details Form',
  description: 'Complete proposal details for your selected plan',
  sections: [
    {
      id: 'customer_info',
      label: 'Customer Information',
      fields: [
        {
          id: 'customer_name',
          type: 'text',
          label: 'Full Name',
          placeholder: 'Enter full name',
          required: true,
          validation: { required: true, minLength: 2, maxLength: 100 },
        },
        {
          id: 'customer_email',
          type: 'email',
          label: 'Email ID',
          placeholder: 'name@example.com',
          required: true,
          validation: {
            required: true,
            pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
            patternMessage: 'Enter a valid email address',
          },
        },
        {
          id: 'customer_phone',
          type: 'text',
          label: 'Mobile Number',
          placeholder: '10-digit mobile number',
          validation: { required: true, minLength: 10, maxLength: 15 },
        },
        {
          id: 'date_of_birth',
          type: 'date',
          label: 'Date of Birth',
          validation: { required: true },
        },
      ],
    },
    {
      id: 'banca_details',
      label: 'Banca Details',
      description: 'Additional fields for Banca channel',
      visibleWhen: {
        field: '_channel_code',
        operator: 'equals',
        value: 'banca',
      },
      fields: [
        {
          id: 'bank_branch_code',
          type: 'text',
          label: 'Bank Branch Code',
          validation: { required: true, minLength: 3 },
        },
        {
          id: 'rm_employee_id',
          type: 'text',
          label: 'RM Employee ID',
          placeholder: 'Relationship manager ID',
        },
      ],
    },
    {
      id: 'policy_details',
      label: 'Policy Details',
      fields: [
        {
          id: 'sum_assured',
          type: 'number',
          label: 'Sum Assured',
          placeholder: '0',
          validation: { required: true, min: 100000 },
        },
        {
          id: 'premium_amount',
          type: 'number',
          label: 'Premium Amount',
          placeholder: '0',
          validation: { required: true, min: 1 },
        },
        {
          id: 'payment_method',
          type: 'select',
          label: 'Payment Method',
          validation: { required: true },
          options: [
            { label: 'Credit / Debit Card', value: 'card' },
            { label: 'Net Banking', value: 'net_banking' },
            { label: 'UPI', value: 'upi' },
            { label: 'Bank Transfer', value: 'bank_transfer' },
          ],
        },
        {
          id: 'bank_name',
          type: 'select',
          label: 'Bank',
          dependsOn: ['payment_method'],
          optionsMap: {
            bank_transfer: [
              { label: 'HDFC Bank', value: 'hdfc' },
              { label: 'ICICI Bank', value: 'icici' },
              { label: 'SBI', value: 'sbi' },
            ],
            net_banking: [
              { label: 'HDFC Bank', value: 'hdfc' },
              { label: 'ICICI Bank', value: 'icici' },
            ],
          },
          visibleWhen: {
            field: 'payment_method',
            operator: 'in',
            value: ['bank_transfer', 'net_banking'],
          },
        },
        {
          id: 'upi_id',
          type: 'text',
          label: 'UPI ID',
          visibleWhen: {
            field: 'payment_method',
            operator: 'equals',
            value: 'upi',
          },
          validation: { required: true },
        },
      ],
    },
    {
      id: 'corporate_details',
      label: 'Corporate Details',
      visibleWhen: {
        field: '_channel_code',
        operator: 'equals',
        value: 'corporate',
      },
      fields: [
        {
          id: 'company_name',
          type: 'text',
          label: 'Company Name',
          validation: { required: true },
        },
        {
          id: 'employee_id',
          type: 'text',
          label: 'Employee ID',
          validation: { required: true },
        },
      ],
    },
    {
      id: 'partner_portal',
      label: 'Partner Portal Benefits',
      description: 'Shown for Policy-Bazaar sub-channel',
      visibleWhen: {
        field: '_sub_channel_code',
        operator: 'equals',
        value: 'policy-bazaar',
      },
      fields: [
        {
          id: 'lead_reference_id',
          type: 'text',
          label: 'Lead Reference ID',
          validation: { required: true },
        },
        {
          id: 'concierge_support',
          type: 'radio',
          label: 'Support Level',
          options: [
            { label: 'Standard', value: 'standard' },
            { label: 'Gold', value: 'gold' },
            { label: 'Platinum', value: 'platinum' },
          ],
          defaultValue: 'standard',
        },
      ],
    },
    {
      id: 'additional_notes',
      label: 'Additional Information',
      fields: [
        {
          id: 'remarks',
          type: 'textarea',
          label: 'Remarks',
          validation: { maxLength: 500 },
        },
        {
          id: 'terms_accepted',
          type: 'checkbox',
          label: 'I accept the terms and conditions',
          validation: { required: true },
        },
      ],
    },
  ],
};

/** Must match frontend selectionOptions.js values exactly. */
export const PRODUCT_CODES = [
  'SUPER_PROTECT_PLUS_PLAN',
  'SUPER_PROTECT_PLAN',
  'MAGIC_SAVINGS_PLAN',
  'LIFE_ADVANTAGE_PLUS_PLAN',
  'WEALTH_GAIN_INSURANCE_PLAN',
  'WEALTHSURANCE_GROWTH_INSURANCE_PLAN_SP_II',
  'SUPER_CASH_PLAN',
  'ASSURED_INCOME_PLAN',
  'ISECURE_PLAN',
];

export const CHANNEL_CODES = [
  'banca',
  'agency',
  'dst',
  'broker',
  'corporate',
  'vakrangee',
];

export const SUB_CHANNEL_CODES = [
  'zopper',
  'insurance-dekho',
  'policy-bazaar',
];

/** Every product × channel × sub-channel combination (162 rows). */
export const SEED_COMBINATIONS = PRODUCT_CODES.flatMap((product_code) =>
  CHANNEL_CODES.flatMap((channel_code) =>
    SUB_CHANNEL_CODES.map((sub_channel_code) => ({
      product_code,
      channel_code,
      sub_channel_code,
    }))
  )
);
