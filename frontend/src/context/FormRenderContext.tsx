import React, { createContext, useContext } from 'react';

export type RenderMode = 'form' | 'cell' | 'compact';

interface FormRenderContextValue {
  mode: RenderMode;
}

const FormRenderContext = createContext<FormRenderContextValue>({
  mode: 'form'
});

export const useRenderMode = () => useContext(FormRenderContext);

interface ProviderProps {
  mode: RenderMode;
  children: React.ReactNode;
}

export const FormRenderProvider = ({
  mode,
  children
}: ProviderProps) => {
  return (
    <FormRenderContext.Provider value={{ mode }}>
      {children}
    </FormRenderContext.Provider>
  );
};