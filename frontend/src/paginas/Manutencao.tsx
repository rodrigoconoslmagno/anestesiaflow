import { Button } from 'primereact/button';

export const Manutencao = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="max-w-md">
        {/* Ícone ou Ilustração */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-orange-100 p-6">
            <i className="pi pi-server text-orange-600" style={{ fontSize: '3rem' }}></i>
          </div>
        </div>

        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Sistema em Manutenção
        </h1>
        
        <p className="mb-8 text-gray-600">
          No momento, nosso servidor está passando por uma atualização ou instabilidade momentânea. 
          Por favor, tente novamente em alguns instantes.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button 
            label="Tentar Novamente" 
            icon="pi pi-refresh" 
            onClick={handleRetry}
            className="p-button-primary shadow-md"
          />
        </div>
        
        <p className="mt-8 text-sm text-gray-400">
          Agradecemos a sua paciência.
        </p>
      </div>
    </div>
  );
};