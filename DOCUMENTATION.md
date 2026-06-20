# Field Loader — Complete Project Documentation

This document describes **every file, function, and major logic flow** in the Field Loader project.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [End-to-End Request Flow](#2-end-to-end-request-flow)
3. [Database Layer](#3-database-layer)
4. [Backend](#4-backend)
5. [Frontend](#5-frontend)
6. [Configuration JSON Schema](#6-configuration-json-schema)
7. [Core Logic Deep Dives](#7-core-logic-deep-dives)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│                                                                 │
│  MakePayment ──► FormRenderer ──► DynamicSection ──► DynamicField
│       │              │                  │                  │    │
│       │              └── formUtils (visibility, validation)     │
│       └── api.js (2 HTTP calls total per session)               │
└────────────────────────────┬────────────────────────────────────┘
                             │ GET  /api/form-configurations
                             │ POST /api/form-submissions
┌────────────────────────────▼────────────────────────────────────┐
│                      BACKEND (Express)                          │
│  formRoutes ──► formController ──► formService ──► PostgreSQL   │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  form_configurations  │  proposals  │  form_submissions          │
└─────────────────────────────────────────────────────────────────┘
```

**Design principle:** The backend is called **twice per user session** — once to load config, once to submit. All rendering, visibility, validation, and dropdown resolution happen **on the client**.

---

## 2. End-to-End Request Flow

### Phase 1 — User selects Product / Channel / Sub-Channel

1. User picks values from static dropdowns in `MakePayment.jsx`.
2. Options come from `selectionOptions.js` (frontend-only, not from API).
3. Changing any selector resets the loaded form config.

### Phase 2 — Load Form (1 API call)

```
User clicks "Load Form"
  → fetchFormConfiguration(product, channel, subChannel)
  → GET /api/form-configurations?product_code=...&channel_code=...&sub_channel_code=...
  → formController.getConfiguration()
  → formService.getFormConfiguration() — SQL SELECT
  → Returns JSONB configuration to frontend
  → FormRenderer mounts and renders sections/fields
```

### Phase 3 — User fills form (0 API calls)

- `DynamicSection` and `DynamicField` evaluate `visibleWhen` rules on every value change via `useWatch`.
- Dropdown options resolved from `options` or `optionsMap` in config (no network).
- Validation runs via React Hook Form using rules from `buildValidationRules()`.

### Phase 4 — Submit (1 API call)

```
User clicks "Submit Payment"
  → handleSubmit (React Hook Form validates first)
  → submitFormData({ product_code, channel_code, sub_channel_code, form_data })
  → POST /api/form-submissions
  → formController.submitForm()
  → Verifies config exists, saves to form_submissions
  → Success screen shown
```

---

## 3. Database Layer

### File: `backend/src/db/schema.sql`

| Table | Purpose |
|-------|---------|
| `form_configurations` | Stores form metadata as JSONB, keyed by product + channel + sub_channel |
| `proposals` | Sample proposal records (not used by current UI flow) |
| `form_submissions` | Stores submitted form data as JSONB |

**Indexes:**
- `idx_form_config_lookup` — fast lookup on `(product_code, channel_code, sub_channel_code)`
- `idx_proposals_number` — fast lookup on `proposal_number`

---

### File: `backend/src/db/init.ts`

**Purpose:** One-time seed script. Run via `npm run db:init`. **Not used at runtime.**

| Symbol | Type | Description |
|--------|------|-------------|
| `paymentFormConfig` | `FormConfiguration` constant | Full web payment form JSON — sections, fields, validation, visibility rules, dropdown options |
| `mobilePaymentFormConfig` | `FormConfiguration` constant | Derived from `paymentFormConfig`: removes Premium Benefits section, hides `remarks` field |
| `initDatabase()` | `async function` | Creates tables, clears data, inserts 3 form configs + 3 sample proposals |

#### `initDatabase()` logic

1. Read and execute `schema.sql` (`CREATE TABLE IF NOT EXISTS`).
2. `DELETE` all rows from `form_submissions`, `proposals`, `form_configurations`.
3. Insert form configurations:

| product_code | channel_code | sub_channel_code | config used |
|--------------|--------------|------------------|-------------|
| PAYMENT | WEB | STANDARD | `paymentFormConfig` |
| PAYMENT | WEB | PREMIUM | `paymentFormConfig` |
| PAYMENT | MOBILE | STANDARD | `mobilePaymentFormConfig` |

4. Insert 3 sample proposals (`PROP-2024-001` through `003`).
5. Close DB pool and exit.

**Why hardcoded values here?** This file only seeds demo data into PostgreSQL. After seeding, the **database** is the source of truth — not this file.

---

## 4. Backend

### File: `backend/src/config/env.ts`

| Export | Description |
|--------|-------------|
| `env.port` | Server port. From `process.env.PORT` or default `3001` |
| `env.databaseUrl` | PostgreSQL connection string. From `DATABASE_URL` env var or local default |

Loads `.env` via `dotenv.config()` on import.

---

### File: `backend/src/config/db.ts`

| Export | Description |
|--------|-------------|
| `pool` | Shared `pg.Pool` instance using `env.databaseUrl` |

**Event handler:** `pool.on('error')` — logs unexpected idle-client DB errors to console.

---

### File: `backend/src/types/index.ts`

TypeScript interfaces describing data shapes. **No runtime logic.**

| Interface | Description |
|-----------|-------------|
| `Proposal` | Row shape for `proposals` table |
| `FormConfigurationRow` | Row from `form_configurations` including parsed JSONB |
| `FormConfiguration` | Top-level form config: `title`, `description`, `sections[]` |
| `SectionConfig` | A form section: `id`, `label`, `fields[]`, optional `visibleWhen`, `hidden` |
| `FieldConfig` | A single field: type, label, validation, options, visibility, etc. |
| `FieldType` | Union: `text \| number \| email \| select \| checkbox \| date \| textarea \| radio` |
| `SelectOption` | `{ label, value }` for dropdowns/radios |
| `VisibilityCondition` | Rule: `{ field, operator, value? }` |
| `ValidationRules` | `required`, `min`, `max`, `minLength`, `maxLength`, `pattern`, `patternMessage` |
| `FormSubmission` | Row shape for `form_submissions` table |

---

### File: `backend/src/services/formService.ts`

Database access layer. No HTTP logic.

#### `getProposalByNumber(proposalNumber: string): Promise<Proposal | null>`

- **SQL:** `SELECT ... FROM proposals WHERE proposal_number = $1`
- **Returns:** First matching row or `null`
- **Note:** Not used by current API routes; kept for potential future use

#### `getFormConfiguration(productCode, channelCode, subChannelCode): Promise<FormConfigurationRow | null>`

- **SQL:** `SELECT ... FROM form_configurations WHERE product_code = $1 AND channel_code = $2 AND sub_channel_code = $3 ORDER BY created_at DESC LIMIT 1`
- **Returns:** Most recent matching config row or `null`
- **Used by:** `getConfiguration` and `submitForm` controllers

#### `saveFormSubmission(proposalNumber, formData): Promise<{ id, created_at }>`

- **SQL:** `INSERT INTO form_submissions (proposal_number, form_data) VALUES ($1, $2) RETURNING id, created_at`
- **Returns:** New submission ID and timestamp
- **Note:** `proposalNumber` is actually a generated reference string like `PAYMENT-WEB-STANDARD-1718901234567`

---

### File: `backend/src/controllers/formController.ts`

HTTP request handlers. Validates input, calls services, sends responses.

#### `getConfiguration(req, res): Promise<void>`

**Route:** `GET /api/form-configurations`

| Step | Logic |
|------|-------|
| 1 | Read `product_code`, `channel_code`, `sub_channel_code` from query string |
| 2 | If any missing → `400` with error message |
| 3 | Call `getFormConfiguration()` |
| 4 | If not found → `404` |
| 5 | If found → `200` with full row JSON (includes `configuration` JSONB) |
| 6 | On DB error → `500` |

#### `submitForm(req, res): Promise<void>`

**Route:** `POST /api/form-submissions`

| Step | Logic |
|------|-------|
| 1 | Read `product_code`, `channel_code`, `sub_channel_code`, `form_data` from body |
| 2 | If any missing → `400` |
| 3 | Verify a form configuration exists for that combination → `404` if not |
| 4 | Build reference: `{product}-{channel}-{subChannel}-{timestamp}` |
| 5 | Merge metadata into saved data: `{ product_code, channel_code, sub_channel_code, ...form_data }` |
| 6 | Call `saveFormSubmission()` |
| 7 | Return `201` with `{ message, submission_id, created_at }` |

---

### File: `backend/src/routes/formRoutes.ts`

Express router mapping URLs to controller functions.

| Method | Path | Handler |
|--------|------|---------|
| GET | `/form-configurations` | `getConfiguration` |
| POST | `/form-submissions` | `submitForm` |

Mounted at `/api` prefix in `app.ts` → full paths are `/api/form-configurations` and `/api/form-submissions`.

---

### File: `backend/src/app.ts`

Express application entry point.

| Code block | Purpose |
|------------|---------|
| `app.use(cors())` | Allow cross-origin requests (frontend on different port) |
| `app.use(express.json())` | Parse JSON request bodies |
| `GET /api/health` | Returns `{ status: 'ok' }` — health check |
| `app.use('/api', formRoutes)` | Mount all form API routes |
| Error middleware | Catches unhandled errors → `500 Internal server error` |
| `app.listen(env.port)` | Start server |

---

## 5. Frontend

### File: `frontend/vite.config.js`

Vite dev server configuration.

| Setting | Value | Purpose |
|---------|-------|---------|
| `server.port` | `5173` | Frontend dev port |
| `server.proxy['/api']` | `http://localhost:3001` | Proxy API calls to backend during development |

---

### File: `frontend/src/main.jsx`

React application bootstrap.

1. Find `#root` DOM element
2. Render `<App />` inside `<StrictMode>` and `<BrowserRouter>`
3. Import global styles from `index.css`

---

### File: `frontend/src/App.jsx`

Root component. Layout shell only.

| Element | Purpose |
|---------|---------|
| `<nav>` | Brand link + "Dynamic Forms Demo" tag |
| `<Routes>` | Single route: `/` → `<MakePayment />` |

---

### File: `frontend/src/config/selectionOptions.js`

**Static frontend data** for Product / Channel / Sub-Channel dropdowns. Not fetched from API.

| Export | Description |
|--------|-------------|
| `PRODUCT_OPTIONS` | 9 insurance plans (e.g. `SUPER_PROTECT_PLUS_PLAN`) |
| `CHANNEL_OPTIONS` | Shared across products: banca, agency, dst, broker, corporate, vakrangee |
| `SUB_CHANNEL_OPTIONS` | Shared across channels: zopper, insurance-dekho, policy-bazaar |

**Cascading logic (in MakePayment):**
- Select product → enables channel dropdown
- Select channel → enables sub-channel dropdown
- Changing parent resets child selections

---

### File: `frontend/src/types/form.ts`

_Removed — frontend is plain JavaScript. Types are documented via JSDoc `@param` / `@returns` in each module._

### File: `frontend/src/services/api.js`

Axios HTTP client. Only 2 functions — minimal API surface.

#### `fetchFormConfiguration(productCode, channelCode, subChannelCode)`

- **HTTP:** `GET /api/form-configurations` with query params
- **Returns:** `FormConfigurationResponse`

#### `submitFormData(payload: SubmitPayload)`

- **HTTP:** `POST /api/form-submissions`
- **Payload:** `{ product_code, channel_code, sub_channel_code, form_data }`
- **Returns:** `{ message, submission_id, created_at }`

**Axios instance:** `baseURL: '/api'` — proxied to backend in dev.

---

### File: `frontend/src/utils/formUtils.js`

Core client-side form logic. No React dependencies. All functions include JSDoc inline documentation.

#### `isEmpty(value)` — private helper

Returns `true` if value is `undefined`, `null`, or `''`.

#### `evaluateVisibility(condition, formValues): boolean`

Determines if a section or field should be shown.

| Input | Behavior |
|-------|----------|
| `condition` is `undefined` | Return `true` (always visible) |
| `condition.field` | Key to read from `formValues` |
| `condition.operator` | Comparison logic (see table below) |

| Operator | Logic |
|----------|-------|
| `equals` | `fieldValue === value` |
| `notEquals` | `fieldValue !== value` |
| `in` | `value` is array and contains `fieldValue` |
| `notIn` | `value` is array and does not contain `fieldValue` |
| `greaterThan` | `Number(fieldValue) > Number(value)` |
| `lessThan` | `Number(fieldValue) < Number(value)` |
| `isEmpty` | Field is empty/null/undefined |
| `isNotEmpty` | Field has a value |
| default | `true` |

**Context fields:** `DynamicField` and `DynamicSection` inject `_product_code`, `_channel_code`, `_sub_channel_code` into `formValues` so rules like `{ field: "_sub_channel_code", "operator": "equals", "value": "policy-bazaar" }` work.

#### `buildValidationRules(validation, isVisible): Record<string, unknown>`

Converts backend validation config into React Hook Form rule objects.

| Backend rule | React Hook Form rule |
|--------------|---------------------|
| `required: true` | `required: 'This field is required'` |
| `min` | `{ value, message: 'Minimum value is X' }` |
| `max` | `{ value, message: 'Maximum value is X' }` |
| `minLength` | `{ value, message: 'Minimum length is X' }` |
| `maxLength` | `{ value, message: 'Maximum length is X' }` |
| `pattern` | `{ value: new RegExp(pattern), message }` |

If `isVisible` is `false` or no validation config → returns `{}` (no validation).

#### `getDefaultValues(sections): Record<string, unknown>`

Walks all sections and fields. For each non-hidden field with `defaultValue` defined, adds `defaults[field.id] = defaultValue`.

Used by `FormRenderer` to initialize React Hook Form.

#### `resolveFieldOptions(field, formValues): SelectOption[]`

Resolves dropdown/radio options **entirely on the client**.

| Priority | Source | Logic |
|----------|--------|-------|
| 1 | `field.options` | Return static options array |
| 2 | `field.optionsMap` + `field.dependsOn[0]` | Read parent field value from `formValues`, return `optionsMap[parentValue]` or `[]` |
| 3 | Neither | Return `[]` |

**Example:** `bank_name` field has `dependsOn: ['payment_method']` and `optionsMap: { bank_transfer: [...], net_banking: [...] }`. When user selects `bank_transfer`, bank dropdown shows Chase, BoA, etc.

---

### File: `frontend/src/pages/MakePayment.jsx`

Main page component. Orchestrates selection → load → render → submit.

#### State

| State variable | Type | Purpose |
|----------------|------|---------|
| `productCode` | `string` | Selected product |
| `channelCode` | `string` | Selected channel |
| `subChannelCode` | `string` | Selected sub-channel |
| `state` | `PageState` | `'idle' \| 'loading' \| 'ready' \| 'success' \| 'error'` |
| `error` | `string \| null` | Error message to display |
| `formConfig` | `FormConfigurationResponse \| null` | Loaded config from API |
| `submitting` | `boolean` | Submit in progress |
| `submissionResult` | `{ id, created_at } \| null` | Success response data |

#### Derived values

| Variable | Logic |
|----------|-------|
| `channelOptions` | `CHANNEL_OPTIONS[productCode]` or `[]` |
| `subChannelOptions` | `SUB_CHANNEL_OPTIONS[channelCode]` or `[]` |

#### Functions

| Function | Trigger | Logic |
|----------|---------|-------|
| `handleProductChange(value)` | Product dropdown change | Set product, reset channel + sub-channel + formConfig, state → `idle` |
| `handleChannelChange(value)` | Channel dropdown change | Set channel, reset sub-channel + formConfig, state → `idle` |
| `handleSubChannelChange(value)` | Sub-channel dropdown change | Set sub-channel, reset formConfig, state → `idle` |
| `handleLoadForm()` | "Load Form" button | Validate all 3 selected → `loading` → API call → `ready` or `error` |
| `handleSubmit(data)` | Form submit | POST form data → `success` or `error` |

#### Render logic (state machine)

```
success  → Show submission confirmation card
default  → Show selector card + (if ready) FormRenderer below
```

---

### File: `frontend/src/components/FormRenderer.jsx`

Renders the dynamic form from configuration JSON.

#### Props

| Prop | Type | Purpose |
|------|------|---------|
| `configuration` | `FormConfiguration` | Sections, fields, title from API |
| `contextMeta` | `FormContextMeta` | Product/channel/sub-channel for visibility |
| `onSubmit` | `(data) => Promise<void>` | Called with validated form values |
| `submitting` | `boolean` | Disables submit button |

#### Logic

1. Initialize React Hook Form with `getDefaultValues(configuration.sections)` and `mode: 'onBlur'`.
2. Render form header (title, description, context meta).
3. Map `configuration.sections` → `<DynamicSection />` for each.
4. Submit button calls `handleSubmit(onSubmit)`.

**React Hook Form exports used:**
- `register` — binds inputs to form state
- `control` — passed to children for `useWatch`
- `handleSubmit` — wraps submit with validation
- `errors` — validation error messages per field

---

### File: `frontend/src/components/DynamicSection.jsx`

Renders one section (fieldset) from config.

#### Props

Same pattern as FormRenderer children: `section`, `register`, `control`, `errors`, `contextMeta`.

#### Logic

1. `useWatch({ control })` — subscribe to all form value changes.
2. Build `contextValues` = form values + `_product_code`, `_channel_code`, `_sub_channel_code`.
3. **Visibility:** `!section.hidden && evaluateVisibility(section.visibleWhen, contextValues)`.
4. If not visible → return `null`.
5. If all fields are `hidden` → return `null`.
6. Render `<fieldset>` with legend, description, and map fields → `<DynamicField />`.

**Re-renders when:** Any watched form value changes (so section visibility updates live).

---

### File: `frontend/src/components/DynamicField.jsx`

Renders a single form field based on `field.type`.

#### Props

`field`, `register`, `control`, `errors`, `contextMeta`.

#### Logic flow

```
useWatch(control) → watchedValues
  ↓
contextValues = watchedValues + _product_code, _channel_code, _sub_channel_code
  ↓
isVisible = !field.hidden && evaluateVisibility(field.visibleWhen, contextValues)
  ↓
if !isVisible → return null
  ↓
options = resolveFieldOptions(field, watchedValues)
validationRules = buildValidationRules(field.validation, isVisible)
  ↓
renderInput() based on field.type
```

#### `renderInput()` switch

| `field.type` | Renders |
|--------------|---------|
| `textarea` | `<textarea>` |
| `select` | `<select>` with options from `resolveFieldOptions` |
| `radio` | Radio button group |
| `checkbox` | Single checkbox (label inside input) |
| default | `<input type={field.type}>` for text, number, email, date |

#### Checkbox special case

Checkboxes render label inside the input element (not as separate `<label>` above), since the label text is the checkbox description.

#### Error display

If `errors[field.id]` exists, show `.error-message` below the field.

---

## 6. Configuration JSON Schema

Stored in `form_configurations.configuration` (JSONB).

```json
{
  "title": "string",
  "description": "string (optional)",
  "sections": [
    {
      "id": "string",
      "label": "string",
      "description": "string (optional)",
      "hidden": false,
      "visibleWhen": { "field": "...", "operator": "...", "value": "..." },
      "fields": [
        {
          "id": "string",
          "type": "text | number | email | select | checkbox | date | textarea | radio",
          "label": "string",
          "placeholder": "string (optional)",
          "defaultValue": "any (optional)",
          "hidden": false,
          "disabled": false,
          "required": true,
          "validation": { "required": true, "min": 1, "pattern": "...", "patternMessage": "..." },
          "visibleWhen": { "field": "payment_method", "operator": "equals", "value": "card" },
          "options": [{ "label": "...", "value": "..." }],
          "optionsMap": { "parent_value": [{ "label": "...", "value": "..." }] },
          "dependsOn": ["parent_field_id"],
          "helpText": "string (optional)"
        }
      ]
    }
  ]
}
```

### Field behavior flags

| Property | Effect |
|----------|--------|
| `hidden: true` | Never rendered |
| `disabled: true` | Rendered but not editable |
| `visibleWhen` | Shown only when condition is true |
| `options` | Static dropdown/radio choices |
| `optionsMap` + `dependsOn` | Dynamic choices based on another field's value |
| `validation` | Client-side rules via React Hook Form |
| `defaultValue` | Pre-filled value on form load |

---

## 7. Core Logic Deep Dives

### 7.1 Conditional visibility chain

**Example:** Card number field only shows when payment method is "card".

Config:
```json
{
  "id": "card_number",
  "visibleWhen": { "field": "payment_method", "operator": "equals", "value": "card" }
}
```

Runtime:
1. User selects `payment_method = "card"` in dropdown.
2. `useWatch` detects change → `DynamicField` re-renders.
3. `evaluateVisibility` → `formValues.payment_method === "card"` → `true`.
4. Card number field appears.
5. User switches to `"upi"` → visibility `false` → field returns `null` (removed from DOM).

### 7.2 Premium section by sub-channel

Config:
```json
{
  "id": "premium_benefits",
  "visibleWhen": { "field": "_sub_channel_code", "operator": "equals", "value": "PREMIUM" }
}
```

`_sub_channel_code` is injected from `contextMeta` (set when user selected Sub-Channel), not from a form input. So the entire section appears/disappears based on the user's initial selection — no extra API call.

### 7.3 Dependent dropdown (optionsMap)

Config:
```json
{
  "id": "bank_name",
  "dependsOn": ["payment_method"],
  "optionsMap": {
    "bank_transfer": [{ "label": "Chase Bank", "value": "chase" }],
    "net_banking": [{ "label": "HDFC Bank", "value": "hdfc" }]
  },
  "visibleWhen": { "field": "payment_method", "operator": "in", "value": ["bank_transfer", "net_banking"] }
}
```

Runtime:
1. `resolveFieldOptions` reads `formValues.payment_method`.
2. If `"bank_transfer"` → returns Chase option.
3. If `"card"` → `optionsMap["card"]` is undefined → returns `[]`.
4. No API call at any point.

### 7.4 Validation on hidden fields

`buildValidationRules(validation, isVisible)` returns `{}` when `isVisible` is false. Hidden fields are not validated even if they have `required: true` in config.

### 7.5 MakePayment state machine

```
                    ┌─────────┐
         start ───► │  idle   │
                    └────┬────┘
                         │ Load Form clicked
                         ▼
                    ┌─────────┐
              ┌────│ loading │────┐
              │    └─────────┘    │
              │ API error    API ok
              ▼                   ▼
         ┌─────────┐        ┌─────────┐
         │  error  │        │  ready  │◄── form visible
         └─────────┘        └────┬────┘
                                 │ Submit
                                 ▼
                            ┌─────────┐
                            │ success │
                            └─────────┘
```

Changing Product/Channel/Sub-Channel resets to `idle` and clears loaded config.

---

## File Index (quick reference)

| File | Role |
|------|------|
| `backend/src/app.ts` | Express server entry |
| `backend/src/config/env.ts` | Environment variables |
| `backend/src/config/db.ts` | PostgreSQL connection pool |
| `backend/src/types/index.ts` | Backend TypeScript interfaces |
| `backend/src/services/formService.ts` | Database queries |
| `backend/src/controllers/formController.ts` | HTTP handlers |
| `backend/src/routes/formRoutes.ts` | URL → handler mapping |
| `backend/src/db/schema.sql` | Table definitions |
| `backend/src/db/init.ts` | Seed script (demo data only) |
| `frontend/src/main.jsx` | React bootstrap |
| `frontend/src/App.jsx` | App shell + routing |
| `frontend/src/pages/MakePayment.jsx` | Main page + state machine |
| `frontend/src/components/FormRenderer.jsx` | Form wrapper + React Hook Form |
| `frontend/src/components/DynamicSection.jsx` | Section renderer |
| `frontend/src/components/DynamicField.jsx` | Field renderer |
| `frontend/src/services/api.js` | HTTP client (2 functions) |
| `frontend/src/utils/formUtils.js` | Visibility, validation, options logic |
| `frontend/src/config/selectionOptions.js` | Static P/C/SC dropdown data |
| `frontend/vite.config.js` | Dev server + API proxy |
