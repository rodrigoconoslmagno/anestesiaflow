import { InputTextarea, type InputTextareaProps } from 'primereact/inputtextarea';
import { classNames } from 'primereact/utils';
import { FieldWrapper } from '@/componentes/FieldWrapper';
import { type ColSpan, getColSpanClass } from '@/utils/GridUtils';
import { FloatLabel } from 'primereact/floatlabel';
import { useRenderMode } from '@/context/FormRenderContext';

export interface AppInputTextAreaProps extends Omit<InputTextareaProps, 'onChange' | 'value'> {
  name: string;
  label: string;
  colSpan?: ColSpan;
  required?: boolean;
  errorMessage?: string;
  value?: InputTextareaProps['value'];
  onChange?: InputTextareaProps['onChange'];
}

export const AppInputTextArea = ({
  name,
  label,
  colSpan = 12,
  required,
  errorMessage,
  value,
  onChange,
  autoResize = true,
  rows = 3,
  ...props
}: AppInputTextAreaProps) => {
  const { mode } = useRenderMode();
  const isCell = mode === 'cell';

  return (
    <FieldWrapper
      label=""
      error={errorMessage}
      className={classNames(getColSpanClass(colSpan), props.className)}
    >
      <FloatLabel className="custom-app-textarea-float-label">
        <InputTextarea
          {...props}
          name={name}
          id={name}
          value={value ?? ''}
          onChange={onChange}
          autoResize={autoResize}
          rows={rows}
          autoComplete="off"
          className={classNames(
            'w-full transition-all duration-200',
            '!p-2 !pl-4 border border-gray-500 rounded-lg outline-none text-lg custom-scrollbar',
            props.className,
            { 'p-invalid border-red-500': errorMessage }
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
        .custom-app-textarea-float-label .p-inputtextarea {
          padding-right: 1rem !important;
          background-image: none !important;
          border: 1px solid rgb(107 114 128 / var(--tw-border-opacity, 1));
          min-height: 40px;
          max-height: 150px;
          overflow-y: auto !important;
          padding-inline-start: 1rem !important;
        }

        .custom-app-textarea-float-label textarea:focus ~ label,
        .custom-app-textarea-float-label textarea.p-filled ~ label {
          font-weight: 700 !important;
          font-size: 1.125rem !important;
          color: #374151 !important;
          background: white;
          padding: 0 8px !important;
          transform: translateY(-70%) scale(0.85) !important;
          top: 0 !important;
          left: 0px !important;
        }

        .custom-app-textarea-float-label label {
          top: 20% !important;
          transform: translateY(-50%) !important;
        }
      `}</style>
    </FieldWrapper>
  );
};