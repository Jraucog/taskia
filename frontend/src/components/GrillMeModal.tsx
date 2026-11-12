import React, { useState } from 'react';
import { Sparkles, Swords, CheckCircle2, AlertCircle } from 'lucide-react';
import type { VisionCard } from '../types';
import { haptics } from '../services/haptics';

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
  const [coachFeedback, setCoachFeedback] = useState<{
    critique: string;
    suggestedGoal?: string;
    passed: boolean;
  } | null>(null);

  if (!isOpen) return null;

  const handleCoachGrill = () => {
    haptics.impact();
    const text = (answers.goal || '').trim();
    const lower = text.toLowerCase();

    if (!text) {
      setCoachFeedback({
        critique: "Aún no has escrito tu meta. Define qué quieres lograr antes de desafiarte.",
        passed: false
      });
      return;
    }

    const issues: string[] = [];
    let suggested = text;

    // Regla 1: Personal (Debe comenzar con "Yo")
    if (!lower.startsWith('yo ')) {
      issues.push("Fórmula 3P requiere que empiece con 'Yo' (Personal) en tiempo presente.");
      suggested = `Yo ${suggested.charAt(0).toLowerCase() + suggested.slice(1)}`;
    }

    // Regla 2: Positivo (Evitar "no", "dejar de", "parar")
    if (lower.includes('no ') || lower.includes('dejar de') || lower.includes('evitar')) {
      issues.push("Evita redactar en negativo ('no', 'dejar de'). El subconsciente ignora la palabra 'no'. Redacta hacia el estado deseado.");
    }

    // Regla 3: Sin tibieza (Evitar "intentar", "tratar", "espero")
    if (lower.includes('intentar') || lower.includes('tratar') || lower.includes('espero') || lower.includes('quisiera')) {
      issues.push("Elimina palabras tibias como 'intentar' o 'tratar'. Actúa como un operador de élite: la meta ya es tuya.");
      suggested = suggested
        .replace(/intentar/gi, 'ejecutar')
        .replace(/tratar de/gi, '')
        .replace(/espero/gi, '')
        .replace(/quisiera/gi, '');
    }

    // Regla 4: Métrica o precisión
    const hasNumbers = /\d+/.test(text);
    if (!hasNumbers && !lower.includes('diario') && !lower.includes('excelencia')) {
      issues.push("Falta una métrica cuantitativa (ej. 85 kg, 10 clientes, 20 minutos diarios).");
    }

    if (issues.length === 0) {
      setCoachFeedback({
        critique: "¡Excelente redacción 3P! Es personal, afirmativa y contundente. Tu mente subconsciente tiene una directiva clara.",
        passed: true
      });
    } else {
      setCoachFeedback({
        critique: issues.join(' '),
        suggestedGoal: suggested.trim(),
        passed: false
      });
    }
  };

  const applySuggestion = (sug: string) => {
    haptics.success();
    onAnswersChange({ ...answers, goal: sug });
    setCoachFeedback(null);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm overflow-y-auto overscroll-contain p-3 sm:p-4 flex min-h-full items-start sm:items-center justify-center animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="surface-depth border border-white/[0.1] rounded-3xl p-5 max-w-md w-full shadow-2xl flex flex-col gap-4 my-auto max-h-[90vh] overflow-y-auto overscroll-contain touch-pan-y shrink-0"
        style={{ WebkitOverflowScrolling: 'touch' }}
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl theme-badge">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider theme-badge px-2 py-0.5 rounded-full">
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
                      ? 'theme-btn-primary font-bold'
                      : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:border-white/[0.15]'
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
              <p className="text-[11px] text-slate-400 italic">
                Ejemplo: "Yo peso 85 kg con tono muscular atlético..." o "Yo consigo mis primeros 10 clientes de pago..."
              </p>
            </div>
            <textarea
              value={answers.goal}
              onChange={(e) => {
                onAnswersChange({ ...answers, goal: e.target.value });
                if (coachFeedback) setCoachFeedback(null);
              }}
              placeholder="Yo ..."
              className="w-full bg-slate-950 border border-white/[0.08] rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-white/[0.2] h-24"
            />

            {/* Botón de Desafío del Coach (Modo Adversarial) */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleCoachGrill}
                className="text-[11px] font-bold px-3 py-1.5 rounded-xl theme-badge hover:brightness-110 flex items-center gap-1.5 transition active:scale-95"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Desafiar Redacción (Modo Coach)</span>
              </button>
            </div>

            {coachFeedback && (
              <div className={`p-3 rounded-2xl border text-xs space-y-2 ${
                coachFeedback.passed
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                  : 'bg-white/[0.03] border-white/[0.1] text-slate-200'
              }`}>
                <div className="flex items-start gap-2">
                  {coachFeedback.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div className="text-[11px] leading-relaxed">
                    {coachFeedback.critique}
                  </div>
                </div>

                {coachFeedback.suggestedGoal && (
                  <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-300 truncate italic">
                      Sugerencia: "{coachFeedback.suggestedGoal}"
                    </span>
                    <button
                      type="button"
                      onClick={() => applySuggestion(coachFeedback.suggestedGoal!)}
                      className="px-2.5 py-1 theme-btn-primary rounded-lg text-[10px] font-bold shrink-0"
                    >
                      Aplicar
                    </button>
                  </div>
                )}
              </div>
            )}
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
              className="w-full bg-slate-950 border border-white/[0.08] rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-white/[0.2] h-24"
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
              className="w-full bg-slate-950 border border-white/[0.08] rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-white/[0.2]"
            />
          </div>
        )}

        {/* Botones de navegación del Wizard */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/[0.08]">
          {step > 0 && (
            <button
              onClick={() => {
                setCoachFeedback(null);
                onStepChange(step - 1);
              }}
              className="px-4 py-2.5 rounded-xl border border-white/[0.08] text-slate-400 hover:text-white text-xs font-semibold"
            >
              Atrás
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => {
                setCoachFeedback(null);
                onStepChange(step + 1);
              }}
              className="flex-1 py-2.5 rounded-xl theme-btn-primary font-bold text-xs transition"
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
              className="flex-1 py-2.5 rounded-xl theme-btn-primary font-bold text-xs shadow-lg transition"
            >
              ✨ Guardar en mi Vision Board
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
