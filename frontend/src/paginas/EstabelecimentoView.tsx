import { server } from "@/api/server";
import { AppColorPicker } from "@/componentes/color/AppColorPicker";
import { CrudBase } from "@/componentes/crud/CrudBase";
import { AppIconPicker } from "@/componentes/image/AppIconPicker";
import { AppInputText } from "@/componentes/inputtext/AppInputText";
import { AppSelect } from "@/componentes/select/AppSelect";
import { AppSwitch } from "@/componentes/switch/AppSwitch";
import { type Estabelecimento, estabelecimentoSchema } from "@/types/estabelecimento";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { TabPanel, TabView } from "primereact/tabview";
import { useEffect, useState } from "react";

export const EstabelecimentoView = () => {
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

    const buscarResumo = async (ano: number, estId: number) => {
        if (!estId) {
            return;
        }

        setLoadingResumo(true);
        try {
            const data = await server.api.listarCustomizada(`/escala-relatorio`, '/resumo-anual-clinica', { estId, ano });
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
        <CrudBase<Estabelecimento>
            title="Clinicas / Hospitais / Consultório"
            // filterContent={<p>Teste de Filtro</p>}
            resourcePath='/estabelecimento'
            schema={estabelecimentoSchema}
            onAdd={handleResetResumo}
            onEdit={handleResetResumo}
            defaultValues={{ 
                nome: '', 
                cor: undefined,
                icone: undefined,
                sigla: undefined,
                ativo: true
            }}
            columns={[
            { field: 'nome', header: 'Nome' },
            { field: 'cor', header: 'Cor/Icone',
                body: (row: any) => {
                    const hasIcon = row.icone && (Array.isArray(row.icone) || typeof row.icone === 'string') && row.icone.length > 0;
                    const hasColor = !!row.cor;
                    // Converte o ícone para exibição (mesma lógica do AppIconPicker)
                    const getIconSrc = () => {
                        if (typeof row.icone === 'string') {
                        return row.icone.startsWith('data:') ? row.icone : `data:image/png;base64,${row.icone}`;
                        }
                        if (Array.isArray(row.icone)) {
                        // Criar URL a partir do array de bytes enviado pelo Spring
                        const blob = new Blob([new Uint8Array(row.icone)], { type: 'image/png' });
                        return URL.createObjectURL(blob);
                        }
                        return null;
                    };

                    return (
                        // Flexbox para centralização total na célula
                        <div className="flex w-full">
                            {hasIcon ? (
                                <div className="w-[28px] h-[28px] rounded-full border border-gray-200 shadow-sm overflow-hidden bg-gray-50 flex items-center justify-center">
                                    <img 
                                        src={getIconSrc()!} 
                                        alt="Ícone" 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : hasColor ? (
                                /* Círculo perfeito para a cor */
                                <div 
                                    className="w-[28px] h-[28px] rounded-full border border-gray-300 shadow-sm transition-transform hover:scale-90"
                                    style={{ 
                                        backgroundColor: row.cor.startsWith('#') ? row.cor : `#${row.cor}` 
                                    }}
                                />
                            ) : null /* Remove qualquer desenho quando não houver dado */}
                        </div>
                    );
                }
            },
            { 
                field: 'sigla', 
                header: 'Sigla' 
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
                const estId = control._formValues?.id;

                return (
                    <>
                    <div className="col-span-12">
                        <TabView className="mt-2"
                            activeIndex={activeIndex}
                            onTabChange={(e) =>{
                                setActiveIndex(e.index);
                                if (e.index === 1){
                                    buscarResumo(anoSelecionado, estId);
                                } 
                            }}
                        >
                            <TabPanel header="Cadastro" leftIcon="pi pi-user mr-2">
                                <div className="grid grid-cols-12 gap-4 pt-4">
                                    <AppInputText
                                        name="nome"
                                        label="Nome" 
                                        control={control} 
                                        colSpan={10} 
                                        maxLength={60}
                                        required
                                    />

                                    <AppInputText
                                        name="sigla"
                                        label="Sigla" 
                                        control={control} 
                                        colSpan={2} 
                                        maxLength={5}
                                    />

                                    <AppSwitch
                                        name="ativo"
                                        label="Situação"
                                        control={control}
                                        colSpan={4}
                                        labelOn='Ativo'
                                        labelOff='Inativo'
                                    />

                                    <AppColorPicker
                                        name="cor"
                                        label="Cor"
                                        control={control}
                                        colSpan={4}
                                        shape="circle"
                                    />

                                    <AppIconPicker
                                        name="icone"
                                        label="Icone"
                                        control={control}
                                        colSpan={4}
                                    />
                                </div>
                            </TabPanel>    

                            <TabPanel header="Escalas/Ano" leftIcon="pi pi-calendar mr-2" disabled={!estId}>
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
                                                    buscarResumo(e.value, estId);
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
                                            row: {
                                                root: {className: 'h-auto'}
                                            }
                                        }}
                                    >
                                        <Column header="MED"
                                                frozen
                                                style={{ minWidth: '10px' }}
                                                className="bg-slate-100 font-bold border-r border-slate-300 !p-0"
                                                headerClassName='text-[15px]'
                                                headerStyle={{ justifyContent: 'center' }}  
                                                pt={{
                                                    headerContent: { className: 'justify-center' },
                                                    bodyCell: { 
                                                        className: '!p-0' 
                                                    }
                                                }}
                                                body={(med) => (
                                                    <div className="text-[15px] font-black flex items-center justify-center w-full h-full text-slate-700 bg-slate-100">
                                                        {med.sigla}
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
                                                style={{ minWidth: '10px' }}
                                                headerStyle={{ justifyContent: 'center' }}  
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