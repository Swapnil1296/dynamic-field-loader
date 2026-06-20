import { pool } from '../config/db';
import { FormConfiguration, FormConfigurationRow, Proposal } from '../types';

export async function getProposalByNumber(
  proposalNumber: string
): Promise<Proposal | null> {
  const result = await pool.query<Proposal>(
    `SELECT id, proposal_number, product_code, channel_code, sub_channel_code, proposal_data
     FROM proposals WHERE proposal_number = $1`,
    [proposalNumber]
  );
  return result.rows[0] ?? null;
}

export async function getFormConfiguration(
  productCode: string,
  channelCode: string,
  subChannelCode: string
): Promise<FormConfigurationRow | null> {
  const result = await pool.query<FormConfigurationRow>(
    `SELECT id, product_code, channel_code, sub_channel_code, configuration, created_at
     FROM form_configurations
     WHERE product_code = $1 AND channel_code = $2 AND sub_channel_code = $3
     ORDER BY created_at DESC
     LIMIT 1`,
    [productCode, channelCode, subChannelCode]
  );
  return result.rows[0] ?? null;
}

export async function saveFormSubmission(
  proposalNumber: string,
  formData: Record<string, unknown>
): Promise<{ id: number; created_at: string }> {
  const result = await pool.query<{ id: number; created_at: string }>(
    `INSERT INTO form_submissions (proposal_number, form_data)
     VALUES ($1, $2)
     RETURNING id, created_at`,
    [proposalNumber, formData]
  );
  return result.rows[0];
}
