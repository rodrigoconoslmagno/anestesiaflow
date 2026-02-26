import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';

// DND-KIT (Regra 10)
import { MeasuringStrategy, DndContext, PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay, closestCorners, useDraggable, useDroppable } from '@dnd-kit/core';

import { server } from '@/api/server';
import { getIntervalosEscala } from '@/types/escalaHelper';
import { ClinicasPanel } from '@/componentes/sudoku/ClinicasPanel';
import '@/componentes/sudoku/SudokuView.css';
import type { Estabelecimento } from '@/types/estabelecimento';
import type { Escala, EscalaItem } from '@/types/escala';
import { DateUtils } from '@/utils/DateUtils';
import clsx from 'clsx';

const DroppableCell = ({ id, alocacao, bloqueado, isPaintingMode, onMouseDown, onMouseEnter, disabled}: any) => {
  const { isOver, setNodeRef } = useDroppable({ 
    id, 
    disabled: bloqueado || disabled
  });

  const [medicoId, hora] = id.split('|');

  return (
    <div 
      ref={setNodeRef} 
      data-medico={medicoId} // Adicione isso
      data-hora={hora}     // Adicione isso
      // IMPORTANTE: Só executa estas funções se isPaintingMode for TRUE
      onMouseDown={(e) => isPaintingMode && onMouseDown?.(e)}
      onMouseEnter={(e) => isPaintingMode && onMouseEnter?.(e)}
      className={`flex items-center justify-center min-h-[28px] min-w-[28px] border-r border-b border-slate-300 transition-colors
          ${bloqueado ? 'bg-slate-50/50 cursor-not-allowed' : 'hover:bg-blue-50/50'}
          ${isOver && !bloqueado ? 'bg-blue-200' : ''}`}
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
        bloqueado && <div className="w-[14px] h-[14px] bg-slate-200 rounded-full opacity-50" />
      )}
      {!alocacao && !bloqueado && <div className="w-1 h-1 bg-slate-300 rounded-full opacity-40"></div>}
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

  // Consolidamos os estilos aqui
  const styleFinal = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 999 : 1,
    opacity: isDragging ? 0.5 : (bloqueado ? 0.6 : 1),
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
      className="w-[28px] h-[28px] rounded-full border border-white shadow-sm flex items-center justify-center overflow-hidden active:cursor-grabbing"
    >
      {alocacao.icone && (
        <img 
          src={alocacao.icone.startsWith('data:') ? alocacao.icone : `data:image/png;base64,${alocacao.icone}`} 
          className="object-contain w-full h-full pointer-events-none" 
        />
      )}
    </div>
  );
};

