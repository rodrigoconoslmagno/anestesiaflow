import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { AppSwitch, type AppSwitchProps } from './AppSwitch';

interface AppSwitchFormProps<T extends FieldValues> extends AppSwitchProps {
    name: Path<T>;
    control: Control<T>;
}

export const AppSwitchForm = <T extends FieldValues>({
  name,
  control,
  ...props
}: AppSwitchFormProps<T>) => (
  <Controller
    name={name}
    control={control}
    render={({ field, fieldState: { error } }) => (
        <AppSwitch
        {...props}
        {...field}
        value={!!field.value}
        errorMessage={error?.message}
        onChange={(e) => field.onChange(e.value)}
      />
    )}
  />
);