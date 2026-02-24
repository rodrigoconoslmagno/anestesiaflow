import { ClinicaItem } from './ClinicaItem';
import type { Estabelecimento } from '@/types/estabelecimento';

interface ClinicasPanelProps {
  clinicas: Estabelecimento[];
}

export const ClinicasPanel = ({ clinicas }: ClinicasPanelProps) => {
  return (
    <div className="grid grid-cols-5 lg:grid-cols-6 gap-0 bg-white rounded-xl border border-gray-100 shadow-inner overflow-y-auto">
      {clinicas.map((clinica) => (
        <ClinicaItem 
          key={clinica.id}
          clinica={clinica}
          label={clinica.sigla || clinica.nome?.substring(0, 5) || ''}
        />
      ))}
    </div>
  );
};