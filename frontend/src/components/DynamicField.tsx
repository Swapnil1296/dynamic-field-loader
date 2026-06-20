import {
  type Control,
  type FieldErrors,
  type UseFormRegister,
  useWatch,
} from 'react-hook-form';
import type {
  FieldConfig,
  FormContextMeta,
  FormValues,
  SelectOption,
} from '../types/form';
import {
  buildValidationRules,
  evaluateVisibility,
  resolveFieldOptions,
} from '../utils/formUtils';

interface DynamicFieldProps {
  field: FieldConfig;
  register: UseFormRegister<FormValues>;
  control: Control<FormValues>;
  errors: FieldErrors<FormValues>;
  contextMeta: FormContextMeta;
}

export function DynamicField({
  field,
  register,
  control,
  errors,
  contextMeta,
}: DynamicFieldProps) {
  const watchedValues = useWatch({ control });

  const contextValues: FormValues = {
    ...watchedValues,
    _product_code: contextMeta.product_code,
    _channel_code: contextMeta.channel_code,
    _sub_channel_code: contextMeta.sub_channel_code,
  };

  const isVisible =
    !field.hidden && evaluateVisibility(field.visibleWhen, contextValues);
  const isDisabled = field.disabled ?? false;
  const options: SelectOption[] = resolveFieldOptions(field, watchedValues);

  if (!isVisible) {
    return null;
  }

  const validationRules = buildValidationRules(field.validation, isVisible);
  const error = errors[field.id];
  const fieldId = `field-${field.id}`;

  const renderInput = () => {
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={fieldId}
            className="form-input form-textarea"
            placeholder={field.placeholder}
            disabled={isDisabled}
            {...register(field.id, validationRules)}
          />
        );

      case 'select':
        return (
          <select
            id={fieldId}
            className="form-input"
            disabled={isDisabled}
            {...register(field.id, validationRules)}
          >
            <option value="">{field.placeholder || 'Select...'}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div
            className="radio-group"
            role="radiogroup"
            aria-labelledby={`${fieldId}-label`}
          >
            {options.map((opt) => (
              <label key={opt.value} className="radio-option">
                <input
                  type="radio"
                  value={opt.value}
                  disabled={isDisabled}
                  {...register(field.id, validationRules)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <label className="checkbox-label">
            <input
              id={fieldId}
              type="checkbox"
              disabled={isDisabled}
              {...register(field.id, validationRules)}
            />
            <span>{field.label}</span>
          </label>
        );

      default:
        return (
          <input
            id={fieldId}
            type={field.type}
            className="form-input"
            placeholder={field.placeholder}
            disabled={isDisabled}
            {...register(field.id, validationRules)}
          />
        );
    }
  };

  if (field.type === 'checkbox') {
    return (
      <div className={`form-field ${error ? 'has-error' : ''}`}>
        {renderInput()}
        {field.helpText && <p className="help-text">{field.helpText}</p>}
        {error && (
          <span className="error-message">{String(error.message)}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`form-field ${error ? 'has-error' : ''}`}>
      <label id={`${fieldId}-label`} htmlFor={fieldId} className="form-label">
        {field.label}
        {(field.required || field.validation?.required) && (
          <span className="required">*</span>
        )}
      </label>
      {renderInput()}
      {field.helpText && <p className="help-text">{field.helpText}</p>}
      {error && (
        <span className="error-message">{String(error.message)}</span>
      )}
    </div>
  );
}
