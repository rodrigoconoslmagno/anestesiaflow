import { z } from 'zod';
import { baseEntitySchema } from '@/types/baseEntity';
import { DateUtils } from '@/utils/DateUtils';

export const pacienteProcedimentoSchema = baseEntitySchema.extend({
    cirurgiao: z.string().min(1, 'Cirurgião é obrigatório'),
    procedimento: z.string().min(1, 'Procedimento é obrigatório'),
    dataProcedimento: z.any().refine(val => {
      if (val) {
          return DateUtils.paraISO(val)
      } 
      return undefined
    },{
      message: "Informe uma data válida"
    }),
    medicoId: z.any()
          .refine((val) => {
              const num = Number(val);
              return !isNaN(num) && num !== null && num !== undefined && num > 0;
          }, {
              message: "Informe um médico"
          }),
});

export type PacienteProcedimento = z.infer<typeof pacienteProcedimentoSchema>;

export const pacienteSchema = baseEntitySchema.extend({
  nome: z.string()
    .min(1, 'Nome é obrigatório')
    .max(60, 'O nome deve ter no máximo 60 caracteres'),
  ativo: z.boolean().default(true),
  procedimentos: z.array(pacienteProcedimentoSchema).optional()
});

export type Paciente = z.infer<typeof pacienteSchema>;