import { AppCalendar } from '@/componentes/datetime/AppCalendar';
// Importe seus outros componentes conforme for criando
// import { AppInputText } from '@/componentes/AppInputText';
// import { AppSwitch } from '@/componentes/AppSwitch';

export const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  // A chave deve ser EXATAMENTE igual ao nome do Enum UIComponentType do Java
  DATE_PICKER: AppCalendar,
  
  /* Exemplos de futuras implementações:
  TEXT: AppInputText,
  SWITCH: AppSwitch,
  NUMBER: AppInputNumber,
  */
};