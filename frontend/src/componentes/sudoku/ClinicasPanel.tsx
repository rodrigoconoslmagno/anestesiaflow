import { type Clinica } from '@/types/sudoku';
import { ClinicaItem } from '@/componentes/sudoku/ClinicaItem';

interface ClinicasPanelProps {
  clinicas: Clinica[];
  layout?: 'horizontal' | 'vertical';
  isPaintingMode: boolean;
  activeClinicaId?: number;
  onDragStart: (e: React.DragEvent, clinica: Clinica) => void;
  onSelect: (clinica: Clinica) => void;
}

export const ClinicasPanel = ({ 
  clinicas, 
  layout = 'horizontal', 
  isPaintingMode, 
  activeClinicaId, 
  onDragStart, 
  onSelect 
}: ClinicasPanelProps) => {
  
  // Classe dinâmica: se for horizontal usa grid, se for vertical usa flex-col
  const containerClass = layout === 'horizontal' 
    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3" 
    : "flex flex-col gap-2 w-full";

  return (
    <div className={`${containerClass} bg-white p-4 rounded-xl border border-gray-100 shadow-inner overflow-y-auto max-h-full`}>
      {clinicas.map((clinica) => (
        <ClinicaItem 
          key={clinica.id}
          clinica={clinica}
          isPaintingMode={isPaintingMode}
          activePaintingClinicaId={activeClinicaId}
          onDragStart={onDragStart}
          onClick={onSelect}
        />
      ))}
    </div>
  );
};