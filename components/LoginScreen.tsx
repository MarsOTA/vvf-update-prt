
import React, { useState } from 'react';
import { UserRole } from '../types';

interface LoginScreenProps {
  onLogin: (role: UserRole) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const CREDENTIALS: Record<string, { pass: string, role: UserRole }> = {
    'redattore@vvf.com': { pass: 'Redvvf@', role: 'REDATTORE' },
    'compilatore.a@vvf.com': { pass: 'AFillvvf01!', role: 'COMPILATORE_A' },
    'compilatore.b@vvf.com': { pass: 'Bfillvvf03!', role: 'COMPILATORE_B' },
    'compilatore.c@vvf.com': { pass: 'CfillvvfM2!', role: 'COMPILATORE_C' },
    'compilatore.d@vvf.com': { pass: 'DFillvvf26!', role: 'COMPILATORE_D' },
    'approvatore@vvf.com': { pass: 'Advvf02!', role: 'APPROVATORE' }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const user = CREDENTIALS[email.toLowerCase().trim()];
      
      if (user && user.pass === password) {
        onLogin(user.role);
      } else {
        setError('Credenziali non valide. Verificare email e password.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen w-full bg-[#403C3A] flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-[#720000]"></div>
      <div className="absolute top-[48%] left-0 w-full h-24 bg-gradient-to-b from-[#720000] to-transparent"></div>
      
      {/* Pattern decorativo */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200">
          
          {/* Header Card */}
          <div className="bg-slate-50 px-8 py-8 border-b border-slate-100 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 mb-4 p-2">
               <img src="https://www.vigilfuoco.it/themes/custom/vvf/logo.png" alt="VVF Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">VIGILI DEL FUOCO</h1>
            <p className="text-xs font-bold text-[#720000] uppercase tracking-[0.25em] mt-1">COMANDO DI MILANO</p>
          </div>

          {/* Form */}
          <div className="p-8 pt-10">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Identificativo Utente</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#720000]/20 focus:border-[#720000] transition-all"
                    placeholder="nome.cognome@vvf.com"
                    required
                  />
                  <svg className="w-5 h-5 text-slate-300 absolute right-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Codice di Accesso</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#720000]/20 focus:border-[#720000] transition-all"
                    placeholder="••••••••••"
                    required
                  />
                  <svg className="w-5 h-5 text-slate-300 absolute right-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                  <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-xs font-bold text-red-600 leading-tight">{error}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-[#720000] text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-red-900/10 hover:bg-[#8b0000] hover:shadow-red-900/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Accedi al Sistema'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-[10px] text-slate-400 font-medium">
                Accesso riservato al personale autorizzato.<br/>
                Il sistema è monitorato. IP: 192.168.1.X
              </p>
            </div>
          </div>
        </div>
        <div className="text-center mt-6">
           <span className="text-[9px] text-white/40 uppercase tracking-widest font-black">Versione Sistema 2.4.1 • Build 20250217</span>
        </div>
      </div>
    </div>
  );
};
