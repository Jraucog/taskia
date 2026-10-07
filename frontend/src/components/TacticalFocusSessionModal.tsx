import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, Check, SkipForward, 
  Wind, Plus, Minus, X, VolumeX, Sparkles
} from 'lucide-react';
import type { Habit } from '../types';
import { ambientSound, type AmbientSoundscapeType } from '../services/soundscape';
import { haptics } from '../services/haptics';

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
  const [ambientActive, setAmbientActive] = useState(false);
  const [soundscapeMode, setSoundscapeMode] = useState<AmbientSoundscapeType>('528hz');

  // Asegurar que el índice esté dentro de los límites
  useEffect(() => {
    if (currentIndex >= queue.length) {
      setCurrentIndex(Math.max(0, queue.length - 1));
    }
  }, [queue.length, currentIndex]);

  // Manejo de sonido ambiental offline
  useEffect(() => {
    if (!isOpen) {
      if (ambientActive) {
        ambientSound.stop();
        setAmbientActive(false);
      }
    }
  }, [isOpen]);

  const toggleAmbientSound = () => {
    haptics.selection();
    if (ambientActive) {
      ambientSound.stop();
      setAmbientActive(false);
    } else {
      ambientSound.start(soundscapeMode);
      setAmbientActive(true);
    }
  };

  const cycleSoundscape = () => {
    haptics.tap();
    const modes: AmbientSoundscapeType[] = ['528hz', 'binaural_alpha', 'deep_zen'];
    const nextIdx = (modes.indexOf(soundscapeMode) + 1) % modes.length;
    const nextMode = modes[nextIdx];
    setSoundscapeMode(nextMode);
    if (ambientActive) {
      ambientSound.start(nextMode);
    }
  };

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

            <div className="flex items-center gap-1.5">
              {/* Selector de Paisaje Sonoro Offline (528Hz / Binaural / Zen) */}
              <button
                type="button"
                onClick={cycleSoundscape}
                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold font-mono transition flex items-center gap-1 border min-h-[44px] ${
                  ambientActive
                    ? 'bg-indigo-950/90 text-indigo-300 border-indigo-700/80 shadow-sm shadow-indigo-500/20'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-white'
                }`}
                title="Cambiar frecuencia armónica"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>
                  {soundscapeMode === '528hz' ? '528Hz Foco' : soundscapeMode === 'binaural_alpha' ? 'Alfa 10Hz' : 'Zen 432Hz'}
                </span>
              </button>

              {/* Botón Play / Silencio Sonido Ambiental */}
              <button
                type="button"
                onClick={toggleAmbientSound}
                className={`p-2 rounded-xl border transition min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  ambientActive
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-white'
                }`}
                title={ambientActive ? "Silenciar audio ambiental de enfoque" : "Activar paisaje sonoro 528Hz offline"}
              >
                {ambientActive ? (
                  <div className="flex items-center gap-0.5">
                    <span className="w-1 bg-emerald-400 rounded-full animate-sound-wave-1 inline-block" />
                    <span className="w-1 bg-emerald-400 rounded-full animate-sound-wave-2 inline-block" />
                    <span className="w-1 bg-emerald-400 rounded-full animate-sound-wave-3 inline-block" />
                  </div>
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  haptics.tap();
                  if (ambientActive) ambientSound.stop();
                  onClose();
                }}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Salir del modo enfoque"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
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
            <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  haptics.tap();
                  onLogSeriesStep(currentHabit.id, -1);
                }}
                disabled={currentVal <= 0}
                className="w-12 h-12 rounded-xl bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 transition flex items-center justify-center active:scale-95"
                title="Restar serie"
              >
                <Minus className="w-5 h-5" />
              </button>
              <div className="px-4">
                <span className="text-xl font-black font-mono text-white block">
                  {currentVal} / {targetVal}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Series</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  haptics.success();
                  onLogSeriesStep(currentHabit.id, 1);
                }}
                className="w-12 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-md shadow-indigo-600/30 flex items-center justify-center active:scale-95"
                title="Sumar serie"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          ) : isBreathing ? (
            <button
              type="button"
              onClick={() => {
                haptics.tap();
                if (ambientActive) ambientSound.stop();
                onClose();
                onStartBreathing(currentHabit);
              }}
              className="bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/80 text-indigo-200 font-bold text-xs px-5 min-h-[48px] rounded-2xl transition flex items-center gap-2 shadow-sm animate-pulse active:scale-95"
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
              haptics.tap();
              if (currentIndex < queue.length - 1) {
                setCurrentIndex(i => i + 1);
              } else {
                setCurrentIndex(0);
              }
            }}
            className="min-h-[48px] px-4 rounded-2xl border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
          >
            <SkipForward className="w-4 h-4" />
            <span>Saltar Tarea</span>
          </button>

          <button
            type="button"
            onClick={() => {
              haptics.success();
              handleCompleteCurrent();
            }}
            className={`flex-1 min-h-[48px] px-5 rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 shadow-xl active:scale-95 ${
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
