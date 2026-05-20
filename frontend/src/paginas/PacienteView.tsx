import { server } from '@/api/server';
import { AppCameraInput } from '@/componentes/camera/AppCameraCapture';
import { CrudBase } from '@/componentes/crud/CrudBase';
import { AppCalendar } from '@/componentes/datetime/AppCalendar';
import { AppInputText } from '@/componentes/inputtext/AppInputText';
import { AppSelect } from '@/componentes/select/AppSelect';
import { AppSelectForm } from '@/componentes/select/AppSelectForm';
import { AppSwitchForm } from '@/componentes/switch/AppSwitchForm';
import { Recurso } from '@/permissoes/recurso';
import type { Medico } from '@/types/medico';
import { pacienteSchema, type Paciente } from '@/types/paciente';
import { DateUtils } from '@/utils/DateUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { useState } from 'react';
import { useFieldArray, useWatch } from 'react-hook-form';
import { useAppToast } from '@/context/ToastContext';
import type { Estabelecimento } from '@/types/estabelecimento';

const ProcedimentosTable = ({ control, activeIndex, onSelectRow }: { control: any, activeIndex: number, onSelectRow: (index: number) => void }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: "procedimentos",
        keyName: "rowId"
    });

    const [isEditing, setIsEditing] = useState(false);
    const [isNewRecord, setIsNewRecord] = useState(false);

    const watchProcedimentos = useWatch({
        control,
        name: "procedimentos",
        defaultValue: fields
    });

    const onAdd = () => {
        append({ medicoId: null, dataProcedimento: new Date(), cirurgiao: '', procedimento: '' });
        onSelectRow(fields.length); // Foca na nova linha criada
        setIsEditing(true);
        setIsNewRecord(true);
    };

    const onSave = () => {
        setIsEditing(false);
        setIsNewRecord(false);
        onSelectRow(-1);
    };

    const onEditRow = (index: number) => {
        onSelectRow(index);
        setIsEditing(true);
        setIsNewRecord(false);
    };

    const onCancel = () => {
        if (isNewRecord) {
            remove(activeIndex); // Se era novo e cancelou, remove a linha
        }
        setIsEditing(false);
        setIsNewRecord(false);
        onSelectRow(-1);
    };

    const handleDelete = (index: number) => {
        remove(index);
        
        // Ajusta o índice ativo após a remoção para não apontar para o vazio
        if (fields.length <= 0) {
            onSelectRow(-1);
        } else if (activeIndex >= index) {
            // Se deletou o item atual ou um anterior, volta um índice
            onSelectRow(Math.max(0, activeIndex - 1));
        }   
    };

    const medicoTemplate = (option: Medico) => {
        if (!option) {
            return "Selecione um médico";
        }
        return option.sigla ? `${option.nome} - ${option.sigla}` : option.nome;
    };

    const getNomeEstabelecimento = (estabelecimento: Estabelecimento): string => {
        let nomeExibir = estabelecimento.nome;
        if (nomeExibir.length > 28) {
            nomeExibir = nomeExibir.substring(0, 28);
        }

        return estabelecimento.sigla ? `${nomeExibir} - ${estabelecimento.sigla}` : nomeExibir;
    };

    const estabelecimentoTemplate = (option: Estabelecimento) => {
        if (!option) {
            return "Selecione uma clinica/hospital";
        }
  
        return (
          <div
            className={`flex items-center justify-between transition-all min-h-[28px] min-w-[28px]
              'cursor-pointer hover:bg-blue-50/50 gap-1`}
          >
            <div
                className={`w-[28px] h-[28px] rounded-full border border-white shadow-inne flex items-center justify-center animate-fadein overflow-hidden`}
                style={{ backgroundColor: option.cor?.startsWith('#') ? option.cor : `#${option.cor}` }}
            >
                {option.icone ? (
                    <img 
                          src={((option.icone as any) as string).startsWith('data:') 
                          ? (option.icone as string) 
                          : `data:image/png;base64,${option.icone}`}
                        className="object-contain"
                        alt={option.nome}
                    />
                ) : <i className=" text-white text-[11px]" />}
            </div>
            {getNomeEstabelecimento(option)}
        </div>
        )
    };    

    return (
        <div className="flex flex-col gap-1.5 mb-2 w-full col-span-12">
            <div className="flex justify-between items-center gap-2 border-b pb-2">
                <span className="text-l sm:text-xl w-full font-bold text-gray-700">Procedimentos do Paciente</span>
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    {!isEditing ? (
                        <Button 
                            type="button" 
                            icon="pi pi-plus" 
                            label="Adicionar" 
                            className='bg-blue-600 text-white border-none shadow-md h-8 px-4 justify-betwenn items-center'
                            onClick={onAdd} 
                        />
                    ) : (
                        <>
                            <Button 
                                type="button" 
                                icon="pi pi-times" 
                                label="Cancelar" 
                                className='bg-red-600 text-white border-none shadow-md h-8 px-4 justify-betwenn items-center'
                                onClick={onCancel} 
                            />
                            <Button 
                                type="button" 
                                icon="pi pi-check" 
                                label="Salvar" 
                                className='bg-green-600 text-white border-none shadow-md h-8 px-4 justify-betwenn items-center'
                                onClick={onSave} 
                            />
                        </>
                    )}
                </div>
            </div>
              
            {isEditing && activeIndex !== -1 && fields[activeIndex] && (
                <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-round mt-4 border-1 border-200 shadow-inner">
                    <div className="col-span-12 font-bold text-blue-700 flex items-center gap-2 mb-2">
                        <i className="pi pi-pencil"></i>
                        Informações do Procedimento
                    </div>
                    <AppSelectForm 
                        label='Anestesista'
                        name={`procedimentos.${activeIndex}.medicoId`}
                        control={control} 
                        url="/medico" 
                        filterParams={{ ativo: true }}
                        optionLabel="nome"
                        optionValue="id"
                        colSpan={6}
                        valueTemplate={medicoTemplate}
                        itemTemplate={medicoTemplate}
                    />

                    <AppSelectForm
                        control={control} 
                        name={`procedimentos.${activeIndex}.estabelecimentoId`}
                        label='Clinica/Hospital'
                        url="/estabelecimento"
                        filterParams={ {ativo: true} }
                        optionLabel="nome"
                        optionValue="id"
                        colSpan={6}
                        itemTemplate={estabelecimentoTemplate}
                        valueTemplate={estabelecimentoTemplate}
                    />

                    <AppInputText
                        name={`procedimentos.${activeIndex}.cirurgiao`}
                        label="Cirurgião" 
                        control={control} 
                        maxLength={60}
                        colSpan={5}
                    />

                    <AppInputText
                        name={`procedimentos.${activeIndex}.procedimento`} 
                        label="Procedimento" 
                        control={control} 
                        maxLength={60}
                        colSpan={5}
                    />

                    <AppCalendar
                        name={`procedimentos.${activeIndex}.dataProcedimento`}
                        label='Data'
                        control={control}
                        colSpan={2}
                    />
                </div>
            )}

            <DataTable 
                dataKey="rowId" 
                value={watchProcedimentos} 
                selectionMode="single"
                selection={fields[activeIndex]}
                onRowClick={(e) => onEditRow(e.index)}
                showGridlines
                className="w-full shadow-sm border-1 border-gray-300 mt-2 overflow-hidden"
                emptyMessage="Nenhum procedimento registrado."
                breakpoint="960px"
                rowClassName={(options: any) => options.rowIndex === activeIndex ? 'bg-blue-50' : ''}
            >
                <Column header="Anestesista" 
                        body={(rowData) => rowData.medicoId ? `Médico selecionado` : 'Não definido'} 
                        headerClassName="bg-gray-200 text-gray-700 border-1 border-200"
                        className="border-1 border-gray-300"/>
                <Column header="Clinica/Hospital" 
                        body={(rowData) => rowData.estabelecimentoId ? `Clinica/hospital selecionado` : 'Não definido'} 
                        headerClassName="bg-gray-200 text-gray-700 border-1 border-200"
                        className="border-1 border-gray-300"/>
                <Column header="Cirurgião" 
                        field="cirurgiao" 
                        headerClassName="bg-gray-200 text-gray-700 border-1 border-200"
                        className="border-1 border-gray-300"/>
                <Column header="Procedimento" 
                        field="procedimento" 
                        headerClassName="bg-gray-200 text-gray-700 border-1 border-200"
                        className="border-1 border-gray-300"/>
                <Column header="Data" 
                        headerClassName="bg-gray-200 text-gray-700 border-1 border-200"
                        body={(rowData) => DateUtils.formatarParaBR(rowData.dataProcedimento)} 
                        className="border-1 border-gray-300" />
                <Column 
                    header="Excluir"
                    headerClassName="bg-gray-200 text-gray-700 border-1 border-200"
                    className="border-1 border-gray-300"
                    body={(_, { rowIndex }) => (
                        <Button 
                            type="button"
                            icon="pi pi-trash" 
                            className="p-button-danger p-button-text text-red-600" 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(rowIndex);
                            }}
                        />
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

    const [activeIndex, setActiveIndex] = useState<number>(-1);

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
                    ativo: true,
                    procedimentos: []
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
                            className='!mt-0 md:!mt-3'
                        />

                        <ProcedimentosTable 
                            control={control} 
                            activeIndex={activeIndex}
                            onSelectRow={(index) => setActiveIndex(index)}
                        />
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
                            closeOnCapture={cameraVisible}
                        />
                    </div>
                </div>
            </Dialog>
        </>
    )
}