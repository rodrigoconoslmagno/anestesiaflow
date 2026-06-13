import { z } from 'zod';
import { baseEntitySchema } from '@/types/baseEntity';
import { DateUtils } from '@/utils/DateUtils';

export const pacienteProcedimentoSchema = baseEntitySchema.extend({
    cirurgiaoId: z.any()
          .refine((val) => {
              const num = Number(val);
              return !isNaN(num) && num !== null && num !== undefined && num > 0;
          }, {
              message: 'Cirurgião é obrigatório'
          }),
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
    medicoExibir: z.string().nullable().optional(),   
    estabelecimentoId: z.any()
          .refine((val) => {
              const num = Number(val);
              return !isNaN(num) && num !== null && num !== undefined && num > 0;
          }, {
              message: "Informe uma clinica/hospital"
          }),
    cor: z.string().nullable().optional(),
    icone: z.any().optional(),     
    estabelecimentoExibir: z.string().nullable().optional(),
    cirurgiaoExibir: z.string().nullable().optional(),
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