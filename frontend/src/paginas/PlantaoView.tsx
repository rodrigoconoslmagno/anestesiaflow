import { server } from "@/api/server";
import { useAppToast } from "@/context/ToastContext";
import type { Escala, EscalaItem } from "@/types/escala";
import type { Estabelecimento } from "@/types/estabelecimento";
import type { Medico } from "@/types/medico";
import { DateUtils } from "@/utils/DateUtils";
import clsx from "clsx";
import { addLocale, locale } from "primereact/api";
import { Button } from "primereact/button"
import { Calendar } from "primereact/calendar";
import { useEffect, useMemo, useState, type SetStateAction } from "react";
import { useNavigate } from "react-router-dom"
import { BlockUI } from 'primereact/blockui';
import { confirmDialog } from "primereact/confirmdialog";
import { Recurso } from "@/permissoes/recurso";
import { useAuthStore } from "@/permissoes/authStore";
import { IconeSirenePlantao } from "@/utils/IconeSirene";
import { processarHoras } from "@/utils/PlantoesUtils";
import { DialogoLancamento, type TimeInterval } from "@/componentes/sudoku/DialogoLancamto";

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

interface EscalaPlantao extends Escala {
  medico: Medico | undefined;
  itens: EscalaItemPlantao[];
}

interface EscalaItemPlantao extends EscalaItem {
    estabelecimento: Estabelecimento | undefined;
}

