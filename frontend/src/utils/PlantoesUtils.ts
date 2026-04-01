
const turnoEstaCompleto = (set: Set<number>, de: number, ate: number): boolean => {
    if (de === 19) { // Caso especial noturno (19 às 6)
      for (let h = 19; h <= 23; h++) if (!set.has(h)) return false;
      for (let h = 0; h <= 6; h++) if (!set.has(h)) return false;
      return true;
    }
    for (let h = de; h <= ate; h++) {
      if (!set.has(h)) return false;
    }
    return true;
  };
  
  const formatarSaida = (grupos: string[]): string => {
    if (grupos.length === 0) return "";
  
    // Unifica a virada de dia 19-24h com 0-7h (ajuste para o padrão "19-7h")
    if (grupos.length > 1) {
      const ultimo = grupos[grupos.length - 1];
      const primeiro = grupos[0];
  
      if (ultimo.endsWith("-24h") && primeiro.startsWith("0-")) {
        const novo = `${ultimo.split("-")[0]}-${primeiro.split("-")[1]}`;
        grupos[0] = novo;
        grupos.pop();
      }
    }
  
    return grupos.join(", ").replaceAll("-24h", "-0h");
  };
  
  export const processarHoras = (horas: number[]): string => {
    if (!horas || horas.length === 0) return "";
  
    // Ordena os números (importante: o sort padrão do JS é alfabético, por isso o (a, b) => a - b)
    const horasOrdenadas = [...horas].sort((a, b) => a - b);
  
    // Regra 1: Dia completo
    if (horasOrdenadas.length === 24) return "7-13h, 13-19h, 19-7h";
  
    const setHoras = new Set(horasOrdenadas);
    const grupos: string[] = [];
    let i = 0;
  
    while (i < horasOrdenadas.length) {
      let inicio = horasOrdenadas[i];
      let atual = inicio;
  
      while (i + 1 < horasOrdenadas.length) {
        let proximo = horasOrdenadas[i + 1];
  
        // Regra 3: Quebra por pulo de hora
        if (proximo - atual > 1) break;
  
        // Quebra em fronteira (7, 13, 19) APENAS SE o turno seguinte estiver completo
        if (proximo === 7 && turnoEstaCompleto(setHoras, 7, 12)) break;
        if (proximo === 13 && turnoEstaCompleto(setHoras, 13, 18)) break;
        if (proximo === 19 && turnoEstaCompleto(setHoras, 19, 6)) break;
  
        // Regra 2: Limite de 6 horas contínuas
        if (proximo + 1 - inicio > 7) break;
  
        i++;
        atual = horasOrdenadas[i];
      }
  
      grupos.push(`${inicio}-${atual + 1}h`);
      i++;
    }
  
    return formatarSaida(grupos);
  };