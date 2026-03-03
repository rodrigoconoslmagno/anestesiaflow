import { Stepper } from 'primereact/stepper';
import { StepperPanel } from 'primereact/stepperpanel';
import { FieldWrapper } from '@/componentes/FieldWrapper';
import { getColSpanClass } from '@/utils/GridUtils';
import { useState } from 'react';
import { useAppToast } from '@/context/ToastContext';
import { useWatch, type Control, type FieldValues, type Path } from 'react-hook-form';
import { AppEscalaDiaria } from '@/componentes/escala/AppEscalaDiaria';
import { AppEscalaSemanal } from '../escala/AppEscalaSemanal';

interface AppStepperProps<T extends FieldValues> {
    control: Control<T>;
}

export const AppStepperEscala = <T extends FieldValues>({
    control
}: AppStepperProps<T>) => {
    const [ dataNavegacao, setDataNavegacao] = useState<Date | null>(null);
    const [activeStep, setActiveStep] = useState(0);
    const medicoId = useWatch({ control, name: 'medicoId' as Path<T>});
    const { showError } = useAppToast();

    const podeNavegar = (targetStep: number) => {
        if (targetStep === 0) return true; 
        return !!medicoId; 
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
        <FieldWrapper label="" className={getColSpanClass(12)}>
            <Stepper activeStep={activeStep} 
                     onChangeStep={handleStepChange} 
                     pt={{
                        root: { className: 'p-0 flex-1 flex flex-col' }, 
                        panelContainer: { className: 'p-0 flex-1 flex flex-col' } 
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
                        <AppEscalaDiaria
                                control={control}
                                dataAtivaExterno={dataNavegacao}
                                medicoId={medicoId}
                            />
                    </div>
                </StepperPanel>
            </Stepper>
        </FieldWrapper>
    );
};