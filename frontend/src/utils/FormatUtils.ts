/**
 * Classe utilitária para formatações diversas.
 */
export class FormatUtils {

    private static readonly currencyFormatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });

    /**
     * Formata um número para o padrão de moeda brasileiro (BRL).
     * @param value O valor numérico a ser formatado.
     * @returns A string formatada como moeda (ex: "R$ 1.234,56") ou uma string vazia se o valor for nulo/indefinido.
     */
    public static formatCurrency(value: number | null | undefined): string {
        return (value !== null && value !== undefined) ? this.currencyFormatter.format(value) : '';
    }
}