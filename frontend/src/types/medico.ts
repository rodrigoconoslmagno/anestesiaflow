import { z } from 'zod';
import { baseEntitySchema } from '@/types/baseEntity';
import { DateUtils } from '@/utils/DateUtils';

export const medicoSchema = baseEntitySchema.extend({
  nome: z.string()
    .min(1, 'Nome é obrigatório')
    .max(60, 'O nome deve ter no máximo 60 caracteres'),
    
  sigla: z.string()
    .length(3, 'A sigla deve ter exatamente 3 dígitos'),
  dataAssociacao: z.date().or(z.string()).transform((val) => 
    val instanceof Date ? DateUtils.paraISO(val) : val
  ),
  ativo: z.boolean().default(true),
});

export type Medico = z.infer<typeof medicoSchema>;