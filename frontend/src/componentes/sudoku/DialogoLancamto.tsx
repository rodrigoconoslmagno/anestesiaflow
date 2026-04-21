import { Dialog } from "primereact/dialog";
import { AppSelect } from "../select/AppSelect";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { useMemo, useState } from "react";
import type { Medico } from "@/types/medico";
import type { Estabelecimento } from "@/types/estabelecimento";
import { DateUtils } from "@/utils/DateUtils";
import { useAppToast } from "@/context/ToastContext";
import type { Escala } from "@/types/escala";
import { AppSwitch } from "../switch/AppSwitch";
import clsx from "clsx";
import { IconeSirenePlantao } from "@/utils/IconeSirene";

interface TimeInterval {
    id: string;
    start: Date | null;
    end: Date | null;
    error?: string;
  }

export interface DialogoLancamentoProps {
    forcarPlantao: boolean | null;
    date: Date;
    saveEscala: ( plantao: boolean, medicoId: number, estabelecimentoId: number,
            intervalorPreDefinido: any, intervaloManual: any) => void;
    escalas: Escala[];
    exibeDialogo: boolean;
    closeDialog: () => void;
}

export const DialogoLancamento = ({ 
    forcarPlantao,
    date,
    saveEscala,
    escalas,
    exibeDialogo,
    closeDialog
} : DialogoLancamentoProps) => {
    const { showError, showWarn } = useAppToast();
    const [ medicoId, setMedicoId] = useState<number | undefined>(undefined);
    const [ estabelecimentoId, setEstabelecimentoId] = useState<number | undefined>(undefined);
    const [ complementoTitulo, setComplementoTitulo ] = useState<string>("Escala")
    const [ plantao, setPlantao] = useState<boolean>(false);
    const [ formData, setFormData] = useState({
        data: date,
        horas: [] as string[]
    });
    const [customIntervals, setCustomIntervals] = useState<TimeInterval[]>([
        { id: "", start: null, end: null }
    ]);
    const timeOptions = Array.from({ length: 24 }, (_, i) => {
        const time = `${i.toString().padStart(2, '0')}:00`;
        return { label: time, value: time };
    });
    
    const intervalos = useMemo(() => [
        {field: "07:00:00", header: '07-13h'},
        {field: "13:00:00", header: '13-19h'},
        {field: "19:00:00", header: '19-07h'}
    ], []);
    const isManualDisabled = formData && formData.horas.length === 3;
    const canAddInterval = !isManualDisabled && customIntervals.every(i => i.start && i.end);

    const footerContent = (
        <div className="flex justify-end gap-2 mt-4">
          <Button 
            label="Cancelar" 
            icon="pi pi-times" 
            onClick={closeDialog} 
            className="p-button-text p-button-secondary" 
          />
          <Button 
            label="Salvar" 
            icon="pi pi-save" 
            onClick={() => saveEscala(plantao, medicoId!, estabelecimentoId!, 
                        formData, customIntervals)} 
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
        let nomeExibir = estabelecimento.nome;
        if (nomeExibir.length > 28) {
            nomeExibir = nomeExibir.substring(0, 28);
        }

        return estabelecimento.sigla ? `${nomeExibir} - ${estabelecimento.sigla}` : nomeExibir;
    };

    const estabelecimentoTemplate = (option: Estabelecimento) => {
        if (!option) {
            return "Selecione uma clinica/hospital";
        }
  
        return (
          <div
            className={`flex items-center justify-between transition-all min-h-[28px] min-w-[28px]
              'cursor-pointer hover:bg-blue-50/50 gap-1`}
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
            {option.plantao && 
                <IconeSirenePlantao className="w-7 h-7 animate-pulse" />
            }
        </div>
        )
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

            const itemEscala: Escala[] = escalas.filter(escala => {
                if (escala.medicoId == medicoId){
                    const itens = escala.itens?.filter(item => {
                        const apenasNumeros = item.hora.replace(/\D/g, '');
                        return parseInt(apenasNumeros.substring(0, 2), 10) == hourVal
                    })
                    if (itens && itens.length > 0) {
                        return escala
                    }
                }
            })
            // Rule 1: If today, no past hours
            if ((isToday && hourVal < currentHour) || (itemEscala && itemEscala.length > 0)) {
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
              const itens = escala.itens?.filter(item => {
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
  
            const hasOverlap = (startHourInput < existingEnd && endHourInput > existingStart);
  
            return hasOverlap;
          });
        }
  
        const analiseDesabilitar = (hora: string): boolean => {
            const retorno = !(medicoId && estabelecimentoId) ||
                  (medicoId && estabelecimentoId && isHoraPassada(hora)) ||
                  (medicoId && estabelecimentoId && isHoraAlocada(hora)) ||
                  (medicoId && estabelecimentoId && isIntervaloManual(hora));
            return retorno as boolean;
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
        <Dialog
            header={
                <div className="flex items-center w-full gap-2 h-8 sm:h-12">
                    <span className="font-semibold text-lg">
                        Gerar {complementoTitulo}
                    </span>
                    {plantao &&
                        <IconeSirenePlantao className="w-8 sm:w-12 h-8 sm:h-12 animate-pulse" />
                    }
                </div> 
            }
            visible={exibeDialogo} 
            style={{ width: '90vw', maxWidth: '450px' }} 
            onHide={() => closeDialog()}
            onShow={() => {
                let  plantao = false;
                if (forcarPlantao != null) {
                    plantao = forcarPlantao;
                } 
                setPlantao(plantao)
                setComplementoTitulo(forcarPlantao ? "Plantão" : "Escala");
                setMedicoId(undefined)
                setEstabelecimentoId(undefined)
                setFormData({
                    data: date,
                    horas: []
            });
            setCustomIntervals([{id: "", start: null, end: null}])
          }}
          footer={footerContent}
          draggable={false}
          resizable={false}
          className="rounded-xl overflow-hidden"
        >
          <div className="flex flex-col gap-3 py-2">
            <div className="grid grid-cols-12 bg-blue-50 pl-2 pr-2 rounded-lg border border-blue-100 mb-2">
                <div className={clsx("flex items-center col-span-12 md:col-span-7",
                        forcarPlantao != null && 'pt-3 pb-3')}>
                    <span className="text-blue-700 font-medium flex items-center gap-2">
                        <i className="pi pi-calendar"></i>
                        Data: {date?.toLocaleDateString('pt-BR')}
                    </span>
                </div>

                {forcarPlantao == null &&  
                    <div className="flex md:justify-end flex-auto col-span-12 md:col-span-5 mt-2">
                        <AppSwitch 
                            name="plantao" 
                            label="Plantao" 
                            colSpan={1} 
                            value={plantao}
                            onChange={(e) => {
                                const novoValor = e.value as boolean;

                                setPlantao(novoValor);
                                setComplementoTitulo(novoValor ? "Plantão" : "Escala");
                            }}
                        />  
                    </div>
                }
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
                  onChange={(e) => setMedicoId(e.value)}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <AppSelect
                  name='estabelecimentoId'
                  value={estabelecimentoId}
                  label='Clinica/Hospital'
                  url="/api/public/estabelecimento/estabelecimentos"
                  filterParams={ plantao ? { ativo: true, plantao: plantao } : {ativo: true}}
                  optionLabel="nome"
                  optionValue="id"
                  public_back
                  itemTemplate={estabelecimentoTemplate}
                  valueTemplate={estabelecimentoTemplate}
                  onChange={(e) => setEstabelecimentoId(e.value)}
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
    )
}