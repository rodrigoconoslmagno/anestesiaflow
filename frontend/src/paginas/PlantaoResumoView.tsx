import { server } from "@/api/server";
import type { Escala, EscalaItem } from "@/types/escala";
import type { Estabelecimento } from "@/types/estabelecimento";
import type { Medico } from "@/types/medico";
import { DateUtils } from "@/utils/DateUtils";
import clsx from "clsx";
import { addLocale, locale } from "primereact/api";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

interface EscalaPlantao extends Escala {
    medico: Medico | undefined;
    itensPlantao: EscalaItemPlantao[];
  }
  
  interface EscalaItemPlantao extends EscalaItem {
      estabelecimento: Estabelecimento | undefined;
  }

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

  export const PlantaoResumoView = () => {
    const navigate = useNavigate();
    const [dataAtiva, setDataAtiva] = useState(new Date());
    const isPublicRoute = location.pathname.startsWith('/view/plantao');
    const [datasComPlantao, setDatasComPlantao] = useState<string[]>([]);
    const [mesVisualizado, setMesVisualizado] = useState<Date>(new Date());
    const [loading, setLoading] = useState(false);
    const [escalas, setEscalas] = useState<EscalaPlantao[]>([]);

    const isHoje = useMemo(() => 
        new Date().toDateString() === dataAtiva.toDateString()
    , [dataAtiva]);

    useEffect(() => {
        const buscarDatasOcupadas = async () => {
          try {
            const dataFormatada = DateUtils.paraISO(mesVisualizado);
            const res = await server.api_public.listar<string>('/api/public/plantao/plantoes', { data: dataFormatada });
            setDatasComPlantao(res || []);
          } catch (error) {
            console.error("Erro ao buscar datas com plantão", error);
          }
        };
      
        buscarDatasOcupadas();
    }, [mesVisualizado]);

    useEffect(() => {
        const carregarDados = async () => {
            setLoading(true);
            try {
                const dataFormatada = DateUtils.paraISO(dataAtiva);
                const res = await server.api_public.listar<EscalaPlantao>('/api/public/plantao/listar', { data: dataFormatada });
                setEscalas(res || []);
            } catch (error) {
                console.error("Erro ao carregar plantões", error);
            } finally {
                setLoading(false);
            }
        };
        carregarDados();
    }, [dataAtiva]);

    const linhasPorEstabelecimento = useMemo(() => {
        const mapa: Record<number, { 
            unidade: Estabelecimento; 
            cards: { escala: EscalaPlantao; item: EscalaItemPlantao; horaSlot: number }[] 
        }> = {};
      
        escalas.forEach(escala => {
            escala.itensPlantao?.forEach(item => {
                const horaSlot = parseInt(item.hora.substring(0, 2), 10);
                if ([7, 13, 19].includes(horaSlot)) {
                    const idEst = item.estabelecimentoId;
                    if (idEst && item.estabelecimento) {
                        if (!mapa[idEst]) {
                            mapa[idEst] = { unidade: item.estabelecimento, cards: [] };
                        }
                        mapa[idEst].cards.push({ escala, item, horaSlot });
                    }
                }
            });
        });
    
        return Object.values(mapa).map(linha => ({
            ...linha,
            cards: linha.cards.sort((a, b) => {
                // Ordenação por hora e depois por data de associação (senioridade)
                if (a.horaSlot !== b.horaSlot) return a.horaSlot - b.horaSlot;
                const dataA = new Date(a.escala.medico?.dataAssociacao || 0).getTime();
                const dataB = new Date(b.escala.medico?.dataAssociacao || 0).getTime();
                return dataA - dataB;
            })
        }));
    }, [escalas]);

    const dateTemplate = (date: any) => {
        const diaFormatado = `${date.year}-${(date.month + 1).toString().padStart(2, '0')}-${date.day.toString().padStart(2, '0')}`;
        const temPlantao = datasComPlantao.includes(diaFormatado);
        
        return (
            <div className={clsx(
            "flex flex-col items-center justify-center w-full h-full rounded-lg transition-all duration-200",
            temPlantao ? "bg-blue-50 border border-blue-100 shadow-sm" : ""
            )}>
            <span className={clsx(
                "text-xs sm:text-sm font-semibold",
                temPlantao ? "text-blue-700" : "text-slate-600"
            )}>
                {date.day}
            </span>
            
            {temPlantao && (
                <div className="flex gap-0.5 mt-0.5">
                <div className="w-4 h-1 bg-blue-500 rounded-full animate-pulse" />
                </div>
            )}
            </div>
        );
    };

    const onDateSelect = (e: any) => {
        const novaData = e.value as Date;
        if (novaData) {
          setDataAtiva(novaData);
        }
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
                    <h1 className="text-[9px] sm:text-xl w-[20%] font-black text-slate-700 m-0">
                        Plantão Diário
                    </h1>

                    <div className="flex items-center gap-3 bg-slate-100 rounded-lg w-full">
                        <Button 
                            icon="pi pi-chevron-left" 
                            className="p-button-rounded p-button-text text-slate-500 h-auto" 
                            onClick={() => { 
                                const d = new Date(dataAtiva); 
                                d.setDate(d.getDate() - 1); 
                                setDataAtiva(d); 
                            }} 
                        />
                        <div className="text-center flex flex-col items-center h-full w-full">
                            <div className="flex items-center gap-2">
                                <span className="sm:text-[12px] text-[7px] uppercase font-bold text-slate-400 tracking-widest">
                                    Plantão Diário
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
                                        onMonthChange={(e) => setMesVisualizado(new Date(e.year, e.month - 1, 1))}
                                        onChange={onDateSelect} 
                                        showButtonBar
                                        hideOnDateTimeSelect={true} 
                                        locale="pt-BR"
                                        appendTo={document.body}
                                        touchUI={window.innerWidth < 768}
                                        readOnlyInput
                                        className="w-full h-full"
                                        inputClassName="w-full h-full cursor-pointer"
                                        dateTemplate={dateTemplate} 
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
                                setDataAtiva(d); 
                            }} 
                        />
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-3">
                <div className="flex flex-col gap-2 w-full">
                    {loading ? (
                        <div className="flex justify-center p-10"><i className="pi pi-spin pi-spinner text-blue-500 text-2xl" /></div>
                    ) : linhasPorEstabelecimento.length === 0 ? (
                        <div className="text-center p-10 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400 text-sm">
                            Nenhum plantão escalado para hoje.
                        </div>
                    ) : (
                        linhasPorEstabelecimento.map(linha => (
                            <div key={linha.unidade.id} className="flex flex-col gap-2">
                                {/* Título da Unidade */}
                                <div className="flex items-center gap-2 px-1">
                                    <div 
                                        className="w-1.5 h-4 rounded-full" 
                                    />
                                    <span className="font-black text-slate-600 uppercase text-[10px] tracking-wider">
                                        {linha.unidade.nome} - {linha.unidade.sigla}
                                    </span>
                                </div>

                                {/* Lista Horizontal de Médicos */}
                                <div className="flex flex-row flex-wrap gap-1 pb-2">
                                    {linha.cards.map(({ escala, item, horaSlot }, idx) => (
                                        <div 
                                            key={`${idx}`}
                                            className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 min-w-[130px] shrink-0 active:scale-95 transition-transform"
                                        >
                                            <div 
                                                className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center overflow-hidden shrink-0"
                                                style={{ backgroundColor: item.cor?.startsWith('#') ? item.cor : `#${item.cor}` }}
                                            >
                                                {item.icone ? (
                                                    <img 
                                                        src={String(item.icone).startsWith('data:') ? (item.icone as string) : `data:image/png;base64,${item.icone}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : <span className="text-white font-bold text-[10px]">{escala.medico?.sigla}</span>}
                                            </div>

                                            <div className="flex flex-col min-w-0">
                                                <div className="text-blue-600 font-black text-[9px] flex items-center gap-1">
                                                    <i className="pi pi-clock text-[9px]" />
                                                    {item.hora.substring(0,2)} - {horaSlot === 7 ? '13' : horaSlot === 13 ? '19' : '07'}h
                                                </div>
                                                <div className="text-slate-800 font-bold uppercase text-xs truncate">
                                                    {escala.medico?.sigla}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

        </div>
    )
  }