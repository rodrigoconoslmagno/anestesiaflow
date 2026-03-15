import { InputSwitch, type InputSwitchProps } from 'primereact/inputswitch';
import { classNames } from 'primereact/utils';
import { FieldWrapper } from '@/componentes/FieldWrapper';
import { type ColSpan, getColSpanClass } from '@/utils/GridUtils';

export interface AppSwitchProps extends Omit<InputSwitchProps, 'onChange' | 'checked' | 'value' > {
  name: string;
  label: string;
  labelOn?: string;
  labelOff?: string;
  description?: string;
  colSpan?: ColSpan;
  required?: boolean;
  errorMessage?: string;
  value?: boolean;
  onChange?: (e: { value: boolean | null | undefined }) => void;
}

export const AppSwitch = ({
  name,
  label,
  labelOn,
  labelOff,
  description,
  colSpan = 12,
  required,
  errorMessage,
  value,
  onChange,
}: AppSwitchProps) => {
  const isChecked = !!value;
  const statusText = isChecked ? labelOn : labelOff;

  return (
    <FieldWrapper
      label=""
      error={errorMessage}
      className={classNames(getColSpanClass(colSpan))}
    >
      <div className={classNames(
        "flex items-center justify-between sm:gap-4 p-1 border rounded-lg transition-all duration-300",
        { 
          "bg-gray-50 border-gray-400": !isChecked, 
          "bg-green-50/40 border-green-500 shadow-sm": isChecked 
        }
      )}>
        <div className="flex flex-col">
          <label htmlFor={name} className="px-2 text-sm font-bold text-gray-700 cursor-pointer flex items-center gap-2">
            {label}
            {required && <span className="text-red-500">*</span>}
            
            {/* Badge ou texto de status dinâmico */}
            {statusText && (
              <span className={classNames(
                "sm:text-[10px] text-[8px] uppercase px-2 py-0.5 rounded-full font-extrabold tracking-wider transition-colors",
                { "bg-green-200 text-green-800": isChecked, "bg-red-200 text-red-600": !isChecked }
              )}>
                {statusText}
              </span>
            )}
          </label>
          
          {description && (
            <span className=" text-gray-500 leading-tight mt-0.5">
              {description}
            </span>
          )}
        </div>

        <InputSwitch
          id={name}
          checked={isChecked}
          onChange={(e) => {
            onChange?.({ value: !!e.value });
          }}
          className={classNames({ "p-invalid": errorMessage }, "h-[22px] sm:h-[25px]")}
        />
      </div>

      {errorMessage && (
        <small className="p-error text-red-500 text-xs mt-1 block animate-fadein">
          {errorMessage}
        </small>
      )}
    </FieldWrapper>
  );
}