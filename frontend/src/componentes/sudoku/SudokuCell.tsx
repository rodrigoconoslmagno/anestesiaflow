import type { Estabelecimento } from '@/types/estabelecimento';

interface SudokuCellProps {
  alocacao?: Estabelecimento;
  isPaintingMode: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onMouseDown: () => void;
  onMouseEnter: () => void;
  onRemove: () => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export const SudokuCell = ({
  alocacao,
  isPaintingMode,
  onDragStart,
  onDrop,
  onMouseDown,
  onMouseEnter,
  onRemove,
  onDragEnd,
  medicoId,
  hora
}: SudokuCellProps & { medicoId: number, hora: string }) => { 

  // Função auxiliar para disparar a lógica de pintura no toque
  const handleTouchStart = () => {
    if (isPaintingMode) {
      onMouseDown(); // Reutiliza a lógica de selecionar a clínica ou pintar
    }
  };

  return (
    <td
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
      onDrop={onDrop}
      onDragEnter={(e) => {
        e.preventDefault();
      }}
      onTouchStart={handleTouchStart}
      data-medico={medicoId}
      data-hora={hora}
      className="text-center border-r border-gray-100 min-w-[55px]"
    >
      <div 
        /* AGORA A DIV É O ARRASTÁVEL */
        draggable={!!alocacao && !isPaintingMode} 
        onDragStart={(e) => alocacao && onDragStart(e)}
        onDragEnd={onDragEnd}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onClick={() => alocacao && onRemove()}
        className="sudoku-cell-content"
        style={{ cursor: isPaintingMode ? 'copy' : (alocacao ? 'grab' : 'default') }}
      >
        {alocacao ? (
          <div
            /* A bolinha tem touch-none para que o segurar funcione sem scrollar a tela */
            className="clinica-dot-sm"
          />
        ) : (
          <div className="empty-dot" />
        )}
      </div>
    </td>
  );
};