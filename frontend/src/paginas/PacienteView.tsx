import { server } from '@/api/server';
import { AppCameraInput } from '@/componentes/camera/AppCameraCapture';
import { CrudBase } from '@/componentes/crud/CrudBase';
import { AppCalendar } from '@/componentes/datetime/AppCalendar';
import { AppCalendarForm } from '@/componentes/datetime/AppCalendarForm';
import { AppInputTextForm } from '@/componentes/inputtext/AppInputTextForm';
import { AppSelect } from '@/componentes/select/AppSelect';
import { AppSelectForm } from '@/componentes/select/AppSelectForm';
import { AppSwitchForm } from '@/componentes/switch/AppSwitchForm';
import { Recurso } from '@/permissoes/recurso';
import type { Medico } from '@/types/medico';
import { pacienteSchema, type Paciente } from '@/types/paciente';
import { DateUtils } from '@/utils/DateUtils';
import { FormatUtils } from '@/utils/FormatUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useWatch } from 'react-hook-form';
import { useAppToast } from '@/context/ToastContext';
import type { Estabelecimento } from '@/types/estabelecimento';
import { AppInputText } from '@/componentes/inputtext/AppInputText';
import { AppInputTextAreaForm } from '@/componentes/inputtext/AppInputTextAreaForm';
import type { Procedimento } from '@/types/procedimento';
import { AppInputTextArea } from '@/componentes/inputtext/AppInputTextArea';
import { AppInputNumberForm } from '@/componentes/inputtext/AppInputNumberForm';
import { useAuthStore } from '@/permissoes/authStore';

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

const getMedicoExibir = (medico?: Medico | null) => {
    if (!medico) {
        return null;
    }

    return medico.sigla ? `${medico.nome} - ${medico.sigla}` : medico.nome;
};

const formatarResumoFinanceiro = (valor?: number | null) => FormatUtils.formatCurrency(Number(valor ?? 0));

const CompProcedimento = ({ incClick, procChange, isReplace, procedimentoParams }:{ incClick: () => void, 
        procChange: (procedimento: Procedimento | undefined) => void, 
        isReplace: (value: boolean) => void, procedimentoParams: { ativo: boolean; _refresh?: string | undefined } }) => {
    const [ shortcutMode, setShortcutMode ] = useState<'replace' | 'append'>('replace');
    const [ selectedTemplateId, setSelectedTemplateId ] = useState<number | undefined>(undefined);

    const handleTemplateChange = (e: any) => {
        const templateId = e.target.value;
        setSelectedTemplateId(templateId);
    };    

    const handleProcedimentoChange = (proc: any) => {
        if (proc == null) {
            return
        }

        if (proc) {
            procChange(proc);
            setSelectedTemplateId(undefined);
        }
    }
    
    return (
        <div className="col-span-12 lg:col-span-6 space-y-2">
            {/* ShortCut Autocomplete Menu block */}
            <div className="p-2 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
            <div className="flex flex-row items-center justify-between gap-1.5">
                <label className="text-[11px] font-bold text-blue-800 flex items-center gap-1 shrink-0">
                    <i className="pi pi-bookmark text-xs mr-1" />
                    Atalho de Procedimento
                </label>
                
                {/* Toggle template action style: replace or append */}
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400">Modo:</span>
                    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                        <button
                            type="button"
                            onClick={() => {
                                setShortcutMode('replace');
                                isReplace(true);
                            }}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                                shortcutMode === 'replace' ? 'bg-blue-600 text-white shadow-3xs' : 'text-slate-500'
                            }`}
                            title="Substitui todo o texto escrito no campo de procedimento"
                        >
                            Substituir
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShortcutMode('append');
                                isReplace(false);
                            }}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                                shortcutMode === 'append' ? 'bg-blue-600 text-white shadow-3xs' : 'text-slate-500'
                            }`}
                            title="Anexa ao final do texto que você já escreveu"
                        >
                            Anexar
                        </button>
                    </div>
                </div>
            </div> 

            {/* SELECT ACCELERATOR ATALHO */}
            <div className="flex gap-2">
                <AppSelect
                    name='templateProcedimento'
                    label=''
                    value={selectedTemplateId}
                    onChange={handleTemplateChange}
                    onObjectChange={handleProcedimentoChange}
                    url="/procedimento"
                    filterParams={procedimentoParams}
                    optionLabel="descricao"
                    optionValue="id"
                />

                {/* Save current written description as dynamic shortcut template */}
                <Button
                    onClick={incClick}
                    className={`px-2 py-1.5 h-[40px] mt-3 border rounded-lg flex items-center justify-center gap-1 text-[10px] font-bold transition-all shrink-0 
                        bg-white text-blue-700 border-blue-200 hover:bg-blue-50
                    `}
                    title="Salvar o texto atual abaixo como um novo atalho reutilizável"
                >
                    <i className="pi pi-bookmark text-xs mr-1"></i>
                    <span>Incluir</span>
                </Button>
            </div> 
            </div>
        </div>
    )
}

