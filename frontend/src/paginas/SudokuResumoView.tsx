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
import { Menu } from "primereact/menu";
import { OverlayPanel } from "primereact/overlaypanel";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IconeSirenePlantao } from "@/utils/IconeSirene";

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

const StaticCell = ({ alocacao, hora, plantao }: { alocacao?: EscalaItem, hora: string, plantao: boolean }) => {
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
          {alocacao.icone && !plantao ? (
            <img 
              src={alocacao.icone.startsWith('data:') ? alocacao.icone : `data:image/png;base64,${alocacao.icone}`} 
              className="object-contain w-full h-full"
              alt="ícone" 
            />
          ) : (
            <IconeSirenePlantao className="w-6 h-6 animate-pulse" />
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

    const op = useRef<OverlayPanel>(null);
    const dt = useRef<DataTable<any>>(null);

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

    const exportItems = [
        {
            label: 'Exportar Dados',
            items: [
                {
                    label: 'Gerar PDF (Visual)',
                    icon: 'pi pi-file-pdf',
                    command: () => exportarPDF()
                },
                {
                    label: 'Baixar CSV (Excel)',
                    icon: 'pi pi-file-excel',
                    command: () => exportCSV()
                }
            ]
        }
    ];

    const renderTableHeader = () => (
        <div className="flex items-center justify-end bg-slate-50">
            <Button 
                type="button" 
                icon="pi pi-ellipsis-v" 
                onClick={(e) => op.current?.toggle(e)} 
                className="p-button-rounded p-button-text p-button-secondary h-8 w-8"
            />
            <OverlayPanel ref={op} className="shadow-xl border-slate-200">
                <Menu model={exportItems} className="border-none sm:w-44 w-40 text-sm" />
            </OverlayPanel>
        </div>
    );

    const exportCSV = () => {
        const cabecalho = ['MEDICO', ...HORARIOS.map(h => h.header)].join(';');

        const linhasDados = escalas.map(escala => {
            const colunas = [];
            colunas.push(escala.medicoSigla?.toUpperCase() || '');

            HORARIOS.forEach(h => {
                const item = escala.itens?.find(i => {
                    const hItem = i.hora?.substring(0, 5) || i.hora;
                    const hHeader = h.field?.substring(0, 5) || h.field;
                    return hItem === hHeader;
                });
                colunas.push(item ? item.estabelecimentoSigla : '');
            });

            return colunas.join(';');
        });
        const csvFinal = `sep=;\n${cabecalho}\n${linhasDados.join('\n')}`;

        const blob = new Blob(['\uFEFF' + csvFinal], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `sudoku_${DateUtils.paraISO(dataAtiva)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        op.current?.hide();
    };

    const exportarPDF = async () => {
        const doc = new jsPDF('l', 'pt', 'a4');
        
        const TAMANHO_IMG = 18;
        const FONTE_SIGLA = 9; 
        const FONTE_HEADER = 10;
    
        const imagensCache = new Map<number, string>();
        const itensComImagem = escalas.flatMap(e => e.itens || [])
            .filter(i => i.estabelecimentoId && i.icone);
    
        for (const item of itensComImagem) {
            if (!imagensCache.has(item.estabelecimentoId || 0)) {
                const src = item.icone.startsWith('data:') 
                    ? item.icone 
                    : `data:image/png;base64,${item.icone}`;
                imagensCache.set(item.estabelecimentoId || 0, src);
            }
        }
    
        const colunasHeader = ['MÉDICO', ...HORARIOS.map(h => h.header)];
        const linhasCorpo = escalas.map(escala => {
            const row = [escala.medicoSigla?.toUpperCase() || ''];
            HORARIOS.forEach(() => row.push('')); 
            return row;
        });
    
        autoTable(doc, {
            head: [colunasHeader],
            body: linhasCorpo,
            startY: 30,
            theme: 'grid',
            styles: { 
                fontSize: FONTE_SIGLA, 
                halign: 'center', 
                valign: 'middle', 
                minCellHeight: 22,
                cellPadding: 1
            },
            headStyles: { 
                fillColor: [37, 99, 235], 
                fontSize: FONTE_HEADER,
                cellPadding: 4
            },
            columnStyles: {
                0: { cellWidth: 50, fontStyle: 'bold' } 
            },
            didDrawPage: (data) => {
                doc.setFontSize(12); 
                doc.setTextColor(40);
                doc.text(`Sudoku AnestesiaFlow - ${DateUtils.formatarParaBR(dataAtiva)}`, data.settings.margin.left, 20);
            },
            didDrawCell: (data) => {
                if (data.section === 'body' && data.column.index > 0) {
                    const escala = escalas[data.row.index];
                    const horario = HORARIOS[data.column.index - 1];
                    
                    const item = escala.itens?.find(i => 
                        (i.hora?.substring(0, 5) || i.hora) === (horario.field?.substring(0, 5) || horario.field)
                    );
    
                    if (item && item.estabelecimentoId) {
                        const imgData = imagensCache.get(item.estabelecimentoId);
                        const sigla = item.estabelecimentoSigla || '';
    
                        if (imgData) {
                            const paddingInter = 3;
                            const textWidth = doc.getTextWidth(sigla);
                            const totalContentWidth = TAMANHO_IMG + paddingInter + textWidth;
                            
                            const posX = data.cell.x + (data.cell.width - totalContentWidth) / 2;
                            const posY = data.cell.y + (data.cell.height - TAMANHO_IMG) / 2;
    
                            try {
                                doc.addImage(imgData, 'PNG', posX, posY, TAMANHO_IMG, TAMANHO_IMG, undefined, 'FAST');
                            } catch (e) {
                                console.error(e);
                            }
    
                            doc.setFontSize(FONTE_SIGLA);
                            doc.setTextColor(40);
                            doc.text(sigla, posX + TAMANHO_IMG + paddingInter, data.cell.y + (data.cell.height / 2) + 3);
                        }
                    }
                }
            },
            margin: { top: 20, right: 20, bottom: 20, left: 20 }
        });
    
        doc.save(`sudoku_${DateUtils.paraISO(dataAtiva)}.pdf`);
        op.current?.hide();
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
            <header className="flex items-center justify-between sm:px-4 sm:py-3 px-2 py-1 bg-white border-b border-slate-200 shadow-sm z-20">
                <div className="flex items-center gap-2 w-full">
                    {!isPublicRoute && (
                        <>
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
                            className="p-button-rounded p-button-text p-button-secondary h-full md:hidden border-red-200 text-red-500" 
                            onClick={() => navigate(-1)} 
                        />
                        </> 
                    )}
                    <h1 className="text-[9px] sm:text-xl font-black text-slate-700 m-0">
                        Sudoku Diário
                    </h1>

                    <div className="flex items-center gap-3 bg-slate-100 rounded-lg w-full">
                        <Button 
                            icon="pi pi-chevron-left" 
                            className="p-button-rounded p-button-text text-slate-500 h-auto" 
                            onClick={() => { 
                                const d = new Date(dataAtiva); 
                                d.setDate(d.getDate() - 1); 
                                if (d.getDay() === 0) {// Se cair no Domingo (0), volta mais 2 dias para Sextas
                                    d.setDate(d.getDate() - 2);
                                } else if (d.getDay() === 6) {// Se cair no Sábado (6), volta mais 1 dia para Sexta
                                    d.setDate(d.getDate() - 1);
                                }
                                setDataAtiva(d); 
                            }} 
                        />
                        <div className="text-center flex flex-col items-center h-full w-full">
                            <div className="flex items-center gap-2">
                                <span className="sm:text-[12px] text-[7px] uppercase font-bold text-slate-400 tracking-widest">
                                    Escala Diária
                                </span>
                                {isHoje && (
                                    <span className="bg-emerald-500 text-white sm:text-[10px] text-[7px] font-black px-1 py-0.25 rounded-full shadow-sm uppercase">
                                        Hoje
                                    </span>
                                )}
                            </div>

                            <div className="relative group">

                                <div className="flex items-center gap-2 px-3 py-1 rounded-lg group-hover:bg-slate-100 transition-all cursor-pointer border border-transparent group-hover:border-slate-200">
                                    <span className="sm:text-lg text-[9px] font-black text-slate-700 capitalize leading-none">
                                        {dataAtiva.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                                    </span>
                                    <i className="pi pi-calendar text-blue-600 sm:text-lg text-[9px]" />
                                </div>

                                <div className="absolute inset-0 opacity-0">
                                    <Calendar 
                                        key={dataAtiva.getTime()}
                                        value={dataAtiva} 
                                        onChange={(e) => {
                                            if (e.value) {
                                                setDataAtiva(e.value as Date);
                                            }
                                        }} 
                                        showButtonBar
                                        hideOnDateTimeSelect={true} 
                                        locale="pt-BR"
                                        appendTo={document.body}
                                        touchUI={window.innerWidth < 768}
                                        readOnlyInput
                                        disabledDays={[0, 6]}
                                        panelClassName="hide-weekends"
                                        className="w-full h-full"
                                        inputClassName="w-full h-full cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                        <Button 
                            icon="pi pi-chevron-right" 
                            className="p-button-rounded p-button-text text-slate-500 h-auto" 
                            onClick={() => { 
                                const d = new Date(dataAtiva); 
                                d.setDate(d.getDate() + 1); 
                                if (d.getDay() === 6) { // Se cair no Sábado (6), pula mais 2 dias para Segunda
                                    d.setDate(d.getDate() + 2);
                                } else if (d.getDay() === 0) {// Se cair no Domingo (0), pula mais 1 dia para Segunda
                                    d.setDate(d.getDate() + 1);
                                }
                                setDataAtiva(d); 
                            }} 
                        />
                    </div>
                </div>
            </header>

            <main className="flex-grow sm:!p-2 !p-0 overflow-hidden">
                <div className="h-full rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                <DataTable 
                    ref={dt}
                    header={renderTableHeader()}
                    pt={{
                        header: { 
                            className: '!p-0 !border-none !bg-transparent' 
                        }
                    }}
                    value={escalas}
                    dataKey="medicoId" 
                    loading={loading} 
                    scrollable 
                    scrollHeight="flex" 
                    className="sudoku-table-custom"
                    emptyMessage="Nenhuma escala encontrada."
                    rowHover={false}
                    exportFilename={`sudoku_${DateUtils.paraISO(dataAtiva)}`}
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
                                console.log("plantao", escala)
                                return <StaticCell 
                                            alocacao={itemAlocado} 
                                            hora={h.field} 
                                            plantao={itemAlocado && escala.plantao || false}
                                        />;
                            }} 
                        />
                        ))} 
                </DataTable>
                </div>
            </main>
        </div>
    )
}