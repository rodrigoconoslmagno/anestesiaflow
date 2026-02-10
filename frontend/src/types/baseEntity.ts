import { z } from 'zod';

// Schema base com os campos do Java
export const baseEntitySchema = z.object({
  id: z.number().optional(),
  dataCriacao: z.string().optional(), // dataCriacao no Java
  dataAtualizacao: z.string().optional(), // dataAtualizacao no Java
});

// Type derivado do schema
export type BaseEntity = z.infer<typeof baseEntitySchema>;