export const getIntervalosEscala = () => {
    // Definimos os pares de início
    const inicios = [7, 9, 11, 13, 15, 17];
    
    return inicios.map(h => {
        const inicio = h.toString().padStart(2, '0');
        const fim = (h + 1).toString().padStart(2, '0');
        return {
            field: `${inicio}:00`, // Mantemos o field no início do intervalo para busca no JSON
            header: `${inicio}-${fim}h`
        };
    });
};