export const SudokuView = () => {
  const navigate = useNavigate();
  const [dataAtiva, setDataAtiva] = useState(new Date());
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [clinicas, setClinicas] = useState<Estabelecimento[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeDragData, setActiveDragData] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isPaintingMode, setIsPaintingMode] = useState(false);
  const [activePaintingClinica, setActivePaintingClinica] = useState<Estabelecimento | null>(null);
  const [isDraggingWithinGrid, setIsDraggingWithinGrid] = useState(false);
  const [hasChangesToSave, setHasChangesToSave] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  useEffect(() => {
    const carregarDados = async () => {
      // Ativamos o loading logo no início
      setLoading(true);
      
      try {
        const dataFormatada = DateUtils.paraISO(dataAtiva);

        // Usamos Promise.all para disparar as buscas em paralelo se for a carga inicial.
        // Se já tivermos as clínicas, buscamos apenas as escalas.
        if (clinicas.length === 0) {
          const [resClinicas, resEscalas] = await Promise.all([
            server.api.listar<Estabelecimento>('/estabelecimento', { ativo: true }),
            server.api.listarCustomizada<Escala>('/escala', '/listardia', { data: dataFormatada })
          ]);
          
          setClinicas(resClinicas || []);
          setEscalas(resEscalas || []);
        } else {
          // Se as clínicas já existem (mudança de data), buscamos apenas as escalas
          const resEscalas = await server.api.listarCustomizada<Escala>('/escala', '/listardia', { data: dataFormatada });
          setEscalas(resEscalas || []);
        }

        setLastUpdate(Date.now());
      } catch (error) {
        console.error("Erro ao carregar dados do Sudoku:", error);
      } finally {
        // O loading só é desativado quando TUDO terminar
        setLoading(false);
      }
    };

    carregarDados();
    // O efeito roda na montagem e sempre que a data ativa mudar
  }, [dataAtiva]);

  // Adicione também este useEffect para garantir que o "arraste" pare ao soltar o mouse
  useEffect(() => {
    const stopDragging = () => setIsDraggingWithinGrid(false);
    window.addEventListener('mouseup', stopDragging);
    return () => window.removeEventListener('mouseup', stopDragging);
  }, []);

  useEffect(() => {
    // Condição para salvar:
    // - Temos mudanças pendentes (hasChangesToSave)
    // - O usuário NÃO está no meio de um arraste de pintura (isDraggingWithinGrid)
    // - O usuário NÃO está no meio de um arraste de item (activeDragData === null)
    const interacaoFinalizada = !isDraggingWithinGrid && activeDragData === null;

    if (hasChangesToSave && interacaoFinalizada) {
      const sincronizarComBackend = async () => {
        try {
          setIsSyncing(true);
          
          const payload = escalas.map(p => ({
            // Se a escala não tem itens, enviamos o ID dela para o backend saber QUAL deletar
            // Se enviarmos sem ID e sem itens, o backend ignora.
            id: p.id || null, 
            medicoId: p.medicoId,
            data: dataStr,
            itens: p.itens?.map(i => ({
              // O ITEM movido NUNCA deve levar o ID antigo, senão o JPA tenta dar update 
              // em vez de criar um novo e gera conflito de Unique Key (Médico/Hora)
              id: i.id || null, 
              estabelecimentoId: i.estabelecimentoId,
              hora: (i.hora?.substring(0, 5) || i.hora),
            })) || [] 
          }));
          
          // Dica: Tente enviar apenas as escalas que foram modificadas ou todas, 
          // mas garanta que o 'id' do item movido seja nulo.
          const response = await server.api.criar<Escala[]>('/escala/sudoku', payload as Escala[]);

          if (response && Array.isArray(response)) {
            // 1. Criamos um Mapa para acesso rápido
            const mapaBack = new Map(response.map(e => [e.medicoId, e]));

            // 2. Usamos a função de atualização para garantir o estado mais recente (prev)
            setEscalas((prev) => {
              const novoEstado = prev.map((escalaLocal) => {
                const escalaDoBanco = mapaBack.get(escalaLocal.medicoId);

                if (escalaDoBanco) {
                  // Retornamos o objeto completo vindo do banco (com os IDs reais)
                  return {
                    ...escalaDoBanco,
                    // Garantimos que campos visuais que talvez o back não retorne sejam mantidos
                    medicoSigla: escalaLocal.medicoSigla 
                  };
                }

                // Se o médico não está no retorno, limpamos as marcações dele no grid
                return { 
                  ...escalaLocal, 
                  id: undefined, 
                  itens: [] 
                };
              });

              return novoEstado;
            });
          }

          setHasChangesToSave(false);
        } catch (err) {
          console.error("Falha na sincronização:", err);
        } finally {
          setIsSyncing(false);
        }
      };

      sincronizarComBackend();
    }
  }, [hasChangesToSave, isDraggingWithinGrid, activeDragData, escalas, dataStr]);

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
    if (!over) return;
  
    const dragData = active.data.current;
    const [destMedicoIdStr, destHora] = over.id.split('|');
    const destMedicoId = Number(destMedicoIdStr);
    const horaDestNorm = destHora.substring(0, 5);
  
    setEscalas(prev => {
      // 1. Cópia profunda
      let tempEscalas = prev.map(e => ({
        ...e,
        itens: e.itens ? [...e.itens] : []
      }));
  
      // 2. REMOÇÃO DA ORIGEM
      if (dragData.isFromGrid) {
        const { medicoId: oMedId, hora: oHora } = dragData.origem;
        const oHoraNorm = oHora.substring(0, 5);
        
        tempEscalas = tempEscalas.map(e => {
          if (e.medicoId === oMedId) {
            return {
              ...e,
              itens: e.itens?.filter(i => (i.hora?.substring(0, 5) || i.hora) !== oHoraNorm)
            };
          }
          return e;
        });
      }
  
      // 3. PREPARAÇÃO DO ITEM
      const clinica = dragData.isFromGrid ? dragData.alocacao : dragData.clinica;
      const novoItem: EscalaItem = {
        id: undefined, // SEMPRE undefined para o novo local
        estabelecimentoId: clinica.estabelecimentoId || clinica.id,
        hora: horaDestNorm,
        cor: clinica.cor,
        icone: clinica.icone
      };
  
      // 4. ADIÇÃO NO DESTINO
      const idxDest = tempEscalas.findIndex(e => e.medicoId === destMedicoId);
  
      if (idxDest === -1) {
        tempEscalas.push({ 
          medicoId: destMedicoId, 
          data: dataStr, 
          itens: [novoItem], 
          medicoSigla: '' // O backend deve preencher ou você pode buscar do objeto clinica se necessário
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
    // Pega os dados que injetamos no useDraggable (seja do painel ou do DraggableItem)
    const data = active.data.current;
    
    if (data.isFromGrid) {
        // Se vem do grid, usamos os dados da alocação para o "fantasma" que voa
        setActiveDragData(data.alocacao);
    } else {
        // Se vem do painel lateral
        setActiveDragData(data.clinica);
    }
  };

  const isHoraBloqueada = (horaStr: string) => {
    if (!isHoje) {
        // Se a data ativa for anterior a hoje, bloqueia tudo
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        return dataAtiva < hoje;
    }
    
    const agora = new Date();
    // Criamos a data de início do intervalo para hoje
    const dataInicioIntervalo = new Date(`${dataStr}T${horaStr}:00`);
    
    // Bloqueia se o início do intervalo já passou
    return dataInicioIntervalo <= agora;
  };

  // Função para marcar a célula (reaproveitando a lógica de salvamento que você já tem)
  const marcarCelulaTouch = (medicoId: number, hora: string) => {
    if (!activePaintingClinica || !isPaintingMode) return;
  
    const horaNormalizada = hora.substring(0, 5);
  
    setEscalas(prevEscalas => {
      // 1. Localiza a escala do médico no estado mais atualizado possível
      const escalaIndex = prevEscalas.findIndex(e => e.medicoId === medicoId);
      
      // 2. Se não existe, cria uma nova
      if (escalaIndex === -1) {
        const novaEscala: Escala = { 
          medicoId, 
          data: dataStr, 
          itens: [{
            id: undefined,
            estabelecimentoId: activePaintingClinica.id,
            hora: horaNormalizada,
            cor: activePaintingClinica.cor,
            icone: activePaintingClinica.icone
          }], 
          medicoSigla: '' 
        };
        setHasChangesToSave(true);
        return [...prevEscalas, novaEscala];
      }
  
      // 3. Verifica se a célula já tem EXATAMENTE a mesma clínica (evita re-render à toa)
      const escalaAtual = prevEscalas[escalaIndex];
      const jaExiste = escalaAtual.itens?.find(i => 
        (i.hora?.substring(0, 5) || i.hora) === horaNormalizada && 
        i.estabelecimentoId === activePaintingClinica.id
      );
  
      if (jaExiste) return prevEscalas;
  
      // 4. Cria a nova lista de itens substituindo o que houver na hora
      const novosItens = [
        ...(escalaAtual.itens || []).filter(i => (i.hora?.substring(0, 5) || i.hora) !== horaNormalizada),
        {
          id: undefined,
          estabelecimentoId: activePaintingClinica.id,
          hora: horaNormalizada,
          cor: activePaintingClinica.cor,
          icone: activePaintingClinica.icone
        }
      ];
  
      // 5. Retorna o novo array de escalas (Imutabilidade Total)
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
            // AQUI ESTÁ O SEGREDO: 
            // Criamos um objeto de clínica consistente para o "pincel"
            setActivePaintingClinica({
                id: itemAlocado.estabelecimentoId, // Sempre usamos o ID do estabelecimento
                cor: itemAlocado.cor,
                icone: itemAlocado.icone
            } as Estabelecimento);
            
            setIsDraggingWithinGrid(true);
        }
    }
  };

  // 2. Função para o movimento no Mobile (Touch)
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
            marcarCelulaTouch(mId, h); // Executa a cópia
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
            
            {/* O Pincel fica aqui: colado no Grid */}
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

  return (
    // <div className="sudoku-container">
    <div className="sudoku-container flex flex-col h-screen bg-slate-50 overflow-hidden">
      
      {/* 1. HEADER GLOBAL (Fixo no topo) */}
      {/* <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm z-20"> */}
      <header className={clsx(
          "flex items-center justify-between px-4 py-3 bg-white border-b transition-all duration-300 relative overflow-hidden",
          isPaintingMode ? "border-blue-200" : "border-slate-200"
      )}>
        {/* O GLOW DE ATIVIDADE: Aparece se estiver sincronizando ou com mudanças */}
        {(isSyncing || hasChangesToSave) && <div className="sync-glow-bar" />}

        <div className="flex items-center gap-4">
          {/* O botão sair sai do FAB e vem para o padrão mobile/tablet: Canto superior esquerdo */}
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
          <h1 className="text-lg md:text-xl font-black text-slate-700 m-0">
            Escala Sudoku
          </h1>
        </div>

        {/* Botão Principal de Ação: Alterna entre ver e editar */}
        <Button 
          icon={isSyncing ? "pi pi-spin pi-spinner" : (isEditing ? "pi pi-check" : "pi pi-pencil")}
          label={isEditing ? "Concluir" : "Editar Escala"}          
          className={clsx(
            "p-button-sm shadow-sm transition-all p-1",
            !isEditing && "bg-blue-600 border-blue-600 text-white",
            isEditing && !hasChangesToSave && "bg-green-600 border-green-600 text-white",
            isEditing && hasChangesToSave && "bg-red-400 border-red-400 text-white opacity-70"
          )}
          onClick={() => setIsEditing(!isEditing)} // Variável hipotética para controlar a UI
        />
      </header>

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        measuring={{
          droppable: {
              strategy: MeasuringStrategy.Always,
          }
        }}
        modifiers={[]}
        onDragStart={onDragStart} 
        onDragEnd={onDragEnd}
      >
        <div className="flex flex-col p-1 gap-2 flex-grow overflow-hidden">
          
          <div className="flex items-center justify-between bg-slate-50 p-1 border-b border-slate-200">
              <Button 
                  icon="pi pi-chevron-left" 
                  className="p-button-rounded p-button-text text-slate-400" 
                  onClick={() => navegar(-1)} 
                  disabled={isHoje} 
              />
              <div className="text-center flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                          Escala Diária
                      </span>
                      {isHoje && (
                          <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm uppercase tracking-tighter">
                              Hoje
                          </span>
                      )}
                  </div>
                  <span className="text-lg font-black text-slate-700 capitalize leading-none">
                      {dataAtiva.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                  </span>
              </div>
              <Button 
                  icon="pi pi-chevron-right" 
                  className="p-button-rounded p-button-text text-slate-400" 
                  onClick={() => navegar(1)} 
              />
          </div>

          {isEditing && !isPaintingMode  && (
            <div className="bg-indigo-50 border-b border-indigo-100 p-2 shadow-inner transition-all z-10 animate-fadein">
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
                  <i className="pi pi-th-large mr-2"></i> Clínicas Disponíveis
                </span>
              </div>
              
              {/* Container das clínicas - Com scroll horizontal suave nativo */}
              <div className="overflow-x-auto pb-1 hide-scrollbar">
                {/* Substitua isso pelo seu componente <ClinicasPanel clinicas={clinicas} /> se ele suportar scroll horizontal flex */}
                <ClinicasPanel clinicas={clinicas} />
              </div>
            </div>
          )}

          <div className={clsx(
                "flex-1 overflow-hidden bg-slate-50",
                isPaintingMode ? "p-1" : ""
          )}>
          
            <div 
              key={`cell-${isPaintingMode}-${isEditing}`} 
              className={clsx(
                "h-full rounded-xl overflow-hidden border shadow-sm transition-all",
                isEditing ? "border-indigo-200" : "border-slate-200",
                isPaintingMode ? "ring-2 ring-indigo-400 cursor-cell" : ""
              )}
              onMouseDown={(e) => handleStartPainting(e.clientX, e.clientY, e)}
              // ADICIONE ESTE HANDLER PARA DESKTOP
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
              
              // Eventos para Mobile (Onde o problema estava)
              onTouchStart={(e) => isPaintingMode && handleStartPainting(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => { 
                setIsDraggingWithinGrid(false); 
                setActivePaintingClinica(null); 
              }}    
              style={{ 
                overflowAnchor: 'none', 
                height: '100%', // Garante que o container tenha altura para o scroll funcionar
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <DataTable 
                key={`grid-${lastUpdate}`}
                value={escalas}
                dataKey="medicoId" 
                loading={loading} 
                scrollable 
                scrollHeight="flex" 
                className="sudoku-table-custom"
                emptyMessage={`Nenhuma escala encontrado.`}
                header={renderTableHeader()}
              >
                <Column 
                  frozen 
                  header="MÉD" 
                  align="center" 
                  style={{ width: '55px' }} 
                  body={(escala: Escala) => (
                    <div className="text-[11px] font-black text-slate-700">{escala.medicoSigla?.substring(0, 3).toUpperCase()}</div>
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
    </div>
  );
};