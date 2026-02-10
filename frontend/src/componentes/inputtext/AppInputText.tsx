import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'; // Importa ambos corretamente
import { InputText, type InputTextProps } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { FieldWrapper } from '@/componentes/FieldWrapper';
import { type ColSpan, getColSpanClass } from '@/utils/GridUtils';
import { FloatLabel } from 'primereact/floatlabel';

interface AppInputTextProps<T extends FieldValues> extends InputTextProps {
  name: Path<T>;
  control: Control<T>;
  label: string;
  colSpan?: ColSpan;
  required?: boolean;
}

export const AppInputText = <T extends FieldValues>({ 
          name, 
          control, 
          label, 
          colSpan = 12, 
          required,
          ...props }: AppInputTextProps<T>) => (
  <Controller
    name={name}
    control={control}
    render={({ field, fieldState: { error } }) => (
      <FieldWrapper 
        label=""
        error={error?.message} 
        className={getColSpanClass(colSpan)}
      >
        <FloatLabel className="custom-app-float-label">
          <InputText 
            {...field} 
            {...props} 
            id={name}
            value={field.value ?? ''}
            autoComplete="off"
            data-lpignore="true"
            className={classNames(
                'w-full !p-1 !pl-1 border border-gray-500 rounded-lg outline-none transition-all duration-200 text-lg', 
                props.className, 
                { 'p-invalid border-red-500': error })} 
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
          /* Forçamos o reset do padding diretamente na classe do PrimeReact */
          .custom-app-float-label .p-inputtext {
            padding-right: 1rem !important; /* Garante que o lado direito seja igual ao esquerdo */
            padding-inline-start: 1rem !important;
            background-image: none !important; /* Remove ícones de fundo injetados */
          }

          /* Remove ícones nativos de 'limpar' ou 'usuário' do Chrome/Edge */
          .custom-app-float-label input::-webkit-contacts-auto-fill-button,
          .custom-app-float-label input::-webkit-credentials-auto-fill-button {
            visibility: hidden;
            display: none !important;
            pointer-events: none;
          }

          /* Ajuste para a label quando flutua */
          .custom-app-float-label input:focus ~ label,
          .custom-app-float-label input.p-filled ~ label {
            font-weight: 700 !important;
            font-size: 1.125rem !important;
            color: #374151 !important;
            background: white; /* Cria o efeito de "cortar" a borda */
            padding: 0 8px !important;
            /* Reposiciona para o centro exato da borda superior */
            transform: translateY(-70%) scale(0.85) !important;
            top: 0 !important;
            left: 0px !important;
          }

          /* Ajuste para a label quando está DENTRO (placeholder) */
          .custom-app-float-label label {
            top: 72% !important;
            transform: translateY(-50%) !important;
          }
        `}</style>
      </FieldWrapper>
    )}
  />
);