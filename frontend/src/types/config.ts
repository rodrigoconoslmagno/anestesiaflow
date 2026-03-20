import { z } from 'zod';

export const configSchema = z.object({
    chave: z.string(),
    valor: z.string()
})

export type Config = z.infer<typeof configSchema>;

export interface ConfigItem {
    chave: string;
    valor: any;
    label: string;
    componentType: string;
    placeholder?: string;
    required?: boolean;
  }