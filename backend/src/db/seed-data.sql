-- =============================================================================
-- Seed ALL product × channel × sub-channel combinations (162 rows)
-- Must match frontend/src/config/selectionOptions.js
-- Run: psql -U postgres -d field_loader -f seed-data.sql
-- =============================================================================

DELETE FROM form_configurations;

-- Base configuration (insert once, then copy to all combinations)
WITH base_config AS (
  INSERT INTO form_configurations (product_code, channel_code, sub_channel_code, configuration)
  VALUES (
    'SUPER_PROTECT_PLUS_PLAN',
    'banca',
    'zopper',
    '{
      "title": "Customer Details Form",
      "description": "Complete proposal details for your selected plan",
      "sections": [
        {
          "id": "customer_info",
          "label": "Customer Information",
          "fields": [
            { "id": "customer_name", "type": "text", "label": "Full Name", "validation": { "required": true, "minLength": 2 } },
            { "id": "customer_email", "type": "email", "label": "Email ID", "validation": { "required": true } },
            { "id": "customer_phone", "type": "text", "label": "Mobile Number", "validation": { "required": true, "minLength": 10 } },
            { "id": "date_of_birth", "type": "date", "label": "Date of Birth", "validation": { "required": true } }
          ]
        },
        {
          "id": "banca_details",
          "label": "Banca Details",
          "visibleWhen": { "field": "_channel_code", "operator": "equals", "value": "banca" },
          "fields": [
            { "id": "bank_branch_code", "type": "text", "label": "Bank Branch Code", "validation": { "required": true } }
          ]
        },
        {
          "id": "policy_details",
          "label": "Policy Details",
          "fields": [
            { "id": "sum_assured", "type": "number", "label": "Sum Assured", "validation": { "required": true, "min": 100000 } },
            { "id": "premium_amount", "type": "number", "label": "Premium Amount", "validation": { "required": true, "min": 1 } },
            {
              "id": "payment_method",
              "type": "select",
              "label": "Payment Method",
              "validation": { "required": true },
              "options": [
                { "label": "Card", "value": "card" },
                { "label": "Net Banking", "value": "net_banking" },
                { "label": "UPI", "value": "upi" },
                { "label": "Bank Transfer", "value": "bank_transfer" }
              ]
            }
          ]
        },
        {
          "id": "corporate_details",
          "label": "Corporate Details",
          "visibleWhen": { "field": "_channel_code", "operator": "equals", "value": "corporate" },
          "fields": [
            { "id": "company_name", "type": "text", "label": "Company Name", "validation": { "required": true } },
            { "id": "employee_id", "type": "text", "label": "Employee ID", "validation": { "required": true } }
          ]
        },
        {
          "id": "partner_portal",
          "label": "Partner Portal Benefits",
          "visibleWhen": { "field": "_sub_channel_code", "operator": "equals", "value": "policy-bazaar" },
          "fields": [
            { "id": "lead_reference_id", "type": "text", "label": "Lead Reference ID", "validation": { "required": true } },
            {
              "id": "concierge_support",
              "type": "radio",
              "label": "Support Level",
              "options": [
                { "label": "Standard", "value": "standard" },
                { "label": "Gold", "value": "gold" },
                { "label": "Platinum", "value": "platinum" }
              ],
              "defaultValue": "standard"
            }
          ]
        },
        {
          "id": "additional_notes",
          "label": "Additional Information",
          "fields": [
            { "id": "remarks", "type": "textarea", "label": "Remarks" },
            { "id": "terms_accepted", "type": "checkbox", "label": "I accept the terms and conditions", "validation": { "required": true } }
          ]
        }
      ]
    }'::jsonb
  )
  RETURNING configuration
),
products AS (
  SELECT unnest(ARRAY[
    'SUPER_PROTECT_PLUS_PLAN',
    'SUPER_PROTECT_PLAN',
    'MAGIC_SAVINGS_PLAN',
    'LIFE_ADVANTAGE_PLUS_PLAN',
    'WEALTH_GAIN_INSURANCE_PLAN',
    'WEALTHSURANCE_GROWTH_INSURANCE_PLAN_SP_II',
    'SUPER_CASH_PLAN',
    'ASSURED_INCOME_PLAN',
    'ISECURE_PLAN'
  ]) AS product_code
),
channels AS (
  SELECT unnest(ARRAY['banca', 'agency', 'dst', 'broker', 'corporate', 'vakrangee']) AS channel_code
),
sub_channels AS (
  SELECT unnest(ARRAY['zopper', 'insurance-dekho', 'policy-bazaar']) AS sub_channel_code
)
INSERT INTO form_configurations (product_code, channel_code, sub_channel_code, configuration)
SELECT
  p.product_code,
  c.channel_code,
  s.sub_channel_code,
  b.configuration
FROM products p
CROSS JOIN channels c
CROSS JOIN sub_channels s
CROSS JOIN base_config b
WHERE NOT (
  p.product_code = 'SUPER_PROTECT_PLUS_PLAN'
  AND c.channel_code = 'banca'
  AND s.sub_channel_code = 'zopper'
);

SELECT COUNT(*) AS total_configurations FROM form_configurations;
