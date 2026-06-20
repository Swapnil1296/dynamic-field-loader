import type { FieldConfig, FormValues, SelectOption, VisibilityCondition } from '../types/form';

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

export function evaluateVisibility(
  condition: VisibilityCondition | undefined,
  formValues: Record<string, unknown>
): boolean {
  if (!condition) {
    return true;
  }

  const fieldValue = formValues[condition.field];
  const { operator, value } = condition;

  switch (operator) {
    case 'equals':
      return fieldValue === value;
    case 'notEquals':
      return fieldValue !== value;
    case 'in':
      return Array.isArray(value) && value.includes(fieldValue);
    case 'notIn':
      return Array.isArray(value) && !value.includes(fieldValue);
    case 'greaterThan':
      return Number(fieldValue) > Number(value);
    case 'lessThan':
      return Number(fieldValue) < Number(value);
    case 'isEmpty':
      return isEmpty(fieldValue);
    case 'isNotEmpty':
      return !isEmpty(fieldValue);
    default:
      return true;
  }
}

export function buildValidationRules(
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    patternMessage?: string;
  },
  isVisible = true
): Record<string, unknown> {
  if (!validation || !isVisible) {
    return {};
  }

  const rules: Record<string, unknown> = {};

  if (validation.required) {
    rules.required = 'This field is required';
  }
  if (validation.min !== undefined) {
    rules.min = {
      value: validation.min,
      message: `Minimum value is ${validation.min}`,
    };
  }
  if (validation.max !== undefined) {
    rules.max = {
      value: validation.max,
      message: `Maximum value is ${validation.max}`,
    };
  }
  if (validation.minLength !== undefined) {
    rules.minLength = {
      value: validation.minLength,
      message: `Minimum length is ${validation.minLength}`,
    };
  }
  if (validation.maxLength !== undefined) {
    rules.maxLength = {
      value: validation.maxLength,
      message: `Maximum length is ${validation.maxLength}`,
    };
  }
  if (validation.pattern) {
    rules.pattern = {
      value: new RegExp(validation.pattern),
      message: validation.patternMessage || 'Invalid format',
    };
  }

  return rules;
}

export function getDefaultValues(
  sections: { fields: { id: string; defaultValue?: unknown; hidden?: boolean }[] }[]
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};

  for (const section of sections) {
    for (const field of section.fields) {
      if (field.hidden) continue;
      if (field.defaultValue !== undefined) {
        defaults[field.id] = field.defaultValue;
      }
    }
  }

  return defaults;
}

export function resolveFieldOptions(
  field: FieldConfig,
  formValues: FormValues
): SelectOption[] {
  if (field.options) {
    return field.options;
  }

  if (field.optionsMap && field.dependsOn?.length) {
    const parentValue = String(formValues[field.dependsOn[0]] ?? '');
    return field.optionsMap[parentValue] ?? [];
  }

  return [];
}
