import { z } from 'zod';
import { baseEntitySchema } from '@/types/baseEntity';

export const estabelecimentoSchema = baseEntitySchema.extend({
  nome: z.string()
    .min(1, 'Nome é obrigatório')
    .max(60, 'O nome deve ter no máximo 60 caracteres'),
  cor: z.string()   
    .max(7, 'O nome deve ter no máximo 7 caracteres').optional().nullable(),
  ativo: z.boolean().default(true),
  icone: z.union([
    z.array(z.number()), 
    z.string() // Aceita string temporariamente para evitar o erro do print
  ]).optional().nullable()
    .transform((val) => {
      // Se for string (ex: Base64 do banco), o backend tratará, 
      // ou você pode converter aqui se necessário.
      return val; 
    }),
}).superRefine((data, ctx) => {
    const hasColor = !!data.cor && data.cor.trim() !== "";
    const hasIcon = !!data.icone && (Array.isArray(data.icone) ? data.icone.length > 0 : data.icone.length > 0);
    
    // REGRA 1: Pelo menos um deve estar preenchido
    if (!hasColor && !hasIcon) {
        const msgVazio = "Selecione ao menos uma Cor ou um Ícone.";
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: msgVazio, path: ["cor"] });
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: msgVazio, path: ["icone"] });
    }

    // REGRA 2: Não permitir os dois preenchidos simultaneamente
    if (hasColor && hasIcon) {
        const msgAmbos = "Escolha apenas Cor OU Ícone, não ambos.";
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: msgAmbos, path: ["cor"] });
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: msgAmbos, path: ["icone"] });
    }
});

export type Estabelecimento = z.infer<typeof estabelecimentoSchema>;