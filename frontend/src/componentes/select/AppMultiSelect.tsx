import { MultiSelect, type MultiSelectProps } from 'primereact/multiselect';
import { classNames } from 'primereact/utils';
import { FieldWrapper } from '@/componentes/FieldWrapper';
import { type ColSpan, getColSpanClass } from '@/utils/GridUtils';
import { FloatLabel } from 'primereact/floatlabel';
import { useEffect, useState } from 'react';
import { server } from '@/api/server';
import { useRenderMode } from '@/context/FormRenderContext';

export interface AppMultiSelectProps extends Omit<MultiSelectProps, 'onChange'> {
  name?: string;
  label: string;
  url?: string;
  filterParams?: any;
  options?: any[];
  colSpan?: ColSpan;
  required?: boolean;
  public_back?: boolean;
  errorMessage?: string;
  onObjectChange?: (items: any[] | null | undefined) => void;
  filterFn?: (item: any) => boolean;
  onChange?: (e: { value: any[] | null }) => void;
}

export const AppMultiSelect = ({
  name,
  label,
  url,
  filterParams = null,
  colSpan = 12,
  required,
  public_back,
  errorMessage,
  showClear = true,
  filter = true,
  onObjectChange,
  filterFn,
  onChange,
  options,
  ...props
}: AppMultiSelectProps) => {
  const [data, setData] = useState<any[]>(options || []);
  const [loading, setLoading] = useState(false);
  const [innerValue, setInnerValue] = useState<any[]>(props.value ?? []);
  const { mode } = useRenderMode();
  const isCell = mode === 'cell';

  useEffect(() => {
    if (options) {
      setData(options);
    }
  }, [options]);

  useEffect(() => {
    if (url && (!options || options.length === 0)) {
      setLoading(true);
      const fetchMethod = public_back ? server.api_public.listar : server.api.listar;

      fetchMethod<any>(url, filterParams)
        .then(res => {
          const lista = res || [];
          setData(lista);
        })
        .finally(() => setLoading(false));
    }
  }, [url, JSON.stringify(filterParams)]);

  useEffect(() => {
    setInnerValue(props.value ?? []);

    if (onObjectChange) {
      if (!props.value || (Array.isArray(props.value) && props.value.length === 0)) {
        onObjectChange(null);
      } else if (data.length > 0) {
        const optionValue = props.optionValue || 'value';
        const selectedItems = data.filter(item => (props.value as any[]).includes(item[optionValue]));
        onObjectChange(selectedItems);
      } else {
        onObjectChange(null);
      }
    }
  }, [props.value, data, onObjectChange, props.optionValue]);

  const defaultItemTemplate = (option: any) => {
    const labelField = props.optionLabel || 'name';
    const displayValue = option[labelField] || option.name || option.label;
    return (
      <div className="flex flex-col py-1">
        <span className="font-semibold text-gray-800 leading-tight">
          {displayValue}
        </span>
      </div>
    );
  };

  return (
    <FieldWrapper
      label=""
      error={errorMessage}
      className={classNames(getColSpanClass(colSpan), props.className)}
    >
      <FloatLabel className="custom-app-select-float-label">
        <MultiSelect
          {...props}
          id={name || props.id}
          value={innerValue ?? []}
          options={data || []}
          filter={filter}
          showClear={showClear}
          filterPlaceholder="Buscar..."
          emptyFilterMessage="Nenhum registro encontrado"
          itemTemplate={props.itemTemplate || defaultItemTemplate}
          loading={loading}
          optionValue={props.optionValue || 'value'}
          optionLabel={props.optionLabel || 'name'}
          className={classNames(
            'w-full border rounded-lg outline-none transition-all duration-200 text-lg',
            'border-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
            props.className,
            { 
              'border-red-500 hover:border-red-600 focus:border-red-500 focus:ring-2 focus:ring-red-200': errorMessage,
              'p-invalid': errorMessage
            }
          )}
          onChange={(e) => {
            const value = e.value ?? [];
            setInnerValue(value);
            onChange?.({ value });

            if (onObjectChange) {
              const optionValue = props.optionValue || 'value';
              const selectedItems = data.filter(item => value.includes(item[optionValue]));
              onObjectChange(selectedItems.length > 0 ? selectedItems : null);
            }
          }}
        />

        {!isCell && (
          <label
            className={classNames(
              'transition-all duration-200 text-lg',
              errorMessage ? 'text-red-600 font-semibold' : 'text-gray-500'
            )}
            htmlFor={name || props.id}
            style={{ left: '1rem' }}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <style>{`
          .custom-app-select-float-label .p-multiselect .p-inputtext {
            padding: 0.10rem 0 !important;
          }

          .custom-app-select-float-label .p-multiselect .p-multiselect-label {
            padding: 0.31rem !important;
            padding-left: 1rem !important;
          }

          .custom-app-select-float-label .p-multiselect-label {            
            display: flex;
            align-items: center;
          }

          .custom-app-select-float-label .p-multiselect:focus-within ~ label,
          .custom-app-select-float-label .p-inputwrapper-filled ~ label {
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

          .custom-app-select-float-label label {
            top: 53% !important;
            transform: translateY(-25%) !important;
          }

          .p-multiselect:not(.p-disabled).p-focus {
            box-shadow: 0 0 0 2px rgba(55, 65, 81, 0.2);
            border-color: #374151 !important;
          }

          @media screen and (max-width: 767px) {
            .p-connected-overlay-enter {
              opacity: 0 !important;
              transform: none !important;
            }

            .p-multiselect-panel {
              left: 4vw !important;
              width: 92vw !important;
              min-width: 92vw !important;
              transform-origin: center top !important;
              transition: none !important;
            }

            .p-multiselect-items-wrapper {
              width: 100% !important;
            }
          }
        `}</style>
      </FloatLabel>
    </FieldWrapper>
  );
};
