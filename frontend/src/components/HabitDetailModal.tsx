import React from 'react';
import { 
  Clock, Target, BookOpen, Wind, Timer, Edit3, Trash2, Minus, Plus, Check, Users, Sparkles 
} from 'lucide-react';
import type { Habit } from '../types';

interface HabitDetailModalProps {
  habit: Habit | null;
  restTimer: number | null;
  onClose: () => void;
  onShowGoalsModal: () => void;
  onStartBreathingSession: (habit: Habit) => void;
  onStartAnkiSession?: (habit: Habit) => void;
  onSetRestTimer: (seconds: number) => void;
  onOpenEditHabitModal: (habit: Habit) => void;
  onOpenShareModal: (habit: Habit) => void;
  onDeleteHabit: (habitId: number, title: string) => void;
  onLogSeriesStep: (habitId: number, step: number) => void;
  onToggleHabit: (habit: Habit) => void;
  getPlanNameFromHabit: (habit: Habit) => string;
  cleanTitle: (title: string) => string;
}

export const HabitDetailModal: React.FC<HabitDetailModalProps> = ({
  habit,
  restTimer,
  onClose,
  onShowGoalsModal,
  onStartBreathingSession,
  onStartAnkiSession,
  onSetRestTimer,
  onOpenEditHabitModal,
  onOpenShareModal,
  onDeleteHabit,
  onLogSeriesStep,
  onToggleHabit,
  getPlanNameFromHabit,
  cleanTitle
}) => {
  if (!habit) return null;

  const isTrx = habit.unit === 'series' || 
    habit.title.toLowerCase().includes('trx') || 
    habit.title.toLowerCase().includes('sentadilla') || 
    habit.title.toLowerCase().includes('talón') || 
    habit.title.toLowerCase().includes('aquiles');

  const isBrianTracy = habit.title.toLowerCase().includes('brian tracy');

  const isBreathing = habit.title.toLowerCase().includes('respir') || 
    habit.title.toLowerCase().includes('suspiro') || 
    habit.title.toLowerCase().includes('coherencia') || 
    habit.title.toLowerCase().includes('4-7-8');

  const isAnki = habit.title.toLowerCase().includes('anki') || 
    habit.title.toLowerCase().includes('flashcard') || 
    habit.title.toLowerCase().includes('inglés') || 
    habit.title.toLowerCase().includes('ingles') || 
    habit.title.toLowerCase().includes('vocabulario');

  const isWater = habit.title.toLowerCase().includes('agua');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto relative">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800/80 transition z-10"
        >
          ✕
        </button>

        {/* Cabecera de la Tarea */}
        <div className="pb-3 border-b border-slate-800/80">
          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-800/50">
            {getPlanNameFromHabit(habit)}
          </span>
          <h3 className="text-base sm:text-lg font-bold text-white mt-2 leading-snug">
            {cleanTitle(habit.title)}
          </h3>
          {habit.description && (
            <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
              💡 {habit.description}
            </p>
          )}
        </div>

        {/* Panel de Métricas y Meta de la Tarea con Tiempo Estimado */}
        <div className="grid grid-cols-4 gap-2 my-3">
          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800 text-center">
            <span className="text-[9px] text-slate-400 uppercase font-bold block">Estimado</span>
            <span className="text-xs font-black text-indigo-300 font-mono flex items-center justify-center gap-0.5 mt-0.5">
              <Clock className="w-3 h-3 text-indigo-400" />
              <span>{habit.estimated_minutes ?? 5} min</span>
            </span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Meta diaria</span>
            <span className="text-sm font-black text-amber-400 font-mono">
              {habit.target_value} {habit.unit || 'vez'}
            </span>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Progreso Hoy</span>
            <span className="text-sm font-black text-indigo-400 font-mono">
              {habit.today_log?.value ?? 0} {habit.unit || ''}
            </span>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">SLA 7 Días</span>
            <span className={`text-sm font-black font-mono ${habit.compliance_summary.meets_sla ? 'text-emerald-400' : 'text-amber-400'}`}>
              {habit.compliance_summary.rate_percent}%
            </span>
          </div>
        </div>

        {/* Guía Técnica Específica de Ejecución según disciplina */}
        <div className="space-y-3 mb-4 flex-1">
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-indigo-400" />
            <span>Instrucciones de Ejecución y Técnica</span>
          </h4>

          {/* Si es ejercicio de fuerza / TRX / Calistenia */}
          {isTrx && (
            <div className="space-y-2 text-xs text-slate-300">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <span>⏱️</span> <strong>Tempo y Control Muscular:</strong>
                </p>
                <p className="text-[11px] text-slate-400">
                  Ejecuta la fase excéntrica (bajada) en <strong>3-4 segundos lentos y controlados</strong>. Pausa isométrica de 1 segundo abajo y empuje potente hacia arriba. Esto protege tendones como el Aquiles y maximiza la hipertrofia funcional.
                </p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <span>🧠</span> <strong>Enfoque de Conexión Mente-Músculo:</strong>
                </p>
                <p className="text-[11px] text-slate-400">
                  Mantén el core apretado, respiración fluida (exhala al hacer la fuerza) y asegúrate de no compensar con la otra pierna o la espalda baja.
                </p>
              </div>
            </div>
          )}

          {/* Si es de Brian Tracy (escritura de 10 metas) */}
          {isBrianTracy && (
            <div className="space-y-2 text-xs text-slate-300">
              <div className="bg-amber-950/30 p-3 rounded-xl border border-amber-800/50 space-y-1.5">
                <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <span>✍️</span> <strong>Fórmula 3P (Presente, Positiva, Personal):</strong>
                </p>
                <p className="text-[11px] text-amber-200/80">
                  Escribe tus 10 metas comenzando con "Yo gano...", "Yo peso...", "Yo conduzco...". Redacta siempre en presente como si ya fuese una realidad consolidada.
                </p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <span>📖</span> <strong>Regla de Oro del Reto:</strong>
                </p>
                <p className="text-[11px] text-slate-400">
                  Tapa la hoja del día anterior. Deja que tu mente filtre las metas verdaderamente prioritarias. Si un día se olvida, el ciclo se reinicia a 0.
                </p>
              </div>

              <button
                onClick={onShowGoalsModal}
                className="w-full bg-amber-950/60 hover:bg-amber-950 border border-amber-700/60 text-amber-300 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Ver Mis 10 Metas Oficiales de Referencia</span>
              </button>
            </div>
          )}

          {/* Si es de Respiración */}
          {isBreathing && (
            <div className="space-y-2 text-xs text-slate-300">
              <div className="bg-indigo-950/30 p-3 rounded-xl border border-indigo-800/50 space-y-1.5">
                <p className="font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5" /> <strong>Protocolo de Regulación del Cortisol:</strong>
                </p>
                <p className="text-[11px] text-indigo-200/80">
                  Inhala profundamente por la nariz expandiendo el diafragma y la caja torácica. Exhala largo y relajado por la boca. Activa inmediatamente el tono vagal parasimpático.
                </p>
              </div>

              <button
                onClick={() => onStartBreathingSession(habit)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition active:scale-95"
              >
                <Wind className="w-4 h-4 animate-pulse" />
                <span>Lanzar Entrenador Visual Interactivo</span>
              </button>
            </div>
          )}

          {/* Si es de Inglés / Flashcards Método Anki */}
          {isAnki && (
            <div className="space-y-2 text-xs text-slate-300">
              <div className="bg-amber-950/30 p-3 rounded-xl border border-amber-800/50 space-y-1.5">
                <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> <strong>Método Anki (Active Recall & SRS):</strong>
                </p>
                <p className="text-[11px] text-amber-200/80">
                  Prueba evocar mentalmente el significado de la palabra y pronunciar en voz alta antes de girar la tarjeta. La repetición espaciada traslada los patrones al subconsciente.
                </p>
              </div>

              {onStartAnkiSession && (
                <button
                  onClick={() => onStartAnkiSession(habit)}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition active:scale-95"
                >
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>Abrir Entrenador Interactivo de Flashcards</span>
                </button>
              )}
            </div>
          )}

          {/* Si es de Agua / Hidratación */}
          {isWater && (
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-1 text-xs">
              <p className="font-semibold text-white">💧 Estrategia de Ingesta:</p>
              <p className="text-[11px] text-slate-400">
                Bebe un vaso de 500ml nada más despertar con una pizca de sal marina. El resto distribúyelo cada 2 horas antes de las 19:00 para no interrumpir el descanso nocturno.
              </p>
            </div>
          )}

          {/* Temporizador de Descanso Rápido entre Series */}
          {habit.unit === 'series' && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Descanso entre Series</span>
                  <span className="text-[10px] text-slate-400">
                    {restTimer ? `Restante: ${restTimer}s` : 'Listo para la siguiente'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onSetRestTimer(45)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-slate-200 transition"
                >
                  45s
                </button>
                <button
                  onClick={() => onSetRestTimer(60)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-slate-200 transition"
                >
                  60s
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Acciones de Gestión (Editar / Eliminar Hábito) */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-800/60 mb-2">
          <span className="text-[11px] text-slate-400">Administración de la tarea:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenShareModal(habit)}
              className="px-2.5 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 font-semibold text-xs flex items-center gap-1.5 transition"
              title="Compartir con otro usuario (ej. lista de compras, metas en común)"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Compartir {habit.is_shared ? `(${habit.shared_with_usernames?.length || 0})` : ''}</span>
            </button>
            <button
              onClick={() => onOpenEditHabitModal(habit)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold text-xs flex items-center gap-1.5 transition"
              title="Editar parámetros, metas o textos de esta tarea"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Editar</span>
            </button>
            <button
              onClick={() => onDeleteHabit(habit.id, habit.title)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/70 text-red-400 hover:text-red-300 font-semibold text-xs flex items-center gap-1.5 transition"
              title="Eliminar esta tarea"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar</span>
            </button>
          </div>
        </div>

        {/* Acciones de Ejecución de la Tarea en el Modal */}
        <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
          {habit.unit === 'series' || habit.habit_type === 'numeric' ? (
            <div className="flex items-center justify-between w-full gap-2">
              <button
                onClick={() => onLogSeriesStep(habit.id, -1)}
                disabled={(habit.today_log?.value ?? 0) <= 0}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
              >
                <Minus className="w-4 h-4" />
              </button>

              <button
                onClick={() => onLogSeriesStep(habit.id, 1)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar +1 Serie (45s descanso)</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onToggleHabit(habit);
                onClose();
              }}
              className={`w-full font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md active:scale-95 ${
                habit.today_log?.completed
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-900/60'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {habit.today_log?.completed ? 'Completado (Desmarcar)' : 'Marcar como Completado Hoy'}
              </span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
