import { type Clinica } from '@/types/sudoku';

export interface ClinicaItemProps {
  clinica: Clinica;
  isPaintingMode: boolean; // <-- Faltava adicionar isso aqui
  activePaintingClinicaId?: number;
  onDragStart: (e: React.DragEvent, clinica: Clinica) => void;
  onClick: (clinica: Clinica) => void;
}

export const ClinicaItem = ({ 
  clinica, 
  isPaintingMode, 
  activePaintingClinicaId, 
  onDragStart, 
  onClick 
}: ClinicaItemProps) => {
  const isActive = activePaintingClinicaId === clinica.id;

  return (
    <div 
      onClick={() => onClick(clinica)}
      className={`flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg border transition-all cursor-pointer ${
        isActive ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-400' : 'border-transparent shadow-sm hover:bg-gray-100'
      }`}
    >
      <div 
        draggable={!isPaintingMode}
        onDragStart={(e) => onDragStart(e, clinica)}
        className={`w-6 h-6 rounded-full shadow-sm transition-transform ${
          !isPaintingMode ? 'cursor-grab active:cursor-grabbing hover:scale-110' : 'cursor-pointer'
        }`} 
        style={{ backgroundColor: clinica.cor }}
      />
      <span className="text-[11px] font-bold text-gray-600 truncate uppercase select-none">
        {clinica.nome}
      </span>
    </div>
  );
};