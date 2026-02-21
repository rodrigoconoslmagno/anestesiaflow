import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Calendar, type CalendarProps } from 'primereact/calendar';
import { classNames } from 'primereact/utils';
import { FieldWrapper } from '@/componentes/FieldWrapper';
import { type ColSpan, getColSpanClass } from '@/utils/GridUtils';
import { FloatLabel } from 'primereact/floatlabel';
import { addLocale } from 'primereact/api';
import { DateUtils } from '@/utils/DateUtils';

// Configuração básica para PT-BR (opcional, mas recomendado)
addLocale('pt-br', {
    firstDayOfWeek: 0,
    dayNames: ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'],
    dayNamesShort: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'],
    dayNamesMin: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
    monthNames: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
    monthNamesShort: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
    today: 'Hoje',
    clear: 'Limpar'
});

interface AppCalendarProps<T extends FieldValues> extends Omit<CalendarProps, 'value' | 'onChange'> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  colSpan?: ColSpan;
  required?: boolean;
  showTime?: boolean; // Define se usa hora ou não
}

export const AppCalendar = <T extends FieldValues>({ 
          name, 
          control, 
          label, 
          colSpan = 12, 
          required,
          showTime = false,
          ...props }: AppCalendarProps<T>) => (
  <Controller
    name={name}
    control={control}
    render={({ field, fieldState: { error } }) => (
      <FieldWrapper 
        label=""
        error={error?.message} 
        className={getColSpanClass(colSpan)}
      >
        <FloatLabel className="custom-app-calendar-float-label">
          <Calendar 
            {...field} 
            {...props} 
            id={name}
            value={DateUtils.paraDate(field.value) ?? null}
            onChange={(e) => field.onChange(e.value)}
            showTime={showTime}
            hourFormat="24"
            locale="pt-br"
            dateFormat="dd/mm/yy"
            showIcon
            showButtonBar
            // autoComplete="off"
            className={classNames(
                'w-full border border-gray-500 rounded-lg outline-none transition-all duration-200 text-lg', 
                props.className, 
                { 'p-invalid border-red-500': error })} 
          />
          <label 
            className="text-gray-500 transition-all duration-200 text-lg"
            htmlFor={name}
            style={{ left: '1rem' }}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </FloatLabel>

        <style>{`
          /* Sincronização visual com AppInputText e AppSelect */
          .custom-app-calendar-float-label .p-calendar {
            height: 40px; /* Ajuste para bater com a altura dos outros inputs */
          }

          .custom-app-calendar-float-label .p-inputtext {
            border: none !important;
            padding-left: 1rem !important;
            background: transparent !important;
            box-shadow: none !important;
          }

          .custom-app-calendar-float-label.p-calendar:focus-within ~ label,
          .custom-app-calendar-float-label .p-inputwrapper-filled ~ label {
            font-weight: 700 !important;
            font-size: 1.125rem !important;
            color: #374151 !important;
            background: white;
            padding: 0 8px !important;
            transform: translateY(-70%) scale(0.85) !important;
            top: 0 !important;
            left: 0px !important;
            z-index: 10;
          }

          .custom-app-calendar-float-label label {
            top: 63% !important;
            transform: translateY(-50%) !important;
            pointer-events: none;
          }

          /* Ajuste do ícone do calendário */
          .p-datepicker-trigger {
            background: transparent !important;
            color: #6b7280 !important;
            border: none !important;
          }
        `}</style>
      </FieldWrapper>
    )}
  />
);