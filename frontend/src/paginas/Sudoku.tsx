import { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { clinicasMock, medicosMock, type Clinica, initialAlocacoesMock } from '../types/sudoku';
import { SudokuCell } from '@/componentes/sudoku/SudokuCell';
import { ClinicasPanel } from '@/componentes/sudoku/ClinicasPanel';
import '@/componentes/sudoku/sudoku.css';

export const Sudoku = () => {
  const [alocacoes, setAlocacoes] = useState<Record<string, Clinica>>(initialAlocacoesMock);
  const [isPaintingMode, setIsPaintingMode] = useState(false);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
  const [activePaintingClinica, setActivePaintingClinica] = useState<Clinica | null>(null);
  const [isDraggingWithinGrid, setIsDraggingWithinGrid] = useState(false);

  const horas = Array.from({ length: 13 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);

  // --- Lógica de Drag and Drop ---
  const onDragStart = (e: React.DragEvent, clinica: Clinica, origem?: { medicoId: number; hora: string }) => {
    if (isPaintingMode) {
      e.preventDefault(); // Garante que não arraste nada se estiver pintando
      return;
    }
    
    // Indica ao sistema que o item pode ser movido
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.dropEffect = 'move';
    
    e.dataTransfer.setData('clinica', JSON.stringify(clinica));
    if (origem) e.dataTransfer.setData('origem', JSON.stringify(origem));

    (e.target as HTMLElement).classList.add('dragging-active');
  };

  const onDragEnd = (e: React.DragEvent) => {
    // Remove a classe independente de onde o item caiu
    (e.target as HTMLElement).classList.remove('dragging-active');
  };

  const onDrop = (e: React.DragEvent, medicoId: number, hora: string) => {
    e.preventDefault();
    e.stopPropagation();
  
    const clinicaData = e.dataTransfer.getData('clinica');
    const origemData = e.dataTransfer.getData('origem');
  
    if (!clinicaData) return;
  
    try {
      const clinica = JSON.parse(clinicaData);
      const targetKey = `${medicoId}-${hora}`;
  
      setAlocacoes(prev => {
        const novo = { ...prev };
        
        // Se tiver origem, é uma movimentação entre células
        if (origemData) {
          const origem = JSON.parse(origemData);
          const origemKey = `${origem.medicoId}-${origem.hora}`;
          // Só remove se a origem for diferente do destino
          if (origemKey !== targetKey) {
            delete novo[origemKey];
          }
        }
        
        novo[targetKey] = clinica;
        return novo;
      });
    } catch (err) {
      console.error("Erro no drop mobile:", err);
    }
  };

  const handleMouseDown = (medicoId: number, hora: string) => {
    // Se não estiver no modo pintura, sai imediatamente para não afetar o Drag
    if (!isPaintingMode) {
      return;
    }
  
    const alocacaoExistente = alocacoes[`${medicoId}-${hora}`];
    
    if (alocacaoExistente) {
      setActivePaintingClinica(alocacaoExistente);
      setIsDraggingWithinGrid(true);
    } else if (activePaintingClinica) {
      setIsDraggingWithinGrid(true);
      marcarCelula(medicoId, hora, activePaintingClinica);
    }
  };

  const marcarCelula = (medicoId: number, hora: string, clinica: Clinica) => {
    setAlocacoes(prev => ({ ...prev, [`${medicoId}-${hora}`]: clinica }));
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPaintingMode || !isDraggingWithinGrid || !activePaintingClinica) return;
  
    // Impede que a tela suba/desça enquanto você está pintando as células
    if (e.cancelable) e.preventDefault(); 
  
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const cell = element?.closest('td[data-medico]');
    
    if (cell) {
      const medicoId = Number(cell.getAttribute('data-medico'));
      const hora = cell.getAttribute('data-hora');
      if (medicoId && hora) {
        marcarCelula(medicoId, hora, activePaintingClinica);
      }
    }
  };

  useEffect(() => {
    const stopPainting = () => setIsDraggingWithinGrid(false);
    window.addEventListener('mouseup', stopPainting);
    return () => window.removeEventListener('mouseup', stopPainting);
  }, []);

  return (
    <div className={`sudoku-container pb-8 min-h-screen flex flex-col select-none ${isPaintingMode ? `painting-active` : ``}`}>
      
      {/* HEADER: Layout Restaurado (Chevron - Título - Botão Modo) */}
      <div className="flex items-center justify-between mb-4 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <Button 
            icon={isHeaderExpanded ? "pi pi-chevron-up" : "pi pi-chevron-down"} 
            className="p-button-text p-button-secondary p-button-sm"
            onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
          />
          <div>
            <h1 className="text-xl font-black text-blue-900 m-0 tracking-tight leading-none">Sudoku de Escalas</h1>
            {!isHeaderExpanded && (
              <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest block">Painel de Clínicas Oculto</span>
            )}
          </div>
        </div>

        <Button 
          icon={isPaintingMode ? "pi pi-pencil" : "pi pi-arrows-alt"} 
          label={isPaintingMode ? "Pintar" : "Mover"}
          severity={isPaintingMode ? "info" : "secondary"}
          className={`px-4 py-2 font-bold text uppercase shadow-sm border-2 ${
            isPaintingMode ? 'bg-blue-600 border-blue-400 text-white' : ''
          }`}
          onClick={() => { 
            setIsPaintingMode(!isPaintingMode); 
            setActivePaintingClinica(null); 
          }}
        />
      </div>

      {/* PAINEL DE CLÍNICAS (Collapse + Componente Reutilizável) */}
      <div className={`transition-all overflow-hidden ${
        isHeaderExpanded ? 'max-h-[500px] opacity-100 mb-4' : 'max-h-0 opacity-0'
      }`}>
        <ClinicasPanel 
          clinicas={clinicasMock}
          layout="horizontal"
          isPaintingMode={isPaintingMode}
          activeClinicaId={activePaintingClinica?.id}
          onDragStart={onDragStart}
          onSelect={(c) => isPaintingMode && setActivePaintingClinica(c)}
        />
      </div>

      {/* ÁREA DO GRID */}
      <div className="sudoku-table-container flex-1 flex flex-col border border-gray-200 shadow-lg rounded-xlx`">
        <div className="overflow-auto flex-1 custom-scrollbar"
            onTouchMove={handleTouchMove} 
            onTouchEnd={() => setIsDraggingWithinGrid(false)}
        >
          <table className="w-full">
            <thead className="sticky top-0 z-[100]">
              <tr className="bg-gray-50">
                <th className="text-center sticky left-0 top-0 z-[1100] bg-gray-50 min-w-[20px] border-b border-r border-gray-200">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Méd</span>
                </th>
                {horas.map(h => (
                  <th key={h} className="text-xs font-bold text-gray-500 border-b border-r border-gray-100 text-center min-w-[50px]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {medicosMock.map(medico => (
                <tr key={medico.id} className="hover:bg-gray-50/30">
                  <td className="font-bold text-sm text-center text-gray-700 sticky left-0 bg-white border-r border-b border-gray-100 shadow-sm">
                    {medico.nome}
                  </td>
                  {horas.map(hora => (
                    <SudokuCell
                      key={hora}
                      medicoId={medico.id} // Passando os novos IDs
                      hora={hora}
                      alocacao={alocacoes[`${medico.id}-${hora}`]}
                      isPaintingMode={isPaintingMode}
                      onDragStart={(e) => onDragStart(e, alocacoes[`${medico.id}-${hora}`]!, { medicoId: medico.id, hora })}
                      onDrop={(e) => onDrop(e, medico.id, hora)}
                      onDragEnd={onDragEnd}
                      onMouseDown={() => handleMouseDown(medico.id, hora)}
                      onMouseEnter={() => {
                        if (isPaintingMode && isDraggingWithinGrid && activePaintingClinica) {
                          marcarCelula(medico.id, hora, activePaintingClinica);
                        }
                      }}
                      onRemove={() => {
                        const n = { ...alocacoes };
                        delete n[`${medico.id}-${hora}`];
                        setAlocacoes(n);
                      }}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};