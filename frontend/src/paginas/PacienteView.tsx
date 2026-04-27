import { server } from '@/api/server';
import { AppCameraInput } from '@/componentes/camera/AppCameraCapture';
import { CrudBase } from '@/componentes/crud/CrudBase';
import { AppCalendar } from '@/componentes/datetime/AppCalendar';
import { AppInputText } from '@/componentes/inputtext/AppInputText';
import { AppSelect } from '@/componentes/select/AppSelect';
import { AppSelectForm } from '@/componentes/select/AppSelectForm';
import { AppSwitchForm } from '@/componentes/switch/AppSwitchForm';
import { CellEditor } from '@/componentes/table/CellEditor';
import { Recurso } from '@/permissoes/recurso';
import type { Medico } from '@/types/medico';
import { pacienteSchema, type Paciente } from '@/types/paciente';
import { DateUtils } from '@/utils/DateUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import { useAppToast } from '@/context/ToastContext';

const ProcedimentosTable = ({ control }: { control: any }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: "procedimentos"
    });

    const medicoTemplate = (option: Medico) => {
        if (!option) {
            return "Selecione um médico";
        }
        return option.sigla ? `${option.nome} - ${option.sigla}` : option.nome;
    };

    return (
        <div className="flex flex-col gap-1.5 mb-2 w-full col-span-12">
            <div className="flex justify-between align-items-center mb-3">
                <span className="text-xl font-bold">Procedimentos</span>
                <Button 
                    type="button" 
                    icon="pi pi-plus" 
                    label="Adicionar" 
                    className='bg-blue-600 text-white border-none shadow-md h-8 px-6 justify-betwenn items-center'
                    onClick={() => append({ medicoId: null, dataProcedimento: new Date() })} 
                />
            </div>
            <DataTable 
                value={fields} 
                editMode="row"
                className="w-full shadow-sm border-round border-1 border-200 p-datatable-sm [&_.p-datatable-tbody>tr>td]:!p-0"
                responsiveLayout="scroll"
                emptyMessage="Nenhum procedimento registrado."
                rowClassName={() => 'm-0 p-0'}
                scrollable
                scrollHeight="400px"
            >
                <Column header="Médico" body={(_, { rowIndex }) => (
                    <CellEditor>
                        <AppSelectForm 
                            label=''
                            name={`procedimentos.${rowIndex}.medicoId`} 
                            control={control} 
                            url="/medico" 
                            filterParams={{ ativo: true }}
                            optionLabel="nome"
                            optionValue="id"
                            valueTemplate={medicoTemplate}
                            itemTemplate={medicoTemplate}
                        />
                    </CellEditor>
                )} />
                <Column header="Cirurgião" 
                    style={{ width: '19rem', minWidth: '19rem' }}
                    body={(_, { rowIndex }) => (
                    <CellEditor>
                        <AppInputText
                            name={`procedimentos.${rowIndex}.cirurgiao`} 
                            label="" 
                            control={control} 
                            maxLength={60}
                        />
                    </CellEditor>
                )} />
                <Column header="Procedimento" 
                    style={{ width: '19rem', minWidth: '19rem' }}
                    body={(_, { rowIndex }) => (
                    <CellEditor>
                        <AppInputText
                            name={`procedimentos.${rowIndex}.procedimento`} 
                            label="" 
                            control={control} 
                            maxLength={60}
                        />
                    </CellEditor>
                )} />
                <Column header="Data" 
                    style={{ width: '10.5rem', minWidth: '10.5rem' }}
                    body={(_, { rowIndex }) => (
                    <CellEditor>
                        <AppCalendar
                            name={`procedimentos.${rowIndex}.dataProcedimento`} 
                            label=''
                            control={control}
                        />
                    </CellEditor>
                )} />
                <Column body={(_, { rowIndex }) => (
                    <Button 
                        icon="pi pi-trash" 
                        className="p-button-danger p-button-text text-red-600" 
                        onClick={() => remove(rowIndex)} />
                )} />
            </DataTable>
        </div>
    );
};

