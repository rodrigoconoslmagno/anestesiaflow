// AppSelectForm.tsx
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { AppSelect, type AppSelectProps } from '@/componentes/select/AppSelect';

interface AppSelectFormProps<T extends FieldValues> extends AppSelectProps {
  name: Path<T>;
  control: Control<T>;
}

export const AppSelectForm = <T extends FieldValues>({ 
  name, control, ...props 
}: AppSelectFormProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <AppSelect
          {...props}
          {...field}
          value={field.value}
          errorMessage={error?.message}
          onChange={(e) => field.onChange(e.value)}
        />
      )}
    />
  );
};