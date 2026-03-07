import type { Recurso } from "@/permissoes/recurso";

export interface MenuItem {
    label: string;
    icon?: string;
    to?: string;
    permission?: string;
    children?: MenuItem[];
    recurso?: Recurso;
  }