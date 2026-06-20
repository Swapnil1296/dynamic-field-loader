import { pool } from '../config/db';
import {
  insuranceProposalFormConfig,
  SEED_COMBINATIONS,
} from './insuranceFormConfig';
import * as fs from 'fs';
import * as path from 'path';

async function initDatabase(): Promise<void> {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  await pool.query(schema);

  await pool.query('DELETE FROM form_submissions');
  await pool.query('DELETE FROM proposals');
  await pool.query('DELETE FROM form_configurations');

  for (const combo of SEED_COMBINATIONS) {
    await pool.query(
      `INSERT INTO form_configurations (product_code, channel_code, sub_channel_code, configuration)
       VALUES ($1, $2, $3, $4)`,
      [
        combo.product_code,
        combo.channel_code,
        combo.sub_channel_code,
        insuranceProposalFormConfig,
      ]
    );
  }

  await pool.query(
    `INSERT INTO proposals (proposal_number, product_code, channel_code, sub_channel_code, proposal_data)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      'PROP-2026-001',
      'SUPER_PROTECT_PLUS_PLAN',
      'banca',
      'zopper',
      { customer_name: 'Rahul Sharma', sum_assured: 5000000 },
    ]
  );

  await pool.query(
    `INSERT INTO proposals (proposal_number, product_code, channel_code, sub_channel_code, proposal_data)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      'PROP-2026-002',
      'MAGIC_SAVINGS_PLAN',
      'dst',
      'policy-bazaar',
      { customer_name: 'Priya Patel', sum_assured: 2500000 },
    ]
  );

  console.log(
    `Database initialized with ${SEED_COMBINATIONS.length} form configurations.`
  );
}

initDatabase()
  .then(() => pool.end())
  .catch((err) => {
    console.error('Database initialization failed:', err);
    pool.end();
    process.exit(1);
  });
