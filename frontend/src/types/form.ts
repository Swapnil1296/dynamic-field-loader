export type FieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'select'
  | 'checkbox'
  | 'date'
  | 'textarea'
  | 'radio';

export interface SelectOption {
  label: string;
  value: string;
}

export interface VisibilityCondition {
  field: string;
  operator:
    | 'equals'
    | 'notEquals'
    | 'in'
    | 'notIn'
    | 'greaterThan'
    | 'lessThan'
    | 'isEmpty'
    | 'isNotEmpty';
  value?: unknown;
}

export interface ValidationRules {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
}

export interface FieldConfig {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  defaultValue?: unknown;
  hidden?: boolean;
  disabled?: boolean;
  required?: boolean;
  validation?: ValidationRules;
  visibleWhen?: VisibilityCondition;
  options?: SelectOption[];
  optionsMap?: Record<string, SelectOption[]>;
  dependsOn?: string[];
  helpText?: string;
}

export interface SectionConfig {
  id: string;
  label: string;
  description?: string;
  hidden?: boolean;
  visibleWhen?: VisibilityCondition;
  fields: FieldConfig[];
}

export interface FormConfiguration {
  title: string;
  description?: string;
  sections: SectionConfig[];
}

export interface FormConfigurationResponse {
  id: number;
  product_code: string;
  channel_code: string;
  sub_channel_code: string;
  configuration: FormConfiguration;
  created_at: string;
}

export type FormValues = Record<string, unknown>;

export interface FormContextMeta {
  product_code: string;
  channel_code: string;
  sub_channel_code: string;
}
