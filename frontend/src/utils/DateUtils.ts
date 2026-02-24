export class DateUtils {
  
    /**
     * Converte uma string ISO (YYYY-MM-DD) para o formato brasileiro (DD/MM/YYYY).
     * Evita o erro de fuso horário (day-shift) ao não utilizar o parser UTC do JavaScript.
     */
    static formatarParaBR(dataISO: string | Date | undefined | null): string {
      if (!dataISO) {
        return '';
      }
  
      // Se já for um objeto Date, extraímos apenas a parte da data
      const dateStr = dataISO instanceof Date 
        ? dataISO.toISOString().split('T')[0] 
        : dataISO;
  
      // Split manual para garantir que a data seja tratada como local, não UTC
      const [ano, mes, dia] = dateStr.split('-').map(Number);
      
      // O construtor de partes (ano, mes-1, dia) garante o fuso local do navegador
      const dataLocal = new Date(ano, mes - 1, dia);
  
      return new Intl.DateTimeFormat('pt-BR').format(dataLocal);
    }
  
    /**
     * Converte um Date ou string para o formato ISO YYYY-MM-DD exigido pelo Backend.
     * Útil para transformações no Zod ou antes do envio via API.
     */
    static paraISO(data: Date | string): string {
      if (!data) {
        return '';
      }
      const d = typeof data === 'string' ? new Date(data) : data;
      const ano = d.getFullYear();
      const mes = String(d.getMonth() + 1).padStart(2, '0'); // Meses começam em 0
      const dia = String(d.getDate()).padStart(2, '0');
      
      return `${ano}-${mes}-${dia}`;
    }
  
    /**
     * Retorna o nome do mês por extenso em português.
     */
    static obterMesExtenso(dataISO: string): string {
      const [ano, mes, dia] = dataISO.split('-').map(Number);
      const dataLocal = new Date(ano, mes - 1, dia);
      return new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(dataLocal);
    }

    static paraDate(data: string | Date | undefined | null): Date | null {
      if (!data) return null;
      if (data instanceof Date) return data;
      
      const [ano, mes, dia] = data.split(/[-T/]/).map(Number);
      return new Date(ano, mes - 1, dia);
    }
  }