export const PacienteView = () => {
    const [ loadingIA, setLoadingIA ] = useState(false);
    const [ cameraVisible, setCameraVisible ] = useState(false);
    const [ medicoId, setMedicoId ] =  useState<Number | undefined>(undefined);
    const [ selectedFile, setSelectedFile ] = useState<File | null>(null);
    const { showError } = useAppToast();
    const [ loadData, setLoadData ] = useState<(() => Promise<void>) | null>(null);

    const handleCapture = async (file: File) => {
        try {
            setLoadingIA(true);
            await server.api.upload('/paciente/decode', 
                        [{key: "medicoId", value: String(medicoId)}], file, 'file');

            if (loadData) {
               await loadData();
            }

            setCameraVisible(false);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || "Ocorreu um erro inesperado ao excluir.";
            console.log("Erro processar imagem", err)
            showError("Importação de paciente", errorMessage);
        } finally {
          setLoadingIA(false);
        }
    };

    const handleExecute = () => {
        console.log("click execute", medicoId, selectedFile)
        if (selectedFile && medicoId) {
            handleCapture(selectedFile);
        }
    };

    const medicoTemplate = (option: Medico) => {
        if (!option) {
            return "Selecione um médico";
        }
        return option.sigla ? `${option.nome} - ${option.sigla}` : option.nome;
    };

    return (
        <>
            <CrudBase<Paciente>
                title="Paciente"
                recurso={Recurso.MEDICO}
                // filterContent={<p>Teste de Filtro</p>}
                resourcePath='/paciente'
                schema={pacienteSchema}
                getMethodLoadData={param => {
                    if (!loadData) {
                        setLoadData(() => param)
                    }
                }}
                defaultValues={{ 
                    nome: '', 
                    ativo: true
                }}
                extraActions={
                    <Button 
                        icon="pi pi-sparkles" 
                        className="md:flex bg-blue-600 text-white border-none shadow-md rounded-full md:rounded-md w-12 h-12 md:w-auto md:h-11 md:px-6 justify-center"
                        onClick={() => setCameraVisible(true)}
                    >
                        <span className="md:hidden"></span>
                        <span className="hidden md:inline pl-3">Scanear procedimento</span>
                    </Button>
                }
                columns={[
                { field: 'nome', header: 'Nome' },
                { field: 'dataProcedimento', header: 'Procedimento',
                    body: (rowData) => DateUtils.formatarParaBR(rowData.dataProcedimento)
                },
                { 
                    field: 'ativo', 
                    header: 'Status', 
                    body: (row: { ativo: any; }) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {row.ativo ? 'ATIVO' : 'INATIVO'}
                    </span>
                    )
                }
                ]}
            >
                {(control) => {
                    return (
                    <>
                        <AppInputText
                            name="nome"
                            label="Nome" 
                            control={control} 
                            colSpan={9} 
                            maxLength={60}
                            required
                        />

                        <AppSwitchForm
                            name="ativo"
                            label="Situação"
                            control={control}
                            colSpan={3}
                            labelOn='Ativo'
                            labelOff='Inativo'
                        />

                        <ProcedimentosTable control={control} />
                    </>
                    )
                }}
            </CrudBase>  

            <Dialog 
                header="Dados procedimento" 
                visible={cameraVisible} 
                onHide={() =>{
                    setCameraVisible(false)
                    setMedicoId(undefined)
                    setSelectedFile(null)
                }} 
                onShow={() => {
                    setMedicoId(undefined)
                    setSelectedFile(null)
                }}
                style={{ width: '450px' }}
                footer={
                    <div className="flex gap-2 justify-between items-center">
                        <Button 
                            label="Cancelar" 
                            icon="pi pi-ban" 
                            onClick={() => setCameraVisible(false)} 
                            className="p-button-outlined p-button-text shadow-md border-none p-2" />
                        <Button 
                            label="Processar" 
                            icon="pi pi-bolt" 
                            disabled={!selectedFile || !medicoId || loadingIA} 
                            onClick={handleExecute}
                            className="p-button-outlined p-button-text shadow-md bg-blue-600 border-none text-white p-2"
                        />
                    </div>
                }
            >
                <div className="flex flex-col gap-4">
                    {/* Seleção do Médico */}
                    <div className="flex flex-col gap-2">
                        <label className="font-bold text-sm">Médico Responsável</label>
                        <AppSelect
                            label='Médico'
                            name='medicoId'
                            value={medicoId}
                            onChange={(e) => setMedicoId(e.value)}    
                            url="/medico"
                            placeholder="Selecione o médico para o filtro da agenda"
                            valueTemplate={medicoTemplate}
                            itemTemplate={medicoTemplate}
                            optionLabel="nome"
                            optionValue="id"
                        />
                    </div>

                    {/* Componente de Câmera "Cru" */}
                    <div className="flex flex-col gap-2">
                        <label className="font-bold text-sm">Captura da Agenda/Etiqueta</label>
                        <AppCameraInput 
                            onPhotoTaken={(file) => setSelectedFile(file)}
                            loading={loadingIA}
                        />
                    </div>
                </div>
            </Dialog>
        </>
    )
}