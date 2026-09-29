import React from 'react';
import { Sparkles } from 'lucide-react';
import type { VisionCard } from '../types';

export interface GrillAnswers {
  area: string;
  goal: string;
  why: string;
  deadline: string;
  commitment?: string;
}

interface GrillMeModalProps {
  isOpen: boolean;
  step: number;
  answers: GrillAnswers;
  onStepChange: (step: number) => void;
  onAnswersChange: (answers: GrillAnswers) => void;
  onClose: () => void;
  onSave: (newCard: VisionCard) => void;
}

export const GrillMeModal: React.FC<GrillMeModalProps> = ({
  isOpen,
  step,
  answers,
  onStepChange,
  onAnswersChange,
  onClose,
  onSave
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-md w-full shadow-2xl flex flex-col gap-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-800/50">
                Grill Me Wizard • Paso {step + 1} de 4
              </span>
              <h3 className="text-sm font-bold text-white mt-1">Descubridor de Metas 3P</h3>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm p-1">✕</button>
        </div>

        {/* Paso 0: Área de Vida */}
        {step === 0 && (
          <div className="space-y-3">
            <p className="text-xs text-slate-300 font-medium">
              1. ¿En qué dimensión de tu vida sientes que necesitas dar un salto cuántico y no puedes postergar más?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Cuerpo & Salud", icon: "🦵" },
                { label: "Software & Negocio", icon: "💻" },
                { label: "Música & Arte", icon: "🎵" },
                { label: "Hogar & Entorno", icon: "🏡" }
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => onAnswersChange({ ...answers, area: item.label })}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2 transition ${
                    answers.area === item.label
                      ? 'bg-amber-950/60 border-amber-500 text-white font-bold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-xs">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Paso 1: Redacción en Fórmula 3P */}
        {step === 1 && (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-white font-medium mb-1">
                2. Define tu meta en Fórmula 3P (Presente, Positivo, Personal):
              </p>
              <p className="text-[11px] text-amber-300/80 italic">
                Ejemplo: "Yo peso 85 kg con tono muscular atlético..." o "Yo consigo mis primeros 10 clientes de pago..."
              </p>
            </div>
            <textarea
              value={answers.goal}
              onChange={(e) => onAnswersChange({ ...answers, goal: e.target.value })}
              placeholder="Yo ..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-amber-500/80 h-24"
            />
          </div>
        )}

        {/* Paso 2: Por qué es innegociable */}
        {step === 2 && (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-white font-medium mb-1">
                3. ¿Por qué esto es vital para ti? ¿Qué pasa si NO lo cumples?
              </p>
              <p className="text-[11px] text-slate-400">
                La motivación superficial se agota en 3 días. El motivo profundo te hace levantar a las 6 AM sin dudar.
              </p>
            </div>
            <textarea
              value={answers.why}
              onChange={(e) => onAnswersChange({ ...answers, why: e.target.value })}
              placeholder="Porque quiero libertad total, jugar al fútbol sin dolor y estar orgulloso de mi disciplina..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-amber-500/80 h-24"
            />
          </div>
        )}

        {/* Paso 3: Fecha Límite */}
        {step === 3 && (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-white font-medium mb-1">
                4. ¿Cuál es tu fecha límite de entrega exacta?
              </p>
              <p className="text-[11px] text-slate-400">
                Una meta sin fecha es solo un deseo que el cerebro pospone indefinidamente.
              </p>
            </div>
            <input
              type="text"
              value={answers.deadline}
              onChange={(e) => onAnswersChange({ ...answers, deadline: e.target.value })}
              placeholder="ej. 31/05/2027 o 15/12/2026"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-amber-500/80"
            />
          </div>
        )}

        {/* Botones de navegación del Wizard */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          {step > 0 && (
            <button
              onClick={() => onStepChange(step - 1)}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
            >
              Atrás
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => onStepChange(step + 1)}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition"
            >
              Siguiente Pregunta →
            </button>
          ) : (
            <button
              onClick={() => {
                const newCard: VisionCard = {
                  id: `v-${Date.now()}`,
                  category: answers.area,
                  emoji: answers.area.includes('Salud') ? '🦵' : answers.area.includes('Software') ? '💻' : answers.area.includes('Música') ? '🎵' : '🏡',
                  title: answers.goal.trim() || 'Meta sin título',
                  why: answers.why.trim() || 'Compromiso de disciplina y excelencia',
                  deadline: answers.deadline.trim() || 'Pronto',
                  progress: 10,
                  color: answers.area.includes('Salud') 
                    ? 'from-emerald-950/60 to-emerald-900/20 border-emerald-500/40' 
                    : answers.area.includes('Software')
                    ? 'from-indigo-950/60 to-indigo-900/20 border-indigo-500/40'
                    : 'from-amber-950/60 to-amber-900/20 border-amber-500/40'
                };
                onSave(newCard);
              }}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black text-xs shadow-lg transition"
            >
              ✨ Guardar en mi Vision Board
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
