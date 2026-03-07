import { CrudBase } from '@/componentes/crud/CrudBase';
import { AppSelect } from '@/componentes/select/AppSelect';
import { AppSelectForm } from '@/componentes/select/AppSelectForm';
import { AppStepperEscala } from '@/componentes/stepper/AppStepper';
import { Recurso } from '@/permissoes/recurso';
import { type EscalaEdicao, escalaEdicaoSchema } from '@/types/escala';
import type { Medico } from '@/types/medico';
import { DateUtils } from '@/utils/DateUtils';
import { useState } from 'react';

export const EscalaView = () => {

    const RESOURCE_PATH = '/escala';

    const [filtroMedicoId, setFiltroMedicoId] = useState<number | undefined>(undefined);
    const [paramsBusca, setParamsBusca] = useState({});

    const handleApply = () => {
        setParamsBusca({ medicoId: filtroMedicoId });
    };

    const handleClear = () => {
        setFiltroMedicoId(undefined);
        setParamsBusca({});
    };

    // Template para o médico
    const medicoTemplate = (option: Medico) => {
        if (!option) return "Selecione um médico";
        return option.sigla ? `${option.nome} - ${option.sigla}` : option.nome;
    };

    return (
        <CrudBase<EscalaEdicao>
            title="Escala"
            recurso={Recurso.ESCALA}
            filterContent={(
                <div className="p-fluid grid grid-cols-12 w-full">
                    <AppSelect
                        className='mb-0 mt-2'
                        name="filtroMedico"
                        label=""
                        url="/medico"
                        value={filtroMedicoId}
                        onChange={(e) => setFiltroMedicoId(e.value)}
                        colSpan={12}
                        showClear
                        filter
                        valueTemplate={medicoTemplate}
                        itemTemplate={medicoTemplate}
                        optionLabel="nome"
                        optionValue="id"
                        placeholder="Todos os médicos"
                    />
                </div>
            )}
            onApplyFilters={handleApply}
            filterParams={paramsBusca}
            onClearFilters={handleClear}
            resourcePath={RESOURCE_PATH}
            schema={escalaEdicaoSchema}
            defaultValues={{ 
                medicoId: undefined,
                semana: []
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
            {(control) => {
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

                    <AppStepperEscala 
                        control={control}
                    />
                </>
            )}
        }
        </CrudBase>  
    )
} 