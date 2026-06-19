import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { AppInputNumber, type AppInputNumberProps } from './AppInputNumber';

interface AppInputNumberFormProps<T extends FieldValues>
  extends Omit<AppInputNumberProps, 'name' | 'value' | 'onChange' | 'errorMessage'> {
  name: Path<T>;
  control: Control<T>;
}

export const AppInputNumberForm = <T extends FieldValues>({
  name,
  control,
  ...props
}: AppInputNumberFormProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <AppInputNumber
          {...props}
          id={name}
          name={name}
          value={field.value ?? null}
          onChange={(e) => field.onChange(e.value)}
          onBlur={field.onBlur}
          errorMessage={error?.message}
        />
      )}
    />
  );
};