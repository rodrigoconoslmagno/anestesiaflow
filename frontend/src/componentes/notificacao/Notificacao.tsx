import { server } from '@/api/server';
import { useAppToast } from '@/context/ToastContext';
import { getMessagingSafe } from '@/firebaseConfig';
import { getToken } from 'firebase/messaging';
import { useState, useEffect } from 'react';

export const Notificacao = () => {
    const [isPWA, setIsPWA] = useState(false);
    const [status, setStatus] = useState<NotificationPermission | 'loading'>('loading');
    const { showSuccess } = useAppToast();

    useEffect(() => {
        if ('Notification' in window) {
            setStatus(Notification.permission);
        }
    }, []);

    useEffect(() => {
        const checkPWA = () => {
            // Verifica iOS
            const isIOSStandalone = (window.navigator as any).standalone;
            
            // Verifica Android / Chrome Desktop
            const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches;
            
            // Se qualquer um for verdadeiro, estamos em modo APP
            setIsPWA(!!(isIOSStandalone || isDisplayStandalone));
        };
    
        checkPWA();
        
        if ('Notification' in window) {
            setStatus(Notification.permission);
        }
    }, []);

    const handleEnable = async () => {
        try{
            const permission = await Notification.requestPermission();
            setStatus(permission);
            console.log("validando permissao", permission)
            if (permission === 'granted') {
                const messaging = await getMessagingSafe();
                console.log("validando messaging", messaging)
                if (messaging) {  
                    const token = await getToken(messaging, { 
                        vapidKey: 'BKONz9FI9x-nFDsQTBI9m8_XJlixcvxLcHj3ztyHkTWsKy9O5M8WL7q0C3kMtrRBgCB-BBqiWoRKkyfZGwDhRoY' 
                    });
                    console.log("token", token)
                    if (token) {
                        await server.auth.registrarToken(token);
                        console.log("Push Token registrado com sucesso.");
                        showSuccess("Notificação", "Notificação ativa com sucesso!");
                    }
                } else {
                console.log("Não tem suporte suporte a regsitro ao firebase");
                }
                console.log("Token de registro disparado...");
            }
        } catch(err) {
            console.error("erro", err)
        }
    };

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // No iOS, exigimos PWA. No Android ou Desktop, permitimos direto no browser
    const podeMostrarBotao = isPWA || !isIOS;
    
    if (!podeMostrarBotao) {
        return (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl">
            <i className="pi pi-info-circle text-amber-600 text-sm"></i>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-amber-800 uppercase">Instale o App</span>
              <span className="text-[9px] text-amber-700">Para receber alertas, use "Adicionar à Tela de Início"</span>
            </div>
          </div>
        );
      }

    return (
        <div className={`p-1 flex flex-col md:flex-row items-start justify-between gap-4 rounded-xl border transition-all ${
            status === 'granted' 
            ? 'bg-green-50/50 border-green-100' 
            : 'bg-blue-50 border-blue-100 shadow-sm'
        }`}>
            <div className="w-full flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    {/* Ícone menor e mais discreto */}
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                        status === 'granted' ? 'bg-green-500' : 'bg-blue-500'
                    }`}>
                        <i className={`pi ${status === 'granted' ? 'pi-check' : 'pi-bell'} text-white text-xs`}></i>
                    </div>
                    
                    <div className="flex flex-col">
                        <h4 className={`text-sm font-bold ${status === 'granted' ? 'text-green-800' : 'text-blue-800'}`}>
                            {status === 'granted' ? 'Alertas Ativos' : 'Notificações'}
                        </h4>
                        <p className={`text-xs ${status === 'granted' ? 'text-green-600' : 'text-blue-600'}`}>
                            {status === 'granted' ? 'Dispositivo registrado' : 'Toque para ativar avisos'}
                        </p>
                    </div>
                </div>

                {status === 'default' && (
                    <button 
                        onClick={handleEnable}
                        className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg font-bold active:scale-95 transition-transform"
                    >
                        ATIVAR
                    </button>
                )}

            {status === 'denied' && (
                <span className="text-red-600 text-sm font-medium flex items-center gap-2">
                    <i className="pi pi-exclamation-circle"></i>
                    Bloqueado no Navegador
                </span>
            )}
            </div>
        </div>
    );
};