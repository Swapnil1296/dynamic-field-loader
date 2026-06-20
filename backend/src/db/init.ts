import { pool } from '../config/db';
import { FormConfiguration } from '../types';
import * as fs from 'fs';
import * as path from 'path';

const paymentFormConfig: FormConfiguration = {
  title: 'Make Payment',
  description: 'Complete payment details for your proposal',
  sections: [
    {
      id: 'customer_info',
      label: 'Customer Information',
      description: 'Basic customer details from the proposal',
      fields: [
        {
          id: 'customer_name',
          type: 'text',
          label: 'Customer Name',
          placeholder: 'Enter full name',
          required: true,
          validation: { required: true, minLength: 2, maxLength: 100 },
        },
        {
          id: 'customer_email',
          type: 'email',
          label: 'Email Address',
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
          label: 'Phone Number',
          placeholder: '+1 555 000 0000',
          validation: { minLength: 10, maxLength: 15 },
        },
      ],
    },
    {
      id: 'payment_details',
      label: 'Payment Details',
      fields: [
        {
          id: 'payment_method',
          type: 'select',
          label: 'Payment Method',
          required: true,
          validation: { required: true },
          options: [
            { label: 'Credit / Debit Card', value: 'card' },
            { label: 'Bank Transfer', value: 'bank_transfer' },
            { label: 'Net Banking', value: 'net_banking' },
            { label: 'UPI', value: 'upi' },
            { label: 'Cash', value: 'cash' },
          ],
        },
        {
          id: 'amount',
          type: 'number',
          label: 'Payment Amount',
          placeholder: '0.00',
          required: true,
          validation: { required: true, min: 1, max: 1000000 },
        },
        {
          id: 'bank_name',
          type: 'select',
          label: 'Bank',
          placeholder: 'Select bank',
          dependsOn: ['payment_method'],
          optionsMap: {
            bank_transfer: [
              { label: 'Chase Bank', value: 'chase' },
              { label: 'Bank of America', value: 'boa' },
              { label: 'Wells Fargo', value: 'wells_fargo' },
            ],
            net_banking: [
              { label: 'HDFC Bank', value: 'hdfc' },
              { label: 'ICICI Bank', value: 'icici' },
              { label: 'SBI', value: 'sbi' },
            ],
          },
          visibleWhen: {
            field: 'payment_method',
            operator: 'in',
            value: ['bank_transfer', 'net_banking'],
          },
        },
        {
          id: 'card_number',
          type: 'text',
          label: 'Card Number',
          placeholder: '1234 5678 9012 3456',
          validation: {
            required: true,
            pattern: '^[0-9]{16}$',
            patternMessage: 'Card number must be 16 digits',
          },
          visibleWhen: {
            field: 'payment_method',
            operator: 'equals',
            value: 'card',
          },
        },
        {
          id: 'card_expiry',
          type: 'text',
          label: 'Expiry (MM/YY)',
          placeholder: 'MM/YY',
          validation: {
            required: true,
            pattern: '^(0[1-9]|1[0-2])\\/\\d{2}$',
            patternMessage: 'Use MM/YY format',
          },
          visibleWhen: {
            field: 'payment_method',
            operator: 'equals',
            value: 'card',
          },
        },
        {
          id: 'upi_id',
          type: 'text',
          label: 'UPI ID',
          placeholder: 'name@upi',
          validation: {
            required: true,
            pattern: '^[\\w.-]+@[\\w]+$',
            patternMessage: 'Enter a valid UPI ID',
          },
          visibleWhen: {
            field: 'payment_method',
            operator: 'equals',
            value: 'upi',
          },
        },
        {
          id: 'payment_date',
          type: 'date',
          label: 'Payment Date',
          required: true,
          validation: { required: true },
        },
        {
          id: 'save_payment_method',
          type: 'checkbox',
          label: 'Save payment method for future use',
          defaultValue: false,
        },
      ],
    },
    {
      id: 'premium_benefits',
      label: 'Premium Benefits',
      description: 'Available for premium sub-channel only',
      visibleWhen: {
        field: '_sub_channel_code',
        operator: 'equals',
        value: 'PREMIUM',
      },
      fields: [
        {
          id: 'priority_processing',
          type: 'checkbox',
          label: 'Enable priority processing',
          defaultValue: true,
        },
        {
          id: 'concierge_support',
          type: 'radio',
          label: 'Concierge Support Level',
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
          placeholder: 'Any additional notes...',
          validation: { maxLength: 500 },
          helpText: 'Optional notes for the payment team',
        },
        {
          id: 'internal_reference',
          type: 'text',
          label: 'Internal Reference',
          hidden: true,
        },
        {
          id: 'terms_accepted',
          type: 'checkbox',
          label: 'I accept the terms and conditions',
          required: true,
          validation: { required: true },
        },
      ],
    },
  ],
};

const mobilePaymentFormConfig: FormConfiguration = {
  ...paymentFormConfig,
  title: 'Make Payment (Mobile)',
  description: 'Streamlined mobile payment form',
  sections: paymentFormConfig.sections
    .filter((s) => s.id !== 'premium_benefits')
    .map((section) => ({
      ...section,
      fields: section.fields.map((field) =>
        field.id === 'remarks' ? { ...field, hidden: true } : field
      ),
    })),
};

async function initDatabase(): Promise<void> {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  await pool.query(schema);

  await pool.query('DELETE FROM form_submissions');
  await pool.query('DELETE FROM proposals');
  await pool.query('DELETE FROM form_configurations');

  await pool.query(
    `INSERT INTO form_configurations (product_code, channel_code, sub_channel_code, configuration)
     VALUES ($1, $2, $3, $4)`,
    ['PAYMENT', 'WEB', 'STANDARD', paymentFormConfig]
  );

  await pool.query(
    `INSERT INTO form_configurations (product_code, channel_code, sub_channel_code, configuration)
     VALUES ($1, $2, $3, $4)`,
    ['PAYMENT', 'WEB', 'PREMIUM', paymentFormConfig]
  );

  await pool.query(
    `INSERT INTO form_configurations (product_code, channel_code, sub_channel_code, configuration)
     VALUES ($1, $2, $3, $4)`,
    ['PAYMENT', 'MOBILE', 'STANDARD', mobilePaymentFormConfig]
  );

  await pool.query(
    `INSERT INTO proposals (proposal_number, product_code, channel_code, sub_channel_code, proposal_data)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      'PROP-2024-001',
      'PAYMENT',
      'WEB',
      'PREMIUM',
      {
        customer_name: 'Jane Doe',
        premium_tier: 'gold',
        outstanding_amount: 1500,
      },
    ]
  );

  await pool.query(
    `INSERT INTO proposals (proposal_number, product_code, channel_code, sub_channel_code, proposal_data)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      'PROP-2024-002',
      'PAYMENT',
      'WEB',
      'STANDARD',
      {
        customer_name: 'John Smith',
        outstanding_amount: 750,
      },
    ]
  );

  await pool.query(
    `INSERT INTO proposals (proposal_number, product_code, channel_code, sub_channel_code, proposal_data)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      'PROP-2024-003',
      'PAYMENT',
      'MOBILE',
      'STANDARD',
      {
        customer_name: 'Alex Johnson',
        outstanding_amount: 320,
      },
    ]
  );

  console.log('Database initialized with sample data.');
}

initDatabase()
  .then(() => pool.end())
  .catch((err) => {
    console.error('Database initialization failed:', err);
    pool.end();
    process.exit(1);
  });
