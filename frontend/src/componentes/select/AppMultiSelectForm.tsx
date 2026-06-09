import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { AppMultiSelect, type AppMultiSelectProps } from '@/componentes/select/AppMultiSelect';

interface AppMultiSelectFormProps<T extends FieldValues> extends AppMultiSelectProps {
  name: Path<T>;
  control: Control<T>;
  required?: boolean;
}

export const AppMultiSelectForm = <T extends FieldValues>({
  name,
  control,
  required,
  label,
  ...props
}: AppMultiSelectFormProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: required ? `${label} é obrigatório` : undefined,
        validate: (value) => {
          if (required && (!value || (Array.isArray(value) && value.length === 0))) {
            return `${label} é obrigatório`;
          }
          return true;
        }
      }}
      defaultValue={[] as any}
      render={({ field, fieldState: { error } }) => (
        <AppMultiSelect
          {...props}
          {...field}
          label={label}
          value={field.value ?? []}
          errorMessage={error?.message}
          required={required}
          onChange={(e) => field.onChange(e.value)}
          onBlur={field.onBlur}
        />
      )}
    />
  );
};
