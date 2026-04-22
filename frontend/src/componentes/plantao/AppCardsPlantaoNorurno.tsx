import { server } from "@/api/server";
import { useAppToast } from "@/context/ToastContext";
import type { Escala, EscalaItem } from "@/types/escala";
import { DateUtils } from "@/utils/DateUtils";
import { processarHoras } from "@/utils/PlantoesUtils";
import { confirmDialog } from "primereact/confirmdialog";
import { classNames } from "primereact/utils";
import { useEffect, useMemo, useState } from "react";

export const AppCardsPlantaoNoturno = ({className = 'pl-1', dataAtual, atualiza, canALTERAR = false} : any) => {

    const [ loading, setLoading] = useState(false);
    const [ escalasPlantoesNoturnos, setEscalasPlantoesNoturnos] = useState<Escala[]>([]);
    const { showError } = useAppToast();

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
            cards: { escala: Escala;
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
                    escala,
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

    const saveBackend = async (escalaPlantao: Escala) => {
        try {
          setLoading(true) 
          const response = await server.api.criar("/plantao", escalaPlantao);
  
          setEscalasPlantoesNoturnos((prev) => {
            const novoEstado = prev.map((escalaLocal) => {
              if (response && escalaLocal.medicoId === response.medicoId && escalaLocal.data === response.data) {
                return {
                  ...response,
                  medicoSigla: escalaLocal.medicoSigla 
                };
              }
  
              return escalaLocal;
            });
  
            return novoEstado;
          });               
          const resEscalasPlantaoNorutn = await server.api.listarCustomizada<Escala>('/sudoku', '/listardianoturno', { data: DateUtils.paraISO(dataAtual) });
          setEscalasPlantoesNoturnos(resEscalasPlantaoNorutn || []);
        } catch (error: any) {
          const errorMessage = error.response?.data?.mensagem || "Ocorreu um erro inesperado ao excluir.";
          const errorCodigo = error.response?.data?.codigo;
    
          showError(errorCodigo === 'ACESSO_NEGADO' ? 'Acesso Negado' : 'Erro', errorMessage);
          console.error("Erro ao carregar dados do plantao:", error);
          return false
        } finally {
          setLoading(false)
        }
        return true;
      }    

    const deleteItem = async (medicoId: number, data: string, horarioFormatado: string) => {
        let escalaPersistir: Escala; 
  
        // Extraímos os números da string (ex: "7-13h" -> inicio: 7, fim: 13)
        const matches = horarioFormatado.match(/\d+/g);
        if (!matches || matches.length < 2) return;
        
        const inicioIntervalo = parseInt(matches[0], 10);
        const fimIntervalo = parseInt(matches[1], 10);
  
        let escalasAtualizadas = escalasPlantoesNoturnos?.map(escala => {
          if (escala.medicoId === medicoId && escala.data === data) {
            const novosItens = escala.itens?.filter(item => {
              const horaItem = parseInt(item.hora.split(':')[0], 10);
            
              if (inicioIntervalo > fimIntervalo) {
                const isNoIntervaloNoturno = (horaItem >= inicioIntervalo || horaItem < fimIntervalo);
                return !isNoIntervaloNoturno;
              }
  
              const isNoIntervaloSemediano = (horaItem >= inicioIntervalo && horaItem < fimIntervalo);
              return !isNoIntervaloSemediano;
            });
            escalaPersistir = {
              ...escala,
              itens: novosItens
            }
            return escalaPersistir;
          }
          return escala;
        }).filter(escala => escala.itens && escala.itens.length > 0);
  
        saveBackend(escalaPersistir!).then(ret => {
          if (ret) {
            setEscalasPlantoesNoturnos(escalasAtualizadas);
          }
        });
    };

    const confirmExclusao = (medicoId: number, data: string, horaInicio: string) => {
        confirmDialog({
            header: 'Confirmação de Esclusão',
            message: (
            <div className="flex flex-col items-center gap-3">
                <i className="pi pi-exclamation-triangle text-red-500 text-5xl"></i>
                <div className="text-center">
                <p className="text-lg font-bold text-gray-700 m-0">
                    Você está prestes a excluir este plantão.
                </p>
                <p className="text-gray-500 text-sm mt-1">
                    Esta ação não poderá ser desfeita. Tem certeza que deseja continuar?
                </p>
                </div>
            </div>
            ),
            icon: 'hidden',
            acceptLabel: 'Sim, Arquivar',
            rejectLabel: 'Não, Cancelar',
            
            acceptClassName: 'bg-red-600 hover:bg-red-700 text-white border-none px-6 py-2.5 font-bold shadow-md transition-all',
            rejectClassName: 'p-button-text p-button-secondary text-gray-600 hover:text-gray-800 px-6 py-2.5 font-bold',
            
            className: 'max-w-[480px] rounded-2xl border-none shadow-2xl',
            
            accept: async () => {
                await deleteItem(medicoId, data, horaInicio);
            }
        });
    };
    
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
                        {linha.cards.map(({escala, item, horarioFormatado} ,idx) => (
                            <div 
                                key={`${idx}-${horarioFormatado}`}
                                className="group relative bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex 
                                            items-center gap-1 min-w-[135px] sm:min-w-[110px] shrink-0 active:scale-95 transition-transform"
                            >
                                {canALTERAR && <button
                                    onClick={() => confirmExclusao(escala.medicoId, escala.data, horarioFormatado)}
                                    className="absolute -top-0.5 -right-0.5 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-600"
                                    >
                                    <i className="pi pi-times text-[16px]"></i>
                                 </button>}

                                <div 
                                    className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center overflow-hidden shrink-0"
                                    style={{ backgroundColor: item?.cor?.startsWith('#') ? item?.cor : `#${item?.cor}` }}
                                >
                                    {item?.icone ? (
                                        <img 
                                            src={String(item?.icone).startsWith('data:') ? (item?.icone as string) : `data:image/png;base64,${item?.icone}`}
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
                                        {horarioFormatado}
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