const DlgProcedimento = ({exibir, handleSave, onHide} : {exibir: boolean, handleSave: (proc: Procedimento) => void, onHide: () => void}) => {
    const [ descProcedimento, setDescProcedimento ] = useState('');
    const { showError, showSuccess } = useAppToast();

    const handleSaveProcedimento = async () => {
        try {
            const novoProcedimento = await server.api.criar<Procedimento>('/procedimento', {
                descricao: descProcedimento,
                ativo: true
            });

            handleSave(novoProcedimento);

            showSuccess('Sucesso', 'Procedimento cadastrado e selecionado.');
            onHide();
        } catch (err: any) {
            showError("Erro", "Não foi possível cadastrar o procedimento.");
        }
    };

    return (
        <Dialog 
            visible={exibir} 
            showCloseIcon={false}
            onHide={onHide} 
            onShow={() => {
                setDescProcedimento('')
            }}
            style={{ width: '450px' }}
            headerClassName='p-0'
            header={
                <div className="bg-blue-600 text-white p-4 flex w-full">
                    <div className="flex gap-2 items-center w-full">
                        <i className="pi pi-user-plus w-5 h-5 text-xg font-bold text-blue-300" />
                        <h2 className="pl-1 text-xg font-bold tracking-tight w-full">Cadastrar Novo Procedimento</h2>
                        <Button  
                            icon="pi pi-times" 
                            onClick={() => {
                                onHide();
                                setDescProcedimento('')
                            }} 
                            className=" text-slate-300 font-bold hover:text-white hover:bg-white/10 rounded-lg transition-colors" />
                    </div>
                </div>
            }
            footer={
                <div className="flex gap-2 justify-between items-center">
                    <Button 
                        label="Cancelar" 
                        icon="pi pi-ban" 
                        onClick={() => {
                            onHide();
                            setDescProcedimento('')
                        }} 
                        className="p-button-outlined p-button-text shadow-md border-none p-2" />
                    <Button 
                        label="Cadastrar" 
                        icon="pi pi-bolt" 
                        disabled={!descProcedimento.trim()} 
                        onClick={handleSaveProcedimento}
                        className="p-button-outlined p-button-text shadow-md bg-blue-600 border-none text-white p-2"
                    />
                </div>
            }  
        >
            <div className="flex flex-col gap-4 mt-4">
                <AppInputText    
                    name="descProcedimento"
                    label="Descrição"
                    value={descProcedimento}
                    onChange={(e) => setDescProcedimento(e.target.value)}
                    colSpan={12} 
                    maxLength={60}
                    required
                />
            </div>
        </Dialog>
    )
}

