import { z } from 'zod';
import { baseEntitySchema, type BaseEntity } from '@/types/baseEntity'
import { DateUtils } from '@/utils/DateUtils';

// --- NOVO TIPO SEPARADO (Para uso no Sudoku e Mockups) ---
export const escalaItemSchema = z.object({
    id: z.number().optional(),
    estabelecimentoId: z.number().int().positive("Selecione um local").optional(),
    hora: z.string().
        transform(val => {
            // Remove espaços e pega apenas os primeiros 5 caracteres (HH:mm)
            return val.trim().substring(0, 5);
        })
        .refine(val => /^\d{2}:\d{2}$/.test(val), {
            message: "Formato de hora inválido (HH:mm)"
        }),
    cor: z.string().nullable().optional(),
    icone: z.any().optional()
});

export type EscalaItem = z.infer<typeof escalaItemSchema>;

export const escalaSchema = baseEntitySchema.extend({
    medicoId: z.number().int().positive("Informe um médico"),
    medicoSigla: z.string().optional(),
    data: z.date().or(z.string()).transform((val) => 
        val instanceof Date ? DateUtils.paraISO(val) : val
    ),
    itens: z.array(escalaItemSchema).optional()
});

//).min(1, "Adicione pelo menos um horário")
export type Escala = z.infer<typeof escalaSchema> & BaseEntity;

export const escalaSummarySchema = baseEntitySchema.extend({
    data: z.string(),
    medicoNome: z.string(),
    medicoSigla: z.string(),
});

export type EscalaSummary = z.infer<typeof escalaSummarySchema> & BaseEntity;

export interface EscalaSemana extends BaseEntity {
    medicoId: number;
    dataInicio: string | undefined;
    dataFim: string;    // Data do Sábado (YYYY-MM-DD)
    escala: Escala[];  // Lista de 7 objetos Escala (um para cada dia)
}

// Atualizamos o schema para validar o lote
export const escalaSemanaSchema = z.object({
    medicoId: z.any()
            .refine((val) => {
                // Tentamos converter manualmente
                const num = Number(val);
                // Validamos se é um número válido, se existe e se é maior que zero
                return !isNaN(num) && num !== null && num !== undefined && num > 0;
            }, {
                message: "Informe um médico" // Esta mensagem será capturada pelo seu CrudBase
            }),
    dataInicio: z.string().optional(),
    dataFim: z.string().optional(),
    escala: z.array(escalaSchema) // Reutiliza seu schema existente
})
/**
 * VALIDAÇÃO GLOBAL: Bloqueia o salvamento se não houver pelo menos 
 * UM item em QUALQUER um dos dias da semana.
 */
.refine((data) => {
    const totalItens = data.escala.reduce((acc, dia) => {
        return acc + (dia.itens?.length || 0);
    }, 0);

    return totalItens > 0;
}, {
    message: "A escala deve conter pelo menos um horário/estabelecimento agendado.",
    path: ["escala"] // Associa o erro ao campo escala para o CrudBase capturar
});