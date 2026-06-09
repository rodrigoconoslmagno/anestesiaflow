import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { AppInputText, type AppInputTextProps } from '@/componentes/inputtext/AppInputText';

interface AppInputTextFormProps<T extends FieldValues>
  extends Omit<AppInputTextProps, 'name' | 'value' | 'onChange' | 'errorMessage'> {
  name: Path<T>;
  control: Control<T>;
}

export const AppInputTextForm = <T extends FieldValues>({
  name,
  control,
  ...props
}: AppInputTextFormProps<T>) => (
  <Controller
    name={name}
    control={control}
    render={({ field, fieldState: { error } }) => (
      <AppInputText
        {...props}
        {...field}
        name={name}
        value={field.value ?? ''}
        errorMessage={error?.message}
      />
    )}
  />
);
