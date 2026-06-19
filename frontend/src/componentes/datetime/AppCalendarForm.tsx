import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { AppCalendar, type AppCalendarProps } from '@/componentes/datetime/AppCalendar';
import { DateUtils } from '@/utils/DateUtils';

interface AppCalendarFormProps<T extends FieldValues>
  extends Omit<AppCalendarProps, 'name' | 'value' | 'onChange' | 'errorMessage'> {
  name: Path<T>;
  control: Control<T>;
}

export const AppCalendarForm = <T extends FieldValues>({
  name,
  control,
  ...props
}: AppCalendarFormProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <AppCalendar
          {...props}
          id={name}
          name={name}
          value={(field.value && DateUtils.paraDate(field.value)) ?? null}
          onChange={(e) => field.onChange(e.value)}
          onBlur={field.onBlur}
          errorMessage={error?.message}
        />
      )}
    />
  );
};