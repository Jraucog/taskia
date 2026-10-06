import React, { useState } from 'react';
import { Users, UserPlus, Trash2, Check, AlertCircle } from 'lucide-react';
import type { Habit } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  habit?: Habit | null;
  planName?: string | null;
  planSharedWith?: string[];
  planOwner?: string;
  currentUsername: string;
  onClose: () => void;
  onShare: (habitId: number, targetUsername: string, action: 'add' | 'remove') => Promise<{ ok: boolean; message?: string }>;
  onSharePlan?: (planName: string, targetUsername: string, action: 'add' | 'remove') => Promise<{ ok: boolean; message?: string }>;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  habit,
  planName,
  planSharedWith,
  planOwner,
  currentUsername,
  onClose,
  onShare,
  onSharePlan
}) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || (!habit && !planName)) return null;

  const targetTitle = planName ? `Plan Completo: ${planName}` : (habit?.title || '');
  const owner = planName ? (planOwner || currentUsername) : (habit?.owner_username || currentUsername);
  const isOwner = planName 
    ? (!planOwner || planOwner === currentUsername)
    : (!habit || !habit.owner_username || habit.owner_username === currentUsername);
  
  // Lista de compartidos: si es plan, usamos planSharedWith; si es hábito, habit.shared_with_usernames
  const sharedList = planName ? (planSharedWith || []) : (habit?.shared_with_usernames || []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    setIsLoading(true);
    setFeedback(null);
    let res: { ok: boolean; message?: string };
    if (planName && onSharePlan) {
      res = await onSharePlan(planName, usernameInput.trim(), 'add');
    } else if (habit) {
      res = await onShare(habit.id, usernameInput.trim(), 'add');
    } else {
      res = { ok: false, message: 'Destino no especificado' };
    }
    setIsLoading(false);
    if (res.ok) {
      setFeedback({ type: 'success', text: res.message || 'Compartido con éxito' });
      setUsernameInput('');
    } else {
      setFeedback({ type: 'error', text: res.message || 'Error al compartir' });
    }
  };

  const handleRemove = async (uname: string) => {
    setIsLoading(true);
    setFeedback(null);
    let res: { ok: boolean; message?: string };
    if (planName && onSharePlan) {
      res = await onSharePlan(planName, uname, 'remove');
    } else if (habit) {
      res = await onShare(habit.id, uname, 'remove');
    } else {
      res = { ok: false, message: 'Destino no especificado' };
    }
    setIsLoading(false);
    if (res.ok) {
      setFeedback({ type: 'success', text: res.message || 'Usuario removido' });
    } else {
      setFeedback({ type: 'error', text: res.message || 'Error al remover' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>{planName ? 'Compartir Plan Completo' : 'Compartir Tarea'}</span>
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xs">✕</button>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 mb-4">
          <p className="text-xs font-semibold text-white truncate">{targetTitle}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {planName ? 'Todas las tareas de este plan se compartirán' : `Creado por: @${owner}`}
          </p>
        </div>

        {feedback && (
          <div className={`text-xs p-2.5 rounded-xl mb-3 flex items-center gap-2 border ${
            feedback.type === 'success' 
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' 
              : 'bg-rose-950/60 border-rose-800 text-rose-300'
          }`}>
            {feedback.type === 'success' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
            <span className="text-[11px] leading-tight">{feedback.text}</span>
          </div>
        )}

        {isOwner ? (
          <>
            <form onSubmit={handleAdd} className="space-y-2 mb-4">
              <label className="text-[11px] text-slate-400 block font-medium">
                Invitar a tu esposa / compañero (por usuario o correo):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="ej. maria o maria@gmail.com"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Añadir</span>
                </button>
              </div>
            </form>

            <div>
              <label className="text-[11px] text-slate-400 block font-medium mb-1.5">
                Compartido actualmente con ({sharedList.length}):
              </label>
              {sharedList.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/50">
                  Solo tú tienes acceso a esta tarea.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {sharedList.map((uname) => (
                    <div 
                      key={uname}
                      className="bg-slate-950/80 border border-slate-800/80 px-2.5 py-1.5 rounded-xl flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-200 font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        @{uname}
                      </span>
                      <button
                        onClick={() => handleRemove(uname)}
                        disabled={isLoading}
                        className="p-1 hover:bg-slate-800 rounded-lg text-rose-400 hover:text-rose-300 transition"
                        title="Dejar de compartir"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 text-xs text-slate-300">
            <p>Este {planName ? 'plan' : 'hábito'} fue compartido contigo por <strong>@{owner}</strong>.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Cualquier ítem que marques o agregues se sincronizará automáticamente para que ambos lo vean.
            </p>
            {sharedList.length > 0 && (
              <div className="mt-3 pt-2 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-1">
                  Participantes del plan:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[11px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full text-indigo-300 font-medium">
                    👑 @{owner} (Creador)
                  </span>
                  {sharedList.map(u => (
                    <span key={u} className="text-[11px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full text-emerald-300 font-medium">
                      @{u}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs px-4 py-1.5 rounded-xl transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
