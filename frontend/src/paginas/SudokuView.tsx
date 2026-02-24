import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Accordion, AccordionTab } from 'primereact/accordion';

// DND-KIT (Regra 10)
import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay, closestCorners, useDraggable, useDroppable } from '@dnd-kit/core';

import { CrudHeader } from '@/componentes/crud/CrudHeader';
import { server } from '@/api/server';
import { getIntervalosEscala } from '@/types/escalaHelper';
import { ClinicasPanel } from '@/componentes/sudoku/ClinicasPanel';
import '@/componentes/sudoku/SudokuView.css';
import type { Estabelecimento } from '@/types/estabelecimento';
import type { Escala, EscalaItem } from '@/types/escala';
import { DateUtils } from '@/utils/DateUtils';
import clsx from 'clsx';

const DroppableCell = ({ id, alocacao, bloqueado, isPaintingMode, onMouseDown, onMouseEnter, }: any) => {
  const { isOver, setNodeRef } = useDroppable({ 
    id, 
    disabled: bloqueado
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
        />
      ) : (
        bloqueado && <div className="w-[14px] h-[14px] bg-slate-200 rounded-full opacity-50" />
      )}
      {!alocacao && !bloqueado && <div className="w-1 h-1 bg-slate-300 rounded-full opacity-40"></div>}
    </div>
  );
};

