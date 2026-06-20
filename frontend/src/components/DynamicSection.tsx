import {
  type Control,
  type FieldErrors,
  type UseFormRegister,
  useWatch,
} from 'react-hook-form';
import { DynamicField } from './DynamicField';
import type {
  FormContextMeta,
  FormValues,
  SectionConfig,
} from '../types/form';
import { evaluateVisibility } from '../utils/formUtils';

interface DynamicSectionProps {
  section: SectionConfig;
  register: UseFormRegister<FormValues>;
  control: Control<FormValues>;
  errors: FieldErrors<FormValues>;
  contextMeta: FormContextMeta;
}

export function DynamicSection({
  section,
  register,
  control,
  errors,
  contextMeta,
}: DynamicSectionProps) {
  const watchedValues = useWatch({ control });

  const contextValues: FormValues = {
    ...watchedValues,
    _product_code: contextMeta.product_code,
    _channel_code: contextMeta.channel_code,
    _sub_channel_code: contextMeta.sub_channel_code,
  };

  const isVisible =
    !section.hidden && evaluateVisibility(section.visibleWhen, contextValues);

  if (!isVisible) {
    return null;
  }

  const visibleFields = section.fields.filter((f) => !f.hidden);

  if (visibleFields.length === 0) {
    return null;
  }

  return (
    <fieldset className="form-section">
      <legend className="section-title">{section.label}</legend>
      {section.description && (
        <p className="section-description">{section.description}</p>
      )}
      <div className="section-fields">
        {section.fields.map((field) => (
          <DynamicField
            key={field.id}
            field={field}
            register={register}
            control={control}
            errors={errors}
            contextMeta={contextMeta}
          />
        ))}
      </div>
    </fieldset>
  );
}
