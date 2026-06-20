# Manual Form Configuration JSON Guide

This guide explains how to **manually create** the `configuration` JSON stored in PostgreSQL `form_configurations.configuration`.

The frontend reads this JSON once per Product / Channel / Sub-Channel combination and renders the form dynamically — **no frontend code changes needed** when you add or edit fields in the database.

---

## Table of Contents

1. [Where this JSON lives](#1-where-this-json-lives)
2. [Top-level structure](#2-top-level-structure)
3. [Sections](#3-sections)
4. [Fields](#4-fields)
5. [Field types reference](#5-field-types-reference)
6. [Validation rules](#6-validation-rules)
7. [Conditional visibility](#7-conditional-visibility)
8. [Dropdown options](#8-dropdown-options)
9. [Step-by-step: build your sample form](#9-step-by-step-build-your-sample-form)
10. [Insert into PostgreSQL](#10-insert-into-postgresql)
11. [Common mistakes](#11-common-mistakes)
12. [Quick reference cheat sheet](#12-quick-reference-cheat-sheet)

---

## 1. Where this JSON lives

```
form_configurations
├── product_code      → e.g. SUPER_PROTECT_PLUS_PLAN
├── channel_code      → e.g. banca
├── sub_channel_code  → e.g. zopper
└── configuration     → YOUR JSON (JSONB column)
```

The API returns this row when the user selects matching Product + Channel + Sub-Channel and clicks **Load Form**:

```
GET /api/form-configurations?product_code=...&channel_code=...&sub_channel_code=...
```

Values must match `frontend/src/config/selectionOptions.js` **exactly** (case-sensitive).

---

## 2. Top-level structure

Every configuration has exactly three root properties:

```json
{
  "title": "Make Payment",
  "description": "Optional subtitle shown below the title",
  "sections": [ ]
}
```

| Property      | Required | Description                                      |
|---------------|----------|--------------------------------------------------|
| `title`       | Yes      | Form heading displayed at the top                |
| `description` | No       | Grey helper text under the title                 |
| `sections`    | Yes      | Array of section objects — each groups fields    |

**Minimal valid config:**

```json
{
  "title": "My Form",
  "sections": [
    {
      "id": "section_1",
      "label": "Section One",
      "fields": [
        {
          "id": "my_field",
          "type": "text",
          "label": "My Field"
        }
      ]
    }
  ]
}
```

---

## 3. Sections

A section is a logical group rendered as a fieldset in a 2-column card grid.

```json
{
  "id": "customer_info",
  "label": "Quote Summary",
  "description": "Optional section subtitle",
  "hidden": false,
  "visibleWhen": { },
  "fields": [ ]
}
```

| Property      | Required | Description |
|---------------|----------|-------------|
| `id`          | Yes      | Unique string identifier for the section (use `snake_case`) |
| `label`       | Yes      | Section heading shown in orange uppercase |
| `description` | No       | Small grey text under the section title |
| `hidden`      | No       | `true` = section never rendered |
| `visibleWhen` | No       | Condition object — show section only when true (see §7) |
| `fields`      | Yes      | Array of field objects |

**Rules:**
- Each `id` must be unique across all sections.
- A section with `hidden: true` or a failed `visibleWhen` is completely skipped.
- Empty `fields` array = section not shown.

---

## 4. Fields

Each field becomes one card (or a radio group) on the form.

```json
{
  "id": "full_name",
  "type": "text",
  "label": "Full Name",
  "placeholder": "Enter full name",
  "defaultValue": "",
  "hidden": false,
  "disabled": false,
  "required": false,
  "validation": { },
  "visibleWhen": { },
  "options": [ ],
  "optionsMap": { },
  "dependsOn": [ ],
  "helpText": "Optional hint below the field"
}
```

| Property       | Required | Description |
|----------------|----------|-------------|
| `id`           | Yes      | **Unique across the entire form** — used as the form data key on submit |
| `type`         | Yes      | Input type (see §5) |
| `label`        | Yes      | Orange label text on the card |
| `placeholder`  | No       | Grey hint inside empty inputs |
| `defaultValue` | No       | Pre-filled value when form loads |
| `hidden`       | No       | `true` = never rendered, never validated |
| `disabled`     | No       | `true` = shown but not editable |
| `required`     | No       | Shows `*` in UI; prefer `validation.required` instead |
| `validation`   | No       | Rules object (see §6) |
| `visibleWhen`  | No       | Show field only when condition is true (see §7) |
| `options`      | No       | Static dropdown/radio choices (see §8) |
| `optionsMap`   | No       | Dependent dropdown choices keyed by parent value (see §8) |
| `dependsOn`    | No       | Parent field `id` list — used with `optionsMap` |
| `helpText`     | No       | Small grey text below the field |

> **Critical:** Every field `id` must be unique. Two fields cannot share the same `id` — React Hook Form will break and only the last one wins.

---

## 5. Field types reference

| `type`     | Renders as | Notes |
|------------|------------|-------|
| `text`     | Single-line text input | Use for names, IDs, reference numbers |
| `email`    | Email input | Adds email keyboard on mobile; use `pattern` in validation for strict check |
| `number`   | Number input | Use `validation.min` / `validation.max` for range |
| `date`     | Date picker | DOB fields show age badge when `id` contains `dob` or `birth` |
| `select`   | Dropdown with ⌄ icon | Requires `options` array or `optionsMap` |
| `radio`    | Gender-style selectable cards | Requires `options` array |
| `checkbox` | Single checkbox | Label is shown inside the card |
| `textarea` | Multi-line text | Spans full width (2 columns) |

---

## 6. Validation rules

Add a `validation` object inside any field:

```json
"validation": {
  "required": true,
  "min": 1,
  "max": 1000000,
  "minLength": 10,
  "maxLength": 10,
  "pattern": "^[A-Z0-9]+$",
  "patternMessage": "Only uppercase letters and numbers allowed"
}
```

| Rule             | Applies to   | Description |
|------------------|--------------|-------------|
| `required`       | All types    | Field must have a value |
| `min`            | `number`     | Minimum numeric value |
| `max`            | `number`     | Maximum numeric value |
| `minLength`      | `text`, `email`, `textarea` | Minimum character count |
| `maxLength`      | `text`, `email`, `textarea` | Maximum character count |
| `pattern`        | `text`, `email` | Regex string (escape `\` as `\\` in JSON) |
| `patternMessage` | With `pattern` | Custom error message when pattern fails |

**Examples:**

```json
// Required 10-character proposal number
"validation": { "required": true, "minLength": 10, "maxLength": 10 }

// Required sum assured minimum 1 lakh
"validation": { "required": true, "min": 100000 }

// Email format
"validation": {
  "required": true,
  "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
  "patternMessage": "Enter a valid email address"
}
```

Hidden fields and fields with a failed `visibleWhen` are **not validated**, even if `required: true`.

---

## 7. Conditional visibility

Use `visibleWhen` on sections or fields to show/hide based on other field values or context.

```json
"visibleWhen": {
  "field": "payment_method",
  "operator": "equals",
  "value": "card"
}
```

### Operators

| Operator      | Meaning | Example `value` |
|---------------|---------|-----------------|
| `equals`      | Field equals value | `"card"` |
| `notEquals`   | Field does not equal value | `"cash"` |
| `in`          | Field is one of listed values | `["card", "upi"]` |
| `notIn`       | Field is not in listed values | `["cash"]` |
| `greaterThan` | Numeric field > value | `100000` |
| `lessThan`    | Numeric field < value | `5000000` |
| `isEmpty`     | Field has no value | (no `value` needed) |
| `isNotEmpty`  | Field has a value | (no `value` needed) |

### Context fields (injected automatically)

These special fields are available in `visibleWhen` without being form inputs:

| Field               | Source |
|---------------------|--------|
| `_product_code`     | Selected product (e.g. `SUPER_PROTECT_PLUS_PLAN`) |
| `_channel_code`     | Selected channel (e.g. `banca`) |
| `_sub_channel_code` | Selected sub-channel (e.g. `policy-bazaar`) |

**Examples:**

```json
// Show only for Banca channel
"visibleWhen": { "field": "_channel_code", "operator": "equals", "value": "banca" }

// Show only for Policy-Bazaar sub-channel
"visibleWhen": { "field": "_sub_channel_code", "operator": "equals", "value": "policy-bazaar" }

// Show card number only when payment method is card
"visibleWhen": { "field": "payment_method", "operator": "equals", "value": "card" }

// Show bank dropdown for transfer or net banking
"visibleWhen": { "field": "payment_method", "operator": "in", "value": ["bank_transfer", "net_banking"] }
```

---

## 8. Dropdown options

### Static options (`options`)

Use for dropdowns and radio groups that never change:

```json
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
```

- `label` = what the user sees
- `value` = what gets saved in form data on submit

### Dependent options (`optionsMap` + `dependsOn`)

Use when dropdown choices depend on another field's value:

```json
{
  "id": "bank_name",
  "type": "select",
  "label": "Bank",
  "dependsOn": ["payment_method"],
  "optionsMap": {
    "bank_transfer": [
      { "label": "HDFC Bank", "value": "hdfc" },
      { "label": "ICICI Bank", "value": "icici" }
    ],
    "net_banking": [
      { "label": "SBI", "value": "sbi" }
    ]
  },
  "visibleWhen": {
    "field": "payment_method",
    "operator": "in",
    "value": ["bank_transfer", "net_banking"]
  }
}
```

When `payment_method` = `"bank_transfer"`, only HDFC and ICICI appear. No API call is made — all options are in the JSON.

---

## 9. Step-by-step: build your sample form

Below is your target form, corrected and explained section by section.

### Issues in the original draft

| Problem | Fix |
|---------|-----|
| `customer_name` used twice (iQuote + Name of Policy) | Give each field a unique `id` |
| `customer_email` id used for "Proposal Number" | Rename id to `proposal_number` |
| Missing `type` clarity for proposal number | Use `type: "text"` (not `email`) |

### Step 1 — Root

```json
{
  "title": "Make Payment",
  "description": "Please review your \"Quote / Premium Calculation Summary\" below and select your payment option",
  "sections": []
}
```

### Step 2 — Quote Summary section (always visible)

```json
{
  "id": "customer_info",
  "label": "Quote Summary",
  "fields": [
    {
      "id": "iquote_number",
      "type": "text",
      "label": "iQuote number",
      "validation": { "required": true, "minLength": 10 }
    },
    {
      "id": "proposal_number",
      "type": "text",
      "label": "Proposal Number",
      "validation": { "required": true, "minLength": 10, "maxLength": 10 }
    },
    {
      "id": "policy_name",
      "type": "text",
      "label": "Name of Policy",
      "validation": { "required": true, "minLength": 10 }
    },
    {
      "id": "full_name",
      "type": "text",
      "label": "Full Name",
      "validation": { "required": true }
    }
  ]
}
```

### Step 3 — Banca section (channel = banca only)

```json
{
  "id": "banca_details",
  "label": "Banca Details",
  "visibleWhen": { "field": "_channel_code", "operator": "equals", "value": "banca" },
  "fields": [
    {
      "id": "bank_branch_code",
      "type": "text",
      "label": "Bank Branch Code",
      "validation": { "required": true }
    }
  ]
}
```

### Step 4 — Policy Details (always visible)

```json
{
  "id": "policy_details",
  "label": "Policy Details",
  "fields": [
    {
      "id": "sum_assured",
      "type": "number",
      "label": "Sum Assured",
      "validation": { "required": true, "min": 100000 }
    },
    {
      "id": "premium_amount",
      "type": "number",
      "label": "Premium Amount",
      "validation": { "required": true, "min": 1 }
    },
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
}
```

### Step 5 — Corporate section (channel = corporate only)

```json
{
  "id": "corporate_details",
  "label": "Corporate Details",
  "visibleWhen": { "field": "_channel_code", "operator": "equals", "value": "corporate" },
  "fields": [
    {
      "id": "company_name",
      "type": "text",
      "label": "Company Name",
      "validation": { "required": true }
    },
    {
      "id": "employee_id",
      "type": "text",
      "label": "Employee ID",
      "validation": { "required": true }
    }
  ]
}
```

### Step 6 — Partner Portal (sub-channel = policy-bazaar only)

```json
{
  "id": "partner_portal",
  "label": "Partner Portal Benefits",
  "visibleWhen": { "field": "_sub_channel_code", "operator": "equals", "value": "policy-bazaar" },
  "fields": [
    {
      "id": "lead_reference_id",
      "type": "text",
      "label": "Lead Reference ID",
      "validation": { "required": true }
    },
    {
      "id": "concierge_support",
      "type": "radio",
      "label": "Support Level",
      "defaultValue": "standard",
      "options": [
        { "label": "Standard", "value": "standard" },
        { "label": "Gold", "value": "gold" },
        { "label": "Platinum", "value": "platinum" }
      ]
    }
  ]
}
```

### Step 7 — Additional Information (always visible)

```json
{
  "id": "additional_notes",
  "label": "Additional Information",
  "fields": [
    {
      "id": "remarks",
      "type": "textarea",
      "label": "Remarks"
    },
    {
      "id": "terms_accepted",
      "type": "checkbox",
      "label": "I accept the terms and conditions",
      "validation": { "required": true }
    }
  ]
}
```

### Step 8 — Combine into final JSON

Put all sections inside the root `sections` array:

```json
{
  "title": "Make Payment",
  "description": "Please review your \"Quote / Premium Calculation Summary\" below and select your payment option",
  "sections": [
    { "id": "customer_info", "label": "Quote Summary", "fields": [ "..."] },
    { "id": "banca_details", "label": "Banca Details", "visibleWhen": { "...": "..." }, "fields": [ "..."] },
    { "id": "policy_details", "label": "Policy Details", "fields": [ "..."] },
    { "id": "corporate_details", "label": "Corporate Details", "visibleWhen": { "...": "..." }, "fields": [ "..."] },
    { "id": "partner_portal", "label": "Partner Portal Benefits", "visibleWhen": { "...": "..." }, "fields": [ "..."] },
    { "id": "additional_notes", "label": "Additional Information", "fields": [ "..."] }
  ]
}
```

---

## 10. Insert into PostgreSQL

### Option A — Update one existing row

```sql
UPDATE form_configurations
SET configuration = '{
  "title": "Make Payment",
  "description": "Please review your Quote / Premium Calculation Summary...",
  "sections": [ ... your full JSON ... ]
}'::jsonb
WHERE product_code = 'SUPER_PROTECT_PLUS_PLAN'
  AND channel_code = 'banca'
  AND sub_channel_code = 'zopper';
```

### Option B — Insert a new combination

```sql
INSERT INTO form_configurations (product_code, channel_code, sub_channel_code, configuration)
VALUES (
  'SUPER_PROTECT_PLUS_PLAN',
  'banca',
  'zopper',
  '{ ... your full JSON ... }'::jsonb
);
```

### Option C — Copy config to another combination

```sql
INSERT INTO form_configurations (product_code, channel_code, sub_channel_code, configuration)
SELECT 'MAGIC_SAVINGS_PLAN', 'agency', 'insurance-dekho', configuration
FROM form_configurations
WHERE product_code = 'SUPER_PROTECT_PLUS_PLAN'
  AND channel_code = 'banca'
  AND sub_channel_code = 'zopper';
```

### Option D — Re-seed everything

```bash
cd backend
npm run db:init
```

### Validate JSON before inserting

Paste your JSON into [jsonlint.com](https://jsonlint.com) or run in psql:

```sql
SELECT '{ "title": "test", "sections": [] }'::jsonb;
```

If it parses without error, the JSON is valid.

---

## 11. Common mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Duplicate field `id` | Only one field works; wrong data on submit | Use unique `id` per field (`iquote_number`, `proposal_number`, etc.) |
| Wrong channel/sub-channel value in `visibleWhen` | Section never appears | Match exact values from `selectionOptions.js` (`banca`, not `Banca`) |
| `visibleWhen` references wrong field id | Condition never triggers | `field` must match another field's `id` exactly |
| Unescaped `\` in regex pattern | JSON parse error | Double-escape: `\\d` not `\d` |
| `options` missing on `select`/`radio` | Empty dropdown | Add `options` array |
| `optionsMap` without `dependsOn` | Dependent dropdown empty | Add `"dependsOn": ["parent_field_id"]` |
| Product/channel codes don't match DB row | API returns 404 | Keys in `form_configurations` must match UI dropdown values |
| Trailing comma in JSON | Parse error | Remove last comma in arrays/objects |

---

## 12. Quick reference cheat sheet

```
configuration
├── title ........................ string (required)
├── description .................. string (optional)
└── sections[] ................... array (required)
    ├── id ....................... string, unique
    ├── label .................... string
    ├── description .............. string (optional)
    ├── hidden ................... boolean (optional)
    ├── visibleWhen .............. { field, operator, value? }
    └── fields[]
        ├── id ................... string, UNIQUE across entire form
        ├── type ................... text | email | number | date | select | radio | checkbox | textarea
        ├── label .................. string
        ├── placeholder ............ string (optional)
        ├── defaultValue ........... any (optional)
        ├── hidden ................. boolean (optional)
        ├── disabled ............... boolean (optional)
        ├── validation
        │   ├── required ........... boolean
        │   ├── min / max .......... number
        │   ├── minLength / maxLength
        │   ├── pattern ............ regex string
        │   └── patternMessage ..... string
        ├── visibleWhen ............ { field, operator, value? }
        ├── options[] .............. [{ label, value }]  — static dropdown/radio
        ├── optionsMap ............. { parentValue: [{ label, value }] }
        ├── dependsOn[] ............ ["parent_field_id"]
        └── helpText ............... string (optional)
```

**Context keys for visibility:** `_product_code` · `_channel_code` · `_sub_channel_code`

**After inserting:** reload the form in the UI with the matching Product / Channel / Sub-Channel — the new fields appear automatically.
