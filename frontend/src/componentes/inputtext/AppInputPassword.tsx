import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Password, type PasswordProps } from 'primereact/password';
import { classNames } from 'primereact/utils';
import { FieldWrapper } from '@/componentes/FieldWrapper';
import { type ColSpan, getColSpanClass } from '@/utils/GridUtils';
import { FloatLabel } from 'primereact/floatlabel';

interface AppInputPasswordProps<T extends FieldValues> extends PasswordProps {
  name: Path<T>;
  control: Control<T>;
  label: string;
  colSpan?: ColSpan;
  required?: boolean;
}

export const AppInputPassword = <T extends FieldValues>({ 
  name, 
  control, 
  label, 
  colSpan = 12, 
  required,
  ...props 
}: AppInputPasswordProps<T>) => (
  <Controller
    name={name}
    control={control}
    render={({ field, fieldState: { error } }) => (
      <FieldWrapper 
        label=""
        error={error?.message} 
        className={getColSpanClass(colSpan)}
      >
        <FloatLabel className="custom-password-float-label">
          <Password 
            {...field} 
            {...props} 
            id={name}
            value={field.value ?? ''}
            toggleMask // Habilita o ícone de mostrar/esconder senha
            feedback={props.feedback ?? false} // Desabilita a barra de força por padrão
            promptLabel="Digite a senha"
            weakLabel="Fraca"
            mediumLabel="Média"
            strongLabel="Forte"
            autoComplete="new-password"
            className="w-full"
            inputClassName={classNames(
              'w-full !p-1 !pl-1 border border-gray-500 rounded-lg outline-none transition-all duration-200 text-lg', 
              props.inputClassName, 
              { 'p-invalid border-red-500': error }
            )} 
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

        {/* Reutilizamos o estilo CSS do AppInputText para manter a consistência */}
        <style>{`

            .custom-password-float-label .p-inputwrapper-focus ~ label,
            .custom-password-float-label .p-inputwrapper-filled ~ label,
            .custom-password-float-label .p-filled ~ label,
            .custom-password-float-label input:focus ~ label {
                font-weight: 700 !important;
                font-size: 1.125rem !important;
                color: #374151 !important;
                background: white; /* Cria o efeito de "cortar" a borda */
                padding: 0 8px !important;
                /* Reposiciona para o centro exato da borda superior */
                transform: translateY(-70%) scale(0.9) !important;
                top: 0 !important;
                left: 0px !important;
            }

            .custom-password-float-label label {
                top: 72% !important;
                transform: translateY(-50%) !important;
            }

            .custom-password-float-label .p-inputtext {
              padding-right: 1rem !important; /* Garante que o lado direito seja igual ao esquerdo */
              padding-inline-start: 1rem !important;
              background-image: none !important; /* Remove ícones de fundo injetados */
            }

            /* Remove ícones nativos de 'limpar' ou 'usuário' do Chrome/Edge */
            .custom-password-float-label  input::-webkit-contacts-auto-fill-button,
            .custom-password-float-label  input::-webkit-credentials-auto-fill-button {
                visibility: hidden;
                display: none !important;
                pointer-events: none;
            }
        
            /* 3. Posicionando o Ícone (SVG ou Button) */
            /* Atacamos o ícone diretamente e qualquer container de toggle do Prime */
            .custom-password-float-label .p-password-show-icon,
            .custom-password-float-label .p-password-hide-icon,
            .custom-password-float-label .p-password-toggle-icon,
            .custom-password-float-label [data-pc-section="showicon"],
            .custom-password-float-label [data-pc-section="hideicon"] {
                position: absolute !important;
                right: -0.5rem !important; /* Move para a direita */
                top: 50% !important;
                transform: translateY(-5%) !important;
                cursor: pointer !important;
                color: #6b7280 !important;
                z-index: 10 !important;
                width: 18px !important; /* Ajuste leve de tamanho se necessário */
                height: 18px !important;
            }

            /* 4. Garantir que a label flutue sem ser bloqueada pelo ícone */
            .custom-password-float-label .p-password input:focus ~ label,
            .custom-password-float-label .p-password input.p-filled ~ label {
                transform: translateY(-115%) scale(0.85) !important;
                background: white !important;
                padding: 0 6px !important;
                font-weight: 700 !important;
                color: #374151 !important;
                left: 0.8rem !important;
                top: 0 !important;
                z-index: 20 !important;
            }
        `}</style>
      </FieldWrapper>
    )}
  />
);