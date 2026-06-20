import axios from 'axios';
import { useEffect, useState } from 'react';
import { FormRenderer } from '../components/FormRenderer';
import { fetchFormConfiguration, submitFormData } from '../services/api';
import {
  getChannelOptions,
  getSubChannelOptions,
  isValidCombination,
  PRODUCT_OPTIONS,
} from '../config/selectionOptions';

/**
 * Main page: Product / Channel / Sub-Channel selection and dynamic form.
 */
export function MakePayment() {
  const [productCode, setProductCode] = useState('');
  const [channelCode, setChannelCode] = useState('');
  const [subChannelCode, setSubChannelCode] = useState('');
  const [state, setState] = useState('idle');
  const [error, setError] = useState(null);
  const [formConfig, setFormConfig] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  const channelOptions = getChannelOptions(productCode);
  const subChannelOptions = getSubChannelOptions(channelCode);

  // Clear stale values left over from hot-reload (e.g. old LOAN / WEB / PREMIUM)
  useEffect(() => {
    if (productCode && !PRODUCT_OPTIONS.some((p) => p.value === productCode)) {
      setProductCode('');
      setChannelCode('');
      setSubChannelCode('');
      setFormConfig(null);
      setState('idle');
      return;
    }
    if (
      channelCode &&
      !channelOptions.some((c) => c.value === channelCode)
    ) {
      setChannelCode('');
      setSubChannelCode('');
      setFormConfig(null);
      setState('idle');
      return;
    }
    if (
      subChannelCode &&
      !subChannelOptions.some((s) => s.value === subChannelCode)
    ) {
      setSubChannelCode('');
      setFormConfig(null);
      setState('idle');
    }
  }, [productCode, channelCode, subChannelCode, channelOptions, subChannelOptions]);

  const handleProductChange = (value) => {
    setProductCode(value);
    setChannelCode('');
    setSubChannelCode('');
    setFormConfig(null);
    setState('idle');
  };

  const handleChannelChange = (value) => {
    setChannelCode(value);
    setSubChannelCode('');
    setFormConfig(null);
    setState('idle');
  };

  const handleSubChannelChange = (value) => {
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

    if (!isValidCombination(productCode, channelCode, subChannelCode)) {
      setError(
        'Invalid selection. Please re-select product, channel, and sub-channel.'
      );
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

  const handleSubmit = async (data) => {
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
          <h2>Proposal Submitted</h2>
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
      <div className="form-container form-container--selector">
        <div className="page-title">
          <h1>Customer Details</h1>
          <p>
            Select product, channel, and sub-channel to load the proposal form.
          </p>
        </div>

        <div className="field-card">
          <label htmlFor="product">Product</label>
          <div className="field-value field-value--select">
            <select
              id="product"
              className="field-select"
              value={productCode}
              autoComplete="off"
              onChange={(e) => handleProductChange(e.target.value)}
            >
              <option value="">Select product...</option>
              {PRODUCT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="dropdown-icon" aria-hidden="true">
              ⌄
            </span>
          </div>
        </div>

        <div className="field-card">
          <label htmlFor="channel">Channel</label>
          <div className="field-value field-value--select">
            <select
              id="channel"
              className="field-select"
              value={channelCode}
              autoComplete="off"
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
            <span className="dropdown-icon" aria-hidden="true">
              ⌄
            </span>
          </div>
        </div>

        <div className="field-card">
          <label htmlFor="subChannel">Sub-Channel</label>
          <div className="field-value field-value--select">
            <select
              id="subChannel"
              className="field-select"
              value={subChannelCode}
              autoComplete="off"
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
            <span className="dropdown-icon" aria-hidden="true">
              ⌄
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn-primary btn-load"
          onClick={handleLoadForm}
          disabled={
            !productCode || !channelCode || !subChannelCode || state === 'loading'
          }
        >
          {state === 'loading' ? 'Loading configuration...' : 'Load Form'}
        </button>

        {state === 'error' && error && (
          <p className="selector-error">{error}</p>
        )}
      </div>

      {state === 'ready' && formConfig && (
        <FormRenderer
          key={`${productCode}-${channelCode}-${subChannelCode}`}
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
