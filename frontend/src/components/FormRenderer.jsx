import { useForm } from 'react-hook-form';
import { DynamicSection } from './DynamicSection';
import { getDefaultValues } from '../utils/formUtils';

/**
 * Top-level dynamic form renderer with 2-column card grid layout.
 */
export function FormRenderer({
  configuration,
  contextMeta,
  onSubmit,
  submitting = false,
}) {
  const {
    register,
    control,
    handleSubmit,
    unregister,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: getDefaultValues(configuration.sections),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    shouldUnregister: true,
  });

  return (
    <form
      className="form-container dynamic-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <header className="form-header">
        <h2>{configuration.title}</h2>
        {configuration.description && (
          <p className="form-description">{configuration.description}</p>
        )}
        <div className="proposal-meta">
          {contextMeta.product_code} / {contextMeta.channel_code} /{' '}
          {contextMeta.sub_channel_code}
        </div>
      </header>

      {configuration.sections.map((section) => (
        <DynamicSection
          key={section.id}
          section={section}
          register={register}
          control={control}
          errors={errors}
          unregister={unregister}
          clearErrors={clearErrors}
          contextMeta={contextMeta}
        />
      ))}

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Proposal'}
        </button>
      </div>
    </form>
  );
}
