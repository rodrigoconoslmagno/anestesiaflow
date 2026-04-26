import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';

// DND-KIT (Regra 10)
import { MeasuringStrategy, DndContext, PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay, rectIntersection, useDraggable, useDroppable } from '@dnd-kit/core';

import { server } from '@/api/server';
import { getIntervalosEscala } from '@/types/escalaHelper';
import { ClinicasPanel } from '@/componentes/sudoku/ClinicasPanel';
import '@/componentes/sudoku/SudokuView.css';
import type { Estabelecimento } from '@/types/estabelecimento';
import type { Escala, EscalaItem } from '@/types/escala';
import { DateUtils } from '@/utils/DateUtils';
import clsx from 'clsx';
import { Calendar } from 'primereact/calendar';
import { addLocale, locale } from 'primereact/api';
import { Menu } from 'primereact/menu';
import { useAppToast } from '@/context/ToastContext';
import { useAuthStore } from '@/permissoes/authStore';
import { Recurso } from '@/permissoes/recurso';
import { confirmDialog } from 'primereact/confirmdialog';
import { IconeSirenePlantao } from '@/utils/IconeSirene';
import { AppCardsPlantaoNoturno } from '@/componentes/plantao/AppCardsPlantaoNorurno';
import { DialogoLancamento } from '@/componentes/sudoku/DialogoLancamto';

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

const DroppableCell = ({ id, alocacao, bloqueado, isPaintingMode, onMouseDown, onMouseEnter, disabled}: any) => {
  const { isOver, setNodeRef } = useDroppable({ 
    id, 
    disabled: bloqueado || disabled
  });

  const [medicoId, hora] = id.split('|');
  const almoco = hora === "11:00" || hora === "12:00"

  return (
    <div 
      ref={setNodeRef} 
      data-medico={medicoId} // Adicione isso
      data-hora={hora}     // Adicione isso
      // IMPORTANTE: Só executa estas funções se isPaintingMode for TRUE
      onMouseDown={(e) => isPaintingMode && onMouseDown?.(e)}
      onMouseEnter={(e) => isPaintingMode && onMouseEnter?.(e)}
      className={`flex items-center justify-center min-h-[28px] min-w-[28px] border-r border-b border-slate-300 transition-colors
          ${bloqueado ? (almoco ? 'bg-red-100' : 'bg-slate-50/50 cursor-not-allowed' ) : 'hover:bg-blue-50/50'}
          ${isOver && !bloqueado ? 'bg-blue-200' : ''}
          ${almoco ? 'bg-red-100' : ''}`}
      style={{ touchAction: isPaintingMode ? 'none' : 'auto' }}
    >
      {alocacao ? (
        <DraggableItem 
          alocacao={alocacao} 
          medicoId={Number(medicoId)} 
          horaOriginal={hora} 
          isPaintingMode={isPaintingMode}
          bloqueado={bloqueado}
          disabled={disabled}
        />
      ) : (
        bloqueado && <div className={`w-[14px] h-[14px] ${almoco ? 'bg-slate-300' : 'bg-slate-200'} rounded-full opacity-50`}/>
      )}
        {!alocacao && !bloqueado && <div className={`w-2 h-2 ${almoco ? 'bg-slate-300': 'bg-slate-200'} rounded-full opacity-40`}/>}
    </div>
  );
};

const DraggableItem = ({ alocacao, medicoId, horaOriginal, isPaintingMode, bloqueado, disabled }: any) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `alocado|${medicoId}|${horaOriginal}`,
    disabled: bloqueado || disabled,
    data: { 
        isFromGrid: true, 
        alocacao,
        origem: { medicoId, hora: horaOriginal }
    }
  });
  const styleFinal = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 999 : 1,
    cursor: disabled ? "default" : (bloqueado ? 'not-allowed' : (isPaintingMode ? 'cell' : 'grab')),
    backgroundColor: alocacao.cor?.startsWith('#') ? alocacao.cor : `#${alocacao.cor}`,
    touchAction: 'none', 
    WebkitUserSelect: 'none' as const,
    filter: bloqueado ? 'saturate(0.8) brightness(0.9)' : 'none',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={styleFinal} // <--- Apenas UM atributo style agora
      {...(isPaintingMode ? {} : listeners)} 
      {...(isPaintingMode ? {} : attributes)}
      onDragStart={(e) => (isPaintingMode || bloqueado) && e.preventDefault()}  
      className="w-[28px] h-[28px] rounded-full border border-white shadow-sm flex items-center
                 justify-center overflow-hidden active:cursor-grabbing">
      {/* {alocacao.icone && !alocacao.plantao ? ( */}
      {alocacao.icone && (
        <img 
          src={alocacao.icone.startsWith('data:') ? alocacao.icone : `data:image/png;base64,${alocacao.icone}`} 
          className="object-contain w-full h-full pointer-events-none" 
        />
      // ) : (
      //   <IconeSirenePlantao className="w-6 h-6 animate-pulse" />
      )}
    </div>
  );
};

