import { server } from "@/api/server";
import type { Escala, EscalaItem } from "@/types/escala";
import { getIntervalosEscala } from "@/types/escalaHelper";
import { DateUtils } from "@/utils/DateUtils";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const StaticCell = ({ alocacao }: { alocacao?: EscalaItem }) => {
    if (!alocacao) {
      return (
        <div className="flex items-center justify-center sm:min-h-[28px] sm:min-w-[28px] min-h-[24px] min-w-[24px] border-r border-b border-slate-300 bg-white">
          <div className="w-1 h-1 bg-slate-300 rounded-full opacity-40"></div>
        </div>
      );
    }
  
    const bgColor = alocacao.cor?.startsWith('#') ? alocacao.cor : `#${alocacao.cor}`;
  
    return (
      <div className="flex items-center justify-center s;:min-h-[28px] sm:min-w-[28px] min-h-[24px] min-w-[24px] border-r border-b border-slate-300 bg-white">
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

    const navegar = (dias: number) => {
        const novaData = new Date(dataAtiva);
        novaData.setDate(novaData.getDate() + dias);
        setDataAtiva(novaData);
      };

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
            <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm z-20">
                {/* {(isSyncing || hasChangesToSave) && <div className="sync-glow-bar" />} */}
                <div className="flex items-center gap-3">
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
                    <h1 className="text-lg md:text-xl font-black text-slate-700 m-0">
                        Sudoku Ddiário
                    </h1>

                    <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                        <Button icon="pi pi-chevron-left" text className="p-button-sm" onClick={() => navegar(-1)} />
                        <span className="text-xs font-bold px-2 whitespace-nowrap">
                            {dataAtiva.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </span>
                        <Button icon="pi pi-chevron-right" text className="p-button-sm" onClick={() => navegar(1)} />
                    </div>
                </div>
            </header>

            <main className="flex-grow p-1 overflow-hidden">
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
                                style: { padding: '0px' } 
                            },
                            // Alvo: O texto dentro do Header
                            headerTitle: { 
                                className: 'sm:!text-[12px] !text-[9px] !font-black !text-slate-700' 
                            },
                            // Alvo: A célula TD (Corpo)
                            bodyCell: { 
                                className: '!bg-slate-200 !border-r-2 !border-blue-500 !p-0' 
                            }
                        }}
                        body={(escala: Escala) => (
                            <div className="flex flex-row items-center justify-center gap-2 text-slate-500">
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
                        return <StaticCell alocacao={itemAlocado} />;
                        }} 
                    />
                    ))} 
                </DataTable>
                </div>
            </main>
        </div>
    )
}