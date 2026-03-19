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
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom"
import { BlockUI } from 'primereact/blockui';
import { confirmDialog } from "primereact/confirmdialog";

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
    const { showError } = useAppToast();
    const [datasComPlantao, setDatasComPlantao] = useState<string[]>([]);
    const [mesVisualizado, setMesVisualizado] = useState<Date>(new Date());

    const intervalos = useMemo(() => [
          {field: "07:00:00", header: '07-13h'},
          {field: "13:00:00", header: '13-19h'},
          {field: "19:00:00", header: '19-07h'}
        ], []);

    const colunasPorEstabelecimento = useMemo(() => {
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
  
      return Object.values(mapa).map(coluna => ({
        ...coluna,
        cards: coluna.cards.sort((a, b) => {
          const dataA = new Date(a.escala.medico?.dataAssociacao || 0).getTime();
          const dataB = new Date(b.escala.medico?.dataAssociacao || 0).getTime();
          return dataA - dataB;
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
            estabelecimento: estabelecimento
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
              estabelecimento: estabelecimento
            }
            periodo1.push(escalaItem);
          })
        })

        let escalaPersistir: EscalaPlantao;

        let exists = escalas.filter((escala: EscalaPlantao) => escala.medicoId === medicoId &&
                      escala.data === dataString)

        if (exists.length > 0) {
          const novasEscalas = escalas.map(escala => {
            if (escala.medicoId === medicoId && escala.data === dataString) {
              escalaPersistir = {
                ...escala,
                itensPlantao: [...escala.itensPlantao, ...periodo1]
              }
              return escalaPersistir;
            }
            return escala;
          });
          setEscalas(novasEscalas);
        } else {
          escalaPersistir = {
            data: DateUtils.paraISO(formData.data),
            medicoId: medicoId as number,
            plantao: true,
            itensPlantao: periodo1,
            medico: medico,
          }
         setEscalas([...escalas, escalaPersistir])
        }

        setExibeDialogo(false)

        saveBackend(escalaPersistir!);
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
      } finally {
        setExibeDialogo(false)
        setLoading(false)
      }
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
          disabled={!(medicoId && estabelecimentoId && formData.horas.length > 0)}
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

    const deleteItem = async (medicoId: number, data: string, horaInicio: string) => {
      let escalaPersistir: EscalaPlantao; 
      let escalasAtualizadas = escalas.map(escala => {
        if (escala.medicoId === medicoId && escala.data === data) {
          const novosItens = escala.itensPlantao.filter(item => {
            const apenasNumeros = horaInicio.replace(/\D/g, '');
            const horaSlot = parseInt(apenasNumeros.substring(0, 2), 10);

            const apenasNumerosArray = item.hora.replace(/\D/g, '');
            const horaSlotArrau = parseInt(apenasNumerosArray.substring(0, 2), 10);
            return (horaSlot === 7 && horaSlotArrau >= 13) || 
                    horaSlot === 13 && horaSlotArrau < 13;
          });
          escalaPersistir = {
            ...escala,
            itensPlantao: novosItens
          }
          return escalaPersistir;
        }
        return escala;
      }).filter(escala => escala.itensPlantao.length > 0);

      setEscalas(escalasAtualizadas);

      saveBackend(escalaPersistir!);
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
              if (item.estabelecimentoId === estabelecimentoId) {
                const apenasNumeros = item.hora.replace(/\D/g, '');
                const horaSlot = parseInt(apenasNumeros.substring(0, 2), 10);
                if ((horaSlot === 7 && horaSlot === horaSlotParam) || 
                    (horaSlot === 13 && horaSlot === horaSlotParam) || 
                    ((horaSlot === 13 || horaSlot === 7) && horaSlotParam === 19) ||
                    ((horaSlot === 19 && (horaSlotParam === 7 || horaSlotParam === 13 || horaSlotParam === 19)))
                ) {
                  return item 
                }
              }
            })
            if (itens && itens.length > 0) {
              return escala
            }
          }
        })

        return analise && analise.length > 0
      }
  
      const analiseDesabilitar = (hora: string): boolean => {
        return !(medicoId && estabelecimentoId) ||
                (medicoId && estabelecimentoId && isHoraPassada(hora)) ||
                (medicoId && estabelecimentoId && isHoraAlocada(hora));
      }

      const toggleHour = (hourField: string) => {
          if (analiseDesabilitar(hourField)) {
              return;
          }
          const apenasNumeros = hourField.replace(/\D/g, '');
          const horaSlot = parseInt(apenasNumeros.substring(0, 2), 10);
          if (horaSlot == 19 && selectedHours.length > 0 && selectedHours[0] !== '19:00:00') {
            selectedHours = [];
          }
          if (horaSlot != 19 && selectedHours.length == 1 && selectedHours[0] == '19:00:00') {
            selectedHours = [];
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
            <Button icon="pi pi-box" 
                    onClick={confirmArquivamento}
                    disabled={!permiteArquivar || loading}
                    tooltip="Arquivar" 
                    className="p-button-outlined p-button-secondary p-button-sm transition-all p-1 border-amber-500 text-amber-600 hover:bg-amber-50" 
            />
            {<div className={clsx(
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
                {/* Unified Card: Calendar and Day Schedule side-by-side */}
                <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl border border-slate-200 overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {/* Calendar Section */}
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

                    <div className="flex-1 p-4 md:p-6 bg-slate-50/30 flex flex-col">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3 md:gap-4">
                        <h2 className="text-base md:text-xl font-bold text-slate-800 flex items-center gap-2">
                            <i className="pi pi-clock text-blue-500"></i>
                            {date?.toLocaleDateString('pt-BR')}
                        </h2>
                        <Button 
                          label="Novo" 
                          icon="pi pi-plus" 
                          className="p-button-sm p-button-primary w-full 
                                sm:w-auto bg-blue-600 text-white p-2 rounded-xl" 
                          onClick={handleNovoPlantao}
                        />
                      </div>

                      <div className="flex flex-row gap-4 overflow-x-auto min-h-[400px]">
                      {colunasPorEstabelecimento.length === 0 ? (
                          <div className="flex flex-col items-center justify-center w-full py-12 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400">
                            <i className="pi pi-clock text-4xl mb-3 opacity-20"></i>
                            <p className="text-sm font-medium">Nenhum plantão para esta data.</p>
                            <Button 
                              label="Gerar Escala Agora" 
                              link 
                              className="mt-2 text-blue-600" 
                              onClick={handleNovoPlantao}
                            />
                          </div>
                        ) : (
                          colunasPorEstabelecimento.map(coluna => (
                            <div key={coluna.unidade.id} className="flex flex-col mt-2 gap-3 min-w-[30%] max-w-[33%]">
                              {coluna.cards.map(({ escala, item, horaSlot }, idxItem) => (
                                <div 
                                  key={`${escala.medicoId}-${horaSlot}-${idxItem}`}
                                  className="relative bg-white p-3 rounded-xl border border-slate-100 hover:border-blue-200 transition-all shadow-sm flex items-center gap-3 group hover:z-50">
                                  
                                  <button
                                    onClick={() => confirmExclusao(escala.medicoId, escala.data, item.hora)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-600"
                                  >
                                    <i className="pi pi-times text-[10px]"></i>
                                  </button>
                                  
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
                                      {item.hora.split(':')[0]} - {horaSlot === 7 ? 13 : horaSlot === 13 ? 19 : 7}h
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
          <div className="flex flex-col gap-5 py-2">
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
                  url="/estabelecimento"
                  filterParams={{ ativo: true, plantao: true }}
                  optionLabel="nome"
                  optionValue="id"
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
          </div>
        </Dialog>
      
      </div>
  )
}