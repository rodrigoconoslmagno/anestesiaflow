export const DashboardHome = () => {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-gray-800">Bem-vindo, Dr. João</h1>
          <p className="text-gray-500">Aqui está o resumo do seu dia hoje.</p>
        </header>
  
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Usando a classe card-stats que criamos no seu index.css */}
          <div className="card-stats">
            <i className="pi pi-calendar text-blue-600 text-2xl mb-3"></i>
            <h3 className="text-gray-500 text-sm font-bold uppercase">Plantões Mes</h3>
            <p className="text-3xl font-black text-gray-800">12</p>
          </div>
          <div className="card-stats">
            <i className="pi pi-clock text-green-600 text-2xl mb-3"></i>
            <h3 className="text-gray-500 text-sm font-bold uppercase">Horas Acumuladas</h3>
            <p className="text-3xl font-black text-gray-800">144h</p>
          </div>
        </div>
      </div>
    );
  };