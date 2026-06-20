import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';
import {
  buildValidationRules,
  evaluateVisibility,
  resolveFieldOptions,
} from '../utils/formUtils';

/** Emoji icons for radio card options (gender-style layout). */
const RADIO_ICONS = {
  male: '👨',
  female: '👩',
  transgender: '⚧',
  standard: '📋',
  gold: '🥇',
  platinum: '💎',
  default: '●',
};

/**
 * Picks a display icon for a radio option based on label or value.
 * @param {{ label: string, value: string }} option
 * @param {number} index
 * @returns {string}
 */
function getRadioIcon(option, index) {
  const key = (option.value || option.label || '').toLowerCase();
  if (RADIO_ICONS[key]) return RADIO_ICONS[key];
  const labelKey = (option.label || '').toLowerCase();
  if (RADIO_ICONS[labelKey]) return RADIO_ICONS[labelKey];
  return ['👨', '👩', '⚧', '📋', '🥇', '💎'][index] ?? RADIO_ICONS.default;
}

/**
 * Returns true for phone/mobile field ids used for mobile-wrapper layout.
 * @param {object} field
 * @returns {boolean}
 */
function isPhoneField(field) {
  const id = (field.id || '').toLowerCase();
  return id.includes('phone') || id.includes('mobile') || field.type === 'tel';
}

/**
 * Returns true for date fields that should show DOB-style layout with age badge.
 * @param {object} field
 * @returns {boolean}
 */
function isDobField(field) {
  const id = (field.id || '').toLowerCase();
  return field.type === 'date' && (id.includes('dob') || id.includes('birth'));
}

/**
 * Calculates age in years from a date string (YYYY-MM-DD).
 * @param {string} dateStr
 * @returns {number | null}
 */
