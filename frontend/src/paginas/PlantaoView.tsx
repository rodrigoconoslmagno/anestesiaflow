import { server } from "@/api/server";
import { AppSelect } from "@/componentes/select/AppSelect";
import { useAppToast } from "@/context/ToastContext";
import type { Escala, EscalaItem, EscalaSemana } from "@/types/escala";
import type { Estabelecimento } from "@/types/estabelecimento";
import type { Medico } from "@/types/medico";
import { DateUtils } from "@/utils/DateUtils";
import clsx from "clsx";
import { addLocale, locale } from "primereact/api";
import { Button } from "primereact/button"
import { Calendar } from "primereact/calendar";
import { Dialog } from "primereact/dialog";
import { useEffect, useMemo, useState, type SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom"
import { BlockUI } from 'primereact/blockui';
import { confirmDialog } from "primereact/confirmdialog";
import { Recurso } from "@/permissoes/recurso";
import { useAuthStore } from "@/permissoes/authStore";
import { IconeSirenePlantao } from "@/utils/IconeSirene";
import { Dropdown } from "primereact/dropdown";
import { processarHoras } from "@/utils/PlantoesUtils";

interface TimeInterval {
  id: string;
  start: Date | null;
  end: Date | null;
  error?: string;
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

interface EscalaPlantao extends Escala {
  medico: Medico | undefined;
  itensPlantao: EscalaItemPlantao[];
}

interface EscalaItemPlantao extends EscalaItem {
    estabelecimento: Estabelecimento | undefined;
}

export const PlantaoView = () => {
    const navigate = useNavigate();
    const [date, setDate] = useState<Date>(new Date());
    const [escalas, setEscalas ] = useState<EscalaPlantao[]>([]);
    const [exibeDialogo, setExibeDialogo] = useState<boolean>(false);
    const [ medicoId, setMedicoId ] = useState<number>();
    const [ estabelecimentoId, setEstabelecimentoId ] = useState();
    const [ estabelecimento, setEstabelecimento ] = useState<Estabelecimento>();
    const [ medico, setMedico ] = useState<Medico>();
    const [ sendMessaging, setSendMessaging ] = useState(false);
    const [ loading, setLoading ] = useState(false);
    const [ permiteArquivar, setPermiteArquivar ] = useState(false);
    const { showError, showWarn } = useAppToast();
    const [datasComPlantao, setDatasComPlantao] = useState<string[]>([]);
    const [mesVisualizado, setMesVisualizado] = useState<Date>(new Date());

    const [customIntervals, setCustomIntervals] = useState<TimeInterval[]>([
      { id: "", start: null, end: null }
    ]);

    const hasPerm = useAuthStore(state => state.hasPermission);

    const canArquivar = hasPerm(Recurso.PLANTAO,'ARQUIVAR');
    const canNotificar = hasPerm(Recurso.PLANTAO,'NOTIFICAR');
    const canALTERAR = hasPerm(Recurso.PLANTAO,'ALTERAR');

    const intervalos = useMemo(() => [
          {field: "07:00:00", header: '07-13h'},
          {field: "13:00:00", header: '13-19h'},
          {field: "19:00:00", header: '19-07h'}
    ], []);

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
        
        escala.itensPlantao.forEach(item => {
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
            const estObj = escala.itensPlantao.find(i => i.estabelecimentoId === estId)?.estabelecimento;
            mapa[estId] = { unidade: estObj!, cards: [] };
          }

          grupos.forEach(grupo => {
            mapa[estId].cards.push({
              escala,
              item: escala.itensPlantao.find(i => i.estabelecimentoId === estId)!,
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

    const [formData, setFormData] = useState({
          data: date,
          horas: [] as string[]
    });

    const methods = useForm<EscalaSemana[]>({    
    });

    const onDateSelect = (e: any) => {
      const novaData = e.value as Date;
      if (novaData) {
        setDate(novaData);
        setFormData(prev => ({
          ...prev,
          data: novaData
        }));
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

    const saveEscala = () => {
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
            plantao: true
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
              plantao: true
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
                  plantao: true
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
                plantao: true
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
                itensPlantao: [...escala.itensPlantao, ...periodo1]
              }
              return escalaPersistir;
            }
            return escala;
          });
        } else {
          escalaPersistir = {
            data: DateUtils.paraISO(formData.data),
            medicoId: medicoId as number,
            plantao: true,
            itensPlantao: periodo1,
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
      setMedico(undefined)
      setMedicoId(undefined);
      setEstabelecimento(undefined);
      setEstabelecimentoId(undefined);
      setFormData({
        data: date,
        horas: []
      });
      setCustomIntervals([{id: "", start: null, end: null}])
      setExibeDialogo(true);
    }

    const footerContent = (
      <div className="flex justify-end gap-2 mt-4">
        <Button 
          label="Cancelar" 
          icon="pi pi-times" 
          onClick={() => setExibeDialogo(false)} 
          className="p-button-text p-button-secondary" 
        />
        <Button 
          label="Salvar" 
          icon="pi pi-save" 
          onClick={saveEscala} 
          disabled={!(medicoId && estabelecimentoId && 
              (formData.horas.length > 0 || customIntervals.length > 0))}
          autoFocus
          className={`p-button-primary text-white rounded-xl p-2 bg-blue-600`}
        />
      </div>
    );

    const medicoTemplate = (option: Medico) => {
      if (!option) {
          return "Selecione um médico";
      }
      return option.sigla ? `${option.nome} - ${option.sigla}` : option.nome;
    };

    const getNomeEstabelecimento = (estabelecimento: Estabelecimento): string => {
      if (estabelecimento.sigla) {
          return estabelecimento.sigla;
      }

      if (estabelecimento.nome?.length <= 5) {
          return estabelecimento.nome;
      }

      return estabelecimento.nome?.substring(0, 5);
    };

    const estabelecimentoTemplate = (option: Estabelecimento) => {
      if (!option) {
          return "Selecione uma clinica/hospital";
      }

      return (
        <div
          className={`flex items-center justify-center transition-all min-h-[28px] min-w-[28px]
            'cursor-pointer hover:bg-blue-50/50`}
        >
          <div
              className={`w-[28px] h-[28px] rounded-full border border-white shadow-inne flex items-center justify-center animate-fadein overflow-hidden`}
              style={{ backgroundColor: option.cor?.startsWith('#') ? option.cor : `#${option.cor}` }}
          >
              {option.icone ? (
                  <img 
                        src={((option.icone as any) as string).startsWith('data:') 
                        ? (option.icone as string) 
                        : `data:image/png;base64,${option.icone}`}
                      className="object-contain"
                      alt={option.nome}
                  />
              ) : <i className=" text-white text-[11px]" />}
          </div>
          {getNomeEstabelecimento(option)}
      </div>
      )
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
          const novosItens = escala.itensPlantao.filter(item => {
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
            itensPlantao: novosItens
          }
          return escalaPersistir;
        }
        return escala;
      }).filter(escala => escala.itensPlantao.length > 0);

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

    const isManualDisabled = formData && formData.horas.length === 3;

    const setIntervaloManual = () =>{
      if (isManualDisabled && customIntervals.length > 0) {
        setCustomIntervals([])
      } else {
        if (!isManualDisabled && customIntervals.length == 0){
          setCustomIntervals([{id: "", start: null, end: null}])
        }
      }
    }

    setIntervaloManual();

    const timeOptions = Array.from({ length: 24 }, (_, i) => {
      const time = `${i.toString().padStart(2, '0')}:00`;
      return { label: time, value: time };
    });

    const getHoursValue = (date: Date | null) => {
      if (!date) return null;
      const hours = date.getHours();
      const day = date.getDate();
      return day === 2 ? hours + 24 : hours;
    };

    const formatDateToTimeString = (date: Date | null) => {
      if (!date) {
        return ''
      }
      return `${date.getHours().toString().padStart(2, '0')}:00`;
    };

    const getFilteredTimeOptions = (id: string, field: 'start' | 'end') => {
      const now = new Date();
      const isToday = date && 
                      date.getDate() === now.getDate() && 
                      date.getMonth() === now.getMonth() && 
                      date.getFullYear() === now.getFullYear();
      
      const currentHour = now.getHours();
  
      const filtered = timeOptions.filter(opt => {
        const h = parseInt(opt.value.split(':')[0], 10);
        let hourVal = h;
        
        const currentInterval = customIntervals.find(i => i.id === id);
        const startHour = currentInterval?.start ? getHoursValue(currentInterval.start)! : null;
  
        // For End Time, if hour is less than or equal to start hour, it's the next day
        if (field === 'end' && startHour !== null && hourVal <= startHour % 24) {
          hourVal += 24;
        }
  
        // Rule 1: If today, no past hours
        if (isToday && hourVal < currentHour) {
          return false;
        }
  
        // Rule 2 & 3: Check for conflicts with fixed intervals
        const isFixedConflict = formData.horas.some(fixed => {
          let fStart = 0, fEnd = 0;
          if (fixed === '07:00:00') { 
            fStart = 7; 
            fEnd = 13; 
          } else if (fixed === '13:00:00') { 
            fStart = 13; 
            fEnd = 19; 
          } else if (fixed === '19:00:00') { 
            fStart = 19; 
            fEnd = 31; 
          }
  
          if (field === 'start') {
            return (hourVal >= fStart && hourVal < fEnd) || (hourVal >= fStart + 24 && hourVal < fEnd + 24);
          } else {
            return (hourVal > fStart && hourVal <= fEnd) || (hourVal > fStart + 24 && hourVal <= fEnd + 24);
          }
        });

        if (isFixedConflict) {
          return false;
        }
  
        // Rule 5: Check for conflicts with other manual intervals
        const isManualConflict = customIntervals.some(other => {
          if (other.id === id || !other.start || !other.end) return false;
          const oStart = getHoursValue(other.start)!;
          const oEnd = getHoursValue(other.end)!;
          
          if (field === 'start') {
            return hourVal >= oStart && hourVal < oEnd;
          } else {
            return hourVal > oStart && hourVal <= oEnd;
          }
        });
        if (isManualConflict) return false;
  
        // Limit to 07:00 of next day
        if (hourVal > 31) {
          return false;
        }
  
        // Visual Touch: For End Time, hide hours before Start Time on future dates
        if (field === 'end' && startHour !== null && !isToday) {
          if (hourVal <= startHour) return false;
        }
  
        return true;
      });
  
      // Sort for End field to show chronological order starting from the hour after Start
      if (field === 'end') {
        const currentInterval = customIntervals.find(i => i.id === id);
        const startHour = currentInterval?.start ? getHoursValue(currentInterval.start)! : null;
        
        if (startHour !== null) {
          return [...filtered].sort((a, b) => {
            let aHour = parseInt(a.value.split(':')[0], 10);
            let bHour = parseInt(b.value.split(':')[0], 10);
            // Adjust for next day interpretation in sorting
            if (aHour <= startHour % 24) aHour += 24;
            if (bHour <= startHour % 24) bHour += 24;
            return aHour - bHour;
          });
        }
      }
  
      return filtered;
    };

    const getDynamicIntervalOptions = () => {
      const now = new Date();
      const isToday = date && 
                      date.getDate() === now.getDate() && 
                      date.getMonth() === now.getMonth() && 
                      date.getFullYear() === now.getFullYear();
      
      const currentHour = now.getHours();

      const hasManualConflict = (fStart: number, fEnd: number, crossesMidnight: boolean) => {
        return customIntervals.some(manual => {
          const start = getHoursValue(manual.start);
          const end = getHoursValue(manual.end);
          if (start === null || end === null) {
            return false;
          }

          if (crossesMidnight) {
            // Turno 19h-07h (19 a 31)
            return (start < 24 && end > 19) || (start < 7 && end > 0);
          } else {
            return start < fEnd && end > fStart;
          }
        });
      };

      return [
        { 
          label: '07h - 13h', 
          value: '7-13', 
          disabled: (isToday && currentHour >= 7) || hasManualConflict(7, 13, false) 
        },
        { 
          label: '13h - 19h', 
          value: '13-19', 
          disabled: (isToday && currentHour >= 13) || hasManualConflict(13, 19, false) 
        },
        { 
          label: '19h - 07h', 
          value: '19-7', 
          disabled: (isToday && currentHour >= 19) || hasManualConflict(19, 7, true) 
        }
      ];
    };

    const validateIntervals = (intervals: TimeInterval[], fixedOverride?: string[]) => {
      const activeFixed = fixedOverride !== undefined ? fixedOverride : formData.horas;
      
      return intervals.map((current, index) => {
        const startHour = getHoursValue(current.start);
        const endHour = getHoursValue(current.end);
  
        if (startHour === null || endHour === null) {
          return { ...current, error: undefined };
        }
  
        // 1. Check if end is before start
        if (endHour <= startHour) {
          return { ...current, error: 'A hora de término deve ser após a hora de início.' };
        }
  
        // 2. Check for overlaps with other custom intervals
        for (let i = 0; i < intervals.length; i++) {
          if (i === index) continue;
          const other = intervals[i];
          const otherStart = getHoursValue(other.start);
          const otherEnd = getHoursValue(other.end);
  
          if (otherStart === null || otherEnd === null) {
            continue;
          }
  
          // Overlap logic: (StartA < EndB) and (EndA > StartB)
          if (startHour < otherEnd && endHour > otherStart) {
            return { ...current, error: 'Este intervalo entra em conflito com outro intervalo manual.' };
          }
        }
  
        // 3. Check for overlaps with selected fixed intervals
        if (activeFixed && activeFixed.length > 0) {
          for (const fixed of activeFixed) {
            let fStart = 0;
            let fEnd = 0;
            let crossesMidnight = false;
  
            if (fixed === '7-13') { fStart = 7; fEnd = 13; }
            else if (fixed === '13-19') { fStart = 13; fEnd = 19; }
            else if (fixed === '19-7') { fStart = 19; fEnd = 7; crossesMidnight = true; }
  
            if (crossesMidnight) {
              // Check overlap with 19:00-24:00 (19-24)
              if (startHour < 24 && endHour > 19) {
                return { ...current, error: 'Conflito com o turno pré-definido 19h - 07h.' };
              }
              // Check overlap with 00:00-07:00 (0-7)
              if (startHour < 7 && endHour > 0) {
                return { ...current, error: 'Conflito com o turno pré-definido 19h - 07h.' };
              }
            } else {
              if (startHour < fEnd && endHour > fStart) {
                const label = getDynamicIntervalOptions().find(o => o.value === fixed)?.label;
                return { ...current, error: `Conflito com o turno pré-definido ${label}.` };
              }
            }
          }
        }
  
        return { ...current, error: undefined };
      });
    };

    const normalizeTime = (date: Date | null) => {
      if (!date) {
        return null;
      }
      // Preserve the day (Day 1 or Day 2) if it's already set correctly
      const day = date.getDate();
      const d = new Date(2000, 0, day, date.getHours(), date.getMinutes(), 0, 0);
      return d;
    };

    const parseTimeStringToDate = (timeStr: string | null) => {
      if (!timeStr) return null;
      const parts = timeStr.split(':');
      const hours = parseInt(parts[0], 10);
      if (isNaN(hours) || hours > 23) return null;
      return new Date(2000, 0, 1, hours, 0, 0, 0);
    };

    const updateInterval = (id: string, field: 'start' | 'end', value: Date | null) => {
      let normalizedValue = normalizeTime(value);
      const current = customIntervals.find(i => i.id === id);
      if (!current) {
        return;
      }
  
      let updatedInterval = { ...current, [field]: normalizedValue };
  
      // Auto-fill end time if start is selected and end is empty
      if (field === 'start' && normalizedValue && !current.end) {
        const suggestedEnd = new Date(normalizedValue);
        suggestedEnd.setHours(suggestedEnd.getHours() + 1);
        let finalEnd = normalizeTime(suggestedEnd);
        
        // Handle midnight crossing for the suggested end
        if (finalEnd) {
          const startH = normalizedValue.getHours();
          const endH = finalEnd.getHours();
          if (endH <= startH) {
            finalEnd = new Date(2000, 0, 2, endH, 0, 0, 0);
          } else {
            finalEnd = new Date(2000, 0, 1, endH, 0, 0, 0);
          }
        }
        updatedInterval.end = finalEnd;
      }
  
      // Handle midnight crossing for end time when manually selected
      if (field === 'end' && normalizedValue) {
        if (current.start) {
          const startH = current.start.getHours();
          const endH = normalizedValue.getHours();
          // If end hour is less than or equal to start hour, it's next day
          if (endH <= startH) {
            updatedInterval.end = new Date(2000, 0, 2, endH, 0, 0, 0);
          } else {
            updatedInterval.end = new Date(2000, 0, 1, endH, 0, 0, 0);
          }
        }
      }
  
      const updated = customIntervals.map(interval => 
        interval.id === id ? updatedInterval : interval
      );
      const validated = validateIntervals(updated);
      
      // Check if a new error was introduced compared to previous state
      const currentInterval = validated.find(i => i.id === id);
      const previousInterval = customIntervals.find(i => i.id === id);
      
      if (currentInterval?.error && currentInterval.error !== previousInterval?.error) {
        showError('Operação Bloqueada', currentInterval.error);
        // Hard block: do not update state if it causes an error
        return;
      }
      
      setCustomIntervals(validated);
    };

    const canAddInterval = !isManualDisabled && customIntervals.every(i => i.start && i.end);

    const addInterval = () => {
      if (!canAddInterval) {
        showWarn('Intervalo Incompleto', 'Preencha o início e o término do intervalo atual antes de adicionar um novo.');
        return;
      }
  
      const lastInterval = customIntervals[customIntervals.length - 1];
      const nextStart = lastInterval ? lastInterval.end : null;
      let nextEnd = null;
  
      if (nextStart) {
        nextEnd = new Date(nextStart);
        nextEnd.setHours(nextEnd.getHours() + 1);
      }
  
      const newIntervals = [...customIntervals, { 
                    id: nextStart!.toTimeString() + nextEnd!.toTimeString(), start: nextStart, end: nextEnd }];
      setCustomIntervals(validateIntervals(newIntervals));
    };

    const removeInterval = (id: string) => {
      if (customIntervals.length > 1) {
        const filtered = customIntervals.filter(interval => interval.id !== id);
        setCustomIntervals(validateIntervals(filtered));
      }
    };

    const TimeSlotPicker = ({ intervals, selectedHours, onChange }: any) => {
      const [isSelecting, setIsSelecting] = useState(false);
  
      const isHoraPassada = (hourField: string) => {
          const hoje = new Date();
          const dataSelecionada = formData.data;
          if (dataSelecionada.toDateString() === hoje.toDateString()) {
              const horaAtual = hoje.getHours();
              const apenasNumeros = hourField.replace(/\D/g, '');
              const horaSlot = parseInt(apenasNumeros.substring(0, 2), 10);
              return horaSlot < horaAtual;
          }
          return false;
      };

      const isHoraAlocada = (hourField: string) => {
        const apenasNumerosParam = hourField.replace(/\D/g, '');
        const horaSlotParam = parseInt(apenasNumerosParam.substring(0, 2), 10);
        const analise = escalas.filter(escala => {
          if (escala.medicoId == medicoId && escala.data === DateUtils.paraISO(date)) {
            const itens = escala.itensPlantao.filter(item => {
              const apenasNumeros = item.hora.replace(/\D/g, '');
              const horaSlot = parseInt(apenasNumeros.substring(0, 2), 10);
              if ((horaSlot === 7 && horaSlot === horaSlotParam) || 
                  (horaSlot === 13 && horaSlot === horaSlotParam) || 
                  (horaSlot === 19 && horaSlot === horaSlotParam)
              ) {
                return item 
              }
            })
            if (itens && itens.length > 0) {
              return escala
            }
          }
        })

        return analise && analise.length > 0
      }
  
      const isIntervaloManual = (hourField: string) => {
        // 1. Converte a string (ex: "07") para número
        const startHourInput = parseInt(hourField, 10);
        
        // 2. Define o fim do intervalo (ex: se começa as 7, termina as 13)
        // Ajuste o "+ 6" para o tamanho real do seu turno
        const endHourInput = startHourInput + 6;

        return customIntervals.some((interval) => {
          if (!interval.start || !interval.end) {
            return false;
          }

          const existingStart = interval.start.getHours();
          const existingEnd = interval.end.getHours();

          const hasOverlap = startHourInput < existingEnd && endHourInput > existingStart;

          return hasOverlap;
        });
      }

      const analiseDesabilitar = (hora: string): boolean => {
        return !(medicoId && estabelecimentoId) ||
                (medicoId && estabelecimentoId && isHoraPassada(hora)) ||
                (medicoId && estabelecimentoId && isHoraAlocada(hora)) ||
                (medicoId && estabelecimentoId && isIntervaloManual(hora));
      }

      const toggleHour = (hourField: string) => {
          if (analiseDesabilitar(hourField)) {
              return;
          }
          const newSelection = selectedHours.includes(hourField)
          ? selectedHours.filter((h: string) => h !== hourField)
          : [...selectedHours, hourField];
          onChange(newSelection);
      };
  
      const handleMouseDown = (hourField: string) => {
          if (analiseDesabilitar(hourField)) {
            return;
          }
          setIsSelecting(true);
          toggleHour(hourField);
      };
  
      const handleMouseEnter = (hourField: string) => {
          if (isSelecting && !analiseDesabilitar(hourField)) {
              if (!selectedHours.includes(hourField)) {
                  onChange([...selectedHours, hourField]);
              }
          }
      };

      return (
          <div 
              className="grid grid-cols-3 gap-2 p-2 bg-slate-100 rounded-xl select-none"
              onMouseUp={() => setIsSelecting(false)}
              onMouseLeave={() => setIsSelecting(false)}
          >
              {intervals.map((int: any) => {
                  const desabilitado = analiseDesabilitar(int.field);
                  const selecionado = selectedHours.includes(int.field);

                  return (
                      <div
                          key={int.field}
                          onMouseDown={() => handleMouseDown(int.field)}
                          onMouseEnter={() => handleMouseEnter(int.field)}
                          className={`
                              flex items-center justify-center p-2 rounded-lg transition-all duration-200
                              h-12 text-center border
                              ${desabilitado 
                                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60 border-slate-300' 
                                  : selecionado 
                                      ? 'bg-blue-600 text-white shadow-md scale-105 border-blue-700' 
                                      : 'bg-white text-slate-600 hover:bg-blue-50 border-slate-200 cursor-pointer'}
                          `}
                      >
                          <span className="text-[12px] font-bold uppercase whitespace-nowrap leading-none">
                              {int.header}
                          </span>
                          {desabilitado && <i className="pi pi-lock ml-1 text-[12px]"></i>}
                      </div>
                  );
              })}
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

        <Dialog 
          header="Cadastrar Plantão" 
          visible={exibeDialogo} 
          style={{ width: '90vw', maxWidth: '450px' }} 
          onHide={() => setExibeDialogo(false)}
          footer={footerContent}
          draggable={false}
          resizable={false}
          className="rounded-xl overflow-hidden"
        >
          <div className="flex flex-col gap-3 py-2">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-2">
              <span className="text-blue-700 font-medium flex items-center gap-2">
                <i className="pi pi-calendar"></i>
                Data Selecionada: {date?.toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div className="flex flex-col gap-2">
                <AppSelect
                  name='medicoId'
                  value={medicoId}
                  label='Médico'
                  url="/api/public/escala/medicos"
                  filterParams={{ ativo: true }}
                  optionLabel="nome"
                  optionValue="id"
                  itemTemplate={medicoTemplate}
                  valueTemplate={medicoTemplate}
                  public_back
                  onObjectChange={(medico) => setMedico(medico)}
                  onChange={(e) => {
                      setMedicoId(e.value);
                      methods.reset();
                  }}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <AppSelect
                  name='estabelecimentoId'
                  value={estabelecimentoId}
                  label='Clinica/Hospital'
                  url="/api/public/estabelecimento/estabelecimentos"
                  filterParams={{ ativo: true, plantao: true }}
                  optionLabel="nome"
                  optionValue="id"
                  public_back
                  itemTemplate={estabelecimentoTemplate}
                  valueTemplate={estabelecimentoTemplate}
                  onObjectChange={(est) => setEstabelecimento(est)}
                  onChange={(e) => {
                      setEstabelecimentoId(e.value);
                      methods.reset();
                  }}
              />
            </div>

            <div className="flex flex-col gap-2">
                <label className="font-bold text-slate-700 flex justify-between">
                    <span>Selecione o Período</span>
                </label>
                <TimeSlotPicker 
                    intervals={intervalos} 
                    selectedHours={formData.horas} 
                    onChange={(newHour: string[]) => {
                      setFormData({...formData, horas: newHour})
                    }
                    }
                />
            </div>  

            <div className={`flex flex-col transition-opacity duration-300 ${isManualDisabled ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <i className="pi pi-plus text-blue-500" /> Intervalos de Horário
                </label>
                <Button 
                  icon='pi pi-plus' 
                  onClick={addInterval} 
                  className="p-button-rounded p-button-text p-button-sm  text-blue-500" 
                  tooltip="Adicionar"
                  tooltipOptions={{ position: 'left' }}
                  disabled={!(medicoId && estabelecimentoId) || !canAddInterval || customIntervals.length >= 24}
                />
              </div>

              {isManualDisabled && (
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center gap-3 text-blue-700 text-xs font-medium">
                  <i className="pi pi-clock text-blue-500"></i>
                  Intervalos manuais desabilitados pois o ciclo de 24h está completo com os turnos pré-definidos.
                </div>
              )}

              <div className="flex flex-col">
                {customIntervals.map((interval, index) => (
                  <div key={interval.id + index} className="flex flex-col gap-2 p-1">
                    <div className={`flex items-end gap-2 bg-slate-50 pl-1 pr-1 pb-1 border transition-all ${interval.error ? 'border-red-300 bg-red-50' : 'border-slate-100 hover:border-blue-200'}`}>
                      <div className=" flex flex-col">
                        <span className="text-sm px-3 font-medium text-slate-500">Início</span>
                        <Dropdown 
                          value={formatDateToTimeString(interval.start)} 
                          onChange={(e) => updateInterval(interval.id, 'start', parseTimeStringToDate(e.value))} 
                          options={getFilteredTimeOptions(interval.id, 'start')}
                          placeholder="00:00"
                          className="w-full"
                          disabled={isManualDisabled || !(medicoId && estabelecimentoId)}
                          dropdownIcon="pi pi-clock"
                          showClear
                          pt={{
                            input: { 
                              className: 'p-0 pt-1 pb-1 pr-5 !border-none'
                            }
                          }}
                        />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <span className="text-sm px-3 font-medium text-slate-500">Término</span>
                        <Dropdown 
                          value={formatDateToTimeString(interval.end)} 
                          onChange={(e) => updateInterval(interval.id, 'end', parseTimeStringToDate(e.value))} 
                          options={getFilteredTimeOptions(interval.id, 'end')}
                          placeholder="00:00"
                          className="w-full"
                          disabled={isManualDisabled || !interval.start}
                          dropdownIcon="pi pi-clock"
                          showClear
                          pt={{
                            input: { 
                              className: 'p-0 pt-1 pb-1 pr-5 !border-none' 
                            }
                          }}
                        />
                      </div>
                      {customIntervals.length > 1 && (
                        <Button 
                          icon='pi pi-trash' 
                          onClick={() => removeInterval(interval.id)} 
                          className="p-button-rounded p-button-danger p-button-text" 
                          disabled={isManualDisabled}
                        />
                      )}
                    </div>
                    {interval.error && (
                      <span className="text-xs text-red-500 font-medium px-2 flex items-center gap-1">
                        <i className="pi pi-exclamation-circle text-[10px]" /> {interval.error}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Dialog>
      
      </div>
  )
}