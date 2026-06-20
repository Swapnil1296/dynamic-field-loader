# Field Loader — Dynamic Form Renderer Demo

> **Full code documentation:** see [DOCUMENTATION.md](./DOCUMENTATION.md) for every file, function, and logic flow.

> **Form configuration guide:** see [FORM_CONFIG_GUIDE.md](./FORM_CONFIG_GUIDE.md) for step-by-step instructions on manually creating the JSON.

A demo project showcasing **metadata-driven dynamic form rendering**. Form structure, validation rules, conditional visibility, and API-driven dropdowns are stored in PostgreSQL and rendered at runtime — no frontend code changes needed when fields are added or hidden.

## Tech Stack

| Layer    | Technologies                                      |
|----------|---------------------------------------------------|
| Frontend | React, JavaScript, React Hook Form, Axios, React Router, CSS |
| Backend  | Node.js, Express.js, TypeScript, pg               |
| Database | PostgreSQL                                        |

## Features

- **Product / Channel / Sub-Channel selectors** on the frontend
- **One API call** to load form configuration when selections are made
- **Client-side rendering** — fields, dropdowns, and visibility rules applied in the browser
- **No per-field API calls** — dropdown options are embedded in the configuration JSON
- Conditional visibility (`visibleWhen` rules) from backend config
- Validation rules from backend configuration
- Form submission stored in PostgreSQL

## How It Works

```
User selects Product + Channel + Sub-Channel
        ↓
  GET /api/form-configurations  (single call)
        ↓
  Frontend renders form from JSON config
  - visibility evaluated client-side
  - dropdown options from config (options / optionsMap)
        ↓
  POST /api/form-submissions  (on submit)
```

## Project Structure

```
field-loader/
├── backend/
│   └── src/
│       ├── routes/          # API routes
│       ├── controllers/     # Request handlers
│       ├── services/        # Database queries
│       ├── db/              # Schema + seed script
│       ├── config/          # DB pool + env
│       └── app.ts
├── frontend/
│   └── src/
│       ├── components/      # FormRenderer, DynamicField, DynamicSection
│       ├── pages/           # MakePayment
│       ├── services/        # API client
│       ├── utils/           # Visibility + validation helpers (JSDoc documented)
└── docker-compose.yml       # PostgreSQL
```

## Prerequisites

- Node.js 18+
- Docker (for PostgreSQL) — or a local PostgreSQL instance

## Quick Start

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run db:init    # Creates tables and seeds sample data
npm run dev        # Starts API on http://localhost:3001
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev        # Starts UI on http://localhost:5173
```

### 4. Open the App

Visit [http://localhost:5173](http://localhost:5173), select **Product**, **Channel**, and **Sub-Channel**, then click **Load Form**.

| Product | Channel | Sub-Channel | Notable differences        |
|---------|---------|-----------|----------------------------|
| SUPER_PROTECT_PLUS_PLAN | banca | zopper | Banca Details section |
| MAGIC_SAVINGS_PLAN | dst | policy-bazaar | Partner Portal Benefits |
| WEALTH_GAIN_INSURANCE_PLAN | corporate | policy-bazaar | Corporate + Partner Portal |

## API Endpoints

| Method | Endpoint                         | Description                              |
|--------|----------------------------------|------------------------------------------|
| GET    | `/api/health`                    | Health check                             |
| GET    | `/api/form-configurations`       | Load form config (query params)          |
| POST   | `/api/form-submissions`          | Submit form data                         |

### Form Configuration Query Params

```
GET /api/form-configurations?product_code=SUPER_PROTECT_PLUS_PLAN&channel_code=banca&sub_channel_code=zopper
```

### Form Submission Body

```json
{
  "product_code": "SUPER_PROTECT_PLUS_PLAN",
  "channel_code": "banca",
  "sub_channel_code": "zopper",
  "form_data": {
    "customer_name": "Jane Doe",
    "payment_method": "card",
    "amount": 1500
  }
}
```

## Configuration Schema

Form metadata is stored as JSONB in `form_configurations.configuration`:

```json
{
  "title": "Make Payment",
  "sections": [
    {
      "id": "payment_details",
      "label": "Payment Details",
      "visibleWhen": { "field": "_sub_channel_code", "operator": "equals", "value": "policy-bazaar" },
      "fields": [
        {
          "id": "payment_method",
          "type": "select",
          "label": "Payment Method",
          "validation": { "required": true },
          "options": [
            { "label": "Credit / Debit Card", "value": "card" },
            { "label": "Bank Transfer", "value": "bank_transfer" }
          ]
        },
        {
          "id": "bank_name",
          "type": "select",
          "dependsOn": ["payment_method"],
          "optionsMap": {
            "bank_transfer": [{ "label": "Chase Bank", "value": "chase" }]
          },
          "visibleWhen": { "field": "payment_method", "operator": "equals", "value": "bank_transfer" }
        },
        {
          "id": "card_number",
          "type": "text",
          "label": "Card Number",
          "visibleWhen": { "field": "payment_method", "operator": "equals", "value": "card" },
          "validation": { "required": true, "pattern": "^[0-9]{16}$" }
        }
      ]
    }
  ]
}
```

### Visibility Operators

`equals`, `notEquals`, `in`, `notIn`, `greaterThan`, `lessThan`, `isEmpty`, `isNotEmpty`

Context fields prefixed with `_` are available for section-level rules:
- `_product_code`, `_channel_code`, `_sub_channel_code`

### Field Properties

| Property        | Description                              |
|-----------------|------------------------------------------|
| `hidden`        | Field never rendered                     |
| `disabled`      | Field rendered but not editable          |
| `visibleWhen`   | Show field when condition is met          |
| `dependsOn`     | Parent field for `optionsMap` lookup      |
| `options`       | Static dropdown/radio options             |
| `optionsMap`    | Dependent options keyed by parent value   |
| `validation`    | Rules passed to React Hook Form           |

## Database Tables

- **form_configurations** — Form metadata (JSONB) keyed by product/channel/sub-channel
- **proposals** — Proposal summary with product/channel/sub-channel codes
- **form_submissions** — Submitted form data (JSONB)

## Try It: Add a Field Without Code Changes

1. Connect to PostgreSQL and update a configuration:

```sql
UPDATE form_configurations
SET configuration = jsonb_set(
  configuration,
  '{sections,0,fields}',
  (configuration->'sections'->0->'fields') || '[{"id":"loyalty_id","type":"text","label":"Loyalty ID","placeholder":"Optional"}]'::jsonb
)
WHERE product_code = 'SUPER_PROTECT_PLUS_PLAN' AND channel_code = 'banca' AND sub_channel_code = 'zopper';
```

2. Reload the form for **banca / zopper** — the new field appears automatically.

## Environment Variables

**Backend** (`backend/.env`):

```
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/field_loader
```
