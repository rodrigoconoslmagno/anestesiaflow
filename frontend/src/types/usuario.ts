import { z } from 'zod';
import { baseEntitySchema } from '@/types/baseEntity'
import { permissoesSchema } from '@/permissoes/permissoes';


export const usuarioSchema = baseEntitySchema.extend({
  nome: z.string().min(1, 'Nome é obrigatório'),
  login: z.string().min(1, 'Login é obrigatório'),
  ativo: z.boolean().default(true),
  senha: z.string().optional().or(z.literal('')),
  confirmarSenha: z.string().optional().or(z.literal('')),
  permissoes: z.array(permissoesSchema).default([]),
}).superRefine((data, ctx) => {
  if (!data.id) {
    if (!data.senha || data.senha.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A senha é obrigatória para novos usuários",
        path: ["senha"],
      });
    }
  }

  if (data.senha || data.confirmarSenha) {
    if (data.senha !== data.confirmarSenha) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "As senhas não conferem",
        path: ["confirmarSenha"],
      });
    }
  }
});

export type Usuario = z.infer<typeof usuarioSchema>;