const DlgCirurgiao = ({exibir, handleSave, onHide} : {exibir: boolean, handleSave: (cirurgiao: Medico) => void, onHide: () => void}) => {
    const [ nomeCirurgiao, setNomeCirurgiao ] = useState<string>('');
    const [ siglaCirurgiao, setSiglaCirurgiao ] = useState<string>('');    
    const { showError, showSuccess } = useAppToast();
    
    const handleSaveCirurgiao = async () => {
        try {
            const novoMedico = await server.api.criar<Medico>('/medico', {
                nome: nomeCirurgiao,
                sigla: siglaCirurgiao.toUpperCase(),
                ativo: true,
                especialidades: [2],
                dataAssociacao: undefined
            });

            handleSave(novoMedico);

            showSuccess('Sucesso', 'Cirurgião cadastrado e selecionado.');
            onHide();
        } catch (err: any) {
            showError("Erro", "Não foi possível cadastrar o cirurgião.");
        }
    };

    return (
        <Dialog 
            visible={exibir} 
            showCloseIcon={false}
            onHide={onHide} 
            onShow={() => {
                setNomeCirurgiao('')
                setSiglaCirurgiao('')
            }}
            style={{ width: '450px' }}
            headerClassName='p-0'
            header={
                <div className="bg-blue-600 text-white p-4 flex w-full">
                    <div className="flex gap-2 items-center w-full">
                        <i className="pi pi-user-plus w-5 h-5 text-xg font-bold text-blue-300" />
                        <h2 className="pl-1 text-xg font-bold tracking-tight w-full">Cadastrar Novo Cirurgião</h2>
                        <Button  
                            icon="pi pi-times" 
                            onClick={() => {
                                onHide();
                                setNomeCirurgiao('')    
                                setSiglaCirurgiao('')
                            }} 
                            className=" text-slate-300 font-bold hover:text-white hover:bg-white/10 rounded-lg transition-colors" />
                    </div>
                </div>
            }
            footer={
                <div className="flex gap-2 justify-between items-center">
                    <Button 
                        label="Cancelar" 
                        icon="pi pi-ban" 
                        onClick={() => {
                            onHide();
                            setNomeCirurgiao('')    
                            setSiglaCirurgiao('')
                        }} 
                        className="p-button-outlined p-button-text shadow-md border-none p-2" />
                    <Button 
                        label="Cadastrar" 
                        icon="pi pi-bolt" 
                        disabled={!nomeCirurgiao || !siglaCirurgiao} 
                        onClick={handleSaveCirurgiao}
                        className="p-button-outlined p-button-text shadow-md bg-blue-600 border-none text-white p-2"
                    />
                </div>
            }  
        >
            <div className="flex flex-col gap-4 mt-4">
                <AppInputText    
                    name="nomeCirurgiao"
                    label="Nome"
                    value={nomeCirurgiao}
                    onChange={(e) => setNomeCirurgiao(e.target.value)}
                    colSpan={12} 
                    maxLength={60}
                    required
                />
                <AppInputText    
                    name="siglaCirurgiao"
                    label="Sigla"
                    value={siglaCirurgiao}
                    onChange={(e) => setSiglaCirurgiao(e.target.value)}
                    colSpan={12} 
                    maxLength={3}
                    minLength={3}
                    required
                />
            </div>
        </Dialog>
    )
}

