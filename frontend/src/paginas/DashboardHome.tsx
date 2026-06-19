import { Logo } from "@/componentes/logo/Logo";
import { Notificacao } from "@/componentes/notificacao/Notificacao";
import { useAuthStore } from "@/permissoes/authStore";

export const DashboardHome = () => {
    const usuarioLogado = useAuthStore((state) => state.user);
    const temMedicoVinculado = !!usuarioLogado?.medicoId;

    return (
      <div className="h-[100dvh] w-full flex flex-col bg-white overflow-hidden">
        <div className="ml-[5%] w-[90%] pt-2 md:pt-4 z-40">
          <div className="rounded-2xl border border-blue-100 bg-white/95 backdrop-blur shadow-sm px-3 py-3">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex flex-col">
                <p className="text-[10px] uppercase tracking-[0.25em] font-black text-gray-400">Painel rápido</p>
              </div>
            </div>

            <div className={`grid grid-cols-1 ${temMedicoVinculado ? 'md:grid-cols-2' : ''} gap-3 items-stretch`}>
              <div className="min-w-0">
                <Notificacao />
              </div>

              {temMedicoVinculado && (
                <div className="flex items-center justify-between gap-4 bg-white border border-blue-100 rounded-xl px-2 py-1 shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400">Médico / Anestesista</p>
                      <p className="text-sm font-bold text-gray-800 truncate">
                        {usuarioLogado?.medicoExibir}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-1 bg-ap-blue-dark flex flex-col justify-center items-center text-white overflow-hidden pb-20 md:pb-0">

          <div className="z-10 max-w-md text-center flex flex-col items-center">
            <Logo className="h-16 lg:h-24 mb-6" light showText={false} />

            <h1 className="text-4xl lg:text-7xl font-black mb-2 tracking-tighter">
              Anestesia<span className="text-ap-cyan drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">Flow</span>
            </h1>
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
