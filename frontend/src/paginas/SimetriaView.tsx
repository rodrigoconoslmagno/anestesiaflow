import { server } from "@/api/server";
import { getIntervalosEscala } from "@/types/escalaHelper";
import { Button } from "primereact/button"
import { Calendar } from "primereact/calendar";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { ProgressSpinner } from "primereact/progressspinner";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export const SimetriaView = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [resumoSimetria, setResumoSimetria] = useState([]);

    const [displayDialog, setDisplayDialog] = useState(false);
    const [selectedCell, setSelectedCell] = useState<any>(null);
    const [formData, setFormData] = useState({
        data: new Date(),
        horas: [] as string[]
    });

    const intervalos = useMemo(() => getIntervalosEscala(), []);

    const abrirLancamento = (rowData: any, colIndex: any) => {
        const medico = rowData.medico[colIndex];
        setSelectedCell({ row: rowData, medico: medico });
        setDisplayDialog(true);
    };

    const salvarEscala = () => {
        console.log("Salvando para:", selectedCell.medico.sigla, formData);
        setDisplayDialog(false);
    };

    const TimeSlotPicker = ({ intervals, selectedHours, onChange }: any) => {
        const [isSelecting, setIsSelecting] = useState(false);

        const toggleHour = (hourField: string) => {
            const newSelection = selectedHours.includes(hourField)
                ? selectedHours.filter((h: string) => h !== hourField)
                : [...selectedHours, hourField];
            onChange(newSelection);
        };

        const handleMouseDown = (hourField: string) => {
            setIsSelecting(true);
            toggleHour(hourField);
        };

        const handleMouseEnter = (hourField: string) => {
            if (isSelecting) {
                if (!selectedHours.includes(hourField)) {
                    onChange([...selectedHours, hourField]);
                }
            }
        };

        return (
            <div 
                className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-2 bg-slate-100 rounded-xl select-none"
                onMouseUp={() => setIsSelecting(false)}
                onMouseLeave={() => setIsSelecting(false)}
            >
                {intervals.map((int: any) => (
                    <div
                        key={int.field}
                        onMouseDown={() => handleMouseDown(int.field)}
                        onMouseEnter={() => handleMouseEnter(int.field)}
                        className={`
                            flex items-center justify-center p-2 rounded-lg cursor-pointer transition-all duration-200
                            h-12 text-center /* Altura fixa para garantir uniformidade */
                            ${selectedHours.includes(int.field) 
                                ? 'bg-blue-600 text-white shadow-md scale-105' 
                                : 'bg-white text-slate-600 hover:bg-blue-50 border border-slate-200'}
                        `}
                    >
                        <span className="text-[11px] font-bold uppercase whitespace-nowrap leading-none">
                            {int.header}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    useEffect(() => {
        const carregarDados = async () => {
        try {
            const simetria = await server.api.listarCustomizada<any>(
                '/escala-relatorio', 
                '/simetria',
                { }
            );
            setResumoSimetria(simetria as any);
        } finally {
            setLoading(false);
        }
        }
        carregarDados()
    }, []);

    const colunasMedicos = useMemo(() => {
        if (!resumoSimetria || resumoSimetria.length === 0) return [];
        
        return (resumoSimetria[0] as any).medico.length;
    }, [resumoSimetria]);

    const corpoMedico = (rowData: any, colIndex: any) => {
        const infoMedico = rowData.medico[colIndex];
        const temValor = infoMedico?.total > 0;
        
        return (
            <div 
                onClick={() => abrirLancamento(rowData, colIndex)}
                title="Clique para lançar escala"
                className={`
                    flex items-center justify-between w-full h-full p-1 transition-all duration-200
                    cursor-pointer group relative overflow-hidden
                    ${temValor ? 'bg-blue-100/40 text-blue-700' : 'hover:bg-slate-50'}
                `}
            >
                {/* Overlay de borda no hover */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-400/20 pointer-events-none" /> 

                {/* ÁREA DA ESQUERDA: Sigla + Total (Pilha Vertical) */}
                <div className="flex flex-col items-center justify-center flex-1">
                    <span className="text-[12px] font-bold text-slate-500 uppercase leading-none mb-1">
                        {infoMedico?.sigla}
                    </span>
                    <span className={`text-[16px] font-black leading-none ${infoMedico?.total > 0 ? 'text-blue-700' : 'text-slate-300'}`}>
                        {infoMedico?.total || 0}
                    </span>
                </div>

                {/* ÁREA DA DIREITA: Ícone de Plus (Centralizado Verticalmente) */}
                <div className="flex items-center justify-center">
                    <i className="pi pi-plus text-[10px] text-blue-600" />
                </div>
</div>
        );
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
            <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm z-20">
                <div className="flex items-center gap-3">
                        <Button 
                            icon="pi pi-times" 
                            label="Sair"
                            text
                            severity="danger" 
                            className="hidden md:flex h-11 px-4 border-red-200 text-red-500 hover:bg-red-50"
                            onClick={() => navigate(-1)} 
                        />
                        <Button
                            icon="pi pi-arrow-left" 
                            className="p-button-rounded p-button-text p-button-secondary md:hidden border-red-200 text-red-500" 
                            onClick={() => navigate(-1)} 
                        />
                    <h1 className="text-lg md:text-xl font-black text-slate-700 m-0">
                        Simetria escala
                    </h1>
                </div>
            </header>

            <main className="flex-grow p-4 overflow-hidden flex flex-col">
                {loading ?
                    (<div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                        <p className="font-medium">Aguarde carregando os dados da simetria</p>
                        <div className="flex justify-center p-8">
                            <ProgressSpinner style={{ width: '40px' }} />
                        </div>;
                    </div>)
                    :     
                    (<div className="flex-grow overflow-hidden border rounded-lg shadow-sm bg-white">
                        <DataTable 
                            value={resumoSimetria}
                            loading={loading}
                            breakpoint="960px" 
                            scrollHeight="flex"
                            className="p-datatable-sm flex-grow"
                            showGridlines
                            scrollable
                            emptyMessage={loading ? "Carregando..." : "Nenhum dado encontrado."}
                            tableStyle={{ minWidth: '50rem' }}
                            pt={{
                                thead: { className: 'bg-gray-50' },
                                headerRow: { className: 'sticky top-0 z-10' },
                                column: {
                                    headerCell: { className: 'bg-gray-50 text-gray-500 sm:text-[15px] text-[10px] font-bold py-3' },
                                },
                            }}
                        >
                            <Column header=""
                                    frozen
                                    style={{ minWidth: '50px' }}
                                    className="bg-slate-100 font-bold border-r border-slate-300 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]"
                                    headerClassName='text-[15px]'
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
                                                        alt={est.estSigla}
                                                    />
                                                ) : null}
                                            </div>
                                            <span className="truncate text-[10px] uppercase tracking-wide">{est.estSigla}</span>
                                        </div>
                                    )}
                            />
                        
                            {Array.from({ length: colunasMedicos }).map((_, i: any) => (
                                <Column 
                                    key={i} 
                                    // header={col.header} 
                                    headerClassName='text-[15px] font-bold]'
                                    bodyClassName="!px-0 !py-0 m-0"
                                    pt={{
                                        headerContent: { className: 'justify-center' },
                                    }}
                                    body={(rowData) => corpoMedico(rowData, i)}
                                />
                            ))}
                        </DataTable>
                    </div> )
                }
            </main>

            <Dialog 
                header={
                    <div className="flex flex-col">
                        <span className="text-xl font-bold text-slate-800">Lançar Escala</span>
                        <small className="text-slate-500 font-normal">
                            Médico: {selectedCell?.medico?.sigla} | 
                            Médico Id: {selectedCell?.medico?.medicoid} | 
                            Setor: {selectedCell?.row?.estSigla} |
                            Est id: {selectedCell?.row?.estId}
                        </small>
                    </div>
                } 
                visible={displayDialog} 
                style={{ width: '90vw', maxWidth: '450px' }} 
                breakpoints={{ '960px': '75vw', '641px': '100vw' }}
                modal 
                className="p-fluid"
                onHide={() => setDisplayDialog(false)}
                footer={
                    <div className="flex items-center justify-between w-full p-3 border-t border-slate-100">
                        <Button label="Cancelar" icon="pi pi-times" text onClick={() => setDisplayDialog(false)} 
                            className="text-slate-500 p-2" />
                        <Button label="Confirmar" icon="pi pi-check" onClick={salvarEscala} 
                            className="bg-blue-600 text-white p-button-sm shadow-sm transition-all p-2" />
                    </div>
                }
            >
                <div className="flex flex-col gap-6 py-4">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="data" className="font-semibold text-slate-700">Data do Plantão</label>
                        <Calendar 
                            id="data"
                            value={formData.data} 
                            onChange={(e) => setFormData({...formData, data: e.value as Date})} 
                            minDate={new Date()} 
                            dateFormat="dd/mm/yy"
                            showIcon
                            locale="pt-BR" 
                            showButtonBar
                            todayButtonClassName="p-button-text"
                            clearButtonClassName="p-button-text"
                            touchUI={window.innerWidth < 768}
                            className="w-full shadow-sm"
                            inputClassName="h-11"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-bold text-slate-700 flex justify-between">
                            <span>Selecione o Período</span>
                            <span className="text-xs text-blue-600 font-normal">Cliqie para selecionar vários</span>
                        </label>
                        <TimeSlotPicker 
                            intervals={intervalos} 
                            selectedHours={formData.horas} 
                            onChange={(newHours: string[]) => setFormData({...formData, horas: newHours})} 
                        />
                        <div className="text-xs text-slate-400 mt-1">
                            {formData.horas.length} bloco(s) selecionado(s) 
                            ({formData.horas.length}h de plantão)
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>                
    )
}