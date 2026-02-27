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
        { label: 'Médicos', icon: 'pi pi-users', to: '/medico' },
        { label: 'Clínicas', icon: 'pi pi-building', to: '/estabelecimento' },
        { label: 'Usuários', icon: 'pi pi-user', to: '/usuario' },
      ]
    },
    { 
      label: 'Escalas', 
      icon: 'pi pi-calendar',
      children: [
        { label: 'Escalas', icon: 'pi pi-user-edit', to: '/escala' },
        { label: 'Escala Médica', icon: 'pi pi-globe', to: '/escalamedicoview' },
        { label: 'Sudoku Resumo', icon: 'pi pi-user-edit', to: '/sudokuresumoview' },
        { label: 'Sudoku', icon: 'pi pi-globe', to: '/sudokuview' },
      ]
    }
  ];