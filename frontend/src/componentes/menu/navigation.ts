export interface MenuItem {
    label: string;
    icon?: string;
    to?: string;
    children?: MenuItem[];
  }
  
  export const navigationItems: MenuItem[] = [
    { label: 'Início', icon: 'pi pi-home', to: '/dashboard' },
    { 
      label: 'Cadastros', 
      icon: 'pi pi-list', 
      children: [
        { label: 'Médicos', icon: 'pi pi-users', to: '/medicos' },
        { label: 'Clínicas', icon: 'pi pi-building', to: '/clinicas' },
      ]
    },
    { 
      label: 'Escalas', 
      icon: 'pi pi-calendar',
      children: [
        { label: 'Minhas Escalas', icon: 'pi pi-user-edit', to: '/escalas/minhas' },
        { label: 'Geral', icon: 'pi pi-globe', to: '/escala' },
      ]
    }
  ];