function calculateAge(dateStr) {
  if (!dateStr) return null;
  const birth = new Date(dateStr);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

/**
 * Renders a single dynamic form field in customer-details card style.
 */
export function DynamicField({
  field,
  register,
  control,
  errors,
  unregister,
  clearErrors,
  contextMeta,
}) {
  const watchedValues = useWatch({ control });

  const contextValues = {
    ...watchedValues,
    _product_code: contextMeta.product_code,
    _channel_code: contextMeta.channel_code,
    _sub_channel_code: contextMeta.sub_channel_code,
  };

  const isVisible =
    !field.hidden && evaluateVisibility(field.visibleWhen, contextValues);
  const isDisabled = field.disabled ?? false;
  const options = resolveFieldOptions(field, watchedValues);
  const currentValue = watchedValues[field.id];

  useEffect(() => {
    if (!isVisible) {
      unregister(field.id);
      clearErrors(field.id);
    }
  }, [isVisible, field.id, unregister, clearErrors]);

  if (!isVisible) {
    return null;
  }

  const validationRules = buildValidationRules(field.validation, isVisible);
  const registerOptions = {
    ...validationRules,
    ...(field.type === 'number' ? { valueAsNumber: true } : {}),
    ...(field.type === 'checkbox' ? { value: true } : {}),
  };
  const error = errors[field.id];
  const fieldId = `field-${field.id}`;
  const labelText = (
    <>
      {field.label}
      {(field.required || field.validation?.required) && (
        <span className="required">*</span>
      )}
    </>
  );

  /* ── Radio → gender-card group ── */
  if (field.type === 'radio') {
    return (
      <div
        className={`gender-group ${error ? 'has-error' : ''}`}
        role="radiogroup"
        aria-labelledby={`${fieldId}-label`}
      >
        <span id={`${fieldId}-label`} className="sr-only">
          {field.label}
        </span>
        {options.map((opt, index) => {
          const isActive = String(currentValue) === String(opt.value);
          return (
            <label
              key={opt.value}
              className={`gender-card ${isActive ? 'active' : ''}`}
            >
              <input
                type="radio"
                value={opt.value}
                disabled={isDisabled}
                {...register(field.id, registerOptions)}
              />
              {isActive && <div className="selected-icon">✓</div>}
              <div className="gender-icon">{getRadioIcon(opt, index)}</div>
              <div className="gender-text">{opt.label}</div>
            </label>
          );
        })}
        {error && (
          <p className="error-message" style={{ width: '100%' }}>
            {String(error.message)}
          </p>
        )}
      </div>
    );
  }

  /* ── Checkbox card ── */
  if (field.type === 'checkbox') {
    return (
      <div className={`field-card checkbox-card ${error ? 'has-error' : ''}`}>
        <label htmlFor={fieldId}>
          <input
            id={fieldId}
            type="checkbox"
            disabled={isDisabled}
            {...register(field.id, registerOptions)}
          />
          <span>{field.label}</span>
        </label>
        {field.helpText && <p className="help-text">{field.helpText}</p>}
        {error && (
          <span className="error-message">{String(error.message)}</span>
        )}
      </div>
    );
  }

  /* ── Phone → mobile-wrapper layout ── */
  if (isPhoneField(field)) {
    return (
      <div className={`field-card ${error ? 'has-error' : ''}`}>
        <label htmlFor={fieldId}>{labelText}</label>
        <div className="mobile-wrapper">
          <div className="country-code">
            <span>91</span>
            <span className="dropdown-icon">⌄</span>
          </div>
          <div className="divider" />
          <input
            id={fieldId}
            type="tel"
            className="field-input mobile-number"
            placeholder={field.placeholder || 'Mobile number'}
            disabled={isDisabled}
            {...register(field.id, registerOptions)}
          />
        </div>
        {field.helpText && <p className="help-text">{field.helpText}</p>}
        {error && (
          <span className="error-message">{String(error.message)}</span>
        )}
      </div>
    );
  }

  /* ── Date → DOB wrapper with calendar icon ── */
  if (field.type === 'date') {
    const age = isDobField(field) ? calculateAge(currentValue) : null;
    return (
      <div className={`field-card ${error ? 'has-error' : ''}`}>
        {!isDobField(field) && (
          <label htmlFor={fieldId}>{labelText}</label>
        )}
        <div className="dob-wrapper">
          <input
            id={fieldId}
            type="date"
            className="field-input field-input--date"
            disabled={isDisabled}
            {...register(field.id, registerOptions)}
          />
          <div className="dob-right">
            {age !== null && (
              <span className="age-badge">{age} Yrs</span>
            )}
            <span className="calendar-icon" aria-hidden="true">
              📅
            </span>
          </div>
        </div>
        {field.helpText && <p className="help-text">{field.helpText}</p>}
        {error && (
          <span className="error-message">{String(error.message)}</span>
        )}
      </div>
    );
  }

  /* ── Select → field-value with dropdown chevron ── */
  if (field.type === 'select') {
    return (
      <div className={`field-card ${error ? 'has-error' : ''}`}>
        <label htmlFor={fieldId}>{labelText}</label>
        <div className="field-value field-value--select">
          <select
            id={fieldId}
            className="field-select"
            disabled={isDisabled}
            {...register(field.id, registerOptions)}
          >
            <option value="">{field.placeholder || 'Select...'}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="dropdown-icon" aria-hidden="true">
            ⌄
          </span>
        </div>
        {field.helpText && <p className="help-text">{field.helpText}</p>}
        {error && (
          <span className="error-message">{String(error.message)}</span>
        )}
      </div>
    );
  }

  /* ── Textarea → full-width card ── */
  if (field.type === 'textarea') {
    return (
      <div className={`field-card field-card--full ${error ? 'has-error' : ''}`}>
        <label htmlFor={fieldId}>{labelText}</label>
        <div className="field-value">
          <textarea
            id={fieldId}
            className="field-input field-textarea"
            placeholder={field.placeholder}
            disabled={isDisabled}
            {...register(field.id, registerOptions)}
          />
        </div>
        {field.helpText && <p className="help-text">{field.helpText}</p>}
        {error && (
          <span className="error-message">{String(error.message)}</span>
        )}
      </div>
    );
  }

  /* ── Default text / email / number ── */
  return (
    <div className={`field-card ${error ? 'has-error' : ''}`}>
      <label htmlFor={fieldId}>{labelText}</label>
      <div className="field-value">
        <input
          id={fieldId}
          type={field.type}
          className="field-input"
          placeholder={field.placeholder}
          disabled={isDisabled}
          {...register(field.id, registerOptions)}
        />
      </div>
      {field.helpText && <p className="help-text">{field.helpText}</p>}
      {error && (
        <span className="error-message">{String(error.message)}</span>
      )}
    </div>
  );
}
