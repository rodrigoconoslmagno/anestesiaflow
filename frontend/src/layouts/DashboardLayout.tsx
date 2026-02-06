import { useState, type FC } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { Ripple } from 'primereact/ripple';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { InputSwitch } from 'primereact/inputswitch'; 
import { Logo } from '@/componentes/logo/Logo';
import { useAuth } from '@/context/AuthContext';
import { navigationItems,type MenuItem } from '@/componentes/menu/navigation';

const NavItem: FC<{ item: MenuItem; level?: number; closeMobile?: () => void; isCollapsed?: boolean; onSelect: () => void }> = ({ 
  item, level = 0, closeMobile, isCollapsed, onSelect 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  const hasChildren = !!item.children?.length;
  const isActive = item.to ? location.pathname === item.to : false;
  
  const handleClick = () => {
    if (hasChildren) {
      setExpanded(!expanded);
    } else if (item.to) {
      navigate(item.to);
      onSelect(); 
      if (closeMobile) closeMobile();
    }
  };

  const paddingClass = isCollapsed ? "px-0 justify-center" : level === 0 ? "px-4" : level === 1 ? "pl-12 pr-4" : "pl-20 pr-4";

  return (
    <div className="w-full">
      <button
        onClick={handleClick}
        className={clsx(
          "w-full flex items-center py-3 rounded-xl transition-all duration-200 p-ripple group mb-1",
          isCollapsed ? "gap-0" : "gap-3",
          paddingClass,
          isActive ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-gray-500 hover:bg-blue-50"
        )}
      >
        {item.icon && (
          <div className="w-6 h-6 flex items-center justify-center shrink-0">
            <i className={clsx(item.icon, "text-lg", isActive ? "text-white" : "text-gray-400 group-hover:text-blue-600")}></i>
          </div>
        )}
        {!isCollapsed && (
          <span className={clsx("font-semibold text-sm flex-1 text-left truncate animate-fadein", isActive ? "text-white" : "text-gray-700")}>
            {item.label}
          </span>
        )}
        {!isCollapsed && hasChildren && <i className={clsx("pi text-[10px]", expanded ? "pi-chevron-down" : "pi-chevron-right")}></i>}
        <Ripple />
      </button>
      {hasChildren && expanded && !isCollapsed && (
        <div className="flex flex-col">
          {item.children?.map((child, idx) => (
            <NavItem key={idx} item={child} level={level + 1} closeMobile={closeMobile} isCollapsed={isCollapsed} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

export const DashboardLayout: FC = () => {
  const { usuario, logout } = useAuth();
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [fullViewMode, setFullViewMode] = useState(false); 
  const [isHovered, setIsHovered] = useState(false); 
  
  const navigate = useNavigate();
  const location = useLocation();

  const isCollapsed = fullViewMode && !isHovered;

  const mobileQuickActions = [
    { label: 'Início', icon: 'pi pi-home', to: '/dashboard' },
    { label: 'Sudoku', icon: 'pi pi-calendar', to: '/sudoku' },
    { label: 'Médicos', icon: 'pi pi-users', to: '/medicos' },
  ];

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-[#f9fafb] overflow-hidden">
      
      {/* SIDEBAR DESKTOP */}
      <aside 
        className={clsx(
          "hidden lg:flex bg-white flex-col shrink-0 border-r border-gray-200 shadow-2xl z-50 transition-all duration-300 ease-in-out h-full",
          !fullViewMode ? "w-72 relative" : (isHovered ? "w-72 absolute" : "w-20 absolute")
        )}
        onMouseEnter={() => fullViewMode && setIsHovered(true)}
        onMouseLeave={() => fullViewMode && setIsHovered(false)}
      >
        <div className={clsx("p-6 flex flex-col items-center border-b border-gray-50", isCollapsed && "px-0")}>
          <Logo showText={false} className={clsx("w-auto mb-4 transition-all", isCollapsed ? "h-10" : "h-16")} />
          {!isCollapsed && (
            <div className="animate-fadein text-center w-full">
              <h1 className="font-black text-blue-900 text-xl tracking-tight leading-tight">
                Anestesia<span className="text-blue-500 font-light">Flow</span>
              </h1>
              
              <div className="mt-4 flex items-center justify-between gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tela Cheia</span>
                <InputSwitch 
                  checked={fullViewMode} 
                  onChange={(e) => {
                    setFullViewMode(e.value);
                    if(!e.value) setIsHovered(false);
                  }} 
                />
              </div>
            </div>
          )}
        </div>
        
        <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar">
          {navigationItems.map((item, idx) => (
            <NavItem 
              key={idx} 
              item={item} 
              isCollapsed={isCollapsed} 
              onSelect={() => fullViewMode && setIsHovered(false)} 
            />
          ))}
        </nav>

        {/* FOOTER DO MENU COM BOTÃO SAIR REINSERIDO */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className={clsx(
            "flex items-center gap-3 bg-white rounded-2xl border border-gray-100 transition-all",
            isCollapsed ? "p-1 justify-center" : "px-3 py-3 mb-4"
          )}>
            <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              {usuario?.nome?.charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate animate-fadein">
                <span className="text-sm font-bold text-gray-800 truncate">{usuario?.nome}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Médico Plantonista</span>
              </div>
            )}
          </div>
          
          {/* BOTÃO SAIR APARECE QUANDO NÃO ESTÁ COLAPSADO */}
          {!isCollapsed && (
            <button 
              onClick={logout} 
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-bold text-xs uppercase tracking-widest animate-fadein"
            >
              <i className="pi pi-sign-out"></i>
              <span>Sair do Sistema</span>
            </button>
          )}

          {/* ÍCONE DE SAIR RÁPIDO QUANDO ESTÁ COLAPSADO (OPCIONAL) */}
          {isCollapsed && (
            <button 
              onClick={logout} 
              title="Sair"
              className="w-full flex items-center justify-center p-3 text-red-400 hover:text-red-600 transition-colors"
            >
              <i className="pi pi-sign-out text-lg"></i>
            </button>
          )}
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className={clsx(
        "flex-1 flex flex-col min-w-0 overflow-hidden relative transition-all duration-300",
        fullViewMode ? "lg:ml-20" : "lg:ml-0"
      )}>
        <div className="flex-1 p-1 lg:p-5 flex flex-col h-full"> 
            <div className="w-full h-full flex flex-col min-h-0">
                <Outlet /> 
            </div>
        </div>
      </main>

      {/* MOBILE UI (Original Mantido) */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-lg border-t border-gray-100 px-6 py-3 flex justify-between items-center z-40 pb-safe">
        {mobileQuickActions.map((item) => (
          <button key={item.to} onClick={() => navigate(item.to)} className={clsx("flex flex-col items-center gap-1", location.pathname === item.to ? "text-blue-600" : "text-gray-400")}>
            <i className={clsx(item.icon, "text-xl")}></i>
            <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
        <button onClick={() => setMobileMenuVisible(true)} className="flex flex-col items-center gap-1 text-gray-400">
          <i className="pi pi-th-large text-xl"></i>
          <span className="text-[9px] font-black uppercase tracking-tighter">Menu</span>
        </button>
      </div>

      <Sidebar visible={mobileMenuVisible} onHide={() => setMobileMenuVisible(false)} position="right" className="w-full md:w-20rem p-0">
        <div className="flex flex-col h-full bg-white">
          <div className="p-8 border-b border-gray-50 flex flex-col items-center bg-gray-50/30">
             <Logo showText={false} className="h-12 mb-3" />
             <span className="font-black text-blue-900 text-xl tracking-tight">AnestesiaFlow</span>
          </div>
          <nav className="flex-1 p-4 overflow-y-auto">
            {navigationItems.map((item, idx) => (
              <NavItem key={idx} item={item} closeMobile={() => setMobileMenuVisible(false)} onSelect={() => setMobileMenuVisible(false)} />
            ))}
          </nav>
          <div className="p-6 border-t border-gray-100">
             <Button label="Sair do Sistema" icon="pi pi-sign-out" severity="danger" text className="w-full font-bold uppercase tracking-widest text-xs" onClick={logout} />
          </div>
        </div>
      </Sidebar>
    </div>
  );
};