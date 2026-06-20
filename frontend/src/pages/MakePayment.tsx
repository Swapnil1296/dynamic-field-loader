import axios from 'axios';
import { useState } from 'react';
import { FormRenderer } from '../components/FormRenderer';
import { fetchFormConfiguration, submitFormData } from '../services/api';
import {
  CHANNEL_OPTIONS,
  PRODUCT_OPTIONS,
  SUB_CHANNEL_OPTIONS,
} from '../config/selectionOptions';
import type { FormConfigurationResponse, FormValues } from '../types/form';

type PageState = 'idle' | 'loading' | 'ready' | 'success' | 'error';

export function MakePayment() {
  const [productCode, setProductCode] = useState('');
  const [channelCode, setChannelCode] = useState('');
  const [subChannelCode, setSubChannelCode] = useState('');
  const [state, setState] = useState<PageState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [formConfig, setFormConfig] = useState<FormConfigurationResponse | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    id: number;
    created_at: string;
  } | null>(null);

  const channelOptions = productCode ? CHANNEL_OPTIONS[productCode] ?? [] : [];
  const subChannelOptions = channelCode
    ? SUB_CHANNEL_OPTIONS[channelCode] ?? []
    : [];

  const handleProductChange = (value: string) => {
    setProductCode(value);
    setChannelCode('');
    setSubChannelCode('');
    setFormConfig(null);
    setState('idle');
  };

  const handleChannelChange = (value: string) => {
    setChannelCode(value);
    setSubChannelCode('');
    setFormConfig(null);
    setState('idle');
  };

  const handleSubChannelChange = (value: string) => {
    setSubChannelCode(value);
    setFormConfig(null);
    setState('idle');
  };

  const handleLoadForm = async () => {
    if (!productCode || !channelCode || !subChannelCode) {
      setError('Please select product, channel, and sub-channel');
      setState('error');
      return;
    }

    setState('loading');
    setError(null);

    try {
      const configData = await fetchFormConfiguration(
        productCode,
        channelCode,
        subChannelCode
      );
      setFormConfig(configData);
      setState('ready');
    } catch (err) {
      let message = 'Failed to load form configuration';
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.error ?? err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      setState('error');
    }
  };

  const handleSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      const result = await submitFormData({
        product_code: productCode,
        channel_code: channelCode,
        sub_channel_code: subChannelCode,
        form_data: data,
      });
      setSubmissionResult({
        id: result.submission_id,
        created_at: result.created_at,
      });
      setState('success');
    } catch {
      setError('Failed to submit form. Please try again.');
      setState('error');
    } finally {
      setSubmitting(false);
    }
  };

  if (state === 'success' && submissionResult) {
    return (
      <div className="page-container">
        <div className="status-card success">
          <h2>Payment Submitted</h2>
          <p>Your form has been submitted successfully.</p>
          <dl className="result-details">
            <dt>Submission ID</dt>
            <dd>{submissionResult.id}</dd>
            <dt>Submitted At</dt>
            <dd>{new Date(submissionResult.created_at).toLocaleString()}</dd>
            <dt>Configuration</dt>
            <dd>
              {productCode} / {channelCode} / {subChannelCode}
            </dd>
          </dl>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="selector-card">
        <h1>Make Payment</h1>
        <p className="selector-description">
          Select product, channel, and sub-channel. The backend returns field
          visibility and layout once — the form then renders entirely on the
          client.
        </p>

        <div className="selector-grid">
          <div className="form-field">
            <label htmlFor="product" className="form-label">
              Product
            </label>
            <select
              id="product"
              className="form-input"
              value={productCode}
              onChange={(e) => handleProductChange(e.target.value)}
            >
              <option value="">Select product...</option>
              {PRODUCT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="channel" className="form-label">
              Channel
            </label>
            <select
              id="channel"
              className="form-input"
              value={channelCode}
              onChange={(e) => handleChannelChange(e.target.value)}
              disabled={!productCode}
            >
              <option value="">Select channel...</option>
              {channelOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="subChannel" className="form-label">
              Sub-Channel
            </label>
            <select
              id="subChannel"
              className="form-input"
              value={subChannelCode}
              onChange={(e) => handleSubChannelChange(e.target.value)}
              disabled={!channelCode}
            >
              <option value="">Select sub-channel...</option>
              {subChannelOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={handleLoadForm}
          disabled={!productCode || !channelCode || !subChannelCode || state === 'loading'}
        >
          {state === 'loading' ? 'Loading configuration...' : 'Load Form'}
        </button>

        {state === 'error' && error && (
          <p className="selector-error">{error}</p>
        )}
      </div>

      {state === 'ready' && formConfig && (
        <FormRenderer
          configuration={formConfig.configuration}
          contextMeta={{
            product_code: productCode,
            channel_code: channelCode,
            sub_channel_code: subChannelCode,
          }}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}
    </div>
  );
}
