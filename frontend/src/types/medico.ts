import { z } from 'zod';
import { baseEntitySchema } from '@/types/baseEntity';

export const medicoSchema = baseEntitySchema.extend({
  nome: z.string()
    .min(1, 'Nome é obrigatório')
    .max(60, 'O nome deve ter no máximo 60 caracteres'),
    
  sigla: z.string()
    .length(3, 'A sigla deve ter exatamente 3 dígitos'),
  ativo: z.boolean().default(true),
});

export type Medico = z.infer<typeof medicoSchema>;