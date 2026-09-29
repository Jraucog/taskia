import React from 'react';
import { HelpCircle, BookOpen, Check } from 'lucide-react';
import type { Habit } from '../types';

interface BrianTracyConfirmModalProps {
  habit: Habit | null;
  onClose: () => void;
  onConfirm: () => void;
  onShowGoalsModal: () => void;
  cleanTitle: (title: string) => string;
}

export const BrianTracyConfirmModal: React.FC<BrianTracyConfirmModalProps> = ({
  habit,
  onClose,
  onConfirm,
  onShowGoalsModal,
  cleanTitle
}) => {
  if (!habit) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full shadow-2xl text-center flex flex-col gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/20">
          <HelpCircle className="w-6 h-6" />
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-800/50">
            Pregunta de Control Diaria • Brian Tracy
          </span>
          <h3 className="text-sm font-bold text-white mt-2">
            {cleanTitle(habit.title)}
          </h3>
          <p className="text-xs text-slate-300 mt-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 font-medium leading-relaxed">
            "¿Escribiste hoy tus 10 metas a mano en tu cuaderno, de memoria y en Fórmula 3P?"
          </p>

          <button
            onClick={onShowGoalsModal}
            className="mt-2.5 w-full bg-amber-950/60 hover:bg-amber-950 border border-amber-800/60 text-amber-300 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Ver Mis 10 Metas de Referencia</span>
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
          >
            Aún no
          </button>
          
          <button 
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Sí, cumplido
          </button>
        </div>
      </div>
    </div>
  );
};
