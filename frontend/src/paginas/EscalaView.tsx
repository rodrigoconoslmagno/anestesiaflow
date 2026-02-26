import { CrudBase } from '@/componentes/crud/CrudBase';
import { AppSelectForm } from '@/componentes/select/AppSelectForm';
import { AppStepperEscala } from '@/componentes/stepper/AppStepper';
import { escalaSemanaSchema, type EscalaSemana } from '@/types/escala';
import type { Medico } from '@/types/medico';
import { DateUtils } from '@/utils/DateUtils';

export const EscalaView = () => {

    // 1. Criamos uma Ref para manter o rastro do médico "ao vivo"
    const RESOURCE_PATH = '/escala';

    // Template para o médico
    const medicoTemplate = (option: Medico) => {
        if (!option) return "Selecione um médico";
        return option.sigla ? `${option.nome} - ${option.sigla}` : option.nome;
    };

    return (
        <CrudBase<EscalaSemana>
            title="Escala"
            // filterContent={<p>Teste de Filtro</p>}
            resourcePath={RESOURCE_PATH}
            schema={escalaSemanaSchema}
            defaultValues={{ 
                medicoId: undefined,
                escala: [],
                dataInicio: undefined
            }}
            columns={[
                { field: 'medicoNome',
                  header: 'Médico',
                    body: (rowData) => (
                        <span>
                            {rowData.medicoNome} - {rowData.medicoSigla}
                        </span>
                    )
                },
                { field: 'dataInicio', header: 'Semana',
                    body: (rowData) => DateUtils.formatarParaBR(rowData.dataInicio) + " - " + 
                                        DateUtils.formatarParaBR(rowData.dataFim) 
                }
            ]}
        >
            {(control ) => {
                return (<>
                    <AppSelectForm
                        name='medicoId'
                        label='Médico'
                        url="/medico"
                        control={control}
                        filterParams={{ ativo: true }}
                        optionLabel="nome"
                        optionValue="id"
                        valueTemplate={medicoTemplate}
                        itemTemplate={medicoTemplate}
                        colSpan={12}
                    />

                    {/* <AppFileUpload 
                        label='Selecione uma planilha'
                        url={RESOURCE_PATH + '/upload'}
                        colSpan={6}
                    /> */}

                    <AppStepperEscala 
                        control={control}
                    />
                </>
            )}
        }
        </CrudBase>  
    )
} 