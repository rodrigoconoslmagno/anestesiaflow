import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { AppInputTextArea, type AppInputTextAreaProps } from './AppInputTextArea';

interface AppInputTextAreaFormProps<T extends FieldValues> 
  extends Omit<AppInputTextAreaProps, 'name' | 'value' | 'onChange' | 'errorMessage'> {
  name: Path<T>;
  control: Control<T>;
}

export const AppInputTextAreaForm = <T extends FieldValues>({
  name,
  control,
  ...props
}: AppInputTextAreaFormProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <AppInputTextArea
          {...props}
          {...field}
          name={name}
          value={field.value ?? ''}
          errorMessage={error?.message}
        />
      )}
    />
  );
};