import React from 'react';
import { Volume2, VolumeX, Pause, Play, Check } from 'lucide-react';
import type { Habit } from '../types';

interface BreathingModalProps {
  habit: Habit | null;
  isRunning: boolean;
  phase: 'inhale' | 'hold' | 'exhale' | 'hold_empty';
  secondsLeft: number;
  totalSeconds: number;
  completedRounds: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onToggleRunning: () => void;
  onComplete: () => void;
  onClose: () => void;
  cleanTitle: (title: string) => string;
}

export const BreathingModal: React.FC<BreathingModalProps> = ({
  habit,
  isRunning,
  phase,
  secondsLeft,
  totalSeconds,
  completedRounds,
  soundEnabled,
  onToggleSound,
  onToggleRunning,
  onComplete,
  onClose,
  cleanTitle
}) => {
  if (!habit) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Botones de control superior (Audio y Cerrar) */}
        <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-full transition ${
              soundEnabled ? 'text-indigo-400 bg-indigo-950/80' : 'text-slate-500 hover:text-slate-300'
            }`}
            title={soundEnabled ? "Silenciar campana de respiración" : "Activar campana tibetana suave"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800/60 transition"
          >
            ✕
          </button>
        </div>

        {/* Cabecera y Técnica */}
        <div className="mb-4">
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded-full border border-indigo-800/50">
            Guía Visual Rítmica
          </span>
          <h3 className="text-base font-bold text-white mt-2">
            {cleanTitle(habit.title)}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Sigue la expansión de la esfera. Inhala profundamente por la nariz y exhala por la boca.
          </p>
        </div>

        {/* Orbe Visual de Respiración con Animaciones de Escala y Resplandor */}
        <div className="my-6 relative flex items-center justify-center w-56 h-56">
          {/* Círculo de onda expansiva */}
          <div 
            className={`absolute inset-0 rounded-full border-2 border-indigo-500/30 transition-all duration-1000 ${
              isRunning && phase === 'inhale' ? 'animate-breathe-ripple scale-125 opacity-70' : 'scale-90 opacity-20'
            }`} 
          />
          
          {/* Esfera central interactiva */}
          <div 
            className={`w-36 h-36 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-1000 ease-in-out ${
              phase === 'inhale'
                ? 'scale-125 bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-800 shadow-indigo-500/50'
                : phase === 'hold'
                ? 'scale-125 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 shadow-amber-500/50'
                : phase === 'exhale'
                ? 'scale-90 bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 shadow-teal-500/40'
                : 'scale-85 bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 shadow-slate-700/30 border border-slate-700'
            }`}
          >
            <span className="text-xs font-black uppercase tracking-wider text-white">
              {phase === 'inhale' && 'Inhala'}
              {phase === 'hold' && 'Retén'}
              {phase === 'exhale' && 'Exhala'}
              {phase === 'hold_empty' && 'Pausa'}
            </span>
            <span className="text-3xl font-black font-mono text-white mt-0.5">
              {secondsLeft}s
            </span>
          </div>
        </div>

        {/* Progreso de la sesión y rondas */}
        <div className="w-full bg-slate-950 p-3 rounded-2xl border border-slate-800/80 mb-5 flex items-center justify-between text-xs">
          <div className="text-left">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Tiempo restante</span>
            <span className="font-mono font-bold text-white">
              {Math.floor(totalSeconds / 60)}:{(totalSeconds % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Ciclos completados</span>
            <span className="font-mono font-bold text-indigo-400">
              {completedRounds} rondas
            </span>
          </div>
        </div>

        {/* Controles del Entrenador */}
        <div className="flex items-center gap-2 w-full">
          <button
            onClick={onToggleRunning}
            className={`flex-1 font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{isRunning ? 'Pausar Guía' : 'Reanudar Guía'}</span>
          </button>

          <button
            onClick={onComplete}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-3 rounded-xl transition flex items-center gap-1.5 shadow-md active:scale-95 shrink-0"
            title="Marcar como cumplido ahora"
          >
            <Check className="w-4 h-4" />
            <span>Listo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
