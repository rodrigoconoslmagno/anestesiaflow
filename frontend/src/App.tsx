import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

function App() {

  return (
   // Div principal usando Tailwind para centralizar e dar cor ao fundo
   <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      
   {/* Card do PrimeReact com uma sombra personalizada do Tailwind */}
   <Card 
      title={<span className="text-brand-blue">AnestesiaFlow</span>} 
      className="w-full max-w-md shadow-2xl rounded-2xl border-t-4 border-brand-blue-light"
    >
     
<div className="flex flex-col gap-6">
    <p className="text-gray-600 leading-relaxed">
      Testando as cores: <span className="text-brand-blue-light font-bold">Azul da Marca</span> ativo.
    </p>
    
    {/* Botão usando sua cor personalizada */}
    <button className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-bold py-2 px-4 rounded-lg transition-colors">
      Acessar Sistema
    </button>
  </div>

     <div className="flex flex-col gap-6">
       <p className="text-gray-600 leading-relaxed">
         Se você vê o card arredondado e este texto cinza, o <span className="text-sky-500 font-bold">Tailwind</span> está ativo.
       </p>

       <div className="flex flex-col gap-2">
         <label className="text-sm font-semibold text-gray-700">Teste de Input (PrimeReact):</label>
         <span className="p-input-icon-left">
           <i className="pi pi-user" />
           <InputText placeholder="Digite algo..." className="w-full" />
         </span>
       </div>

       <div className="flex flex-col gap-3">
         {/* Botão do PrimeReact - O estilo azul vem do tema Lara Light */}
         <Button 
           label="Botão PrimeReact" 
           icon="pi pi-check" 
           className="p-button-primary w-full" 
         />

         {/* Botão nativo estilizado APENAS com Tailwind */}
         <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg">
           Botão Tailwind Puro
         </button>
       </div>

       <p className="text-xs text-center text-gray-400 mt-4 italic">
         Vite + React + TS + Big Sur Compatibility Mode
       </p>
     </div>
   </Card>
 </div>
  )
}

export default App
