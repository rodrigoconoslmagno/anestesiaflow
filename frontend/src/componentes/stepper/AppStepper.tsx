import { Stepper } from 'primereact/stepper';
import { StepperPanel } from 'primereact/stepperpanel';
import { FieldWrapper } from '@/componentes/FieldWrapper';
import { getColSpanClass } from '@/utils/GridUtils';
import { useState } from 'react';
import { useAppToast } from '@/context/ToastContext';
import { AppEscalaSemanal } from '@/componentes/escala/AppEscalaSemanal';
import { useWatch, type Control } from 'react-hook-form';
import type { EscalaSemana } from '@/types/escala';
import { AppEscalaDiaria } from '@/componentes/escala/AppEscalaDiaria';

interface AppStepperProps {
    control: Control<EscalaSemana>;
}

export const AppStepperEscala = ({
    control
}: AppStepperProps) => {
    // 1. Observa a data e o médico "ao vivo"
    const [ dataNavegacao, setDataNavegacao] = useState<Date | null>(null);
    const [activeStep, setActiveStep] = useState(0);
    const medicoId = useWatch({ control, name: 'medicoId' });

    // const [ diaAtual, setDiaAtual ] = useState<any>();
    const { showError } = useAppToast();

    // Regra de negócio: pode navegar se tiver médico OU se estiver voltando para o Resumo (step 0)
    const podeNavegar = (targetStep: number) => {
        if (targetStep === 0) return true; // Sempre pode voltar para o resumo
        return !!medicoId; // Só vai para o 1 ou 2 se tiver médico
    };

    const handleIrParaDia = (data: Date) => {
        if (podeNavegar(1)) {
            setDataNavegacao(data);
            setActiveStep(1);
        }
    };

    const handleStepChange = (e: {index: number}) => {
        if (!podeNavegar(e.index)) {
            showError('Atenção', 'Selecione um médico antes de acessar a escala detalhada.');
            setActiveStep(0);
        } else {
            if (e.index === 0) {
                setDataNavegacao(null);
            }
            setActiveStep(e.index);
        }
    }

    return (
        /* O segredo para ocupar a tela toda no CrudBase é o col-span-12 */
        <FieldWrapper label="" className={getColSpanClass(12)}>
            <Stepper activeStep={activeStep} 
                     onChangeStep={handleStepChange} 
                     //  linear //porperty que desabilita a navegacao pelo titulo do step
                     // Força os containers internos do Stepper a ocuparem a altura toda
                     pt={{
                        root: { className: 'p-0 flex-1 flex flex-col' }, // Remove o padding do p-stepper-content
                        panelContainer: { className: 'p-0 flex-1 flex flex-col' } // Remove o padding do container de painéis
                    }}
                     className="flex-1 flex flex-col min-h-[400px]"
                    
            >
                <StepperPanel header="Resumo">
                    <div className="w-full">
                        <div className="flex-1 w-full h-full min-h-[400px]">
                            <AppEscalaSemanal control={control} onAgendar={handleIrParaDia}/>
                        </div>
                    </div>
                </StepperPanel>

                <StepperPanel header="Horários"
                    pt={{
                        header: {
                            style: !medicoId ? { pointerEvents: 'none', cursor: 'not-allowed' } : {}
                        }
                    }}
                >
                    <div className="h-full">
                        <AppEscalaDiaria control={control} dataAtivaExterno={dataNavegacao}/>
                    </div>
                </StepperPanel>
            </Stepper>
        </FieldWrapper>
    );
};