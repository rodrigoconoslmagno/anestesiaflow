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

export const getIntervalosEscalaPlantao = () => {
    const horaInicio = 19;
    const duracao = 11;
    const intervalos = [];

    for (let i = 0; i <= duracao; i++) {
        const hAtual = (horaInicio + i) % 24;
        const hProxima = (horaInicio + i + 1) % 24;

        const inicio = hAtual.toString().padStart(2, '0');
        const fim = hProxima.toString().padStart(2, '0');
        
        intervalos.push({
            field: `${inicio}:00`,
            header: `${inicio}-${fim}h`
        });
    }
    
    return intervalos;
};