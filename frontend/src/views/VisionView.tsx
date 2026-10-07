import React from 'react';
import { Compass, Sparkles, Edit3, Link as LinkIcon, CheckCircle2, Circle } from 'lucide-react';
import type { VisionCard, Habit } from '../types';

interface VisionViewProps {
  visionCards: VisionCard[];
  habits?: Habit[];
  onOpenGrillMe: () => void;
  onEditCard: (card: VisionCard) => void;
}

export const VisionView: React.FC<VisionViewProps> = ({
  visionCards,
  habits = [],
  onOpenGrillMe,
  onEditCard
}) => {
  // Helper para buscar hábitos vinculados a la categoría o palabras clave de la tarjeta
  const getLinkedHabits = (card: VisionCard) => {
    const cardCat = card.category.toLowerCase();
    const cardTitle = card.title.toLowerCase();

    return habits.filter(h => {
      const hTitle = h.title.toLowerCase();
      const hDesc = (h.description || '').toLowerCase();

      if (cardCat.includes('salud') || cardCat.includes('cuerpo') || cardCat.includes('tren inferior')) {
        return hTitle.includes('trx') || hTitle.includes('fuerza') || hTitle.includes('salud') || 
               hTitle.includes('agua') || hTitle.includes('paso') || hTitle.includes('aquiles') || 
               hTitle.includes('dorsiflex') || hTitle.includes('nutric') || hTitle.includes('comida') ||
               hTitle.includes('ejercicio');
      }
      if (cardCat.includes('software') || cardCat.includes('negocio') || cardCat.includes('carrera') || cardCat.includes('finanza')) {
        return hTitle.includes('software') || hTitle.includes('program') || hTitle.includes('deep work') || 
               hTitle.includes('código') || hTitle.includes('mvp') || hTitle.includes('cliente') || 
               hTitle.includes('trabajo') || hTitle.includes('ahorro') || hTitle.includes('100m');
      }
      if (cardCat.includes('música') || cardCat.includes('creativ') || cardCat.includes('pasión')) {
        return hTitle.includes('música') || hTitle.includes('beat') || hTitle.includes('track') || 
               hTitle.includes('single') || hTitle.includes('audio') || hTitle.includes('creat');
      }
      if (cardCat.includes('hogar') || cardCat.includes('familia') || cardCat.includes('paz') || cardCat.includes('mente')) {
        return hTitle.includes('hogar') || hTitle.includes('termopanel') || hTitle.includes('casa') || 
               hTitle.includes('respir') || hTitle.includes('sueño') || hTitle.includes('medit') ||
               hTitle.includes('orden') || hTitle.includes('familia');
      }

      // Coincidencia por palabras clave directas
      const keywords = cardTitle.split(' ').filter(w => w.length > 4);
      return keywords.some(k => hTitle.includes(k) || hDesc.includes(k));
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" /> Vision Board Conectado a Hábitos
          </h2>
          <p className="text-xs text-slate-400">Cada meta trascendental impulsada por tus acciones diarias</p>
        </div>

        <button 
          onClick={onOpenGrillMe}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Grill Me
        </button>
      </div>

      {/* Banner explicativo del Vision Board */}
      <div className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-indigo-950/30 border border-amber-900/30 rounded-2xl p-3.5 flex items-start gap-3">
        <span className="text-xl shrink-0 mt-0.5">⚡</span>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          <strong>El puente mente-acción de Taskia:</strong> Las metas no se quedan en deseos estáticos. Aquí ves exactamente <em>qué tareas y entrenamientos de hoy</em> están moviendo la aguja hacia tus objetivos a largo plazo.
        </p>
      </div>

      {/* Cuadrícula o lista de Tarjetas del Vision Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {visionCards.map((card) => {
          const linked = getLinkedHabits(card);
          const completedLinked = linked.filter(h => h.today_log?.completed).length;

          return (
            <div 
              key={card.id} 
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-4 rounded-3xl flex flex-col justify-between shadow-sm relative group transition"
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
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <span className="text-[9px] uppercase font-bold tracking-wider text-amber-400/90">
                  {card.category}
                </span>
                <h3 className="font-bold text-sm text-slate-100 mt-0.5 leading-snug">
                  {card.title}
                </h3>

                <p className="text-[11px] text-slate-300 mt-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed italic">
                  "{card.why}"
                </p>

                {/* Motor de Tracción Diaria: Hábitos que empujan esta meta */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/60">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="text-slate-400 flex items-center gap-1 font-semibold">
                      <LinkIcon className="w-3 h-3 text-indigo-400" /> Hábitos de tracción diaria:
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400">
                      {completedLinked} / {linked.length} listos hoy
                    </span>
                  </div>

                  {linked.length > 0 ? (
                    <div className="space-y-1">
                      {linked.slice(0, 3).map(h => (
                        <div key={h.id} className="text-[10px] flex items-center justify-between bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-800/60 text-slate-300">
                          <span className="truncate pr-2">{h.title.replace(/^\[.*?\]\s*/, '')}</span>
                          {h.today_log?.completed ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          ) : (
                            <Circle className="w-3 h-3 text-slate-600 shrink-0" />
                          )}
                        </div>
                      ))}
                      {linked.length > 3 && (
                        <span className="text-[9px] text-slate-500 pl-1 block">+{linked.length - 3} hábitos adicionales vinculados</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 italic bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/40">
                      Consejo: Activa hábitos de {card.category} para impulsar esta meta diariamente.
                    </p>
                  )}
                </div>
              </div>

              {/* Barra de Progreso Global */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/60">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>Avance proyectado:</span>
                  <span className="font-mono font-bold text-slate-300">{card.progress}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${card.progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