const DroppableTrashZone = ({ children }: any) => {
  const { setNodeRef } = useDroppable({ 
    id: 'painel-clinicas-trash' 
  });

  return (
    <div ref={setNodeRef} className="w-full h-full">
      {children}
    </div>
  );
};

export const SudokuView = () => {
  const navigate = useNavigate();
  const [dataAtiva, setDataAtiva] = useState(new Date());
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [clinicas, setClinicas] = useState<Estabelecimento[]>([]);
  const [loading, setLoading] = useState(false);
  const [ sendMessaging, setSendMessaging ] = useState(false);
  const [activeDragData, setActiveDragData] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isPaintingMode, setIsPaintingMode] = useState(false);
  const [activePaintingClinica, setActivePaintingClinica] = useState<Estabelecimento | null>(null);
  const [isDraggingWithinGrid, setIsDraggingWithinGrid] = useState(false);
  const [hasChangesToSave, setHasChangesToSave] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isOverTrash, setIsOverTrash ] = useState(false);
  const { showError, showSuccess } = useAppToast();
  const menu = useRef<Menu>(null);
  const [ permiteArquivar, setPermiteArquivar ] = useState(false);
  const ultimoEstadoConfirmado = useRef<Escala[]>([]);
  const [ ativaPlantao, setAtivaPlantao ] = useState(false);
  const [ exibirDialogo, setExibeDialogo] = useState(false);
  const [ plantaoNoturno, setPlantaoNoturno] = useState<boolean>(false);
  const [ clinicasPlantoes, setClinicasPlantoes ] = useState<boolean>();

  const hasPerm = useAuthStore(state => state.hasPermission);

  const canArquivar = hasPerm(Recurso.SUDOKU,'ARQUIVAR');
  const canNotificar = hasPerm(Recurso.SUDOKU,'NOTIFICAR');
  const canALTERAR = hasPerm(Recurso.SUDOKU,'ALTERAR');

  const menuItems = [
    { label: 'Arquivar', icon: 'pi pi-box', visible: canArquivar && permiteArquivar , command: () => {confirmArquivamento()} },
    { label: 'Notificar', icon: 'pi pi-send', visible: canNotificar, command: () => { handleEnciarMensagem()} }
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, useMemo(() => ({
      activationConstraint: isPaintingMode 
        ? { distance: 2000 } // Distância enorme para o Drag não "acordar" no modo pintura
        : { distance: 8 },    // Distância normal para funcionar o arraste
    }), [isPaintingMode])),
    useSensor(TouchSensor, useMemo(() => ({
      activationConstraint: isPaintingMode 
        ? { delay: 99999, tolerance: 999 } 
        : { delay: 250, tolerance: 5 },
    }), [isPaintingMode]))
  );

  const dataStr = useMemo(() => {
    const y = dataAtiva.getFullYear();
    const m = String(dataAtiva.getMonth() + 1).padStart(2, '0');
    const d = String(dataAtiva.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [dataAtiva]);

  const existeEscalaDia = useMemo(() => {
    return escalas.some(item => item.itens && item.itens?.length > 0);
  }, [escalas]);

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      try {
        const dataFormatada = DateUtils.paraISO(dataAtiva);
    
        const resEscalas = await server.api.listarCustomizada<Escala>('/sudoku', '/listardia', { data: dataFormatada });
        const arquivado  = await server.api.postCustomizada<boolean>('/sudoku', '/arquivado', { data: dataFormatada });

        setPermiteArquivar(!arquivado)
        setEscalas(resEscalas || []);

        setLastUpdate(Date.now());
        let plantao = true;
        if (!(dataAtiva.getDay() === 0 || dataAtiva.getDay() === 6)) {
          plantao = await await server.api.postCustomizada<boolean>('/sudoku', '/templantaodiasemana', { data: dataFormatada });
          setAtivaPlantao(plantao)
        } 

        if (clinicas.length == 0 || clinicasPlantoes != plantao ) {
            const resClinicas: Estabelecimento[] = await server.api_public.listar("/api/public/estabelecimento/estabelecimentos",
            plantao ? { ativo: true, plantao: plantao } : { ativo: true });
            
            setClinicas(resClinicas || []);
            setClinicasPlantoes(plantao);
        }
      } catch (error: any) {
        if (error.status = 403) {
          const errorMessage = error.response?.data?.mensagem || "Você não tem permissão para excluir este registro.";
          showError('Ação Bloqueada', errorMessage);
        } 
        console.error("Erro ao carregar dados do Sudoku:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
    setAtivaPlantao(dataAtiva.getDay() === 0 || dataAtiva.getDay() === 6);
  }, [dataAtiva]);

  useEffect(() => {
    const stopDragging = () => setIsDraggingWithinGrid(false);
    window.addEventListener('mouseup', stopDragging);
    return () => window.removeEventListener('mouseup', stopDragging);
  }, []);

  useEffect(() => {
    const interacaoFinalizada = !isDraggingWithinGrid && activeDragData === null;

    if (hasChangesToSave && interacaoFinalizada) {
      const sincronizarComBackend = async () => {
        const snapshotAnterior = [...ultimoEstadoConfirmado.current];
        try {
          setIsSyncing(true);
          
          const payload = escalas.map(p => ({
            id: p.id || null, 
            medicoId: p.medicoId,
            data: dataStr,
            plantao: ativaPlantao,
            itens: p.itens?.map(i => ({
              id: i.id || null, 
              estabelecimentoId: i.estabelecimentoId,
              hora: (i.hora?.substring(0, 5) || i.hora),
              plantao: i.plantao
            })) || [] 
          }));
          const response = await server.api.criar<Escala[]>('/sudoku', payload as Escala[]);

          await atualizarStatusBloqueio(dataAtiva);

          if (response && Array.isArray(response)) {
            const mapaBack = new Map(response.map(e => [e.medicoId, e]));

            const novoEstadoIntegrado = escalas.map((escalaLocal) => {
              const escalaDoBanco = mapaBack.get(escalaLocal.medicoId);

              if (escalaDoBanco) {
                return {
                  ...escalaDoBanco,
                  medicoSigla: escalaLocal.medicoSigla 
                };
              }

              return { 
                ...escalaLocal, 
                id: undefined, 
                itens: [] 
              };
            });

            setEscalas(novoEstadoIntegrado);
            ultimoEstadoConfirmado.current = novoEstadoIntegrado;
          }

          setHasChangesToSave(false);
          setPlantaoNoturno(await await server.api.postCustomizada<boolean>('/sudoku', '/listardianoturno', { data: DateUtils.paraISO(dataAtiva) }))
          let ativarPlantao = true;
          if (!(dataAtiva.getDay() === 0 || dataAtiva.getDay() === 6)) {
            ativarPlantao = await await server.api.postCustomizada<boolean>('/sudoku', '/templantaodiasemana', { data: DateUtils.paraISO(dataAtiva) });
            setAtivaPlantao(ativarPlantao)
          }
          if (clinicasPlantoes != ativarPlantao) {
            const resClinicas: Estabelecimento[] = await server.api_public.listar("/api/public/estabelecimento/estabelecimentos",
            ativarPlantao ? { ativo: true, plantao: ativarPlantao } : { ativo: true });
      
            setClinicas(resClinicas || []);
            setClinicasPlantoes(ativarPlantao)
          }
        } catch (err: any) {
          console.error("Falha na sincronização:", err);

          setEscalas(snapshotAnterior);
          setHasChangesToSave(false);

          if (err.status === 403) {
            const errorMessage = err.response?.data?.mensagem || "Você não tem permissão para excluir este registro.";
            showError('Ação Bloqueada', errorMessage);
          }
          if (err.status === 422) {
            const errorMessage = err.response?.data?.message || "Ocorreu um erro inesperado ao salvar.";
            showError('Erro', errorMessage);
          }
        } finally {
          setIsSyncing(false);
        }
      };

      sincronizarComBackend();
    }
  }, [hasChangesToSave, isDraggingWithinGrid, activeDragData, dataStr]);

  useEffect(() => {
    if (escalas.length > 0 && !hasChangesToSave) {
        ultimoEstadoConfirmado.current = escalas;
    }
  }, [escalas, hasChangesToSave]);

  const atualizarStatusBloqueio = useCallback(async (data: any) => {
    try {
      const jaArquivado = await server.api.postCustomizada<boolean>(
        '/sudoku', 
        '/arquivado', 
        { data: DateUtils.paraISO(data) }
      );
      // Força o booleano e atualiza o estado
      setPermiteArquivar(!!(String(jaArquivado) !== 'true'));
    } catch (e) {
      setPermiteArquivar(false);
    }
  }, []);

  const HORARIOS = useMemo(() => getIntervalosEscala(), []);
  const isHoje = dataAtiva.toDateString() === new Date().toDateString();

  const navegar = (dias: number) => {
    const novaData = new Date(dataAtiva);
    novaData.setDate(novaData.getDate() + dias);

    setDataAtiva(novaData);

    setIsPaintingMode(false);
    setIsDraggingWithinGrid(false);
    setActivePaintingClinica(null);
  };

  const onDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveDragData(null);
    if (!over) {
      return;
    }
    const dragData = active.data.current;
    if (dragData.isFromGrid && over.id === 'painel-clinicas-trash') {
      const { medicoId: oMedId, hora: oHora } = dragData.origem;
      const oHoraNorm = oHora.substring(0, 5);
  
      setEscalas(prev => {
        const novoEstado = prev.map(e => {
          if (e.medicoId === oMedId) {
            return {
              ...e,
              itens: e.itens?.filter(i => (i.hora?.substring(0, 5) || i.hora) !== oHoraNorm) || []
            };
          }
          return e;
        });
        setHasChangesToSave(true);
        return novoEstado;
      });
      return;
    }

    const [destMedicoIdStr, destHora] = over.id.split('|');
    const destMedicoId = Number(destMedicoIdStr);

    if (!destMedicoId || !destHora){
      return;
    }
    const horaDestNorm = destHora.substring(0, 5);
  
    setEscalas(prev => {
      let tempEscalas = prev.map(e => ({
        ...e,
        itens: e.itens ? [...e.itens] : []
      }));

      let itemSendoMovido: EscalaItem | null = null;
      let medicoOrigemId = undefined;

      if (dragData.isFromGrid) {
        const { medicoId: oMedId, hora: oHora } = dragData.origem;
        medicoOrigemId = oMedId;
        const oHoraNorm = oHora.substring(0, 5);
        
        tempEscalas = tempEscalas.map(e => {
          if (e.medicoId === oMedId) {
            itemSendoMovido = e.itens?.find(i => (i.hora?.substring(0, 5) || i.hora) === oHoraNorm) || null;
            return {
              ...e,
              itens: e.itens?.filter(i => (i.hora?.substring(0, 5) || i.hora) !== oHoraNorm)
            };
          }
          return e;
        });
      }

      const clinica = dragData.isFromGrid ? dragData.alocacao : dragData.clinica;
      
      const idxDest = tempEscalas.findIndex(e => e.medicoId === destMedicoId);

      const novoItem: EscalaItem = {
        id: itemSendoMovido && medicoOrigemId && medicoOrigemId == destMedicoId ? (itemSendoMovido as EscalaItem).id : undefined,
        estabelecimentoId: clinica.estabelecimentoId || clinica.id,
        hora: horaDestNorm,
        cor: clinica.cor,
        icone: clinica.icone,
        arquivado: null,
        reagendado: false,
        plantao: ativaPlantao
      };
  
      if (idxDest === -1) {
        tempEscalas.push({ 
          medicoId: destMedicoId, 
          data: dataStr, 
          plantao: ativaPlantao,
          itens: [novoItem], 
          medicoSigla: ''
        });
      } else {
        tempEscalas[idxDest] = {
          ...tempEscalas[idxDest],
          itens: [
            ...(tempEscalas[idxDest].itens || []).filter(i => (i.hora?.substring(0, 5) || i.hora) !== horaDestNorm),
            novoItem
          ]
        };
      }
      setHasChangesToSave(true);
      return tempEscalas;
    });
  };

  const onDragStart = (event: any) => {
    const { active } = event;
    const data = active.data.current;
    
    if (data.isFromGrid) {        
        setActiveDragData(data.alocacao);
    } else {
        setActiveDragData(data.clinica);
    }
  };

  const isHoraBloqueada = (horaStr: string) => {
    if (!isHoje) {
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        return dataAtiva < hoje;
    }
    
    const agora = new Date();
    const dataInicioIntervalo = new Date(`${dataStr}T${horaStr}:00`);

    return dataInicioIntervalo <= agora;
  };

  const marcarCelulaTouch = (medicoId: number, hora: string) => {
    if (!activePaintingClinica || !isPaintingMode) return;
  
    const horaNormalizada = hora.substring(0, 5);
  
    setEscalas(prevEscalas => {
      const escalaIndex = prevEscalas.findIndex(e => e.medicoId === medicoId);

      if (escalaIndex === -1) {
        const novaEscala: Escala = { 
          medicoId, 
          data: dataStr, 
          plantao: ativaPlantao,
          itens: [{
            id: undefined,
            estabelecimentoId: activePaintingClinica.id,
            hora: horaNormalizada,
            cor: activePaintingClinica.cor,
            icone: activePaintingClinica.icone,
            arquivado: null,
            reagendado: false,
            plantao: ativaPlantao
          }], 
          medicoSigla: '' 
        };
        setHasChangesToSave(true);
        return [...prevEscalas, novaEscala];
      }
  
      const escalaAtual = prevEscalas[escalaIndex];
      const jaExiste = escalaAtual.itens?.find(i => 
        (i.hora?.substring(0, 5) || i.hora) === horaNormalizada && 
        i.estabelecimentoId === activePaintingClinica.id
      );
  
      if (jaExiste) return prevEscalas;
  
      const novosItens = [
        ...(escalaAtual.itens || []).filter(i => (i.hora?.substring(0, 5) || i.hora) !== horaNormalizada),
        {
          id: undefined,
          estabelecimentoId: activePaintingClinica.id,
          hora: horaNormalizada,
          cor: activePaintingClinica.cor,
          icone: activePaintingClinica.icone,
          arquivado: null,
          reagendado: false,
          plantao: ativaPlantao
        }
      ];

      const novasEscalas = [...prevEscalas];
      novasEscalas[escalaIndex] = { ...escalaAtual, itens: novosItens };
      
      setHasChangesToSave(true);
      return novasEscalas;
    });
  };

  const handleStartPainting = (clientX: number, clientY: number, e?: any) => {
    if (!isPaintingMode) {
      return;
    }

    if (e && e.button !== 0 && e.type === 'mousedown') {
      return;
    }

    if (e && e.preventDefault) {
      e.preventDefault();
    }
  
    const element = document.elementFromPoint(clientX, clientY);
    const cell = element?.closest('[data-medico]');
  
    if (cell) {
        const medicoId = Number(cell.getAttribute('data-medico'));
        const hora = cell.getAttribute('data-hora');
        if (isHoraBloqueada(hora!)) return; 
  
        const escalaDoMedico = escalas.find(e => e.medicoId === medicoId);
        const itemAlocado = escalaDoMedico?.itens?.find(i => 
            (i.hora?.substring(0, 5) || i.hora) === (hora?.substring(0, 5) || hora)
        );
  
        if (itemAlocado) {
            setActivePaintingClinica({
                id: itemAlocado.estabelecimentoId,
                cor: itemAlocado.cor,
                icone: itemAlocado.icone
            } as Estabelecimento);
            
            setIsDraggingWithinGrid(true);
        }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPaintingMode && isDraggingWithinGrid && e.cancelable) {
      e.preventDefault(); 
    }

    if (!isPaintingMode || !isDraggingWithinGrid || !activePaintingClinica) {
      return;
    }

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const cell = element?.closest('[data-medico]');

    if (cell) {
        const mId = Number(cell.getAttribute('data-medico'));
        const h = cell.getAttribute('data-hora');
        if (mId && h) {
            marcarCelulaTouch(mId, h);
        }
    }
  };

  const renderTableHeader = () => {
    return (
        <div className="flex items-center justify-between  bg-slate-50">
            <div className="flex items-center gap-2">
                <i className="pi pi-th-large text-slate-400 text-sm" />
                <span className="text-xs font-bold text-slate-600 uppercase">Grade de Alocação</span>
            </div>
            
            {isEditing && <Button 
                label={isPaintingMode ? "Finalizar Rápidor" : "Preencher Rápidor"}
                icon={isPaintingMode ? "pi pi-check" : "pi pi-palette"} 
                severity={isPaintingMode ? "success" : "info"}
                raised={isPaintingMode}
                className={clsx(
                    "transition-all p-1", 
                    !isPaintingMode && "bg-blue-500 border-blue-500 text-white",
                    isPaintingMode && "bg-green-500 border-green-500 text-white",
                    
                )}
                onClick={() => setIsPaintingMode(!isPaintingMode)}
            />
            }
        </div>
    );
  };

  const confirmArquivamento = () => {
    confirmDialog({
      header: 'Confirmação de Arquivamento',
      message: (
        <div className="flex flex-col items-center gap-3">
          <i className="pi pi-exclamation-triangle text-red-500 text-5xl"></i>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-700 m-0">
              Você está prestes a arquivar este sudoku.
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
          await server.api.criar('/sudoku/arquivar', DateUtils.paraISO(dataAtiva));
          showSuccess('Arquivamento', 'Sudoku arquivado com sucesso.');
          setPermiteArquivar(false);
        } catch (err: any) {
          const errorMessage = err.response?.data?.mensagem || "Ocorreu um erro inesperado ao salvar.";
          const errorCodigo = err.response?.data?.codigo;
    
          showError(errorCodigo === 'ACESSO_NEGADO' ? 'Acesso Negado' : 'Erro', errorMessage);
        }
      }
    });
  };

  const handleEnciarMensagem = async () => {
    try {
      setSendMessaging(true);
      await server.api.postCustomizada('/notification', '/send-notification', 
        { mensagem: "Sudoku atualizado, entrar para conferrir."});
    } finally {
      setSendMessaging(false);
    }    
  }

  return (
    <div className="sudoku-container w-full bg-slate-50 pb-20 sm:pb-0"
        style={{ height: 'auto', minHeight: '100vh', overflow: 'auto' }}>
      <header className={clsx(
          "flex items-center justify-between sm:px-4 sm:py-3 px-2 bg-white border-b transition-all duration-300",
          isPaintingMode ? "border-blue-200" : "border-slate-200"
      )}>
        {(isSyncing || hasChangesToSave) && <div className="sync-glow-bar" />}

        <div className="flex items-center gap-3 mr-2">
          <Button 
            icon="pi pi-times" 
            label="Sair"
            text
            severity="danger"
            className="hidden md:flex px-4 h-full w-full border-red-200 text-red-500 hover:bg-red-50"
            onClick={() => navigate(-1)} 
          />
          <Button 
            icon="pi pi-arrow-left" 
            className="p-button-rounded p-button-text p-button-secondary h-auto md:hidden border-red-200 text-red-500" 
            onClick={() => navigate(-1)} 
          />
          <h1 className="text-lg md:text-xl font-black text-slate-700 m-0">
            Sudoku
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex gap-2">
            {canArquivar && <Button icon="pi pi-box"
                    onClick={confirmArquivamento}
                    disabled={!permiteArquivar || loading || hasChangesToSave}
                    tooltip="Arquivar" 
                    className="p-button-outlined p-button-secondary p-button-sm transition-all p-1 border-amber-500 text-amber-600 hover:bg-amber-50" 
            />}
            {canNotificar && (
              <div className={clsx(
                "relative inline-flex items-center justify-center rounded-md p-[2px] transition-all duration-300",
                sendMessaging ? "animate-glow-around bg-blue-500/20" : "bg-transparent"
              )}>
                {sendMessaging && (
                  <div className="absolute inset-0 rounded-md animate-pulse bg-gradient-to-r from-blue-400 to-emerald-400 opacity-50 blur-[2px]" />
                )}
                
                <Button 
                  icon={sendMessaging ? "pi pi-spin pi-spinner" : "pi pi-send"} 
                  disabled={loading || sendMessaging}
                  onClick={handleEnciarMensagem}
                  tooltip="Notificar" 
                  className={clsx(
                    "p-button-outlined p-button-secondary p-button-sm transition-all p-1 border-slate-400 text-slate-500 hover:bg-slate-50 z-10",
                    "!rounded-md" 
                  )}
                />
              </div>
            )}
          </div>

          <Button 
            icon={"pi pi-plus-circle"} 
            disabled={loading || sendMessaging}
            onClick={() =>  setExibeDialogo(true)}
            tooltip="Incluir" 
            className={clsx(
              "p-button-outlined p-button-secondary p-button-sm transition-all p-1 border-blue-400 hover:bg-slate-50 z-10",
              "!rounded-md",
              "text-blue-700"
            )}
          />

          {canALTERAR && <Button 
            icon={isSyncing ? "pi pi-spin pi-spinner" : (isEditing ? "pi pi-check" : "pi pi-pencil")}
            label={isEditing ? "Concluir" : "Editar"}  
            disabled={loading}        
            className={clsx(
              "p-button-sm shadow-sm transition-all p-1",
              !isEditing && "bg-blue-600 border-blue-600 text-white",
              isEditing && !hasChangesToSave && "bg-green-600 border-green-600 text-white",
              isEditing && hasChangesToSave && "bg-red-400 border-red-400 text-white opacity-70"
            )}
            onClick={() => setIsEditing(!isEditing)}
          />}

          {(canArquivar || canNotificar) && (
            <div className="md:hidden h-auto w-auto flex items-center justify-center">
              <div className={clsx(
                "rounded-full transition-all duration-300",
                sendMessaging && "animate-glow-around ring-2 ring-blue-400" 
              )}>
                <Button 
                  icon={sendMessaging ? "pi pi-spin pi-spinner" : "pi pi-ellipsis-v"} 
                  disabled={isEditing || sendMessaging}
                  className="p-button-rounded p-button-text p-button-secondary h-auto w-auto" 
                  onClick={(e) => menu.current?.toggle(e)}
                />
              </div>
              <Menu model={menuItems} popup ref={menu} id="popup_menu_left" />
            </div>
          )}
        </div>
      </header>

      <DndContext 
        sensors={sensors} 
        collisionDetection={rectIntersection} 
        measuring={{
          droppable: {
              strategy: MeasuringStrategy.Always,
          }
        }}
        modifiers={[]}
        onDragStart={onDragStart} 
        onDragEnd={(event) => {
          setIsOverTrash(false);
          onDragEnd(event);
        }}
        onDragOver={(event) => {
          const { over } = event;
          setIsOverTrash(over?.id === 'painel-clinicas-trash');
        }}
      >
        <div className="flex flex-col sm:p-1 p-0 gap-2">
          
          <div className="flex items-center justify-between bg-slate-50 border-b border-slate-200">
              <Button 
                  icon="pi pi-chevron-left" 
                  className="p-button-rounded p-button-text text-slate-400 h-auto" 
                  onClick={() => navegar(-1)} 
                  disabled={isHoje} 
              />

              <div className="flex flex-row items-center w-auto">

                {ativaPlantao && (
                  <IconeSirenePlantao className="w-8 sm:w-12 h-8 sm:h-12 animate-pulse" />
                )}

                <div className="text-center flex flex-col items-center w-auto">
                  <div className="flex items-center gap-2">
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
                      <div className="flex items-center gap-2 px-3 py-1 rounded-lg group-hover:bg-slate-100 transition-all cursor-pointer border border-transparent group-hover:border-slate-200">
                          <span className="sm:text-lg text-[10px] font-black text-slate-700 capitalize leading-none">
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
                                      setIsPaintingMode(false);
                                  }
                              }} 
                              minDate={new Date()} 
                              showButtonBar
                              hideOnDateTimeSelect={true}
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
              </div>
              <Button 
                  icon="pi pi-chevron-right" 
                  className="p-button-rounded p-button-text text-slate-400 h-auto" 
                  onClick={() => navegar(1)} 
              />
          </div>

          {isEditing && !isPaintingMode  && (
            <div className="bg-indigo-50 border-b border-indigo-100 p-2 shadow-inner transition-all z-10 animate-fadein">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
                  <i className="pi pi-th-large mr-2"></i> Clínicas Disponíveis
                </span>
                <span className="text-[10px] font-bold text-red-800 uppercase mb-1 ml-1">
                  <i className="pi pi-trash mr-1"></i> Arraste aqui para remover
                </span>
              </div>
              
              {isEditing && !isPaintingMode && (
                <div className="p-2 animate-fadein"> 
                  <DroppableTrashZone>
                    <div className="flex flex-col p-1">
                      <ClinicasPanel clinicas={clinicas} />
                    </div>
                  </DroppableTrashZone>
                </div>
              )}
            </div>
          )}

          <div className={clsx(
                "bg-slate-50 w-full",
                isPaintingMode ? "p-1" : "")}
                style={{ 
                  display: 'block', // Garante que não herde flex do CSS
                  height: 'auto', 
                  width: '100%',
                  overflow: 'visible' 
              }}
          >
          
            <div 
              key={`cell-${isPaintingMode}-${isEditing}`} 
              className={clsx(
                "rounded-xl border shadow-sm transition-all",
                isEditing ? "border-indigo-200" : "border-slate-200",
                isPaintingMode && "ring-2 ring-indigo-400 cursor-cell",
                isOverTrash && "opacity-60 transition-all grayscale-[0.5]"
              )}
              onMouseDown={(e) => handleStartPainting(e.clientX, e.clientY, e)}
              onMouseMove={(e) => {
                  if (isPaintingMode && isDraggingWithinGrid && activePaintingClinica) {
                      const element = document.elementFromPoint(e.clientX, e.clientY);
                      const cell = element?.closest('[data-medico]');
                      if (cell) {
                          const mId = Number(cell.getAttribute('data-medico'));
                          const h = cell.getAttribute('data-hora');
                          if (mId && h) marcarCelulaTouch(mId, h);
                      }
                  }
              }}
              onMouseUp={() => { 
                setIsDraggingWithinGrid(false); 
                setActivePaintingClinica(null); 
              }}
              onMouseLeave={() => { 
                setIsDraggingWithinGrid(false); 
                setActivePaintingClinica(null); 
              }}
              
              onTouchStart={(e) => isPaintingMode && handleStartPainting(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => { 
                setIsDraggingWithinGrid(false); 
                setActivePaintingClinica(null); 
              }}    
              style={{ 
                overflowAnchor: 'none', 
                backgroundColor: 'white'
              }}
            >
              <DataTable 
                key={`grid-${lastUpdate}`}
                value={escalas}
                dataKey="medicoId" 
                loading={loading} 
                scrollable
                scrollHeight="auto"   
                className="sudoku-table-custom w-full"
                emptyMessage={`Nenhuma escala encontrado.`}
                header={renderTableHeader()}
                tableStyle={{ minWidth: '100%' }}
              >
                <Column 
                  frozen 
                  header="MÉD" 
                  align="center" 
                  style={{ width: '55px' }} 
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
                    <div className="sm:text-[12px] text-[9px] font-black text-slate-700 bg-slate-100">
                      {escala.medicoSigla?.substring(0, 3).toUpperCase()}
                    </div>
                  )} 
                />

                {HORARIOS.map(h => {
                  const bloqueado = isHoraBloqueada(h.field);

                  return (
                    <Column 
                        key={h.field} 
                        header={(
                          <div className="flex justify-center items-center">
                              <span className={`text-[13px] font-bold tracking-tight ${bloqueado ? 'text-slate-400' : 'text-blue-600'}`}>
                                  {h.header}
                              </span>
                          </div>
                      )}
                      headerClassName="bg-slate-50 border-b border-r border-slate-300 p-0 h-full min-w-[28px]"
                      headerStyle={{ justifyContent: 'center' }} 
                      pt={{
                          headerContent: { className: 'justify-center' } // Força o alinhamento central no PrimeReac
                      }}
                      className='p-0'
                      body={(escala: Escala) => {
                        const itemAlocado: EscalaItem | undefined = escala.itens?.find((i: EscalaItem) => {
                          const hItem = i.hora?.substring(0, 5) || i.hora;
                          return hItem === h.field;
                        });

                        return (
                          <DroppableCell 
                            id={`${escala.medicoId}|${h.field}`} 
                            alocacao={itemAlocado}
                            sigla={escala.medicoSigla}
                            bloqueado={bloqueado}
                            isPaintingMode={isPaintingMode}
                            // Quando clica na célula, chama a função que busca o que tem nela
                            onMouseDown={isPaintingMode ? (e: any) => handleStartPainting(e.clientX, e.clientY) : undefined}
                            onMouseEnter={isPaintingMode ? () => {
                              if (isDraggingWithinGrid && activePaintingClinica) {
                                  marcarCelulaTouch(escala.medicoId, h.field);
                              }
                            } : undefined}
                            disabled={!isEditing}
                          />
                          )}
                      } />
                  )}
                )} 
              </DataTable>
            </div>
          </div> 
        </div>

        <DragOverlay 
            dropAnimation={null} 
            style={{ pointerEvents: 'none' }} // Impede que o overlay bloqueie o drop no touch
        >
          {activeDragData ? (
            <div 
              className="shadow-2xl scale-150"
              style={{ 
                width: '28px', 
                height: '28px', 
                borderRadius: '50%', 
                backgroundColor: activeDragData.cor?.startsWith('#') ? activeDragData.cor : `#${activeDragData.cor}`,
                border: '2px solid white',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                cursor: 'grabbing',
                zIndex: 9999,
                pointerEvents: 'none' // Crucial para não travar o drop
              }}
            >
              {activeDragData.icone ? (
                <img 
                  src={activeDragData.icone.startsWith('data:') ? activeDragData.icone : `data:image/png;base64,${activeDragData.icone}`} 
                  className="w-full h-full object-contain" 
                />
              ) : (
                <i className=" text-white text-[11px]" />
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <AppCardsPlantaoNoturno 
        dataAtual={dataAtiva} 
        atualiza={plantaoNoturno} 
        canALTERAR={canALTERAR}
      />

      <DialogoLancamento 
          forcarPlantao={!ativaPlantao && !existeEscalaDia ? null : ativaPlantao}
          date={dataAtiva} 
          saveEscala={(plantao, medicoId, estabelecimentoId, 
                  intervaloPreDeinido, intervaloManual) => {
            setExibeDialogo(false);
            setAtivaPlantao(plantao);
            if ((intervaloPreDeinido && intervaloPreDeinido.horas.length > 0) || 
                (intervaloManual && intervaloManual.length > 0 && 
                  intervaloManual[0].start != null && intervaloManual[0].end != null))  {
              setEscalas(prev => {
                let tempEscalas = prev.map(e => ({
                  ...e,
                  itens: e.itens ? [...e.itens] : []
                }));

                const horasInserir: Array<number> = [];                
                if (intervaloPreDeinido && intervaloPreDeinido.horas.length > 0) {
                  tempEscalas = tempEscalas.map(e => {
                    if (e.medicoId === medicoId) {
                      intervaloPreDeinido.horas.forEach((hora: string) => {
                        const horaChecar = parseInt(hora.substring(0, 2), 10);

                        const loopHoras: Array<number> = [];

                        if (horaChecar == 7) {
                          loopHoras.push(7, 8, 9, 10, 11, 12)
                        } else if (horaChecar == 13) {
                          loopHoras.push(13, 14, 15, 16, 17, 18)
                        } else {
                          loopHoras.push(1, 2, 3, 4, 5, 6, 19, 20, 21, 22, 23, 24)
                        }
                    
                        loopHoras.forEach(h => {
                          const teste = e.itens?.find(item => {
                            const horaItem = parseInt(item.hora.substring(0, 2), 10)
                            if (horaItem === h){
                              item.estabelecimentoId = estabelecimentoId;
                            }
                            return horaItem === h;
                          })
                          if (!teste) {
                            horasInserir.push(h);
                          }
                        })

                      });
                      horasInserir.forEach(hora => {
                        let incHora = hora;
                        if (hora > 23) {
                          incHora = incHora - 24;
                        }
                        const horaFormatada = `${incHora.toString().padStart(2, '0')}:00:00`;
                        const novoItem: EscalaItem = {
                          id: undefined,
                          estabelecimentoId: estabelecimentoId,
                          hora: horaFormatada,
                          cor: undefined,
                          icone: undefined,
                          arquivado: null,
                          reagendado: false,
                          plantao: hora > 6 && hora < 19 ? plantao : true
                        };
                        e.itens?.push(novoItem);
                      })
                      return {
                        ...e
                      };
                    }
                    return e;
                  });
                }
                if (intervaloManual && intervaloManual.length > 0 &&
                    intervaloManual[0].start != null && intervaloManual[0].end != null) {

                  tempEscalas = tempEscalas.map(e => {
                    if (e.medicoId === medicoId) {
                      intervaloManual.forEach((item: any) => {
                        const horaInicio = item.start.getHours();
                        const horaFim = item.end.getHours();  

                        const loopHoras: Array<number> = [];

                        if ((horaFim - horaInicio) == 1){
                          loopHoras.push(horaInicio);
                        } else {
                          for (let i = horaInicio; i < horaFim; i++) {
                            loopHoras.push(i);
                          }
                        }

                        loopHoras.forEach(h => {
                          const teste = e.itens?.find(item => {
                            const horaItem = parseInt(item.hora.substring(0, 2), 10)
                            if (horaItem === h){
                              item.estabelecimentoId = estabelecimentoId;
                            }
                            return horaItem === h;
                          })
                          if (!teste) {
                            horasInserir.push(h);
                          }
                        })

                      });
                      horasInserir.forEach(hora => {
                        let incHora = hora;
                        if (hora > 23) {
                          incHora = incHora - 24;
                        }
                        const horaFormatada = `${incHora.toString().padStart(2, '0')}:00:00`;
                        const novoItem: EscalaItem = {
                          id: undefined,
                          estabelecimentoId: estabelecimentoId,
                          hora: horaFormatada,
                          cor: undefined,
                          icone: undefined,
                          arquivado: null,
                          reagendado: false,
                          plantao: hora > 6 && hora < 19 ? plantao : true
                        };
                        e.itens?.push(novoItem);
                      })
                      return {
                        ...e
                      };
                    }
                    return e;
                  });

                }
                setHasChangesToSave(true);
                return tempEscalas;
              });
            }
          }} 
          escalas={escalas} 
          exibeDialogo={exibirDialogo}
          closeDialog={() => setExibeDialogo(false)} />
    </div>
  );
};