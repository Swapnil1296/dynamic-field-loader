import axios from 'axios';
import type { FormConfigurationResponse, FormValues } from '../types/form';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchFormConfiguration(
  productCode: string,
  channelCode: string,
  subChannelCode: string
): Promise<FormConfigurationResponse> {
  const { data } = await api.get<FormConfigurationResponse>(
    '/form-configurations',
    {
      params: {
        product_code: productCode,
        channel_code: channelCode,
        sub_channel_code: subChannelCode,
      },
    }
  );
  return data;
}

export interface SubmitPayload {
  product_code: string;
  channel_code: string;
  sub_channel_code: string;
  form_data: FormValues;
}

export async function submitFormData(
  payload: SubmitPayload
): Promise<{ message: string; submission_id: number; created_at: string }> {
  const { data } = await api.post('/form-submissions', payload);
  return data;
}