const DraggableItem = ({ alocacao, medicoId, horaOriginal, isPaintingMode, bloqueado }: any) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `alocado|${medicoId}|${horaOriginal}`,
    disabled: bloqueado,
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
    cursor: bloqueado ? 'not-allowed' : (isPaintingMode ? 'cell' : 'grab'),
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
  const [accordionActiveIndex, setAccordionActiveIndex] = useState<number | null>(0);

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
    const carregarDadosIniciais = async () => {
      setLoading(true);
      try {
        // Regra: Chamar API para estabelecimentos ativos
        const resClinicas = await server.api.listar<Estabelecimento>('/estabelecimento', { ativo: true });
        setClinicas(resClinicas || []); 
  
        // Aproveitamos para carregar os médicos que aparecerão nas linhas do grid
        // const resMedicos = await server.api.listar<Medico>('/medico', { ativo: true });
        // setMedicos(resMedicos || []);
      } catch (error) {
        console.error("Erro ao carregar dados do Sudoku:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarDadosIniciais();
  }, []);

  useEffect(() => {
    const buscarEscalasDoDia = async (data: Date) => {
      setLoading(true);
      try {
        const dataFormatada = DateUtils.paraISO(data);
        // Busca as escalas do dia. O backend deve trazer os itens inclusos (Join)
        
        const escalas = await server.api.listarCustomizada<Escala>('/escala', '/listardia', { data: dataFormatada });
        
        setEscalas(escalas);
        setLastUpdate(Date.now());
      } finally {
        setLoading(false);
      }
      };

    buscarEscalasDoDia(dataAtiva);
  }, [dataAtiva]);

  // Adicione também este useEffect para garantir que o "arraste" pare ao soltar o mouse
  useEffect(() => {
    const stopDragging = () => setIsDraggingWithinGrid(false);
    window.addEventListener('mouseup', stopDragging);
    return () => window.removeEventListener('mouseup', stopDragging);
  }, []);

  useEffect(() => {
    if (isPaintingMode) {
        setAccordionActiveIndex(null); // Fecha o Accordion (null desativa todos os tabs)
    } else {
        setAccordionActiveIndex(0); // Abre o primeiro tab (Clínicas) ao sair do modo pintura
    }
}, [isPaintingMode]);

  const HORARIOS = useMemo(() => getIntervalosEscala(), []);
  const isHoje = dataAtiva.toDateString() === new Date().toDateString();

  const navegar = (dias: number) => {
    const novaData = new Date(dataAtiva);
    novaData.setDate(novaData.getDate() + dias);
    setDataAtiva(novaData);

    setIsPaintingMode(false);
    setIsDraggingWithinGrid(false);
    setActivePaintingClinica(null);
    setAccordionActiveIndex(0);
  };

  const onDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveDragData(null);
  
    if (!over || !active) return;
  
    const dataAtiva = active.data.current;
    const [destMedicoIdStr, destHora] = over.id.split('|');
    const destMedicoId = Number(destMedicoIdStr);
  
    const novasEscalas = [...escalas];
  
    // 1. Se for movimentação interna, limpamos a origem primeiro
    if (dataAtiva.isFromGrid) {
      const { medicoId: origMedicoId, hora: origHora } = dataAtiva.origem;
      const escalaOrigem: Escala | undefined = novasEscalas.find(e => e.medicoId === origMedicoId);
      if (escalaOrigem) {
        escalaOrigem.itens = escalaOrigem.itens?.filter(i => (i.hora?.substring(0, 5) || i.hora) !== origHora);
      }
    }
  
    // 2. Identificamos a Clínica (seja do painel ou do grid)
    const clinicaParaMover = dataAtiva.isFromGrid ? dataAtiva.alocacao : dataAtiva.clinica;
  
    // 3. Adicionamos no destino (mesma lógica anterior)
    let escalaDestino = novasEscalas.find(e => e.medicoId === destMedicoId);
    if (!escalaDestino) {
      escalaDestino = { id: undefined, medicoId: destMedicoId, data: dataStr, itens: [], medicoSigla: '' };
      novasEscalas.push(escalaDestino);
    }
  
    const itensAtuais = escalaDestino.itens || [];

    escalaDestino.itens = [
      ...itensAtuais.filter(i => (i.hora?.substring(0, 5) || i.hora) !== destHora),
      {
        estabelecimentoId: clinicaParaMover.estabelecimentoId || clinicaParaMover.id,
        hora: destHora,
        cor: clinicaParaMover.cor,
        icone: clinicaParaMover.icone
      }
    ];
  
    setEscalas(novasEscalas);
    setLastUpdate(Date.now());
  
    // 4. Persistência (Enviamos as escalas alteradas para o Back)
    // Recomendo enviar apenas a escala de destino e a de origem se forem diferentes
    try {
      // Filtramos apenas as escalas que foram afetadas no movimento
      const escalasAfetadas = novasEscalas.filter(e => 
          e.medicoId === destMedicoId || 
          (dataAtiva.isFromGrid && e.medicoId === dataAtiva.origem.medicoId)
      );
  
      // Montamos o payload seguindo a estrutura do seu EscalaRequestDTO
      // mas enviando como um array
      const payload = escalasAfetadas.map(p => ({
          id: p.id || undefined,
          medicoId: p.medicoId,
          data: p.data, // formato ISO YYYY-MM-DD
          itens: p.itens?.map(i => ({
              id: i.id,
              estabelecimentoId: i.estabelecimentoId,
              hora: i.hora.substring(0, 5), // Garantindo o formato HH:mm
          }))
      }));
  
      // Enviamos a lista completa em uma única requisição
      await server.api.criar('/escala/sudoku', payload);
  
    } catch (err) {
        console.error("Erro na transposição:", err);
    }
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
  const marcarCelulaTouch = async (medicoId: number, hora: string) => {
    if (!activePaintingClinica || !isPaintingMode) {
      return;
    }
  
    setEscalas(prevEscalas => {
      const novasEscalas = [...prevEscalas];
      let escalaIndex = novasEscalas.findIndex(e => e.medicoId === medicoId);
      
      if (escalaIndex === -1) {
        novasEscalas.push({
          medicoId,
          data: dataStr,
          itens: [],
          medicoSigla: ''
        });
        escalaIndex = novasEscalas.length - 1;
      }
    
      const escalaAlvo = { ...novasEscalas[escalaIndex] };
      const itensAtuais = [...(escalaAlvo.itens || [])];
    
      // Verifica se já existe a mesma clínica na mesma hora
      const jaExiste = itensAtuais.find(i => 
        (i.hora?.substring(0, 5) || i.hora) === hora && 
        i.estabelecimentoId === activePaintingClinica.id
      );
    
      if (jaExiste) {
        return prevEscalas;
      }
    
      // IMPORTANTE: Remove o item antigo daquela hora para substituir
      const novosItens = itensAtuais.filter(i => (i.hora?.substring(0, 5) || i.hora) !== hora);
      
      // Adiciona o novo item (Pincel)
      novosItens.push({
        id: undefined, // <--- Regra do seu backend: ID null para persistir novo item
        estabelecimentoId: activePaintingClinica.id,
        hora: hora,
        cor: activePaintingClinica.cor,
        icone: activePaintingClinica.icone
      });
    
      escalaAlvo.itens = novosItens;
      novasEscalas[escalaIndex] = escalaAlvo;
      setHasChangesToSave(true);
      return novasEscalas;
    });
  };

  const persistirAlteracoesPintura = async () => {
    if (!hasChangesToSave) return;

    try {
        const payload = escalas.map(p => ({
            id: p.id || null,
            medicoId: p.medicoId,
            data: dataStr,
            itens: p.itens?.map(i => ({
                id: i.id || null,
                estabelecimentoId: i.estabelecimentoId,
                hora: i.hora.substring(0, 5),
            }))
        }));

        await server.api.criar('/escala/sudoku', payload);
        setHasChangesToSave(false); // Sucesso!
    } catch (err) {
        console.error("Erro ao persistir lote de pintura:", err);
        // Opcional: Mostrar um Toast de erro aqui
    }
  };

  const handleStartPainting = (clientX: number, clientY: number, e?: any) => {
    if (!isPaintingMode) {
      return;
    }

    // e.button === 0 garante que é o clique esquerdo
    if (e && e.button !== 0 && e.type === 'mousedown') {
      return;
    }

    // Crucial para desktop: impede o "ghost image" de arrastar do navegador
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    const element = document.elementFromPoint(clientX, clientY);
    const cell = element?.closest('[data-medico]');

    if (cell) {
        const medicoId = Number(cell.getAttribute('data-medico'));
        const hora = cell.getAttribute('data-hora');

        if (isHoraBloqueada(hora!)) {
          return; 
        }

        // Busca a clínica que está nesta célula para "copiar"
        const escalaDoMedico = escalas.find(e => e.medicoId === medicoId);
        const itemAlocado = escalaDoMedico?.itens?.find(i => 
            (i.hora?.substring(0, 5) || i.hora) === hora
        );

        if (itemAlocado) {
            setActivePaintingClinica({
                id: itemAlocado.estabelecimentoId,
                cor: itemAlocado.cor,
                icone: itemAlocado.icone
            } as Estabelecimento);
            
        }

        setIsDraggingWithinGrid(true);
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

  return (
    <div className="sudoku-container">
      {/* Regra 1: Removido botão Novo passando onAdd como undefined */}
      <CrudHeader title="Quadro Sudoku" onAdd={undefined} />

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={onDragStart} 
        onDragEnd={onDragEnd}
      >
        <div className="flex flex-col p-2 gap-2 flex-grow overflow-hidden">
          
          {/* Regra 2: Visual igual ao AppEscalaDiaria */}
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

          <Accordion 
            className="custom-accordion"
            activeIndex={accordionActiveIndex} 
            onTabChange={(e) => setAccordionActiveIndex(e.index as number)}
          >
            <AccordionTab 
              header={
                <div className="flex items-center justify-between w-full pr-4">
                  <span>Clínicas / Hospitais</span>
                  
                  {/* Botão visível apenas no Desktop dentro do Header do Accordion */}
                  <div className="hidden md:flex items-center gap-2" onClick={(e) => e.stopPropagation()}> 
                    <span className={clsx(
                      "text-[10px] font-bold uppercase tracking-widest transition-opacity",
                      isPaintingMode ? "text-blue-600 opacity-100" : "text-slate-400 opacity-0"
                    )}>
                      Modo Pintura Ativo
                    </span>
                    <Button 
                      icon={isPaintingMode ? "pi pi-check" : "pi pi-palette"} 
                      label={isPaintingMode ? "Finalizar" : "Ativar Pincel"}
                      className={clsx(
                        "p-button-rounded p-button-sm shadow-sm transition-all",
                        isPaintingMode ? "p-button-primary" : "p-button-outlined p-button-secondary"
                      )}
                      onClick={() => {
                        setIsPaintingMode(!isPaintingMode);
                        if (isPaintingMode) {
                          setIsDraggingWithinGrid(false);
                          setActivePaintingClinica(null);
                        }
                      }}
                    />
                  </div>
                </div>
              }
            >
              <ClinicasPanel clinicas={clinicas} />
            </AccordionTab>
          </Accordion>

          <div 
            key={isPaintingMode ? 'painting-on' : 'painting-off'}
            className={clsx(
                "flex-grow overflow-hidden bg-white border rounded-xl shadow-inner",
                isPaintingMode ? "touch-none cursor-cell overflow-hidden" : "overflow-auto"
            )}
            // Eventos para Desktop
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
              persistirAlteracoesPintura();
            }}
            onMouseLeave={() => { 
              setIsDraggingWithinGrid(false); 
              setActivePaintingClinica(null); 
              persistirAlteracoesPintura();
            }}
            
            // Eventos para Mobile (Onde o problema estava)
            onTouchStart={(e) => isPaintingMode && handleStartPainting(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => { 
              setIsDraggingWithinGrid(false); 
              setActivePaintingClinica(null); 
              persistirAlteracoesPintura();
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
                        />
                        )}
                    } />
                )}
              )} 
            </DataTable>
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
                <span className="text-[10px] text-white font-bold uppercase">
                    {activeDragData.sigla || activeDragData.nome?.substring(0, 2)}
                </span>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <button className="mobile-exit-fab md:hidden" onClick={() => navigate(-1)}>
        <i className="pi pi-times" />
      </button>

      <button 
        className={clsx(
          "fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center border-none z-50 transition-all md:hidden",
          isPaintingMode ? "bg-blue-600 text-white" : "bg-white text-gray-500 border border-gray-200"
        )}
        onClick={() => {
          const novoModo = !isPaintingMode;
          setIsPaintingMode(novoModo);
          
          // RESET TOTAL: Limpa tudo que pode travar o mouse/touch
          setIsDraggingWithinGrid(false);
          setActivePaintingClinica(null);
          
          // Isso força o React a limpar o estado de movimento
          if (!novoModo) {
              document.body.style.cursor = 'default';
          }
        }}
      >
        <i className={clsx("pi", isPaintingMode ? "pi-pencil" : "pi-palette", "text-xl")}></i>
      </button>
    </div>
  );
};