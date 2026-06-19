import { InputNumber, type InputNumberProps, type InputNumberValueChangeEvent } from 'primereact/inputnumber';
import { classNames } from 'primereact/utils';
import { FieldWrapper } from '@/componentes/FieldWrapper';
import { type ColSpan, getColSpanClass } from '@/utils/GridUtils';
import { FloatLabel } from 'primereact/floatlabel';
import { useRenderMode } from '@/context/FormRenderContext';

export interface AppInputNumberProps extends Omit<InputNumberProps, 'onChange' | 'value'> {
  name: string;
  label: string;
  colSpan?: ColSpan;
  required?: boolean;
  errorMessage?: string;
  value?: number | null;
  onChange?: (e: InputNumberValueChangeEvent) => void;
  isCurrency?: boolean;
  minFractionDigits?: number;
  maxFractionDigits?: number;
}

export const AppInputNumber = ({
  name,
  label,
  colSpan = 12,
  required,
  errorMessage,
  value,
  onChange,
  isCurrency = false,
  minFractionDigits = 2,
  maxFractionDigits = 2,
  ...props
}: AppInputNumberProps) => {
  const { mode } = useRenderMode();
  const isCell = mode === 'cell';

  return (
    <FieldWrapper
      label=""
      error={errorMessage}
      className={classNames(getColSpanClass(colSpan), props.className)}
    >
      <FloatLabel className="custom-app-float-label">
        <InputNumber
          {...props}
          id={name}
          name={name}
          value={value ?? null}
          invalid={!!errorMessage}
          onValueChange={onChange}
          mode={isCurrency ? 'currency' : 'decimal'}
          currency="BRL"
          locale="pt-BR"
          minFractionDigits={minFractionDigits}
          maxFractionDigits={maxFractionDigits}
          useGrouping={true}
          inputMode="decimal"
          className={classNames('w-full', props.className)}
          inputClassName={classNames(
            'w-full transition-all duration-200',
            '!p-1 !pl-4 !pr-4 border border-gray-500 rounded-lg outline-none text-lg !text-right',
            { 'p-invalid !border-red-500': errorMessage }
          )}
        />

        {!isCell && (
          <label
            className={classNames(
              'text-gray-500 transition-all duration-200 text-lg',
              { 'text-red-600 font-semibold': errorMessage }
            )}
            htmlFor={name}
            style={{ left: '1rem' }}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
      </FloatLabel>

      <style>{`
        .custom-app-float-label .p-inputtext {
          padding-right: 1rem !important;
          padding-inline-start: 1rem !important;
          background-image: none !important;
          border: 1px solid rgb(107 114 128 / var(--tw-border-opacity, 1));
          height: 40px; 
        }

        .custom-app-float-label .p-inputtext.p-invalid,
        .custom-app-float-label .p-invalid .p-inputtext {
          border-color: #ef4444 !important;
          border-width: 1px !important;
        }

        .custom-app-float-label input:focus ~ label,
        .custom-app-float-label input.p-filled ~ label {
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

        .custom-app-float-label label {
          top: 72% !important;
          transform: translateY(-50%) !important;
          pointer-events: none;
        }
      `}</style>
    </FieldWrapper>
  );
};