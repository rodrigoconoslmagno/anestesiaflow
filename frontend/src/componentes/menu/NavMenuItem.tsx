import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { Ripple } from 'primereact/ripple';
import type { MenuItem } from '@/componentes/menu/navigation';

interface NavMenuItemProps {
  item: MenuItem;
  level?: number;
}

export const NavMenuItem = ({ item, level = 0 }: NavMenuItemProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.to ? location.pathname === item.to : false;
  
  // Estilização dinâmica baseada no nível de profundidade
  const paddingLeft = level === 0 ? 'px-3' : level === 1 ? 'pl-10 pr-3' : 'pl-16 pr-3';

  const handleClick = () => {
    if (hasChildren) {
      setExpanded(!expanded);
    } else if (item.to) {
      navigate(item.to);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={handleClick}
        className={clsx(
          "w-full flex items-center gap-3 py-3 rounded-xl transition-all duration-200 p-ripple group mb-1",
          paddingLeft,
          isActive 
            ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
            : "text-gray-500 hover:bg-blue-50 hover:text-blue-600"
        )}
      >
        <i className={clsx(item.icon, "text-lg", isActive ? "text-white" : "group-hover:text-blue-600")}></i>
        <span className="font-semibold text-sm tracking-tight flex-1 text-left truncate">{item.label}</span>
        
        {hasChildren && (
          <i className={clsx("pi text-xs transition-transform duration-200", expanded ? "pi-chevron-down" : "pi-chevron-right")}></i>
        )}
        <Ripple />
      </button>

      {/* RENDERIZAÇÃO RECURSIVA */}
      {hasChildren && expanded && (
        <div className="flex flex-col animate-fadein">
          {item.children?.map((child, idx) => (
            <NavMenuItem key={idx} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};