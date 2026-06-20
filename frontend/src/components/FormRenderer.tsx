import { useForm } from 'react-hook-form';
import { DynamicSection } from './DynamicSection';
import type {
  FormConfiguration,
  FormContextMeta,
  FormValues,
} from '../types/form';
import { getDefaultValues } from '../utils/formUtils';

interface FormRendererProps {
  configuration: FormConfiguration;
  contextMeta: FormContextMeta;
  onSubmit: (data: FormValues) => Promise<void>;
  submitting?: boolean;
}

export function FormRenderer({
  configuration,
  contextMeta,
  onSubmit,
  submitting = false,
}: FormRendererProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: getDefaultValues(configuration.sections),
    mode: 'onBlur',
  });

  return (
    <form
      className="dynamic-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <header className="form-header">
        <h2>{configuration.title}</h2>
        {configuration.description && (
          <p className="form-description">{configuration.description}</p>
        )}
        <div className="proposal-meta">
          <span>
            {contextMeta.product_code} / {contextMeta.channel_code} /{' '}
            {contextMeta.sub_channel_code}
          </span>
        </div>
      </header>

      {configuration.sections.map((section) => (
        <DynamicSection
          key={section.id}
          section={section}
          register={register}
          control={control}
          errors={errors}
          contextMeta={contextMeta}
        />
      ))}

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Payment'}
        </button>
      </div>
    </form>
  );
}
