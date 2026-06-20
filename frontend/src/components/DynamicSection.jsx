import { useWatch } from 'react-hook-form';
import { DynamicField } from './DynamicField';
import { evaluateVisibility } from '../utils/formUtils';

/**
 * Renders one form section — fields flow into the parent 2-column grid.
 */
export function DynamicSection({
  section,
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
    !section.hidden && evaluateVisibility(section.visibleWhen, contextValues);

  if (!isVisible) {
    return null;
  }

  const visibleFields = section.fields.filter((f) => !f.hidden);

  if (visibleFields.length === 0) {
    return null;
  }

  return (
    <>
      <div className="section-header">
        <div className="section-title">{section.label}</div>
        {section.description && (
          <p className="section-description">{section.description}</p>
        )}
      </div>
      {section.fields.map((field) => (
        <DynamicField
          key={field.id}
          field={field}
          register={register}
          control={control}
          errors={errors}
          unregister={unregister}
          clearErrors={clearErrors}
          contextMeta={contextMeta}
        />
      ))}
    </>
  );
}
