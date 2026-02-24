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

const DroppableCell = ({ id, alocacao, bloqueado }: any) => {
  const { isOver, setNodeRef } = useDroppable({ 
    id, 
    disabled: bloqueado 
  });

  const [medicoId, hora] = id.split('|');

  return (
    <div 
      ref={setNodeRef} 
      className={`flex items-center justify-center min-h-[28px] min-w-[28px] border-r border-b border-slate-300 transition-colors
          ${bloqueado ? 'bg-slate-100/50' : 'hover:bg-blue-50/50'}
          ${isOver && !bloqueado ? 'bg-blue-200' : ''}`}
    >
      {alocacao ? (
        <DraggableItem 
          alocacao={alocacao} 
          medicoId={Number(medicoId)} 
          horaOriginal={hora} 
        />
      ) : (
        !bloqueado && <div className="w-1 h-1 bg-slate-300 rounded-full opacity-40"></div>
      )}
    </div>
  );
};

const DraggableItem = ({ alocacao, medicoId, horaOriginal }: any) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `alocado|${medicoId}|${horaOriginal}`,
    data: { 
        isFromGrid: true, 
        alocacao,
        origem: { medicoId, hora: horaOriginal }
    }
  });

  // Consolidamos os estilos aqui
  const styleFinal = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 999 : 1,
    backgroundColor: alocacao.cor?.startsWith('#') ? alocacao.cor : `#${alocacao.cor}`,
    cursor: isDragging ? 'grabbing' : 'grab',
    // IMPORTANTE PARA MOBILE:
    touchAction: 'none', 
    WebkitUserSelect: 'none' as const,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={styleFinal} // <--- Apenas UM atributo style agora
      {...listeners} 
      {...attributes}
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Só ativa se mover 5px (evita cliques acidentais)
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,    // Segurar por 250ms ativa o drag (evita o zoom)
        tolerance: 5,  // Se o dedo tremer mais de 5px antes dos 250ms, cancela
      },
    })
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

  const HORARIOS = useMemo(() => getIntervalosEscala(), []);
  const isHoje = dataAtiva.toDateString() === new Date().toDateString();

  const navegar = (dias: number) => {
    const novaData = new Date(dataAtiva);
    novaData.setDate(novaData.getDate() + dias);
    setDataAtiva(novaData);
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

  return (
    <div className="sudoku-container">
      {/* Regra 1: Removido botão Novo passando onAdd como undefined */}
      <CrudHeader title="Quadro Sudoku" onAdd={undefined} />

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
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

          <Accordion className="custom-accordion">
            <AccordionTab header="Clínicas / Hospitais">
              <ClinicasPanel clinicas={clinicas} />
            </AccordionTab>
          </Accordion>

          {/* Regra 5-8: DataTable */}
          <div className="flex-grow overflow-hidden bg-white border rounded-xl shadow-inner">
            <DataTable 
              key={`grid-${lastUpdate}`}
              value={escalas}
              dataKey="medicoId" 
              loading={loading} 
              scrollable 
              scrollHeight="flex" 
              className="sudoku-table-custom"
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
    </div>
  );
};