import { Logo } from "@/componentes/logo/Logo";
import { Notificacao } from "@/componentes/notificacao/Notificacao";

export const DashboardHome = () => {
    return (
      <div className="min-h-screen w-full flex flex-col bg-white overflow-hidden">
        <div className="ml-[5%] w-[90%] pt-2 md:pt-4 z-40">
          <Notificacao />
        </div>
        
        <div className="flex-1 bg-ap-blue-dark flex flex-col justify-center items-center text-white overflow-hidden">

          <div className="z-10 max-w-md text-center flex flex-col items-center">
            <Logo className="h-16 lg:h-24 mb-6" light />

            <h1 className="text-4xl lg:text-7xl font-black mb-2 tracking-tighter">
              Anestesia<span className="text-ap-cyan drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">Flow</span>
            </h1>
            
            <div className="mb-6 lg:mb-8">
              <span className="text-blue-200 text-xs lg:text-lg font-medium tracking-[0.2em] uppercase opacity-80">
                Anestesia Piracicaba
              </span>
            </div>
            
            <p className="text-blue-100 text-base lg:text-xl opacity-90 font-light max-w-xs lg:max-w-sm leading-relaxed px-4">
              Painel Geral: Resumo de escalas e produtividade.
            </p>
          </div>

          <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-ap-blue-light opacity-20 blur-[100px] rounded-full z-0" />
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-ap-cyan opacity-10 blur-[120px] rounded-full z-0" />
          <div className="absolute inset-0 bg-gradient-to-br from-ap-blue-dark via-ap-blue-dark to-[#001a33] opacity-95 z-0" />

        </div>

        <div className="absolute bottom-0 w-full text-center text-blue-200/60 text-[10px] lg:text-xs z-20 px-4 pb-24 lg:pb-8">
          © 2026 AnestesiaFlow. Todos os direitos reservados.
        </div>

      </div>
    );
  };