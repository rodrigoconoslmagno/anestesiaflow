import { useState, type FC } from 'react';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Logo } from '@/componentes/logo/Logo.tsx';
import { useNavigate } from 'react-router-dom';

export const Login: FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      
      {/* LADO ESQUERDO / TOPO MOBILE: Branding */}
      <div className="w-full lg:w-7/12 bg-ap-blue-dark relative flex flex-col justify-center items-center p-8 lg:p-12 text-white overflow-hidden">
        <div className="z-10 max-w-md text-center">
          <Logo className="h-20 lg:h-24 mb-6 justify-center" light />
          
          <h1 className="text-5xl lg:text-7xl font-black mb-2 tracking-tighter">
            Anestesia<span className="text-ap-cyan drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">Flow</span>
          </h1>
          
          <div className="mb-8">
            <span className="text-blue-200 text-sm lg:text-lg font-medium tracking-[0.2em] uppercase opacity-80">
              Anestesia Piracicaba
            </span>
          </div>
          
          <p className="hidden lg:block text-blue-100 text-xl opacity-90 font-light max-w-sm mx-auto leading-relaxed">
            Gestão inteligente de escalas, fluxos e produtividade hospitalar.
          </p>
        </div>

        {/* Efeito de luz no fundo para dar profundidade */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-ap-blue-light opacity-20 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-ap-cyan opacity-10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-br from-ap-blue-dark via-ap-blue-dark to-[#001a33] opacity-95" />
      </div>

      {/* LADO DIREITO / BAIXO MOBILE: Formulário */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 bg-white relative z-20 -mt-6 lg:mt-0 rounded-t-[32px] lg:rounded-none">
        <div className="w-full max-w-sm">
          
          <div className="text-center lg:text-left mb-8 lg:mb-10">
            <h2 className="text-3xl font-bold text-gray-800">Acesso</h2>
            <p className="text-gray-500 mt-2 font-medium">Insira suas credenciais para entrar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700 ml-1 uppercase tracking-wider">Usuário</label>
              <div className="p-icon-field p-icon-field-left">
                <i className="pi pi-user" />
                <InputText 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Login"
                  className="p-4 border-gray-200 rounded-2xl focus:border-ap-blue-light transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700 ml-1 uppercase tracking-wider">Senha</label>
              <div className="p-icon-field p-icon-field-left">
                <i className="pi pi-lock" />
                <Password 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  toggleMask
                  feedback={false}
                  placeholder="••••••••"
                  inputClassName="p-4 border-gray-200 rounded-2xl focus:border-ap-blue-light transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit"
              label="Entrar no Painel" 
              loading={loading}
              className="w-full h-14 bg-ap-blue-dark border-none rounded-2xl text-lg font-bold hover:bg-ap-blue-light transition-all shadow-xl shadow-blue-900/20 text-white mt-4" 
            />
            
            <p className="text-center text-gray-400 text-xs mt-6">
              © 2026 AnestesiaFlow. Todos os direitos reservados.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};