import { classNames } from 'primereact/utils';
import { FieldWrapper } from '@/componentes/FieldWrapper';
import { type ColSpan, getColSpanClass } from '@/utils/GridUtils';
import { useWatch, type Control, type FieldValues, type Path } from 'react-hook-form';

interface AppLabelProps<T extends FieldValues> {
  label: string;
  value?: string | number | undefined | null;
  colSpan?: ColSpan;
  className?: string;
  name?: Path<T>;
  control?: Control<T>;
}

export const AppLabel = <T extends FieldValues>({ 
    label, 
    colSpan = 12, 
    className,
    name,
    control,
    value: valueProp
}: AppLabelProps<T>) => {
    const formValue = name && control ? useWatch({ control, name }) : undefined;
    const displayValue = formValue ?? valueProp;

  return (
    <FieldWrapper 
      label="" 
      className={classNames(getColSpanClass(colSpan), "flex flex-col")}
    >
      <div className="custom-app-label-container relative">
        {/* Label superior simulando o FloatLabel flutuando */}
        <label className="absolute left-1 bg-white px-2 text-gray-700 text-lg font-bold z-10">
          {label}
        </label>
        
        {/* Área de conteúdo que simula o design do InputText */}
        <div className={classNames(
         'w-full !p-1 !pl-4 border border-gray-500 rounded-lg outline-none transition-all duration-200 text-lg', 
          className
        )}>
          <span className="text-gray-900">
            {displayValue || '-'}
          </span>
        </div>
      </div>

      <style>{`
        /* Garante que a borda do container e a label se alinhem como no InputText */
        .custom-app-label-container label {
          transform: translateY(-20%) scale(0.9);
          transition: all 0.2s;
          margin-top: -1.4rem;
        }
      `}</style>
    </FieldWrapper>
  );
};