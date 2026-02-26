import { Dropdown, type DropdownProps } from 'primereact/dropdown';
import { classNames } from 'primereact/utils';
import { FieldWrapper } from '@/componentes/FieldWrapper';
import { type ColSpan, getColSpanClass } from '@/utils/GridUtils';
import { FloatLabel } from 'primereact/floatlabel';
import { useEffect, useState } from 'react';
import { server } from '@/api/server';

export interface AppSelectProps extends Omit<DropdownProps, 'onChange'> {
  name: string;
  label: string;
  url?: string;         // A URL base da entidade (ex: '/medicos')
  filterParams?: any;   // Filtros adicionais para o body do POST
  options?: any[];      // Possibilidade de passar options estáticos
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
  filterParams = null, // Default: busca apenas ativos
  colSpan = 12, 
  required,
  public_back,
  errorMessage,
  onObjectChange,
  filterFn,
  onChange,
  value,
  ...props }: AppSelectProps) => {

    const [data, setData] = useState<any[]>(props.options || []);
    const [loading, setLoading] = useState(false);

    // 1. Lógica de Busca e Auto-seleção (filterFn)
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

    // 2. Lógica de Sincronização do Objeto (onObjectChange)
    // Funciona tanto para o useState local quanto para o field.value do Form
    useEffect(() => {
      if (onObjectChange) {
        if (!value) {
          onObjectChange(null);
        } else if (data.length > 0) {
          const selectedObj = data.find(item => item[props.optionValue || 'id'] === value);
          onObjectChange(selectedObj || null);
        } else {
          onObjectChange(null);
        }
      }
    }, [value, data, onObjectChange, props.optionValue]);

    // Template para os 25 médicos: Nome em destaque + CRM/Especialidade discreto
    const defaultItemTemplate = (option: any) => (
      <div className="flex flex-col py-1">
        <span className="font-semibold text-gray-800 leading-tight">{option.nome}</span>
      </div>
    );

  return (
        <FieldWrapper 
          label=""
          error={errorMessage} 
          className={getColSpanClass(colSpan)}
        >
          <FloatLabel className="custom-app-select-float-label">
            <Dropdown 
              {...props} 
              id={name}
              value={value?? null}
              options={data || []} // Garante que options seja sempre um array
              filter
              showClear
              filterPlaceholder="Buscar..."
              emptyFilterMessage="Nenhum registro encontrado"
              itemTemplate={props.itemTemplate || defaultItemTemplate}
              loading={loading}
              className={classNames(
                  'w-full border border-gray-500 rounded-lg outline-none transition-all duration-200 text-lg', 
                  props.className, 
                  { 'p-invalid border-red-500': errorMessage })} 
              onChange={(e) => {
                // Notifica o pai (EscalaMedicoView) sobre a mudança
                onChange?.(e); 
                
                // Se houver lógica de objeto, executa também
                if (onObjectChange) {
                    const selectedObj = data.find(item => item[props.optionValue || 'id'] === e.value);
                    onObjectChange(selectedObj || null);
                }
              }}
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
          `}</style>
        </FieldWrapper>
  );
};