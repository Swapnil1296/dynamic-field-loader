import axios from 'axios';

/**
 * Shared Axios client for backend API calls.
 * In development, Vite proxies /api to http://localhost:3001.
 */
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Fetches the form configuration for a product / channel / sub-channel combination.
 * This is the only API call made when loading a form.
 *
 * @param {string} productCode - e.g. "SUPER_PROTECT_PLUS_PLAN"
 * @param {string} channelCode - e.g. "banca"
 * @param {string} subChannelCode - e.g. "zopper"
 * @returns {Promise<{
 *   id: number,
 *   product_code: string,
 *   channel_code: string,
 *   sub_channel_code: string,
 *   configuration: object,
 *   created_at: string
 * }>}
 */
export async function fetchFormConfiguration(
  productCode,
  channelCode,
  subChannelCode
) {
  const { data } = await api.get('/form-configurations', {
    params: {
      product_code: productCode,
      channel_code: channelCode,
      sub_channel_code: subChannelCode,
    },
  });
  return data;
}

/**
 * Submits completed form data to the backend.
 *
 * @param {{
 *   product_code: string,
 *   channel_code: string,
 *   sub_channel_code: string,
 *   form_data: Record<string, unknown>
 * }} payload
 * @returns {Promise<{ message: string, submission_id: number, created_at: string }>}
 */
export async function submitFormData(payload) {
  const { data } = await api.post('/form-submissions', payload);
  return data;
}
