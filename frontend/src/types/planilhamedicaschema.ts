import { z } from 'zod';

export const PlanilhaMedicaSchema = z.object({
  id: z.string().optional(),
  titulo: z.string().min(1, "O título é obrigatório"),
  data_inicio: z.date().optional(),
  linhas: z.array(z.object({
    colA: z.string().optional(), // Letras de "MANHA", "TARDE", "NOITE"
    colB: z.string().optional(), // Horários ou Setores mesclados
    setor: z.string().optional(), // Terceira coluna de identificação
    segunda: z.string().optional(),
    terca: z.string().optional(),
    quarta: z.string().optional(),
    quinta: z.string().optional(),
    sexta: z.string().optional(),
    sabado: z.string().optional(),
    domingo: z.string().optional(),
  }))
});

export type PlanilhaMedicaType = z.infer<typeof PlanilhaMedicaSchema>;