export const PlantaoView = () => {
    const navigate = useNavigate();
    const [date, setDate] = useState<Date>(new Date());
    const [escalas, setEscalas ] = useState<EscalaPlantao[]>([]);
    const [exibeDialogo, setExibeDialogo] = useState<boolean>(false);
    const [ sendMessaging, setSendMessaging ] = useState(false);
    const [ loading, setLoading ] = useState(false);
    const [ permiteArquivar, setPermiteArquivar ] = useState(false);
    const { showError } = useAppToast();
    const [datasComPlantao, setDatasComPlantao] = useState<string[]>([]);
    const [mesVisualizado, setMesVisualizado] = useState<Date>(new Date());

    const hasPerm = useAuthStore(state => state.hasPermission);

    const canArquivar = hasPerm(Recurso.PLANTAO,'ARQUIVAR');
    const canNotificar = hasPerm(Recurso.PLANTAO,'NOTIFICAR');
    const canALTERAR = hasPerm(Recurso.PLANTAO,'ALTERAR');

    const colunasPorEstabelecimento = useMemo(() => {
      const mapa: Record<number, { 
        unidade: Estabelecimento; 
        cards: { escala: EscalaPlantao; 
                 item: EscalaItemPlantao; 
                 horarioFormatado: string;
                 dataAssociacao: number }[]
      }> = {};

      escalas.forEach(escala => {    
        const itensPorEst: Record<number, number[]> = {};
        
        escala.itens?.forEach(item => {
          if (!item.estabelecimentoId) return;
          if (!itensPorEst[item.estabelecimentoId]) {
            itensPorEst[item.estabelecimentoId] = [];
          }
          const horaNum = parseInt(item.hora.substring(0, 2), 10);
          itensPorEst[item.estabelecimentoId].push(horaNum);
        });

        Object.keys(itensPorEst).forEach(estIdStr => {
          const estId = parseInt(estIdStr, 10);
          const horas = itensPorEst[estId];
          
          const stringHorarios = processarHoras(horas); 
          
          const grupos = stringHorarios.split(',').map(s => s.trim());

          if (!mapa[estId]) {
            const estObj = escala.itens.find(i => i.estabelecimentoId === estId)?.estabelecimento;
            mapa[estId] = { unidade: estObj!, cards: [] };
          }

          grupos.forEach(grupo => {
            mapa[estId].cards.push({
              escala,
              item: escala.itens.find(i => i.estabelecimentoId === estId)!,
              horarioFormatado: grupo,
              dataAssociacao: new Date(escala.medico?.dataAssociacao || 0).getTime()
            });
          });
        });
      });
    
      return Object.values(mapa).map(coluna => ({
        ...coluna,
        cards: coluna.cards.sort((a, b) => {
          const horaA = parseInt(a.horarioFormatado.split('-')[0], 10);
          const horaB = parseInt(b.horarioFormatado.split('-')[0], 10);
      
          if (horaA !== horaB) {
            return horaA - horaB;
          }
          return a.dataAssociacao - b.dataAssociacao;
        })
      }));
    }, [escalas]);

    const onDateSelect = (e: any) => {
      const novaData = e.value as Date;
      if (novaData) {
        setDate(novaData);
      }
    };

    useEffect(() => {
      const buscarDatasOcupadas = async () => {
        try {
          const res = await server.api.listarCustomizada<string>('/plantao', '/plantoes', mesVisualizado);
          setDatasComPlantao(res || []);
        } catch (error) {
          console.error("Erro ao buscar datas com plantão", error);
        }
      };
    
      buscarDatasOcupadas();
    }, [mesVisualizado]);

    useEffect(() => {
      if (!date) {
        return;
      }

      const carregarDados = async () => {
        setLoading(true);
  
        try {
          const dataFormatada = DateUtils.paraISO(date);
          const [ resEscalas, arquivado ] = await Promise.all([
            server.api.listarCustomizada<EscalaPlantao>('/plantao', '/listar',  dataFormatada ),
            server.api.postCustomizada<boolean>('/plantao', '/arquivado',  dataFormatada )
          ]);
  
          setPermiteArquivar(!arquivado)
          setEscalas(resEscalas || []);
        } catch (error: any) {
          const errorMessage = error.response?.data?.mensagem || "Ocorreu um erro inesperado ao excluir.";
          const errorCodigo = error.response?.data?.codigo;
    
          showError(errorCodigo === 'ACESSO_NEGADO' ? 'Acesso Negado' : 'Erro', errorMessage);
          console.error("Erro ao carregar dados do plantao:", error);
        } finally {
          setLoading(false);
        }
      };

      carregarDados()
    }, [date]);

    const saveEscala = (plantao: boolean, 
                    medicoId: number, 
                    estabelecimentoId: number, 
                    formData: {data: Date, horas: string[]}, 
                    customIntervals: TimeInterval[],
                    medico?: Medico, estabelecimento?: Estabelecimento) => {
      const dataString = DateUtils.paraISO(formData.data);
      const periodo1: EscalaItemPlantao[] = []
        formData.horas.forEach(hora => {
          const apenasNumeros = hora.replace(/\D/g, '');
          const horaSlot = parseInt(apenasNumeros.substring(0, 2), 10);
          let escalaItem: EscalaItemPlantao = {
            hora: hora,
            reagendado: false,
            estabelecimentoId: estabelecimentoId,
            cor: estabelecimento?.cor,
            icone: estabelecimento?.icone,
            estabelecimento: estabelecimento,
            plantao: plantao
          }
          periodo1.push(escalaItem);
          const array = horaSlot === 19 ? [1,2,3,4,5,6,7,8,9,10,11] : [1,2,3,4,5];
          Array.from(array).forEach((item: number) => {
            let incHora = horaSlot + item;
            if (incHora > 23) {
              incHora = incHora - 24;
            }
            const horaFormatada = `${incHora.toString().padStart(2, '0')}:00:00`;
            let escalaItem: EscalaItemPlantao = {
              hora: horaFormatada,
              reagendado: false,
              estabelecimentoId: estabelecimentoId,
              cor: estabelecimento?.cor,
              icone: estabelecimento?.icone,
              estabelecimento: estabelecimento,
              plantao: plantao
            }
            periodo1.push(escalaItem);
          })
        });

        customIntervals.forEach(item => {
          if (item.start != null) {
            const diferenca = item.end!.getHours() - item.start!.getHours();
            if (diferenca > 1){
              let horaSlot = item.start!.getHours();
              for(let i = 0; i < diferenca; i++) {
                const horaFormatada = `${horaSlot.toString().padStart(2, '0')}:00:00`;
                let escalaItem: EscalaItemPlantao = {
                  hora: horaFormatada,
                  reagendado: false,
                  estabelecimentoId: estabelecimentoId,
                  cor: estabelecimento?.cor,
                  icone: estabelecimento?.icone,
                  estabelecimento: estabelecimento,
                  plantao: plantao
                }
                periodo1.push(escalaItem);
                horaSlot++;
                if (horaSlot > 23) {
                  horaSlot = horaSlot - 24;
                }
              }
            } else {
              const horaFormatada = `${item.start!.getHours().toString().padStart(2, '0')}:00:00`;
              let escalaItem: EscalaItemPlantao = {
                hora: horaFormatada,
                reagendado: false,
                estabelecimentoId: estabelecimentoId,
                cor: estabelecimento?.cor,
                icone: estabelecimento?.icone,
                estabelecimento: estabelecimento,
                plantao: plantao
              }
              periodo1.push(escalaItem);
            }
          }
        });

        let escalaPersistir: EscalaPlantao;

        let exists = escalas.filter((escala: EscalaPlantao) => escala.medicoId === medicoId &&
                      escala.data === dataString)
        let novasEscalas: SetStateAction<EscalaPlantao[]>;
        if (exists.length > 0) {
          novasEscalas = escalas.map(escala => {
            if (escala.medicoId === medicoId && escala.data === dataString) {
              escalaPersistir = {
                ...escala,
                itens: [...escala.itens, ...periodo1]
              }
              return escalaPersistir;
            }
            return escala;
          });
        } else {
          escalaPersistir = {
            data: DateUtils.paraISO(formData.data),
            medicoId: medicoId as number,
            plantao: plantao,
            itens: periodo1,
            medico: medico,
          }
        }

        setExibeDialogo(false)

        saveBackend(escalaPersistir!).then(ret => {
          if (ret){
            if (novasEscalas) {
              setEscalas(novasEscalas); 
            } else {
              setEscalas([...escalas, escalaPersistir])
            }
          }
        });
    };

    const saveBackend = async (escalaPlantao: EscalaPlantao) => {
      try {
        setLoading(true) 
        const response = await server.api.criar("/plantao", escalaPlantao);

        setEscalas((prev) => {
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
        const arquivado = await server.api.postCustomizada<boolean>('/plantao', '/arquivado',  escalaPlantao.data );
        setPermiteArquivar(!arquivado)
        const responsePlantoes = await server.api.listarCustomizada<string>('/plantao', '/plantoes', mesVisualizado);
        setDatasComPlantao(responsePlantoes || []);   
      } catch (error: any) {
        const errorMessage = error.response?.data?.mensagem || "Ocorreu um erro inesperado ao excluir.";
        const errorCodigo = error.response?.data?.codigo;
  
        showError(errorCodigo === 'ACESSO_NEGADO' ? 'Acesso Negado' : 'Erro', errorMessage);
        console.error("Erro ao carregar dados do plantao:", error);
        return false
      } finally {
        setExibeDialogo(false)
        setLoading(false)
      }
      return true;
    }

    const handleNovoPlantao = () => {
      setExibeDialogo(true);
    }

    const getNomeEstabelecimento = (estabelecimento: Estabelecimento): string => {
      if (estabelecimento.sigla) {
          return estabelecimento.sigla;
      }

      if (estabelecimento.nome?.length <= 5) {
          return estabelecimento.nome;
      }

      return estabelecimento.nome?.substring(0, 5);
    };

    const handleEnciarMensagem = async () => {
      try {
        setSendMessaging(true);
        await server.api.postCustomizada('/notification', '/send-notification', 
          { mensagem: "Plantão atualizado, entrar para conferrir."});
      } finally {
        setSendMessaging(false);
      }    
    }

    const deleteItem = async (medicoId: number, data: string, horarioFormatado: string) => {
      let escalaPersistir: EscalaPlantao; 

      // Extraímos os números da string (ex: "7-13h" -> inicio: 7, fim: 13)
      const matches = horarioFormatado.match(/\d+/g);
      if (!matches || matches.length < 2) return;
      
      const inicioIntervalo = parseInt(matches[0], 10);
      const fimIntervalo = parseInt(matches[1], 10);

      let escalasAtualizadas = escalas.map(escala => {
        if (escala.medicoId === medicoId && escala.data === data) {
          const novosItens = escala.itens.filter(item => {
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
      }).filter(escala => escala.itens.length > 0);

      saveBackend(escalaPersistir!).then(ret => {
        if (ret) {
          setEscalas(escalasAtualizadas);
        }
      });
    };

    const confirmArquivamento = () => {
      confirmDialog({
        header: 'Confirmação de Arquivamento',
        message: (
          <div className="flex flex-col items-center gap-3">
            <i className="pi pi-exclamation-triangle text-red-500 text-5xl"></i>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-700 m-0">
                Você está prestes a arquivar este plantão.
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
          try {
            await server.api.postCustomizada('/plantao', '/arquivar', DateUtils.paraISO(date));
            setPermiteArquivar(false);
          } catch (err: any) {
            const errorMessage = err.response?.data?.mensagem || "Ocorreu um erro inesperado ao salvar.";
            const errorCodigo = err.response?.data?.codigo;
      
            showError(errorCodigo === 'ACESSO_NEGADO' ? 'Acesso Negado' : 'Erro', errorMessage);
          }
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

    return (
      <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">

        <header className='
            flex items-center justify-between sm:px-4 sm:py-3 px-2 py-1 bg-white border-b transition-all duration-300 relative overflow-hidden border-slate-200'>
  
          <div className="flex items-center gap-3 mr-2">
            <Button 
              icon="pi pi-times" 
              label="Sair"
              text
              severity="danger"
              className="hidden md:flex px-4 h-full w-full border-red-200 text-red-500 hover:bg-red-50"
              onClick={() => navigate("/dashboard")} 
            />
            <Button 
              icon="pi pi-arrow-left" 
              className="p-button-rounded p-button-text p-button-secondary h-auto md:hidden border-red-200 text-red-500" 
              onClick={() => navigate("/dashboard")} 
            />
            <h1 className="text-lg md:text-xl font-black text-slate-700 m-0">
              Plantão
            </h1>
          </div>

          <div className="flex gap-2">
            {canArquivar && <Button icon="pi pi-box" 
                    onClick={confirmArquivamento}
                    disabled={!permiteArquivar || loading}
                    tooltip="Arquivar" 
                    className="p-button-outlined p-button-secondary p-button-sm transition-all p-1 border-amber-500 text-amber-600 hover:bg-amber-50" 
            />}
            {canNotificar && <div className={clsx(
                "relative inline-flex items-center justify-center rounded-md p-[2px] transition-all duration-300",
                sendMessaging ? "animate-glow-around bg-blue-500/20" : "bg-transparent"
              )}>`
                {sendMessaging && (
                  <div className="absolute inset-0 rounded-md animate-pulse bg-gradient-to-r from-blue-400 to-emerald-400 opacity-50 blur-[2px]" />
                )}
                
                <Button 
                  icon={sendMessaging ? "pi pi-spin pi-spinner" : "pi pi-send"} 
                  disabled={colunasPorEstabelecimento.length === 0 || loading || sendMessaging}
                  onClick={handleEnciarMensagem}
                  tooltip="Notificar" 
                  className={clsx(
                    "p-button-outlined p-button-secondary p-button-sm transition-all p-1 border-slate-400 text-slate-500 hover:bg-slate-50 z-10",
                    "!rounded-md" 
                  )}
                />
              </div>
            }
          </div>
        </header>

        <main className="flex-grow sm:!p-2 !p-0 overflow-y-auto">
          <BlockUI blocked={loading} template={<i className="pi pi-spin pi-spinner text-3xl text-white"/>}>
            <div className="space-y-4 flex-1 min-h-[400px]">
              <div className="flex flex-col gap-4 md:gap-8 max-w-7xl mx-auto pb-10">
                <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl border border-slate-200 overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-3 md:p-6 border-b md:border-b-0 md:border-r border-slate-100">
                      <div className="flex items-center gap-2 mb-2 md:mb-4 text-slate-700 font-bold text-sm md:text-base">
                          <i className="pi pi-calendar text-blue-500"></i>
                          Calendário
                        </div>
                        <Calendar 
                          value={date}
                          onChange={onDateSelect} 
                          onMonthChange={(e) => setMesVisualizado(new Date(e.year, e.month - 1, 1))}
                          inline
                          minDate={new Date()} 
                          className="w-full border-none"
                          locale="pt-br"
                          showButtonBar
                          hideOnDateTimeSelect={true}
                          readOnlyInput   
                          dateTemplate={dateTemplate}                     
                        />
                      </div>

                    <div className="flex-1 min-w-0 p-4 md:p-6 bg-slate-50/30 flex flex-col overflow-hidden">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3 md:gap-4 w-full">
                        <div className="flex flex-row items-center gap-2">
                            <h2 className="text-base md:text-xl font-bold text-slate-800 flex items-center gap-2">
                              <i className="pi pi-clock text-blue-500"></i>
                              {date?.toLocaleDateString('pt-BR')}
                            </h2>
                            <IconeSirenePlantao className="w-8 h-8 animate-pulse" />
                          </div>
                          {canALTERAR && (
                            <Button 
                              label="Novo" 
                              icon="pi pi-plus" 
                              className="p-button-sm p-button-primary w-full sm:w-auto bg-blue-600 text-white p-2 rounded-xl" 
                              onClick={handleNovoPlantao}
                            />
                          )}
                        </div>

                        <div className="flex flex-row flex-nowrap gap-4 overflow-x-auto w-full max-w-full pb-4 custom-scrollbar">
                          {colunasPorEstabelecimento.length === 0 ? (
                              <div className="flex flex-col items-center justify-center w-full py-12 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400">
                                <i className="pi pi-clock text-4xl mb-3 opacity-20"></i>
                                <p className="text-sm font-medium">Nenhum plantão para esta data.</p>
                                {canALTERAR && <Button 
                                  label="Gerar Escala Agora" 
                                  link 
                                  className="mt-2 text-blue-600" 
                                  onClick={handleNovoPlantao}
                                />}
                              </div>
                            ) : (
                              <div className="flex-1 min-w-0 overflow-hidden flex flex-col"> 
                                <div className="flex flex-row flex-nowrap gap-4 overflow-x-auto pb-4 custom-scrollbar scroll-smooth">
                                  {colunasPorEstabelecimento.map(coluna => (
                                    <div key={coluna.unidade.id} 
                                         className="flex flex-col flex-none gap-2 w-[30%] max-h-[250px] md:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar pt-2">
                                      {coluna.cards.map(({ escala, item, horarioFormatado}, idxItem) => (
                                        <div 
                                          key={`${escala.medicoId}-${horarioFormatado}-${idxItem}`}
                                          className="group relative bg-white p-2 rounded-xl border border-slate-100 shadow-sm flex items-center gap-0 md:gap-2">
                                          
                                          {canALTERAR && <button
                                            onClick={() => confirmExclusao(escala.medicoId, escala.data, horarioFormatado)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-600"
                                          >
                                            <i className="pi pi-times text-[16px]"></i>
                                          </button>}
                                          
                                          <div className="flex items-center justify-center min-h-[28px] min-w-[28px]">
                                            <div
                                              className="w-[28px] h-[28px] rounded-full border border-white shadow-inner flex items-center justify-center overflow-hidden"
                                              style={{ backgroundColor: item.cor?.startsWith('#') ? item.cor : `#${item.cor}` }}
                                            >
                                              {item.icone ? (
                                                <img 
                                                  src={String(item.icone).startsWith('data:') ? (item.icone as string) : `data:image/png;base64,${item.icone}`}
                                                  className="object-contain"
                                                  alt={item.estabelecimento?.nome}
                                                />
                                              ) : <i className="text-white text-[11px]" />}
                                            </div>
                                          </div>
                              
                                          <div className="flex-1 min-w-0">
                                            <div className="text-blue-600 font-black text-[9px] uppercase tracking-tight flex items-center gap-1 mb-0.5">
                                              <i className="pi pi-clock text-[10px]"></i>
                                              {/* {item.hora.split(':')[0]} - {horaSlot === 7 ? 13 : horaSlot === 13 ? 19 : 7}h */}
                                              {horarioFormatado}
                                            </div>
                                            <div className="text-slate-800 font-extrabold text-xs md:text-sm flex items-center gap-1.5">
                                              {escala.medico?.sigla}              
                                            </div>
                                            <div className="text-slate-400 text-[9px] font-medium truncate">
                                              {item.estabelecimento ? getNomeEstabelecimento(item.estabelecimento) : ""} 
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ))
                                  }
                              </div>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                </div>
              </div>
            </div>
          </BlockUI>
        </main>

        <DialogoLancamento 
          forcarPlantao={true}
          date={date} 
          saveEscala={saveEscala}
          escalas={escalas} 
          exibeDialogo={exibeDialogo}
          closeDialog={() => setExibeDialogo(false)}
        />
      </div>
  )
}