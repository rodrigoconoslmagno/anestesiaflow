import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { ColorPicker, type ColorPickerChangeEvent } from 'primereact/colorpicker';
import { classNames } from 'primereact/utils';
import { FieldWrapper } from '@/componentes/FieldWrapper';
import { type ColSpan, getColSpanClass } from '@/utils/GridUtils';

interface AppColorPickerProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  colSpan?: ColSpan;
  required?: boolean;
  shape?: 'circle' | 'rectangle';
}

export const AppColorPicker = <T extends FieldValues>({
  name,
  control,
  label,
  colSpan = 12,
  required,
  shape = 'rectangle'
}: AppColorPickerProps<T>) => (
  <Controller
    name={name}
    control={control}
    render={({ field, fieldState: { error } }) => {
      const hasValue = !!field.value;
      const colorValue = hasValue ? (field.value.startsWith('#') ? field.value : `#${field.value}`) : 'transparent';

      return (
        <FieldWrapper
          label=""
          error={error?.message}
          className={getColSpanClass(colSpan)}
        >
          <div className={classNames(
            "flex items-center justify-between gap-4 p-[4.5px] border rounded-lg transition-all duration-300",
            { 
              "bg-white border-gray-400": !error, 
              "bg-red-50 border-red-500 shadow-sm": !!error 
            }
          )}>
            <div className="flex flex-col px-1">
              <label htmlFor={name} className="text-sm font-bold text-gray-700 cursor-pointer flex items-center gap-2">
                {label}
                {required && <span className="text-red-500">*</span>}
                
                {/* Texto de instrução que some quando selecionado */}
                {!hasValue && (
                  <span className="text-xs font-normal text-gray-400 italic">
                    Selecione uma cor
                  </span>
                )}
              </label>
            </div>

            <div className="flex items-center gap-3 ">
              {/* O próprio ícone/retângulo é o gatilho para o seletor */}
              <div className="relative flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
                <ColorPicker
                  id={name}
                  value={field.value || 'ffffff'}
                  onChange={(e: ColorPickerChangeEvent) => field.onChange(e.value)}
                  className="custom-picker-trigger"
                />
                
                {/* Overlay visual: Borda de segurança para cores claras */}
                <div 
                  className={classNames(
                    "absolute inset-0 pointer-events-none border flex items-center justify-center transition-all",
                    {
                      "rounded-full": shape === 'circle',
                      "rounded-md": shape === 'rectangle',
                      "border-gray-300 shadow-sm": hasValue, // Borda para cores claras
                      "border-dashed border-gray-400 bg-gray-50": !hasValue
                    }
                  )}
                  style={{ 
                    backgroundColor: colorValue,
                    width: shape === 'circle' ? '27px' : '48px',
                    height: shape === 'circle' ? '27px' : '28px'
                  }}
                >
                  {!hasValue && (
                    <i className="pi pi-palette text-gray-400 text-[16px]" />
                  )}
                </div>
              </div>

              {/* Apenas o botão de excluir permanece */}
              {hasValue && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    field.onChange(null);
                  }}
                  className="p-[1.5px] text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-90"
                  title="Remover cor"
                >
                  <i className="pi pi-trash text-sm" />
                </button>
              )}
            </div>
          </div>

          <style>{`
            /* Garante que a área clicável do PrimeReact cubra exatamente o nosso overlay */
            .custom-picker-trigger .p-colorpicker-preview {
              width: ${shape === 'circle' ? '27px' : '48px'} !important;
              height: ${shape === 'circle' ? '27px' : '28px'} !important;
              opacity: 0 !important;
              cursor: pointer;
            }
            .custom-picker-trigger .p-inputtext {
              padding-left: 2rem !important;
            }
          `}</style>
        </FieldWrapper>
      );
    }}
  />
);