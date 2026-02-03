export interface Clinica {
    id: number;
    nome: string;
    cor: string;
  }
  
  export interface Medico {
    id: number;
    nome: string;
    especialidade: string;
  }
  
  export const clinicasMock: Clinica[] = [
    { id: 1, nome: 'Hospital Unimed', cor: '#3B82F6' }, // Azul
    { id: 2, nome: 'Santa Casa', cor: '#EF4444' },      // Vermelho
    { id: 3, nome: 'Hosp. Regional', cor: '#10B981' },   // Verde
  ];
  
  export const medicosMock: Medico[] = [
    { id: 1, nome: 'Dr. Ricardo Silva', especialidade: 'Anestesista' },
    { id: 2, nome: 'Dra. Ana Souza', especialidade: 'Cardiologista' },
    { id: 3, nome: 'Dr. Marcos Lima', especialidade: 'Anestesista' },
  ];