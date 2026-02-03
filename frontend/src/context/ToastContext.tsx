import { createContext, useContext, useRef, type FC,type ReactNode } from 'react';
import { Toast } from 'primereact/toast';

interface ToastContextType {
  showSuccess: (summary: string, detail: string) => void;
  showError: (summary: string, detail: string) => void;
  showInfo: (summary: string, detail: string) => void;
  showWarn: (summary: string, detail: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const toast = useRef<Toast>(null);

  const showSuccess = (summary: string, detail: string) => {
    toast.current?.show({ severity: 'success', summary, detail, life: 3000 });
  };

  const showError = (summary: string, detail: string) => {
    toast.current?.show({ severity: 'error', summary, detail, life: 5000 });
  };

  const showInfo = (summary: string, detail: string) => {
    toast.current?.show({ severity: 'info', summary, detail, life: 3000 });
  };

  const showWarn = (summary: string, detail: string) => {
    toast.current?.show({ severity: 'warn', summary, detail, life: 4000 });
  };

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showInfo, showWarn }}>
      <Toast ref={toast} position="top-right" />
      {children}
    </ToastContext.Provider>
  );
};

// Hook personalizado para facilitar o uso
export const useAppToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useAppToast deve ser usado dentro de um ToastProvider');
  return context;
};