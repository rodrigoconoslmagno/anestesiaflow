import { z } from 'zod';
import { baseEntitySchema } from '@/types/baseEntity';

export const procedimentoSchema = baseEntitySchema.extend({
  descricao: z.string()
    .min(1, 'A descrição é obrigatório'),
  ativo: z.boolean().default(true),
});

export type Procedimento = z.infer<typeof procedimentoSchema>;