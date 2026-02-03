import { useState, useEffect } from 'react';
import { clinicasMock, medicosMock, type Clinica, initialAlocacoesMock } from '../types/escala';

export const Escala = () => {
  const [alocacoes, setAlocacoes] = useState<Record<string, Clinica>>(initialAlocacoesMock);
  const [isPaintingMode, setIsPaintingMode] = useState(false);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true); // Controle do Collapse
  const [activePaintingClinica, setActivePaintingClinica] = useState<Clinica | null>(null);
  const [isDraggingWithinGrid, setIsDraggingWithinGrid] = useState(false);
  
  const horas = Array.from({ length: 13 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);

  // --- Mantenha as funções onDragStart, onDrop, handleMouseDown e handleMouseEnter anteriores ---
  const onDragStart = (e: React.DragEvent, clinica: Clinica, origem?: { medicoId: number; hora: string }) => {
    if (isPaintingMode) { e.preventDefault(); return; }
    e.dataTransfer.setData('clinica', JSON.stringify(clinica));
    if (origem) e.dataTransfer.setData('origem', JSON.stringify(origem));
  };

  const onDrop = (e: React.DragEvent, targetMedicoId: number, targetHora: string) => {
    e.preventDefault();
    const targetKey = `${targetMedicoId}-${targetHora}`;
    if (alocacoes[targetKey]) return;
    const clinica = JSON.parse(e.dataTransfer.getData('clinica')) as Clinica;
    const origemRaw = e.dataTransfer.getData('origem');
    setAlocacoes(prev => {
      const newAlocacoes = { ...prev };
      if (origemRaw) {
        const origem = JSON.parse(origemRaw);
        delete newAlocacoes[`${origem.medicoId}-${origem.hora}`];
      }
      newAlocacoes[targetKey] = clinica;
      return newAlocacoes;
    });
  };

  const handleMouseDown = (medicoId: number, hora: string, clinica?: Clinica) => {
    if (isPaintingMode && clinica) {
      setIsDraggingWithinGrid(true);
      setActivePaintingClinica(clinica);
      marcarCelula(medicoId, hora, clinica);
    }
  };

  const handleMouseEnter = (medicoId: number, hora: string) => {
    if (isPaintingMode && isDraggingWithinGrid && activePaintingClinica) {
      marcarCelula(medicoId, hora, activePaintingClinica);
    }
  };

  const marcarCelula = (medicoId: number, hora: string, clinica: Clinica) => {
    const key = `${medicoId}-${hora}`;
    if (!alocacoes[key]) setAlocacoes(prev => ({ ...prev, [key]: clinica }));
  };

  useEffect(() => {
    const stopPainting = () => setIsDraggingWithinGrid(false);
    window.addEventListener('mouseup', stopPainting);
    return () => window.removeEventListener('mouseup', stopPainting);
  }, []);

  return (
    <div className="flex flex-col h-full w-full animate-fadein overflow-hidden select-none">
      
      {/* HEADER COMPACTO COM CONTROLES */}
      <div className="shrink-0 bg-gray-50 pb-4 pt-2 border-b border-gray-100">
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-blue-900"
              title={isHeaderExpanded ? "Recolher clínicas" : "Expandir clínicas"}
            >
              <i className={`pi ${isHeaderExpanded ? 'pi-chevron-up' : 'pi-chevron-down'} font-bold`}></i>
            </button>
            <div>
              <h2 className="text-xl font-black text-blue-900 tracking-tight leading-none">Gestão de Escalas</h2>
              {!isHeaderExpanded && (
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">Painel de Clínicas Oculto</p>
              )}
            </div>
          </div>

          {/* BOTÃO DE MODO (MOVER/PINTAR) - SEMPRE VISÍVEL */}
          <button 
            onClick={() => setIsPaintingMode(!isPaintingMode)}
            className={`flex items-center gap-3 px-6 py-2 rounded-xl transition-all shadow-sm border-2 ${
              isPaintingMode 
              ? 'bg-blue-600 border-blue-400 text-white shadow-blue-200' 
              : 'bg-white border-gray-200 text-gray-600 hover:border-blue-200'
            }`}
          >
            <i className={`pi ${isPaintingMode ? 'pi-pencil' : 'pi-arrows-alt'}`}></i>
            <span className="font-black text-xs uppercase tracking-tighter">
              {isPaintingMode ? 'Pintar' : 'Mover'}
            </span>
          </button>
        </div>

        {/* COMPONENTE DE COLLAPSE (CLÍNICAS) */}
        <div className={`grid transition-all duration-300 ease-in-out ${
          isHeaderExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 overflow-hidden'
        }`}>
          <div className="overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-inner">
              {clinicasMock.map((clinica) => (
                <div key={clinica.id} className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-xl border border-transparent shadow-sm">
                  <div 
                    draggable={!isPaintingMode}
                    onDragStart={(e) => onDragStart(e, clinica)}
                    className={`w-5 h-5 min-w-5 rounded-full ring-2 ring-white shadow-sm ${
                      !isPaintingMode ? 'cursor-grab active:cursor-grabbing hover:scale-110' : 'opacity-50'
                    }`} 
                    style={{ backgroundColor: clinica.cor }}
                  />
                  <span className="text-[11px] font-bold text-gray-600 truncate uppercase">{clinica.nome}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ÁREA DO GRID (EXPANDIDA) */}
      <div className="flex-1 min-h-0 bg-white rounded-b-3xl flex flex-col overflow-hidden">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-20">
              <tr className="bg-gray-50/95 backdrop-blur-sm">
                <th className="sticky left-0 top-0 z-30 bg-gray-50 p-4 border-b border-r border-gray-200 min-w-[25px] text-left">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Médico</span>
                </th>
                {horas.map(hora => (
                  <th key={hora} className="p-3 border-b border-gray-100 min-w-20 text-center bg-gray-50/95 border-r last:border-r-0">
                    <span className="text-[10px] font-bold text-gray-500">{hora}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {medicosMock.map((medico) => (
                <tr key={medico.id} className="group hover:bg-gray-50/30">
                  <td className="sticky left-0 z-10 bg-white p-4 border-r border-gray-100 font-bold text-sm text-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    <span className="truncate">{medico.nome}</span>
                  </td>
                  {horas.map(hora => {
                    const alocacao = alocacoes[`${medico.id}-${hora}`];
                    return (
                      <td 
                        key={hora}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => onDrop(e, medico.id, hora)}
                        onMouseEnter={() => handleMouseEnter(medico.id, hora)}
                        className={`p-1 text-center border-r border-gray-50 last:border-r-0 ${isPaintingMode ? 'cursor-crosshair' : ''}`}
                      >
                         <div className="w-full h-12 flex items-center justify-center" onMouseDown={() => handleMouseDown(medico.id, hora, alocacao)}>
                          {alocacao ? (
                            <div 
                              draggable={!isPaintingMode}
                              onDragStart={(e) => onDragStart(e, alocacao, { medicoId: medico.id, hora })}
                              className="w-7 h-7 rounded-full shadow-lg ring-2 ring-white animate-scalein hover:scale-110 transition-transform"
                              style={{ backgroundColor: alocacao.cor }}
                              onClick={() => {
                                if (!isPaintingMode) {
                                  const n = { ...alocacoes };
                                  delete n[`${medico.id}-${hora}`];
                                  setAlocacoes(n);
                                }
                              }}
                            />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};