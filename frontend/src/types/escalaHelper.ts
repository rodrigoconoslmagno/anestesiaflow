export const getIntervalosEscala = () => {
    const horaInicio = 7;
    const horaFim = 18; // Irá gerar o último par como 18-19h
    const intervalos = [];

    for (let h = horaInicio; h <= horaFim; h++) {
        const inicio = h.toString().padStart(2, '0');
        const fim = (h + 1).toString().padStart(2, '0');
        
        intervalos.push({
            field: `${inicio}:00`,
            header: `${inicio}-${fim}h`
        });
    }
    
    return intervalos;
};