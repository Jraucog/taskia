import React from 'react';
import { UserPlus, LogIn } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  isRegister: boolean;
  username: string;
  email: string;
  password: string;
  error: string;
  onClose: () => void;
  onToggleRegister: () => void;
  onUsernameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  isRegister,
  username,
  email,
  password,
  error,
  onClose,
  onToggleRegister,
  onUsernameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-xs w-full shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            {isRegister ? <UserPlus className="w-4 h-4 text-indigo-400" /> : <LogIn className="w-4 h-4 text-indigo-400" />}
            {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xs">✕</button>
        </div>

        {error && (
          <div className="bg-red-950/60 border border-red-800/80 text-red-300 text-xs p-2 rounded-lg mb-3">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-2.5">
          <div>
            <label className="text-[11px] text-slate-400 block mb-0.5">Usuario</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              placeholder="ej. joshua" 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
            />
          </div>

          {isRegister && (
            <div>
              <label className="text-[11px] text-slate-400 block mb-0.5">Correo</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="tu@correo.com" 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] text-slate-400 block mb-0.5">Contraseña</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="••••••••" 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 rounded-xl transition mt-1 shadow-md active:scale-95"
          >
            {isRegister ? 'Registrarme' : 'Entrar'}
          </button>
        </form>

        <div className="text-center mt-3">
          <button 
            onClick={onToggleRegister}
            className="text-[11px] text-slate-400 hover:text-indigo-400"
          >
            {isRegister ? '¿Ya tienes cuenta? Ingresa' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  );
};
