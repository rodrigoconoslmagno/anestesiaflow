import { z } from 'zod';
import { baseEntitySchema, type BaseEntity } from '@/types/baseEntity'
import { DateUtils } from '@/utils/DateUtils';

export const escalaItemSchema = z.object({
    id: z.number().optional(),
    estabelecimentoId: z.number().int().positive("Selecione um local").optional(),
    estabelecimentoSigla: z.string().nullable().optional(),
    hora: z.string().
        transform(val => {
            return val.trim().substring(0, 5);
        })
        .refine(val => /^\d{2}:\d{2}$/.test(val), {
            message: "Formato de hora inválido (HH:mm)"
        }),
    cor: z.string().nullable().optional(),
    icone: z.any().optional(),
    arquivado: z.union([z.date(), z.string()]).nullable().optional(), 
    reagendado: z.boolean().nullable().optional().default(false),
});

export type EscalaItem = z.infer<typeof escalaItemSchema>;

export const escalaSchema = baseEntitySchema.extend({
    medicoId: z.number().int().positive("Informe um médico"),
    medicoSigla: z.string().optional(),
    data: z.date().or(z.string()).transform((val) => 
        val instanceof Date ? DateUtils.paraISO(val) : val
    ),
    plantao: z.boolean().default(false),
    itens: z.array(escalaItemSchema).optional()
});

export type Escala = z.infer<typeof escalaSchema> & BaseEntity;

export interface EscalaSemana extends BaseEntity {
    medicoId: number;
    dataInicio: string | undefined;
    dataFim: string;
    escala: Escala[]; 
}

export const escalaSemanaSchema = z.object({
    medicoId: z.any()
            .refine((val) => {
                const num = Number(val);
                return !isNaN(num) && num !== null && num !== undefined && num > 0;
            }, {
                message: "Informe um médico"
            }),
    dataInicio: z.string().optional(),
    dataFim: z.string().optional(),
    escala: z.array(escalaSchema)
})
.refine((data) => {
    const totalItens = data.escala.reduce((acc, dia) => {
        return acc + (dia.itens?.length || 0);
    }, 0);

    return totalItens > 0;
}, {
    message: "A escala deve conter pelo menos um horário/estabelecimento agendado.",
    path: ["escala"]
});

export const escalaEdicaoSchema = baseEntitySchema.extend({
    medicoId: z.number(),
    semana: z.array(escalaSemanaSchema)
})
.refine((data) => {
    const totalItens = data.semana.reduce((acc, dia) => {
        return acc + (dia.escala?.length || 0);
    }, 0);

    return totalItens > 0;
}, {
    message: "A escala deve conter pelo menos um horário/estabelecimento agendado.",
    path: ["semana"]    
});

export type EscalaEdicao = z.infer<typeof escalaEdicaoSchema> & BaseEntity;