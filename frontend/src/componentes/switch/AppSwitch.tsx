import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { InputSwitch } from 'primereact/inputswitch';
import { classNames } from 'primereact/utils';
import { FieldWrapper } from '@/componentes/FieldWrapper';
import { type ColSpan, getColSpanClass } from '@/utils/GridUtils';

interface AppSwitchProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  // Novas props para textos dinâmicos
  labelOn?: string;  // Texto quando true (ex: "Ativo")
  labelOff?: string; // Texto quando false (ex: "Inativo")
  description?: string;
  colSpan?: ColSpan;
  required?: boolean;
}

export const AppSwitch = <T extends FieldValues>({
  name,
  control,
  label,
  labelOn,
  labelOff,
  description,
  colSpan = 12,
  required
}: AppSwitchProps<T>) => (
  <Controller
    name={name}
    control={control}
    render={({ field, fieldState: { error } }) => {
      // Lógica para definir qual texto exibir ao lado da label principal
      const statusText = field.value ? labelOn : labelOff;

      return (
        <FieldWrapper
          label=""
          error={error?.message}
          className={getColSpanClass(colSpan)}
        >
          <div className={classNames(
            "flex items-center justify-between gap-4 p-1 border rounded-lg transition-all duration-300",
            { 
              "bg-gray-50 border-gray-400": !field.value, 
              "bg-green-50/40 border-green-500 shadow-sm": field.value 
            }
          )}>
            <div className="flex flex-col">
              <label htmlFor={name} className="px-2 text-sm font-bold text-gray-700 cursor-pointer flex items-center gap-2">
                {label}
                {required && <span className="text-red-500">*</span>}
                
                {/* Badge ou texto de status dinâmico */}
                {statusText && (
                  <span className={classNames(
                    "text-[10px] uppercase px-2 py-0.5 rounded-full font-extrabold tracking-wider transition-colors",
                    { "bg-green-200 text-green-800": field.value, "bg-red-200 text-red-600": !field.value }
                  )}>
                    {statusText}
                  </span>
                )}
              </label>
              
              {description && (
                <span className="text-xs text-gray-500 leading-tight mt-0.5">
                  {description}
                </span>
              )}
            </div>

            <InputSwitch
              id={name}
              checked={field.value}
              onChange={(e) => field.onChange(e.value)}
              className={classNames({ "p-invalid": error })}
            />
          </div>

          {error && (
            <small className="p-error text-red-500 text-xs mt-1 block animate-fadein">
              {error.message}
            </small>
          )}
        </FieldWrapper>
      );
    }}
  />
);