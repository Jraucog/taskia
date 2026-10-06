import React from 'react';
import { Compass, Sparkles, Edit3 } from 'lucide-react';
import type { VisionCard } from '../types';

interface VisionViewProps {
  visionCards: VisionCard[];
  onOpenGrillMe: () => void;
  onEditCard: (card: VisionCard) => void;
}

export const VisionView: React.FC<VisionViewProps> = ({
  visionCards,
  onOpenGrillMe,
  onEditCard
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" /> Mi Vision Board Personal
          </h2>
          <p className="text-xs text-slate-400">Metas maestras, horizonte temporal y por qué lo haces</p>
        </div>

        <button 
          onClick={onOpenGrillMe}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Grill Me
        </button>
      </div>

      {/* Banner explicativo del Vision Board */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex items-start gap-2.5">
        <span className="text-base">🎯</span>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          El Vision Board conecta tus hábitos diarios con tus metas trascendentales de vida. Toca cualquier tarjeta para editarla o usa el botón <strong>"Grill Me"</strong> para que el asistente te entreviste y formule una nueva meta precisa con la fórmula 3P.
        </p>
      </div>

      {/* Cuadrícula o lista de Tarjetas del Vision Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visionCards.map((card) => (
          <div 
            key={card.id} 
            className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl flex flex-col justify-between shadow-sm relative group transition"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{card.emoji}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                    📅 {card.deadline}
                  </span>
                  <button 
                    onClick={() => onEditCard(card)}
                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition"
                    title="Editar Meta"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                {card.category}
              </span>
              <h3 className="font-bold text-sm text-slate-100 mt-0.5 leading-snug">
                {card.title}
              </h3>

              <p className="text-[11px] text-slate-400 mt-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed italic">
                "{card.why}"
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-800/60">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span>Progreso estimado:</span>
                <span className="font-mono font-bold text-slate-300">{card.progress}%</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="bg-slate-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${card.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
