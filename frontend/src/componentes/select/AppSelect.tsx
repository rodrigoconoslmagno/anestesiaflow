import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Dropdown, type DropdownProps } from 'primereact/dropdown';
import { classNames } from 'primereact/utils';
import { FieldWrapper } from '@/componentes/FieldWrapper';
import { type ColSpan, getColSpanClass } from '@/utils/GridUtils';
import { FloatLabel } from 'primereact/floatlabel';
import { useEffect, useState } from 'react';
import { server } from '@/api/server';

interface AppSelectProps<T extends FieldValues> extends Omit<DropdownProps, 'value' | 'onChange'> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  url?: string;         // A URL base da entidade (ex: '/medicos')
  filterParams?: any;   // Filtros adicionais para o body do POST
  options?: any[];      // Possibilidade de passar options estáticos
  colSpan?: ColSpan;
  required?: boolean;
  onObjectChange?: (obj: any | null | undefined) => void;
}

export const AppSelect = <T extends FieldValues>({ 
  name, 
  control, 
  label, 
  url,
  filterParams = null, // Default: busca apenas ativos
  colSpan = 12, 
  required,
  onObjectChange,
  ...props }: AppSelectProps<T>) => {

    const [data, setData] = useState<any[]>(props.options || []);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Só dispara a busca se houver uma URL e não houver options manuais
        if (url && (!props.options || props.options.length === 0)) {
            setLoading(true);
            
            // Utilizando seu método listar que faz POST
            server.api.listar<any>(url, filterParams)
            .then(res => {
                setData(res);
            })
            .catch(err => {
                console.error(`Erro ao carregar dados de ${url}:`, err);
            })
            .finally(() => setLoading(false));
        }
     }, [url, JSON.stringify(filterParams)]); // Recarrega se a URL ou filtros mudarem


  // Template para os 25 médicos: Nome em destaque + CRM/Especialidade discreto
  const defaultItemTemplate = (option: any) => (
    <div className="flex flex-col py-1">
      <span className="font-semibold text-gray-800 leading-tight">{option.nome}</span>
    </div>
  );

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {

      // Efeito para sincronizar o objeto quando o valor do formulário muda externamente (ex: Reset)
      useEffect(() => {
        if (onObjectChange) {
          if (!field.value) {
            onObjectChange(null);
          } else if (data.length > 0) {
            const selectedObj = data.find(item => item[props.optionValue || 'id'] === field.value);
            if (selectedObj) {
              onObjectChange(selectedObj);
            }
          } else {
            onObjectChange(null);
          }
        }
      }, [field.value, data]);

        return (
        <FieldWrapper 
          label=""
          error={error?.message} 
          className={getColSpanClass(colSpan)}
        >
          <FloatLabel className="custom-app-select-float-label">
            <Dropdown 
              {...field} 
              {...props} 
              id={name}
              value={field.value?? null}
              options={data || []} // Garante que options seja sempre um array
              filter
              showClear
              filterPlaceholder="Buscar..."
              emptyFilterMessage="Nenhum registro encontrado"
              itemTemplate={props.itemTemplate || defaultItemTemplate}
              className={classNames(
                  'w-full border border-gray-500 rounded-lg outline-none transition-all duration-200 text-lg', 
                  props.className, 
                  { 'p-invalid border-red-500': error })} 
              onChange={(e) => {
                // 1. Atualiza o react-hook-form (com o ID)
               // 1. Atualiza o react-hook-form
                const valorParaForm = e.value ?? null;
                field.onChange(valorParaForm);

                // 2. Notifica o pai
                if (onObjectChange) {
                  const selectedObj = data.find(item => item[props.optionValue || 'id'] === e.value);
                  onObjectChange(selectedObj || null);
                }
              }}
              onHide={() => {
                if (field.value === null || field.value === undefined) {
                    // Garante que o estado visual de "aberto" não permaneça
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
      }}
    />
  );
};