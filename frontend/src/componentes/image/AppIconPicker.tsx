import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { classNames } from 'primereact/utils';
import { FieldWrapper } from '@/componentes/FieldWrapper';
import { type ColSpan, getColSpanClass } from '@/utils/GridUtils';
import { useEffect, useRef, useState } from 'react';

interface AppIconPickerProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  description?: string;
  colSpan?: ColSpan;
  required?: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

export const AppIconPicker = <T extends FieldValues>({
  name,
  control,
  label,
  description,
  colSpan = 12,
  required,
  maxWidth = 32,
  maxHeight = 32
}: AppIconPickerProps<T>) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const processImage = (file: File): Promise<{ data: Uint8Array; width: number; height: number } | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = maxWidth;
          canvas.height = maxHeight;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            resolve(null);
            return;
          }

          ctx.drawImage(img, 0, 0, maxWidth, maxHeight);
          
          canvas.toBlob((blob) => {
            if (!blob) {
              resolve(null);
              return;
            }
            blob.arrayBuffer().then((buffer) => {
              resolve({
                data: new Uint8Array(buffer),
                width: img.width,
                height: img.height
              });
            });
          }, 'image/png');
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        
      // useEffect dentro do render para ter acesso ao field.value
      useEffect(() => {
        if (field.value) {
          if (typeof field.value === 'string' && field.value.length > 0) {
            // Se vier do banco como String/Base64
            const src = field.value.startsWith('data:') ? field.value : `data:image/png;base64,${field.value}`;
            setPreview(src);
          } else if (Array.isArray(field.value) && field.value.length > 0) {
            // Se vier como Array de números (o que enviamos para o Spring)
            const blob = new Blob([new Uint8Array(field.value)], { type: 'image/png' });
            const url = URL.createObjectURL(blob);
            setPreview(url);
            return () => URL.revokeObjectURL(url);
          }
        } else {
          setPreview(null);
        }
      }, [field.value]);

        const handleClear = (e: React.MouseEvent) => {
          e.stopPropagation();
          setPreview(null);
          setLocalError(null);
          field.onChange(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        };

        return (
          <FieldWrapper
            label=""
            error={localError || error?.message}
            className={getColSpanClass(colSpan)}
          >
            <div className={classNames(
              "flex items-center justify-between gap-4 p-1 border rounded-lg transition-all duration-300",
              { 
                "bg-white border-gray-400": !(localError || error), 
                "bg-red-50 border-red-500 shadow-sm": !!(localError || error) 
              }
            )}>
              <div className="flex flex-col px-1">
                <label className="text-sm font-bold text-gray-700 cursor-pointer flex items-center gap-2">
                  {label}
                  {required && <span className="text-red-500">*</span>}
                </label>
                {description && (
                  <span className="text-xs text-gray-500 leading-tight mt-0.5">
                    {description}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 pr-1">
                {/* Preview centralizado */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={classNames(
                    "w-[28px] h-[28px] rounded-full border border-dashed border-gray-400 flex items-center justify-center cursor-pointer overflow-hidden bg-gray-100 transition-all hover:border-blue-400",
                    { "border-solid border-blue-600 ring-4 ring-blue-50": preview && !(localError || error) }
                  )}
                >
                  {preview && !(localError || error) ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <i className="pi pi-image text-gray-400 text-xs" />
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const result = await processImage(file);
                    if (!result) return;

                    if (result.width > maxWidth || result.height > maxHeight) {
                      setLocalError(`Máximo: ${maxWidth}x${maxHeight}px`);
                      setPreview(null);
                      field.onChange(null);
                    } else {
                      setLocalError(null);
                      setPreview(URL.createObjectURL(file));
                      field.onChange(Array.from(result.data));
                    }
                  }}
                />
                
                {/* Ações agrupadas à direita */}
                <div className="flex items-center gap-1.5">
                  {(preview || localError) && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="p-0 text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-90"
                      title="Remover imagem"
                    >
                      <i className="pi pi-trash text-md" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </FieldWrapper>
        );
      }}
    />
  );
};