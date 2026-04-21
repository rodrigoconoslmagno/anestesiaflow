import { Dropdown, type DropdownProps } from 'primereact/dropdown';
import { classNames } from 'primereact/utils';
import { FieldWrapper } from '@/componentes/FieldWrapper';
import { type ColSpan, getColSpanClass } from '@/utils/GridUtils';
import { FloatLabel } from 'primereact/floatlabel';
import { useEffect, useState } from 'react';
import { server } from '@/api/server';
import { useRenderMode } from '@/context/FormRenderContext';

export interface AppSelectProps extends Omit<DropdownProps, 'onChange'> {
  name: string;
  label: string;
  url?: string;        
  filterParams?: any;   
  options?: any[];      
  colSpan?: ColSpan;
  required?: boolean;
  public_back?: boolean;
  errorMessage?: string;
  onObjectChange?: (obj: any | null | undefined) => void;
  filterFn?: (item: any) => boolean;
  onChange?: (e: { value: any }) => void;
}

export const AppSelect = ({ 
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
  ...props }: AppSelectProps) => {

    const [data, setData] = useState<any[]>(props.options || []);
    const [loading, setLoading] = useState(false);
    const [innerValue, setInnerValue] = useState(props.value);

    const { mode } = useRenderMode();

    const isCell = mode === 'cell';

    useEffect(() => {
      if (url && (!props.options || props.options.length === 0)) {
          setLoading(true);
          const fetchMethod = public_back ? server.api_public.listar : server.api.listar;

          fetchMethod<any>(url, filterParams)
              .then(res => {
                  const lista = res || [];
                  setData(lista);

                  if (filterFn && lista.length > 0) {
                    const itemAlvo = lista.find(filterFn);
                    if (itemAlvo) {
                        const id = itemAlvo[props.optionValue || 'id'];
                        onChange?.({ value: id });
                        onObjectChange?.(itemAlvo);
                    }
                  }
              })
              .finally(() => setLoading(false));
      }
    }, [url, JSON.stringify(filterParams)]);

    useEffect(() => {
      setInnerValue(props.value);

      if (onObjectChange) {
        if (!props.value) {
          onObjectChange(null);
        } else if (data.length > 0) {
          const selectedObj = data.find(item => item[props.optionValue || 'id'] === props.value);
          onObjectChange(selectedObj || null);
        } else {
          onObjectChange(null);
        }
      }
    }, [props.value, data, onObjectChange, props.optionValue]);

    const defaultItemTemplate = (option: any) => {
      const labelField = props.optionLabel || "nome"; 
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
            <Dropdown 
              {...props} 
              id={name}
              value={innerValue?? null}
              options={data || []}
              filter={filter}
              showClear={showClear}
              filterPlaceholder="Buscar..."
              emptyFilterMessage="Nenhum registro encontrado"
              itemTemplate={props.itemTemplate || defaultItemTemplate}
              loading={loading}
              optionValue={props.optionValue || "value"}
              optionLabel={props.optionLabel || "name"}
              className={classNames(
                  'w-full border border-gray-500 rounded-lg outline-none transition-all duration-200 text-lg', 
                  props.className, 
                  { 'p-invalid border-red-500': errorMessage })} 
              onChange={(e) => {
                setInnerValue(e.value);
                onChange?.(e); 
                if (onObjectChange) {
                    const selectedObj = data.find(item => item[props.optionValue || 'id'] === e.value);
                    onObjectChange(selectedObj || null);
                }
              }}
            />

            {isCell && (
              <label 
                className="text-gray-500 transition-all duration-200 text-lg"
                htmlFor={name}
                style={{ left: '1rem' }}
              >
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
          </FloatLabel>

          <style>{`
            /* Ajuste do container do Dropdown para alinhar com seu InputText */
            .custom-app-select-float-label .p-dropdown {
              padding: 0.10rem 0 !important;
            }

            .custom-app-select-float-label .p-inputtext {
                padding: 0.10rem 0 !important;
              }

            .custom-app-select-float-label .p-dropdown-label {
              padding-left: 1rem !important;
              display: flex;
              align-items: center;
            }

            /* Estilização da Label Flutuante (Sincronizada com seu AppInputText) */
            .ccustom-app-select-float-label .p-dropdown:focus-within ~ label,
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

            /* Centralização da label quando em repouso */
            .custom-app-select-float-label label {
              top: 53% !important;
              transform: translateY(-25%) !important;
            }

            /* Remove sombras de foco padrão do PrimeReact para usar as suas */
            .p-dropdown:not(.p-disabled).p-focus {
              box-shadow: 0 0 0 2px rgba(55, 65, 81, 0.2);
              border-color: #374151 !important;
            }

            @media screen and (max-width: 767px) {
              /* 1. Removemos qualquer transição de movimento para evitar o 'salto' */
              .p-connected-overlay-enter {
                  opacity: 0 !important;
                  transform: none !important;
              }
          
              /* 2. Forçamos a posição ANTES mesmo da animação terminar */
              .p-dropdown-panel {
                  left: 4vw !important;
                  width: 92vw !important;
                  min-width: 92vw !important;
                  /* Evita que o transform-origin do JS desloque o componente */
                  transform-origin: center top !important; 
                  transition: none !important; /* Remove o deslize visual */
              }
          
              /* 3. Ajuste para o Safari não tentar 'adivinhar' a largura */
              .p-dropdown-items-wrapper {
                  width: 100% !important;
              }
            }
          `}</style>
        </FieldWrapper>
  );
};