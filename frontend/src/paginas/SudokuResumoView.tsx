import { server } from "@/api/server";
import type { Escala, EscalaItem } from "@/types/escala";
import { getIntervalosEscala } from "@/types/escalaHelper";
import { DateUtils } from "@/utils/DateUtils";
import clsx from "clsx";
import { addLocale, locale } from "primereact/api";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

addLocale('pt-BR', {
    firstDayOfWeek: 0,
    dayNames: ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'],
    dayNamesShort: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'],
    dayNamesMin: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
    monthNames: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
    monthNamesShort: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
    today: 'Hoje',
    clear: 'Limpar',
  });
  locale('pt-BR');

const StaticCell = ({ alocacao, hora }: { alocacao?: EscalaItem, hora: string }) => {
    const almoco = hora === "11:00" || hora === "12:00"
    if (!alocacao) {
      return (
        <div className={clsx(
            "flex items-center justify-center sm:min-h-[28px] sm:min-w-[28px] min-h-[24px] min-w-[24px] ",
            "border-r border-b border-slate-300 ",
            almoco ? "bg-red-100" : "bg-white"
        )}>
          <div className="sm:w-6 w-4 h-1 px-1 bg-slate-200 rounded-full group-hover:bg-emerald-100 transition-colors" title="Livre"></div>
        </div>
      );
    }
  
    const bgColor = alocacao.cor?.startsWith('#') ? alocacao.cor : `#${alocacao.cor}`;
  
    return (
      <div className={clsx(
        "flex items-center justify-center s;:min-h-[28px] sm:min-w-[28px] min-h-[24px] min-w-[24px] border-r border-b border-slate-300",
        almoco ? "bg-red-100" : "bg-white"
      )} >
        <div 
          style={{ backgroundColor: bgColor }}
          className="sm:w-[28px] sm:h-[28px] w-[24px] h-[24px] rounded-full border border-white shadow-sm flex items-center justify-center overflow-hidden"
        >
          {alocacao.icone && (
            <img 
              src={alocacao.icone.startsWith('data:') ? alocacao.icone : `data:image/png;base64,${alocacao.icone}`} 
              className="object-contain w-full h-full"
              alt="ícone" 
            />
          )}
        </div>
      </div>
    );
  };