const ProcedimentosTable = ({ control, activeIndex, onSelectRow, setDlgCirurgiao, cirurgiaoParams, medicoId }: 
            { control: any, activeIndex: number, onSelectRow: (index: number) => void, 
                        setDlgCirurgiao: (value: boolean) => void,  cirurgiaoParams: any, medicoId: number | undefined }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: "procedimentos",
        keyName: "rowId"
    });

    const [ procedimentoParams, setProcedimentoParams ] = useState<{ 
        ativo: boolean; 
        _refresh?: string 
    }>({ ativo: true });   

    const [ isEditing, setIsEditing ] = useState(false);
    const [ isNewRecord, setIsNewRecord ] = useState(false);

    const [ dlgProcedimento, setDlgProcedimento ] = useState(false);

    const [ replace, setReplace ] = useState<boolean>(true);

    const watchProcedimentos = useWatch({
        control,
        name: "procedimentos",
        defaultValue: fields
    }) ?? [];

    const resumoTabela = useMemo(() => {
        return watchProcedimentos.reduce(
            (acc: { previsto: number; efetivo: number }, procedimento: any) => {
                acc.previsto += Number(procedimento?.valorPrevisto ?? 0);
                acc.efetivo += Number(procedimento?.valorEfetivo ?? 0);
                return acc;
            },
            { previsto: 0, efetivo: 0 }
        );
    }, [watchProcedimentos]);

    const procedimentoAtivo = watchProcedimentos[activeIndex];
    const pagoAtivo = procedimentoAtivo?.pago;
    const valorEfetivoAtivo = procedimentoAtivo?.valorEfetivo;

    useEffect(() => {
        if (activeIndex === -1 || !procedimentoAtivo) return;

        if (pagoAtivo) {
            if (!valorEfetivoAtivo || valorEfetivoAtivo <= 0) {
                // Impede ligar o switch se não houver valor positivo
                (control as any).setValue(`procedimentos.${activeIndex}.pago`, false);
                
                (control as any).setError(`procedimentos.${activeIndex}.valorEfetivo`, {
                    type: 'manual',
                    message: "O valor efetivo deve ser maior que zero para marcar como pago"
                });
            } else {
                // Se ligou e o valor é válido, garante a limpeza de erros manuais
                (control as any).clearErrors(`procedimentos.${activeIndex}.valorEfetivo`);
            }
        } else if (valorEfetivoAtivo > 0) {
            // Se o switch está desligado mas o usuário digitou um valor, limpa o feedback de erro
            (control as any).clearErrors(`procedimentos.${activeIndex}.valorEfetivo`);
        }
    }, [pagoAtivo, valorEfetivoAtivo, activeIndex, control]);

    const onAdd = () => {
        append({ medicoId: medicoId, dataProcedimento: new Date(), cirurgiao: '', procedimento: '' });
        onSelectRow(fields.length);
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
                        url="/api/public/escala/medicos"
                        public_back
                        filterParams={{ ativo: true,  especialidades: [1] }}
                        optionLabel="nome"
                        optionValue="id"
                        colSpan={6}
                        valueTemplate={medicoTemplate}
                        itemTemplate={medicoTemplate}
                        onObjectChange={(medico: Medico | null | undefined) => {
                            (control as any).setValue(`procedimentos.${activeIndex}.medicoExibir`, getMedicoExibir(medico));
                        }}
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
                        onObjectChange={(estabelecimento: Estabelecimento | null | undefined) => {
                            (control as any).setValue(
                                `procedimentos.${activeIndex}.estabelecimentoExibir`,
                                estabelecimento ? getNomeEstabelecimento(estabelecimento) : null
                            );
                        }}
                    />

                    <AppSelectForm
                        control={control} 
                        name={`procedimentos.${activeIndex}.cirurgiaoId`}
                        label='Cirurgião'
                        url="/api/public/escala/medicos"
                        public_back
                        filterParams={cirurgiaoParams}
                        optionLabel="nome"
                        optionValue="id"
                        colSpan={6}
                        itemTemplate={medicoTemplate}
                        valueTemplate={medicoTemplate}
                        onObjectChange={(cirurgiao: Medico | null | undefined) => {
                            (control as any).setValue(`procedimentos.${activeIndex}.cirurgiaoExibir`, getMedicoExibir(cirurgiao));
                        }}
                    />

                    <Button 
                        type="button" 
                        icon="pi pi-user-plus" 
                        label="Cadastrar Cirurgião" 
                        className='bg-blue-600 text-white border-none shadow-md md:mt-3 h-[40px] px-4 justify-betwenn items-center col-span-12 md:col-span-4'
                        onClick={() => setDlgCirurgiao(true)}
                    />

                    <AppCalendarForm
                        name={`procedimentos.${activeIndex}.dataProcedimento`}
                        label='Data'
                        control={control}
                        colSpan={2}
                    />

                    <CompProcedimento 
                        incClick={() => setDlgProcedimento(true)} 
                        isReplace={(value) => setReplace(value)}
                        procedimentoParams={procedimentoParams}
                        procChange={(proc) => {
                            if (proc) {
                                if (replace) {
                                    (control as any).setValue(`procedimentos.${activeIndex}.procedimento`, proc.descricao);
                                } else {
                                    // Append mode
                                    const currentVal = watchProcedimentos[activeIndex]?.procedimento || '';
                                    const separator = currentVal.trim() ? ' ' : '';
                                    (control as any).setValue(`procedimentos.${activeIndex}.procedimento`, currentVal + separator + proc.descricao);
                                }
                            }  
                        }}
                    />

                    <AppInputTextAreaForm
                        name={`procedimentos.${activeIndex}.procedimento`} 
                        label="Procedimento" 
                        control={control} 
                        maxLength={60}
                        colSpan={6}
                        className="!max-h-[90px]"
                    />

                    <AppSwitchForm
                        name={`procedimentos.${activeIndex}.pago`}
                        label="Pago"
                        control={control}
                        colSpan={3}
                        labelOff="Não"
                        labelOn="Sim"
                    />

                    <AppInputNumberForm
                        name={`procedimentos.${activeIndex}.valorPrevisto`}
                        label='Valor Previsto'
                        control={control}
                        colSpan={3}
                        isCurrency={true}                        
                    />

                    <AppInputNumberForm
                        name={`procedimentos.${activeIndex}.valorEfetivo`}
                        label='Valor Efetivo'
                        control={control}
                        colSpan={4}
                        isCurrency={true}                        
                    />
                    <Button
                        label='Copiar valor'
                        icon="pi pi-copy"
                        disabled={!(watchProcedimentos[activeIndex]?.valorPrevisto > 0)}
                        className='bg-blue-600 text-white border-none shadow-md md:mt-3 h-[40px] px-4 justify-betwenn items-center col-span-12 md:col-span-2'
                        onClick={() => {
                            const valorPrevisto = watchProcedimentos[activeIndex]?.valorPrevisto || 0;
                            (control as any).setValue(`procedimentos.${activeIndex}.valorEfetivo`, valorPrevisto);
                        }}
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
                footer={
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between px-3 py-2 text-sm">
                        <span className="font-bold text-gray-700">
                            Total de procedimentos: {watchProcedimentos.length}
                        </span>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                            <span className="font-semibold text-gray-600">
                                Valor Previsto: <span className="font-bold text-blue-700">{formatarResumoFinanceiro(resumoTabela.previsto)}</span>
                            </span>
                            <span className="font-semibold text-gray-600">
                                Valor Efetivo: <span className="font-bold text-emerald-700">{formatarResumoFinanceiro(resumoTabela.efetivo)}</span>
                            </span>
                        </div>
                    </div>
                }
            >
                <Column header="Pago" 
                        headerClassName="bg-gray-200 text-gray-700 border-1 border-200"
                        className="border-1 border-gray-300"
                        body={(rowData) => {
                            const isPaid = rowData.pago;
                            const status = isPaid 
                                ? {
                                    text: 'Pago',
                                    icon: 'pi pi-check-circle',
                                    className: 'bg-green-100 text-green-800'
                                  }
                                : {
                                    text: 'Pendente',
                                    icon: 'pi pi-clock',
                                    className: 'bg-red-100 text-red-800'
                                  };
                    
                            return (
                                <div className="flex justify-center">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${status.className}`}>
                                        <i className={status.icon}></i>
                                        {status.text}
                                    </span>
                                </div>
                            );
                        }}/>
                <Column header="Anestesista" 
                        body={(rowData) => rowData.medicoId ? rowData.medicoExibir : 'Não definido'} 
                        headerClassName="bg-gray-200 text-gray-700 border-1 border-200"
                        className="border-1 border-gray-300"/>
                <Column header="Clinica/Hospital" 
                        body={(rowData) => rowData.estabelecimentoId ? rowData.estabelecimentoExibir : 'Não definido'} 
                        headerClassName="bg-gray-200 text-gray-700 border-1 border-200"
                        className="border-1 border-gray-300"/>
                <Column header="Cirurgião" 
                        body={(rowData) => rowData.cirurgiaoId ? rowData.cirurgiaoExibir : 'Não definido'} 
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
                <Column header="Valor Previsto" 
                        headerClassName="bg-gray-200 text-gray-700 border-1 border-200"
                        body={(rowData) => FormatUtils.formatCurrency(rowData.valorPrevisto)} 
                        className="border-1 border-gray-300" />
                <Column header="Valor Efetivo" 
                        headerClassName="bg-gray-200 text-gray-700 border-1 border-200"
                        body={(rowData) => FormatUtils.formatCurrency(rowData.valorEfetivo)} 
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

            <DlgProcedimento 
                exibir={dlgProcedimento} 
                onHide={() => setDlgProcedimento(false)}
                handleSave={(proc) => {
    
                    if (activeIndex !== -1) {
                        if (replace) {
                            (control as any).setValue(`procedimentos.${activeIndex}.procedimento`, proc.descricao);
                        } else {
                            // Append mode
                            const currentVal = watchProcedimentos[activeIndex]?.procedimento || '';
                            const separator = currentVal.trim() ? ' ' : '';
                            (control as any).setValue(`procedimentos.${activeIndex}.procedimento`, currentVal + separator + proc.descricao);
                        }
                    }

                    setProcedimentoParams({ 
                        ativo: true, 
                        _refresh: Date.now().toString() 
                    });

                }}
            />
        </div>
    );
};

export const PacienteView = () => {
    const medicoAtualId = useAuthStore((state) => state.user?.medicoId);
    const [ loadingIA, setLoadingIA ] = useState(false);
    const [ cameraVisible, setCameraVisible ] = useState(false);
    const [ medicoId, setMedicoId ] =  useState<number | undefined>(medicoAtualId ?? undefined);
    const [ selectedFile, setSelectedFile ] = useState<File | null>(null);
    const { showError } = useAppToast();
    const [ loadData, setLoadData ] = useState<(() => Promise<void>) | null>(null);

    const [ dlgCirurgiao, setDlgCirurgiao ] = useState<boolean>(false);

    const [ textAreaProcedimento, setTextAreaProcedimento ] = useState<string>('');

    const [ cirurgiaoParams, setCirurgiaoParams ] = useState<{ 
        ativo: boolean; 
        especialidades: string[]; 
        _refresh?: string 
    }>({ ativo: true, especialidades: ['2'] });
    
    const [ procedimentoScanParams, setProcedimentoScanParams ] = useState<{ 
        ativo: boolean; 
        _refresh?: string 
    }>({ ativo: true });

    const [ dlgProcedimento, setDlgProcedimento ] = useState<boolean>(false);

    const [activeIndex, setActiveIndex] = useState<number>(-1);

    const [ replaceScan, setReplaceScan ] = useState<boolean>(true);

    const [ estabelecimentoId, setEstabelecimentoId ] = useState<number | undefined>(undefined);
    const [ cirurgiaoId, setCirurgiaoId ] = useState<number | undefined>(undefined);

    const [ paramsBusca, setParamsBusca ] = useState<{
        ativo?: boolean | null,
        pago?: boolean | null,
        nome?: string | null,
        dataProcInicio?: string | null,
        dataProcFim?: string | null,
        cirurgiaoId?: number | null }
    >({
        ativo: true,
        pago: false
    });
    const [ filtroDataProcInicio, setFiltroDataProcInicio ] = useState<Date | null>(null);
    const [ filtroDataProcFim, setFiltroDataProcFim ] = useState<Date | null>(null);
    const [ filtroCirurgiao, setFiltroCirurgiao ] = useState<number | undefined>(undefined);
    const [ filtroNomePaciente, setFiltroNomePaciente ] = useState<string | undefined>(undefined);
    const [ filtroStatus, setFiltroStatus ] = useState<boolean | undefined>(true);
    const [ filtroPago, setFiltroPago ] = useState<boolean | undefined>(false);

    const handleCapture = async (file: File) => {
        try {
            setLoadingIA(true);
            const uploadParams: Array<{ key: string; value: string | Blob }> = [
                { key: "medicoId", value: String(medicoId) },
                { key: "cirurgiaoId", value: String(cirurgiaoId) },
                { key: "estabelecimentoId", value: String(estabelecimentoId) },
                { key: "procedimentoTexto", value: textAreaProcedimento }
            ];

            await server.api.upload('/paciente/decode', uploadParams as any, file, 'file');

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

    const handleClear = () => {
        setFiltroStatus(undefined);
        setFiltroNomePaciente(undefined);
        setFiltroDataProcInicio(null);
        setFiltroDataProcFim(null);
        setFiltroCirurgiao(undefined);
        setFiltroPago(undefined);
        setParamsBusca({});
    };

    const handleApply = () => {
        const possuiDataInicio = !!filtroDataProcInicio;
        const possuiDataFim = !!filtroDataProcFim;

        if (possuiDataInicio !== possuiDataFim) {
            showError(
                'Filtro de período',
                'Quando informar uma data, preencha também a data inicial e a data final.'
            );
            return;
        }

        setParamsBusca({
            ativo: filtroStatus ?? null,
            nome: filtroNomePaciente ?? null,
            dataProcInicio: filtroDataProcInicio ? DateUtils.paraISO(filtroDataProcInicio) : null,
            dataProcFim: filtroDataProcFim ? DateUtils.paraISO(filtroDataProcFim) : null,
            pago: filtroPago ?? null,
            cirurgiaoId: filtroCirurgiao ?? null
        });
    };

    const handleDataProcInicioChange = (value: Date | null) => {
        setFiltroDataProcInicio(value);

        if (value && filtroDataProcFim && filtroDataProcFim < value) {
            setFiltroDataProcFim(null);
        }
    };

    const handleDataProcFimChange = (value: Date | null) => {
        if (value && filtroDataProcInicio && value < filtroDataProcInicio) {
            return;
        }

        setFiltroDataProcFim(value);
    };

    const periodoDataPreenchido = Boolean(filtroDataProcInicio || filtroDataProcFim);
    const formatarValorTabelaPrincipal = (valor?: number | null) => FormatUtils.formatCurrency(Number(valor ?? 0));

    return (
        <>
            <CrudBase<Paciente>
                title="Paciente"
                recurso={Recurso.PACIENTE}
                filterContent={(
                    <div className="grid grid-cols-12 gap-4">
                        <AppInputText
                            name="filtroNomePaciente"
                            label="Nome"
                            colSpan={6}
                            value={filtroNomePaciente}
                            onChange={(e) => setFiltroNomePaciente(e.target.value)}
                        />
                        <AppCalendar
                            name="dataProcInicio"
                            label="Data Proc Inicio"
                            colSpan={3}
                            required={periodoDataPreenchido}
                            value={filtroDataProcInicio}
                            maxDate={filtroDataProcFim ?? undefined}
                            onChange={(e) => handleDataProcInicioChange(e.value ?? null)}
                        />
                        <AppCalendar
                            name="dataProcFim"
                            label="Data Proc Fim"
                            colSpan={3}
                            required={periodoDataPreenchido}
                            value={filtroDataProcFim}
                            minDate={filtroDataProcInicio ?? undefined}
                            onChange={(e) => handleDataProcFimChange(e.value ?? null)}
                        />
                        <AppSelect
                            name="filtroCirurgia"
                            label="Cirurgião"
                            value={filtroCirurgiao}
                            optionLabel="nome"
                            optionValue="id"
                            url='/medico'
                            filterParams={{ especialidades: [2] }}
                            showClear
                            onChange={(e) => setFiltroCirurgiao(e.value ?? null)}
                            colSpan={6}
                            placeholder="Situação"
                            itemTemplate={medicoTemplate}
                            valueTemplate={medicoTemplate}
                        />
                        <AppSelect
                            name="ativo"
                            label="Situação"
                            value={filtroStatus}
                            options={[
                                { nome: 'Ativo', value: true },
                                { nome: 'Inativo', value: false }
                            ]}
                            optionLabel="nome"
                            optionValue="value"
                            showClear
                            onChange={(e) => setFiltroStatus(e.value ?? null)}
                            colSpan={3}
                            placeholder="Situação"
                            itemTemplate={(options) => {
                                return (
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${options.value  ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {options.value ? 'ATIVO' : 'INATIVO'}
                                        </span>
                                    )
                            }}
                            valueTemplate={(options) => {
                                if (!options) {
                                    return <></>;
                                }
                                return (
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${options.value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {options.value ? 'ATIVO' : 'INATIVO'}
                                        </span>
                                    )
                            }}
                        />
                        <AppSelect
                            name="pago"
                            label="Financeiro"
                            value={filtroPago}
                            options={[
                                { nome: 'Pago', value: true },
                                { nome: 'Pendente', value: false }
                            ]}
                            optionLabel="nome"
                            optionValue="value"
                            showClear
                            onChange={(e) => setFiltroPago(e.value ?? null)}
                            colSpan={3}
                            placeholder="Situação"
                            itemTemplate={(options) => {
                                return (
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${options.value  ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {options.value ? 'PAGO' : 'PENDENTE'}
                                        </span>
                                    )
                            }}
                            valueTemplate={(options) => {
                                if (!options) {
                                    return <></>;
                                }
                                return (
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${options.value ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {options.value ? 'PAGO' : 'PENDENTE'}
                                        </span>
                                    )
                            }}
                        />                        
                    </div>
                )}
                onApplyFilters={handleApply}
                onClearFilters={handleClear}
                filterParams={paramsBusca}
                tableFooter={(items) => {
                    const totais = items.reduce(
                        (acc, item: any) => {
                            acc.previsto += Number(item?.valorPrevistoExibir ?? 0);
                            acc.efetivo += Number(item?.valorEfetivoExibir ?? 0);
                            return acc;
                        },
                        { previsto: 0, efetivo: 0 }
                    );

                    return (
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between px-3 py-2 text-sm">
                            <span className="font-bold text-gray-700">
                                Total de pacientes: {items.length}
                            </span>
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                                <span className="font-semibold text-gray-600">
                                    Valor Previsto: <span className="font-bold text-blue-700">{formatarValorTabelaPrincipal(totais.previsto)}</span>
                                </span>
                                <span className="font-semibold text-gray-600">
                                    Valor Efetivo: <span className="font-bold text-emerald-700">{formatarValorTabelaPrincipal(totais.efetivo)}</span>
                                </span>
                            </div>
                        </div>
                    );
                }}
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
                    { field: 'dataProcedimentoExibir', header: 'Data Procedimento' },
                    { field: 'procedimentoExibir', header: 'Procedimento' },
                    { 
                        field: 'valorPrevistoExibir', 
                        header: 'Valor Previsto',
                        body: (rowData) => FormatUtils.formatCurrency(rowData.valorPrevistoExibir)
                    },
                    { 
                        field: 'valorEfetivoExibir', 
                        header: 'Valor Efetivo',
                        body: (rowData) => FormatUtils.formatCurrency(rowData.valorEfetivoExibir)
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
                    const saveCirurgiao = (cirurgiao: Medico) => {
                         if (activeIndex !== -1) {
                            (control as any).setValue(`procedimentos.${activeIndex}.cirurgiaoId`, cirurgiao.id);
                        }

                        setCirurgiaoParams({ 
                            ativo: true, 
                            especialidades: ['2'], 
                            _refresh: Date.now().toString() 
                        });
                    }
                    
                    return (
                    <>
                        <AppInputTextForm
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
                            setDlgCirurgiao={(value) => setDlgCirurgiao(value)}
                            cirurgiaoParams={cirurgiaoParams}
                            medicoId={medicoAtualId ?? undefined}
                        />

                        <DlgCirurgiao
                            exibir={dlgCirurgiao}
                            onHide={() => setDlgCirurgiao(false)}
                            handleSave={saveCirurgiao}
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
                    setMedicoId(medicoAtualId ?? undefined)
                    setSelectedFile(null)
                }} 
                onShow={() => {
                    setMedicoId(medicoAtualId ?? undefined)
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
                            disabled={!selectedFile || !medicoId || !estabelecimentoId || !cirurgiaoId || !textAreaProcedimento || loadingIA} 
                            onClick={handleExecute}
                            className="p-button-outlined p-button-text shadow-md bg-blue-600 border-none text-white p-2"
                        />
                    </div>
                }
            >
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col mt-3 gap-2">
                        <AppSelect
                            label='Médico'
                            name='medicoId'
                            value={medicoId}
                            filterParams={{ ativo: true, especialidades: ['1'] }}
                            onChange={(e) => setMedicoId(e.value)}    
                            url="/api/public/escala/medicos"
                            public_back
                            placeholder="Selecione o médico"
                            valueTemplate={medicoTemplate}
                            itemTemplate={medicoTemplate}
                            optionLabel="nome"
                            optionValue="id"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <AppSelect
                            label='Clinica / Hospital'
                            name='estabelecimentoId'
                            value={estabelecimentoId}
                            filterParams={{ ativo: true }}
                            onChange={(e) => setEstabelecimentoId(e.value)}    
                            url="/estabelecimento"
                            placeholder="Selecione uma clinica/hospital"
                            valueTemplate={estabelecimentoTemplate}
                            itemTemplate={estabelecimentoTemplate}
                            optionLabel="nome"
                            optionValue="id"
                        />
                    </div>

                    <div className="flex flex-col grid grid-cols-12 gap-2">
                        <AppSelect
                            className="!col-span-10"
                            label='Cirurgião'
                            name='cirurgiaoId'
                            value={cirurgiaoId}
                            filterParams={cirurgiaoParams}
                            onChange={(e) => setCirurgiaoId(e.value)}    
                            url="/medico"
                            placeholder="Selecione o cirurgião"
                            valueTemplate={medicoTemplate}
                            itemTemplate={medicoTemplate}
                            optionLabel="nome"
                            optionValue="id"
                        />

                        <Button 
                            type="button" 
                            icon="pi pi-user-plus" 
                            className='bg-blue-600 text-white border-none shadow-md ml-4 mt-3 h-[40px] px-4 justify-betwenn items-center col-span-1'
                            onClick={() => setDlgCirurgiao(true)}
                        />
                    </div>        

                    <CompProcedimento
                        incClick={() => setDlgProcedimento(true)}
                        isReplace={(value) => setReplaceScan(value)}
                        procedimentoParams={procedimentoScanParams}
                        procChange={(proc) => {
                            if (proc) {
                                if (replaceScan) {
                                    setTextAreaProcedimento(proc.descricao);
                                } else {
                                    const separator = textAreaProcedimento.trim() ? ' ' : '';
                                    setTextAreaProcedimento(textAreaProcedimento + separator + proc.descricao);
                                }
                            }
                        }}
                    />
                             
                    <div className="flex flex-col gap-2">
                        <AppInputTextArea
                            name='procediemtno'
                            label='Procedimento'
                            value={textAreaProcedimento}
                            onChange={(e) => setTextAreaProcedimento(e.target.value)}
                            colSpan={12}
                        />
                    </div>


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

            <DlgProcedimento
                exibir={dlgProcedimento}
                onHide={() => setDlgProcedimento(false)}
                handleSave={(proc) => {
                    if (proc) {
                        if (replaceScan) {
                            setTextAreaProcedimento(proc.descricao);
                        } else {
                            const separator = textAreaProcedimento.trim() ? ' ' : '';
                            setTextAreaProcedimento(textAreaProcedimento + separator + proc.descricao);
                        }
                    }
                    setProcedimentoScanParams({ 
                        ativo: true, 
                        _refresh: Date.now().toString() 
                    });
                }}
            />

            <DlgCirurgiao
                exibir={dlgCirurgiao}
                onHide={() => setDlgCirurgiao(false)}
                handleSave={(cirurgiao) => {
                    setCirurgiaoId(cirurgiao.id);

                    setCirurgiaoParams({ 
                        ativo: true, 
                        especialidades: ['2'], 
                        _refresh: Date.now().toString() 
                    });
                }}
            />
        </>
    )
}
