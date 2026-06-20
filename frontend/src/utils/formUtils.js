/**
 * Client-side form utilities.
 * Visibility, validation rules, default values, and dropdown resolution
 * all run in the browser — no additional API calls after config is loaded.
 */

/**
 * Returns true when a value is considered empty for visibility rules.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
function isEmpty(value) {
  return value === undefined || value === null || value === '';
}

/**
 * Evaluates a visibility condition from backend config against current form values.
 * Used by both sections and fields to show/hide UI elements.
 *
 * Supports operators: equals, notEquals, in, notIn, greaterThan, lessThan, isEmpty, isNotEmpty.
 * Context keys like _product_code, _channel_code, _sub_channel_code are injected
 * by DynamicField / DynamicSection before calling this function.
 *
 * @param {{ field: string, operator: string, value?: unknown } | undefined} condition
 * @param {Record<string, unknown>} formValues - Current form values plus context fields
 * @returns {boolean} true if the element should be visible
 */
export function evaluateVisibility(condition, formValues) {
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

/**
 * Converts backend validation config into React Hook Form rule objects.
 * Hidden fields (isVisible=false) receive no rules so they are not validated.
 *
 * @param {{
 *   required?: boolean,
 *   min?: number,
 *   max?: number,
 *   minLength?: number,
 *   maxLength?: number,
 *   pattern?: string,
 *   patternMessage?: string
 * } | undefined} validation
 * @param {boolean} [isVisible=true]
 * @returns {Record<string, unknown>}
 */
export function buildValidationRules(validation, isVisible = true) {
  if (!validation || !isVisible) {
    return {};
  }

  const rules = {};

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

/**
 * Builds initial form values from field defaultValue properties in the config.
 * Skips fields marked as hidden.
 *
 * @param {{ fields: { id: string, defaultValue?: unknown, hidden?: boolean }[] }[]} sections
 * @returns {Record<string, unknown>}
 */
export function getDefaultValues(sections) {
  const defaults = {};

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

/**
 * Resolves dropdown/radio options entirely on the client.
 * - Uses field.options for static lists
 * - Uses field.optionsMap + field.dependsOn for parent-dependent lists (e.g. banks by payment method)
 *
 * @param {{
 *   options?: { label: string, value: string }[],
 *   optionsMap?: Record<string, { label: string, value: string }[]>,
 *   dependsOn?: string[]
 * }} field
 * @param {Record<string, unknown>} formValues
 * @returns {{ label: string, value: string }[]}
 */
export function resolveFieldOptions(field, formValues) {
  if (field.options) {
    return field.options;
  }

  if (field.optionsMap && field.dependsOn?.length) {
    const parentValue = String(formValues[field.dependsOn[0]] ?? '');
    return field.optionsMap[parentValue] ?? [];
  }

  return [];
}
