
import React, { useState } from 'react';
import { ScreenType, UserRole, OperationalEvent } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeScreen: ScreenType;
  setScreen: (screen: ScreenType) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  onLogout: () => void;
  date: string;
  events: OperationalEvent[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

const LogoutIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeScreen, 
  setScreen, 
  role, 
  onLogout,
  date,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const navItems = [
    { id: 'DASHBOARD', label: 'Quadro Giorno', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg> },
    ...(role === 'REDATTORE' ? [
      { id: 'CREAZIONE', label: 'Crea Servizio', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> },
      { id: 'GENERATORE', label: 'Generatore', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.022.547l-2.387 2.387a2 2 0 000 2.828l.586.586a2 2 0 002.828 0l2.387-2.387a2 2 0 00.547-1.022l.477-2.387a6 6 0 01.517-3.86l.158-.318a6 6 0 00.517-3.86L15.21 6.05a2 2 0 01.547-1.022l2.387-2.387a2 2 0 012.828 0l.586.586a2 2 0 010 2.828l-2.387 2.387z" /></svg> }
    ] : []),
    { id: 'STAFF', label: 'Anagrafica', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> }
  ];

  return (
    <div className="flex h-full w-full bg-[#f4f7f9] overflow-hidden">
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`sidebar-transition fixed top-0 left-0 h-full bg-[#720000] z-[60] flex flex-col shadow-2xl overflow-hidden ${isHovered ? 'w-64' : 'w-16'}`}
      >
        <div className="h-16 flex items-center px-3.5 shrink-0 border-b border-white/10 overflow-hidden bg-white/5">
          <div className="w-9 h-9 shrink-0 flex items-center justify-center">
            <img src="https://www.vigilfuoco.it/themes/custom/vvf/logo.png" className="w-8 h-8 object-contain" alt="Logo VVF" />
          </div>
          <div className={`ml-4 flex flex-col nav-label-transition ${isHovered ? 'opacity-100' : 'opacity-0 invisible'}`}>
            <span className="text-white font-black text-xs leading-none whitespace-nowrap tracking-tighter">COMANDO DI MILANO</span>
            <span className="text-[#C9A40E] text-[8px] font-black uppercase tracking-widest whitespace-nowrap mt-1">Vigili del Fuoco</span>
          </div>
        </div>
        
        <nav className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => setScreen(item.id as ScreenType)} 
              className={`w-full flex items-center h-11 rounded-xl transition-all group relative ${
                activeScreen === item.id 
                ? 'bg-white/10 text-white shadow-inner' 
                : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className={`w-12 flex items-center justify-center shrink-0 transition-transform ${activeScreen === item.id ? 'scale-110 text-[#C9A40E]' : 'group-hover:scale-110'}`}>
                {item.icon}
              </div>
              <span className={`nav-label-transition text-[10px] font-black uppercase tracking-[0.15em] whitespace-nowrap ${isHovered ? 'opacity-100' : 'opacity-0 invisible'}`}>
                {item.label}
              </span>
              {activeScreen === item.id && (
                <div className="absolute left-0 w-1 h-5 bg-[#C9A40E] rounded-r-full active-nav-indicator"></div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-white/10 shrink-0">
          <div className={`flex items-center gap-3 p-1.5 rounded-xl bg-black/20 border border-white/5 transition-all ${isHovered ? 'px-3' : 'justify-center'}`}>
            <div className="w-8 h-8 bg-[#C9A40E] rounded-lg flex items-center justify-center font-black text-[#720000] text-[12px] shrink-0 shadow-lg">
              {role.charAt(role.length - 1)}
            </div>
            {isHovered && (
              <div className="flex-1 min-w-0 nav-label-transition">
                <p className="text-[7px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">OPERATORE ATTIVO</p>
                <div className="text-[10px] font-bold text-white uppercase tracking-wider truncate">
                  {role.replace('_', ' ')}
                </div>
              </div>
            )}
             {isHovered && (
                <button 
                  onClick={onLogout}
                  className="ml-auto w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  title="Esci"
                >
                  <LogoutIcon className="w-4 h-4" />
                </button>
             )}
          </div>
          {!isHovered && (
             <button 
                onClick={onLogout}
                className="mt-2 w-full h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                title="Esci"
             >
               <LogoutIcon className="w-4 h-4" />
             </button>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col ml-16 sidebar-transition overflow-hidden h-full">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 z-50 sticky top-0 shrink-0 shadow-sm gap-6">
          <div className="flex flex-col shrink-0 min-w-[140px]">
            <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">{date.split('•')[0]}</span>
            <span className="text-[10px] font-mono font-medium text-[#720000] leading-none">{date.split('•')[1]}</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[#f4f7f9] custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};
