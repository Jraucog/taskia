import React from 'react';
import { BookOpen } from 'lucide-react';
import type { BrianTracyGoal } from '../types';

interface GoalsReferenceModalProps {
  isOpen: boolean;
  goals: BrianTracyGoal[];
  onClose: () => void;
}

export const GoalsReferenceModal: React.FC<GoalsReferenceModalProps> = ({
  isOpen,
  goals,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">10 Metas Oficiales (Fórmula 3P)</h3>
              <p className="text-[11px] text-slate-400">Referencia del Cuaderno de Brian Tracy</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm p-1">✕</button>
        </div>

        <div className="text-[11px] text-amber-300/80 bg-amber-950/30 p-2.5 rounded-xl border border-amber-900/30 my-3">
          💡 <em>Recuerda: Cada mañana debes redactarlas en tu cuaderno físico a mano y de memoria, sin mirar las anotaciones anteriores.</em>
        </div>

        <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
          {goals.map(goal => (
            <div key={goal.id} className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 flex items-start gap-2.5">
              <span className="w-5 h-5 shrink-0 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center justify-center mt-0.5">
                {goal.id}
              </span>
              <div className="flex-1">
                <p className="text-xs text-white leading-relaxed font-medium">{goal.text}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                    📅 {goal.date}
                  </span>
                  <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded">
                    {goal.cat}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={onClose}
          className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl transition"
        >
          Cerrar y Volver al Tablero
        </button>
      </div>
    </div>
  );
};
