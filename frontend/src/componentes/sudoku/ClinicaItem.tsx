import { useDraggable } from '@dnd-kit/core';
import type { Estabelecimento } from '@/types/estabelecimento';

export const ClinicaItem = ({ clinica, label }: { clinica: Estabelecimento; label: string }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `clinica-${clinica.id}`,
    data: { clinica }
  });

  // Estilo para o movimento suave
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 9999,
    opacity: 0.8,
  } : undefined;

  const getStringIcone = (icone: any) => {
    if (!icone) return undefined;
    return icone.startsWith('data:') ? icone : `data:image/png;base64,${icone}`;
  };

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes}
      className={`clinica-item-draggable flex items-center gap-1 bg-white pl-1 rounded-full border border-slate-200 shadow-sm transition-all ${isDragging ? 'invisible' : ''}`}
      style={{ ...style, touchAction: 'none' }} // touchAction aqui é vital
    >
      <div 
        className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-white shadow-sm shrink-0 overflow-hidden pointer-events-none"
        style={{ backgroundColor: clinica.cor?.startsWith('#') ? clinica.cor : `#${clinica.cor}` }}
      >
        {clinica.icone ? (
          <img src={getStringIcone(clinica.icone)} className="w-full h-full object-cover" alt="" />
        ) : (
          <i className=" text-white text-[11px]" />
        )}
      </div>
      <span className="text-[10px] font-bold text-slate-600 uppercase truncate pointer-events-none">
        {label}
      </span>
    </div>
  );
};