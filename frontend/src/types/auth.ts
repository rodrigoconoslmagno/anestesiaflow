import { z } from 'zod';
import { permissoesSchema } from '@/permissoes/permissoes';

export const loginResponseSchema = z.object({
  nome: z.string(),
  login: z.string(),
  medicoId: z.number().nullable().optional(),
  medicoExibir: z.string().nullable().optional(),
  permissoes: z.array(permissoesSchema).default([]),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