export const SudokuResumoView = () => {
    const navigate = useNavigate();
    const [dataAtiva, setDataAtiva] = useState(new Date());
    const isPublicRoute = location.pathname.startsWith('/view/sudoku');
    const [escalas, setEscalas] = useState<Escala[]>([]);
    const [loading, setLoading] = useState(false);

    const HORARIOS = useMemo(() => getIntervalosEscala(), []);
    const isHoje = useMemo(() => new Date().toDateString() === dataAtiva.toDateString(), [dataAtiva]);

    useEffect(() => {
        const carregarDados = async () => {
          setLoading(true);
          try {
            const dataFormatada = DateUtils.paraISO(dataAtiva);
            const resEscalas = await server.api_public.listar<Escala>('/api/public/sudoku/sudokudia', { data: dataFormatada });
            setEscalas(resEscalas || []);
          } catch (error) {
            console.error("Erro ao carregar dados do Sudoku:", error);
          } finally {
            setLoading(false);
          }
        };
        carregarDados();
      }, [dataAtiva]);

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
            <header className="flex items-center justify-between sm:px-4 sm:py-3 px-2 py-1 bg-white border-b border-slate-200 shadow-sm z-20">
                {/* {(isSyncing || hasChangesToSave) && <div className="sync-glow-bar" />} */}
                <div className="flex items-center gap-2 w-full">
                    {/* O botão sair sai do FAB e vem para o padrão mobile/tablet: Canto superior esquerdo */}
                    {!isPublicRoute && (
                        <>
                        <Button 
                            icon="pi pi-times" 
                            label="Sair"
                            text
                            severity="danger" // Vermelho para indicar saída/fechamento
                            className="hidden md:flex h-11 px-4 border-red-200 text-red-500 hover:bg-red-50"
                            onClick={() => navigate(-1)} 
                        />
                        <Button 
                            icon="pi pi-arrow-left" 
                            className="p-button-rounded p-button-text p-button-secondary md:hidden border-red-200 text-red-500" 
                            onClick={() => navigate(-1)} 
                        />
                        </> 
                    )}
                    <h1 className="text-[9px] sm:text-xl font-black text-slate-700 m-0">
                        Sudoku Ddiário
                    </h1>

                    <div className="flex items-center gap-3 bg-slate-100 rounded-lg w-full">
                        <Button 
                            icon="pi pi-chevron-left" 
                            className="p-button-rounded p-button-text text-slate-500 h-full" 
                            onClick={() => { const d = new Date(dataAtiva); d.setDate(d.getDate() - 1); setDataAtiva(d); }} 
                            disabled={isHoje} 
                        />
                        <div className="text-center flex flex-col items-center w-full">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                                    Escala Diária
                                </span>
                                {isHoje && (
                                    <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm uppercase">
                                        Hoje
                                    </span>
                                )}
                            </div>

                            <div className="relative group">
                                {/* Camada Visual */}
                                <div className="flex items-center gap-2 px-3 py-1 rounded-lg group-hover:bg-slate-100 transition-all cursor-pointer border border-transparent group-hover:border-slate-200">
                                    <span className="text-lg font-black text-slate-700 capitalize leading-none">
                                        {dataAtiva.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                                    </span>
                                    <i className="pi pi-calendar text-blue-600 text-lg" />
                                </div>

                                {/* Calendar realçado e resetado por KEY para evitar travamento */}
                                <div className="absolute inset-0 opacity-0">
                                    <Calendar 
                                        key={dataAtiva.getTime()} // Força o refresh do componente interno
                                        value={dataAtiva} 
                                        onChange={(e) => {
                                            if (e.value) {
                                                setDataAtiva(e.value as Date);
                                            }
                                        }} 
                                        minDate={new Date()} 
                                        showButtonBar // ATIVA O BOTÃO HOJE E LIMPAR
                                        hideOnDateTimeSelect={true} // Fecha ao selecionar
                                        locale="pt-BR"
                                        appendTo={document.body}
                                        touchUI={window.innerWidth < 768}
                                        readOnlyInput
                                        className="w-full h-full"
                                        inputClassName="w-full h-full cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                        <Button 
                            icon="pi pi-chevron-right" 
                            className="p-button-rounded p-button-text text-slate-500 h-full" 
                            onClick={() => { const d = new Date(dataAtiva); d.setDate(d.getDate() + 1); setDataAtiva(d); }} 
                        />
                    </div>
                </div>
            </header>

            <main className="flex-grow sm:!p-2 !p-0 overflow-hidden">
                <div className="h-full rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                <DataTable 
                    value={escalas}
                    dataKey="medicoId" 
                    loading={loading} 
                    scrollable 
                    scrollHeight="flex" 
                    className="sudoku-table-custom"
                    emptyMessage="Nenhuma escala encontrada."
                    rowHover={false}
                >
                    {/* Coluna do Médico (Fixa) */}
                    <Column 
                        frozen 
                        header="MÉD" 
                        align="center" 
                        pt={{
                            // Alvo: O elemento TH (Header)
                            headerCell: { 
                                className: '!bg-slate-200 !border-r-2 !border-blue-500',
                                style: { padding: '0px'  } 
                            },
                            // Alvo: O texto dentro do Header
                            headerTitle: { 
                                className: 'sm:!text-[12px] !text-[9px] !font-black !text-slate-700', 
                                style: { padding: '0px' } 
                            },
                            // Alvo: A célula TD (Corpo)
                            bodyCell: { 
                                className: '!bg-slate-200 !border-r-2 !border-blue-500 !p-0' 
                            }
                        }}
                        body={(escala: Escala) => (
                            <div className="flex flex-row items-center justify-center gap-2 text-slate-500 bg-slate-100">
                                <span className="sm:text-[12px] text-[8px] font-black leading-none">
                                    {escala.medicoSigla?.substring(0, 3).toUpperCase()}
                                </span>
                            </div>
                        )} 
                    />
                    
                    {/* Colunas de Horários Dinâmicas */}
                    {HORARIOS.map(h => (
                        <Column 
                            key={h.field} 
                            header={
                                <span className="sm:text-[12px] text-[9px] font-bold text-blue-600">{h.header}</span>
                            }
                            headerClassName="bg-slate-50 border-b border-r border-slate-300 p-0"
                            className='p-0'
                            body={(escala: Escala) => {
                                const itemAlocado = escala.itens?.find((i: EscalaItem) => {
                                    const hItem = i.hora?.substring(0, 5) || i.hora;
                                    return hItem === h.field;
                                });
                                return <StaticCell alocacao={itemAlocado} hora={h.field} />;
                            }} 
                        />
                        ))} 
                </DataTable>
                </div>
            </main>
        </div>
    )
}