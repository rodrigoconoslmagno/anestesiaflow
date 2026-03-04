import { server } from '@/api/server';
import { CrudBase } from '@/componentes/crud/CrudBase';
import { AppCalendar } from '@/componentes/datetime/AppCalendar';
import { AppInputText } from '@/componentes/inputtext/AppInputText';
import { AppSelect } from '@/componentes/select/AppSelect';
import { AppSwitch } from '@/componentes/switch/AppSwitch';
import { type Medico, medicoSchema } from '@/types/medico';
import { DateUtils } from '@/utils/DateUtils';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { TabPanel, TabView } from 'primereact/tabview';
import { useEffect, useState } from 'react';

export const MedicoView = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [loadingResumo, setLoadingResumo] = useState(false);
    const [resumoEscalas, setResumoEscalas] = useState([]);
    const [anoSelecionado, setAnoSelecionado] = useState(Number(new Date().getFullYear()));
    const [anosDisponiveis, setAnosDisponiveis] = useState<{nome: string, value: number}[]>([]);

    useEffect(() => {
        const carregarAnos = async () => {
            try {
                const anos = await server.api.listarCustomizada('/escala-relatorio', '/anos-escalas', {}); 
                setAnosDisponiveis(anos.map(a => ({ nome: String(a), value: Number(a) })));
            } catch (err) {
                console.error("Erro ao carregar anos", err);
            }
        };
        carregarAnos();
    }, []);

    const buscarResumo = async (ano: number, medicoId: number) => {
        if (!medicoId){
            return;
        }
        setLoadingResumo(true);
        try {
            const data = await server.api.listarCustomizada(`/escala-relatorio`, '/resumo-anual-medico', { medicoId, ano });
            setResumoEscalas(data as any);
        } catch (err) {
            console.error("Erro ao carregar resumo", err);
        } finally {
            setLoadingResumo(false);
        }
    };

    const handleResetResumo = () => {
        setActiveIndex(0);
        setAnoSelecionado(Number(new Date().getFullYear()));
        setResumoEscalas([]); 
    }

    return (
        <CrudBase<Medico>
            title="Médico"
            // filterContent={<p>Teste de Filtro</p>}
            resourcePath='/medico'
            schema={medicoSchema}
            defaultValues={{ 
                nome: '', 
                sigla: '',
                ativo: true
            }}
            onAdd={handleResetResumo}
            onEdit={handleResetResumo}
            columns={[
            { field: 'nome', header: 'Nome' },
            { field: 'sigla', header: 'Sigla' },
            { field: 'dataAssociacao', header: 'Sócio desde',
                body: (rowData) => DateUtils.formatarParaBR(rowData.dataAssociacao)
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
                const medicoId = control._formValues?.id;

                return (
                <>
                    <div className="col-span-12">
                    <TabView className="mt-2"
                        activeIndex={activeIndex}
                        onTabChange={(e) =>{
                            setActiveIndex(e.index);
                            if (e.index === 1){
                                buscarResumo(anoSelecionado, medicoId);
                            } 
                        }}
                    >
                        <TabPanel header="Cadastro" leftIcon="pi pi-user mr-2">
                            <div className="grid grid-cols-12 gap-4 pt-4">
                                <AppInputText<Medico> 
                                    name="nome"
                                    label="Nome" 
                                    control={control} 
                                    colSpan={12} 
                                    maxLength={60}
                                    required
                                />

                                <AppInputText<Medico> 
                                    name="sigla"
                                    label="Sigla" 
                                    control={control} 
                                    colSpan={6} 
                                    maxLength={3}
                                    minLength={3}
                                    required
                                />

                                <AppCalendar
                                    name='dataAssociacao'
                                    label='Sócio desde:'
                                    control={control}
                                    colSpan={3}
                                    required
                                />

                                <AppSwitch<Medico>
                                    name="ativo"
                                    label="Situação"
                                    control={control}
                                    colSpan={3}
                                    labelOn='Ativo'
                                    labelOff='Inativo'
                                />
                            </div>
                        </TabPanel>
                        
                        <TabPanel header="Escalas/Ano" leftIcon="pi pi-calendar mr-2" disabled={!medicoId}>
                            <div className="pt-4">
                                <div className="flex justify-between items-center mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Histórico de Atividades</h3>
                                        <p className="text-xs text-gray-500">Consolidado mensal de plantões e horas</p>
                                    </div>
                                    <div className="w-full max-w-[250px]">
                                        <AppSelect 
                                            className='-mb-2'
                                            name="anoResumo" 
                                            label='Ano de Referência'
                                            options={anosDisponiveis}
                                            value={anoSelecionado}
                                            optionLabel="nome"
                                            optionValue="value"
                                            onChange={(e) => {
                                                setAnoSelecionado(e.value);
                                                buscarResumo(e.value, medicoId);
                                            }}
                                            placeholder="Selecione o Ano"
                                        />
                                    </div>
                                </div>
                                
                                <DataTable 
                                    value={resumoEscalas}
                                    loading={loadingResumo}
                                    breakpoint="400px" 
                                    scrollHeight="400px"
                                    className="p-datatable-sm"
                                    showGridlines
                                    scrollable
                                    emptyMessage={loadingResumo ? "Carregando..." : "Nenhum dado encontrado."}
                                    pt={{
                                        thead: { className: 'bg-gray-50' },
                                        headerRow: { className: 'sticky top-0 z-10' },
                                        column: {
                                            headerCell: { className: 'bg-gray-50 text-gray-500 text-[15px] font-bold' },
                                            bodyCell: { className: '!p-0' }
                                        },
                                    }}
                                >
                                    <Column header="Clinica / Hospitais"
                                            frozen
                                            className="bg-slate-100 font-bold border-r border-slate-300 !p-0"
                                            headerClassName='border-r border-b border-t border-slate-300 text-[15px]'
                                            headerStyle={{ justifyContent: 'center' }}  
                                            pt={{
                                                headerContent: { className: 'justify-center' },
                                            }}
                                            body={(est) => (
                                                <div className="flex items-center gap-1 ml-1 h-full">
                                                    <div 
                                                        className="w-[28px] h-[28px] rounded-full shadow-inner border-b border-black/5 flex items-center justify-center overflow-hidden" 
                                                        style={{ backgroundColor: est.cor?.startsWith('#') ? est.cor : `#${est.cor}` }}
                                                    >
                                                        {est.icone ? (
                                                            <img 
                                                                src={est.icone.startsWith('data:') ? est.icone : `data:image/png;base64,${est.icone}`} 
                                                                className="object-contain"
                                                                alt={est.estabelecimento}
                                                            />
                                                        ) : null}
                                                    </div>
                                                    <span className="truncate text-[10px] uppercase tracking-wide">{est.estabelecimento}</span>
                                                </div>
                                            )}
                                    />
                                    {[
                                        { f: 'janeiro', h: 'JAN' }, { f: 'fevereiro', h: 'FEV' },
                                        { f: 'marco', h: 'MAR' }, { f: 'abril', h: 'ABR' },
                                        { f: 'maio', h: 'MAI' }, { f: 'junho', h: 'JUN' },
                                        { f: 'julho', h: 'JUL' }, { f: 'agosto', h: 'AGO' },
                                        { f: 'setembro', h: 'SET' }, { f: 'outubro', h: 'OUT' },
                                        { f: 'novembro', h: 'NOV' }, { f: 'dezembro', h: 'DEZ' }
                                    ].map((mes) => (
                                        <Column 
                                            key={mes.f} 
                                            field={mes.f} 
                                            header={mes.h} 
                                            headerClassName='text-[15px] font-bold]'
                                            bodyClassName="!px-0 !py-0 m-0"
                                            pt={{
                                                headerContent: { className: 'justify-center' }
                                            }}
                                            body={(ano) => {
                                                const bgBlue =  ano[mes.f] > 0;
                                                return (
                                                    <div className={`flex items-center justify-center gap-1 w-full h-full ${bgBlue && 'bg-blue-200'}`}>
                                                        <span className="text-[15px] uppercase tracking-wide">{ano[mes.f]}</span>
                                                    </div>
                                                )
                                            }}
                                        />
                                    ))}
                                    <Column 
                                        field="total_ano" 
                                        header="TOTAL" 
                                        className="bg-blue-50 font-bold" 
                                        headerClassName='text-[15px] font-bold]' 
                                        bodyClassName='text-center'
                                    />
                                </DataTable>
                            </div>
                        </TabPanel>
                    </TabView>
                    </div>
                </>
                )
            }}
        </CrudBase>  
    )
}