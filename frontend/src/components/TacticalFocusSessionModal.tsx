import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, Check, SkipForward, 
  Wind, Plus, Minus, X
} from 'lucide-react';
import type { Habit } from '../types';

interface TacticalFocusSessionModalProps {
  isOpen: boolean;
  habits: Habit[];
  onClose: () => void;
  onToggleHabit: (habit: Habit) => void;
  onLogSeriesStep: (habitId: number, stepDelta: number) => void;
  onStartBreathing: (habit: Habit) => void;
  cleanTitle: (title: string) => string;
}

export const TacticalFocusSessionModal: React.FC<TacticalFocusSessionModalProps> = ({
  isOpen,
  habits,
  onClose,
  onToggleHabit,
  onLogSeriesStep,
  onStartBreathing,
  cleanTitle
}) => {
  // Filtrar pendientes primero, o todos si todo está completado
  const pendingHabits = habits.filter(h => !h.today_log?.completed);
  const queue = pendingHabits.length > 0 ? pendingHabits : habits;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);

  // Asegurar que el índice esté dentro de los límites
  useEffect(() => {
    if (currentIndex >= queue.length) {
      setCurrentIndex(Math.max(0, queue.length - 1));
    }
  }, [queue.length, currentIndex]);

  const currentHabit = queue[currentIndex];

  // Temporizador de enfoque por tarea
  useEffect(() => {
    let interval: any = null;
    if (isOpen && timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, timerRunning]);

  // Reset del timer al cambiar de tarea
  useEffect(() => {
    setTimerSeconds(0);
    setTimerRunning(true);
  }, [currentIndex]);

  if (!isOpen || !currentHabit) return null;

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isCompleted = !!currentHabit.today_log?.completed;
  const currentVal = currentHabit.today_log?.value ?? 0;
  const targetVal = currentHabit.target_value;

  const isBreathing = currentHabit.title.toLowerCase().includes('respir') ||
    currentHabit.title.toLowerCase().includes('suspiro') ||
    currentHabit.title.toLowerCase().includes('coherencia') ||
    currentHabit.title.toLowerCase().includes('4-7-8') ||
    currentHabit.title.toLowerCase().includes('box');

  const handleCompleteCurrent = () => {
    if (!isCompleted) {
      onToggleHabit(currentHabit);
    }
    // Si quedan más en la cola, avanzar
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const progressPercent = queue.length > 0
    ? Math.round((queue.filter(h => h.today_log?.completed).length / queue.length) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 max-w-lg w-full flex flex-col justify-between shadow-2xl relative overflow-hidden min-h-[520px]">
        {/* Glow de fondo ambiental */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Cabecera de la Estación de Enfoque */}
        <div className="relative z-10">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                  Modo Enfoque Táctico
                </span>
                <h3 className="text-xs text-slate-400">
                  Tarea {currentIndex + 1} de {queue.length} ({progressPercent}% sesión)
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800/80 transition"
              title="Salir del modo enfoque"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Barra de progreso de la sesión */}
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-3">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Cuerpo Principal: Tarjeta Central de la Tarea Activa */}
        <div className="relative z-10 py-6 flex flex-col items-center text-center space-y-4">
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300">
            {currentHabit.unit === 'series' ? 'Entrenamiento por Series' : isBreathing ? 'Regulación Autónoma' : 'Ejecución Diaria'}
          </span>

          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight max-w-md">
            {cleanTitle(currentHabit.title)}
          </h2>

          {currentHabit.description && (
            <p className="text-xs sm:text-sm text-slate-300 bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 max-w-sm leading-relaxed">
              💡 {currentHabit.description}
            </p>
          )}

          {/* Cronómetro de Foco en vivo */}
          <div className="flex flex-col items-center gap-1.5 py-2">
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-amber-400 bg-slate-950 border border-slate-800 px-5 py-2 rounded-2xl shadow-inner">
              {formatTimer(timerSeconds)}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTimerRunning(!timerRunning)}
                className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded-lg bg-slate-800 flex items-center gap-1 transition"
              >
                {timerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{timerRunning ? 'Pausar' : 'Reanudar'}</span>
              </button>
              <button
                type="button"
                onClick={() => setTimerSeconds(0)}
                className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded-lg bg-slate-800 flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Controles interactivos específicos para series / respiración */}
          {currentHabit.unit === 'series' || currentHabit.habit_type === 'numeric' ? (
            <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => onLogSeriesStep(currentHabit.id, -1)}
                disabled={currentVal <= 0}
                className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="px-3">
                <span className="text-lg font-black font-mono text-white block">
                  {currentVal} / {targetVal}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Series</span>
              </div>
              <button
                type="button"
                onClick={() => onLogSeriesStep(currentHabit.id, 1)}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-md shadow-indigo-600/30"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : isBreathing ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartBreathing(currentHabit);
              }}
              className="bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/80 text-indigo-200 font-bold text-xs px-4 py-2.5 rounded-2xl transition flex items-center gap-2 shadow-sm animate-pulse"
            >
              <Wind className="w-4 h-4 text-indigo-400" />
              <span>Abrir Guía Rítmica 528Hz</span>
            </button>
          ) : null}
        </div>

        {/* Acciones Inferiores: Marcar Hecho y Pasar a la Siguiente */}
        <div className="relative z-10 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (currentIndex < queue.length - 1) {
                setCurrentIndex(i => i + 1);
              } else {
                setCurrentIndex(0);
              }
            }}
            className="py-3 px-4 rounded-2xl border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <SkipForward className="w-4 h-4" />
            <span>Saltar Tarea</span>
          </button>

          <button
            type="button"
            onClick={handleCompleteCurrent}
            className={`flex-1 py-3 px-5 rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 shadow-xl active:scale-95 ${
              isCompleted
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white shadow-emerald-600/25'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{isCompleted ? 'Completado ✓ Siguiente' : '¡Tarea Cumplida!'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
