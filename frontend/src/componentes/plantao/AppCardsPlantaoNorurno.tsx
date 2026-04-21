import { server } from "@/api/server";
import type { Escala, EscalaItem } from "@/types/escala";
import { DateUtils } from "@/utils/DateUtils";
import { processarHoras } from "@/utils/PlantoesUtils";
import { classNames } from "primereact/utils";
import { useEffect, useMemo, useState } from "react";

export const AppCardsPlantaoNoturno = ({className = 'pl-1', dataAtual, atualiza} : any) => {

    const [loading, setLoading] = useState(false);
    const [escalasPlantoesNoturnos, setEscalasPlantoesNoturnos] = useState<Escala[]>([]);

    useEffect(() => {
        const dataFormatada = DateUtils.paraISO(dataAtual);
        const carregaDados = async () => {
            try{
                setLoading(true);
                const resEscalasPlantaoNorutn = await server.api.listarCustomizada<Escala>('/sudoku', '/listardianoturno', { data: dataFormatada });
                setEscalasPlantoesNoturnos(resEscalasPlantaoNorutn || []);
            } finally {
                setLoading(false);
            }
        }
        carregaDados()
    }, [dataAtual, atualiza])

    const linhasPorMedico = useMemo(() => {
        // 1. Criar uma lista de médicos únicos com seus respectivos cards processados
        const mapaMedicos: Record<number, { 
            medicoSigla: string; 
            cards: { 
                item: EscalaItem;
                horarioFormatado: string;
                horaInicio: number; // Para ordenação
            }[] 
        }> = {};
    
        escalasPlantoesNoturnos.forEach(escala => {
            if (!escala.medicoId){
              return;
            }  
            const medId = escala.medicoId;
    
            // Extraímos as horas brutas para a Utils
            const horas = escala.itens?.map(item => 
                parseInt(item.hora.substring(0, 2), 10)
            );
    
            // Chamada à regra de negócio da Utils
            const stringHorarios = processarHoras(horas!); 
            const grupos = stringHorarios.split(',').map(s => s.trim());
    
            if (!mapaMedicos[medId]) {
                mapaMedicos[medId] = { 
                    medicoSigla: escala.medicoSigla!, 
                    cards: [] 
                };
            }
    
            grupos.forEach(grupo => {
                const horaInicio = parseInt(grupo.split('-')[0], 10);
                
                // Tenta achar o estabelecimento vinculado a essa hora de início para pegar o ícone/cor
                const itemOriginal = escala.itens?.find(i => 
                    parseInt(i.hora.substring(0, 2), 10) === horaInicio
                );
    
                mapaMedicos[medId].cards.push({
                    item: itemOriginal!,
                    horarioFormatado: grupo,
                    horaInicio: horaInicio
                });
            });
        });
    
        // 2. Transformar o mapa em array e aplicar as ordenações solicitadas
        return Object.values(mapaMedicos)
            .map(group => ({
                ...group,
                // Ordenação Secundária: Horas de início dos cards do médico
                cards: group.cards.sort((a, b) => a.horaInicio - b.horaInicio)
        }));
      }, [escalasPlantoesNoturnos]);  

    return (
        <div className={classNames(className,
                        'flex flex-wrap gap-1 bg-slate-50 border-slate-200'
                        )}>
        {loading ? (
            <div className="flex justify-center p-10 w-full">
                <i className="pi pi-spin pi-spinner text-blue-500 text-2xl" />
            </div>
        ) : (
            linhasPorMedico.map(linha => (
                <div key={linha.medicoSigla} className="flex flex-col gap-2 bottom-1">
                    {/* Lista Horizontal de Médicos */}
                    <div className="flex flex-row flex-wrap gap-1">
                        {linha.cards.map((escalaItem ,idx) => (
                            <div 
                                key={`${idx}-${escalaItem.horarioFormatado}`}
                                className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex 
                                            items-center gap-1 min-w-[135px] sm:min-w-[110px] shrink-0 active:scale-95 transition-transform"
                            >
                                <div 
                                    className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center overflow-hidden shrink-0"
                                    style={{ backgroundColor: escalaItem.item?.cor?.startsWith('#') ? escalaItem.item?.cor : `#${escalaItem.item?.cor}` }}
                                >
                                    {escalaItem.item?.icone ? (
                                        <img 
                                            src={String(escalaItem.item?.icone).startsWith('data:') ? (escalaItem.item?.icone as string) : `data:image/png;base64,${escalaItem.item?.icone}`}
                                            className="w-full h-full object-cover"
                                        />
                                      ) : <span className="text-white font-bold text-[10px]">{linha.medicoSigla}</span>}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-black text-slate-600 uppercase text-[12px] tracking-wider">
                                       {linha.medicoSigla}
                                  </span>
                                    <div className="text-blue-600 font-black text-[9px] flex items-center gap-1">
                                        <i className="pi pi-clock text-[9px]" />
                                        {escalaItem.horarioFormatado}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))
        )}
      </div>
    )

}