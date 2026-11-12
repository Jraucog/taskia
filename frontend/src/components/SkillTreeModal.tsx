import React from 'react';
import { 
  X, Award, Shield, Zap, Sparkles, Brain, Dumbbell, Compass, Flame 
} from 'lucide-react';
import type { SkillTreeProfile } from '../services/skillTreeService';
import { haptics } from '../services/haptics';

interface SkillTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: SkillTreeProfile;
  userName?: string;
}

export const SkillTreeModal: React.FC<SkillTreeModalProps> = ({
  isOpen,
  onClose,
  profile,
  userName = 'Operador'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="mastery-modal-card relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Glow ambient background */}
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header con botón de cierre */}
        <div className="relative z-10 flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
              <Award className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold block">
                Sistema RPG de Maestría
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">
                Árbol de Habilidades
              </h2>
            </div>
          </div>

          <button
            onClick={() => { haptics.tap(); onClose(); }}
            className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner de Nivel y Rango */}
        <div className="relative z-10 my-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-950/90 via-slate-900 to-indigo-950/90 border border-indigo-600/30 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 text-xs font-mono font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Nivel {profile.level}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide">
            {profile.title}
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Perfil de <span className="text-indigo-300 font-semibold">{userName}</span> &bull; {profile.totalXP.toLocaleString()} XP acumulada
          </p>

          {/* Barra de progreso de nivel */}
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>{profile.currentLevelXP} XP</span>
              <span className="text-indigo-300 font-bold">{profile.progressPercent}%</span>
              <span>{profile.nextLevelXP} XP para Nivel {profile.level + 1}</span>
            </div>
            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${profile.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Los 4 Pilares de Atributos */}
        <div className="relative z-10 space-y-3 my-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Atributos de Rendimiento</span>
          </h4>

          {/* 1. Vitalidad & Fuerza */}
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-rose-500/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-bold text-white">Fuerza & Vitalidad</span>
                <span className="font-mono font-bold text-rose-400">{profile.attributes.physical}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-rose-500 to-orange-400 rounded-full transition-all duration-500"
                  style={{ width: `${profile.attributes.physical}%` }}
                />
              </div>
            </div>
          </div>

          {/* 2. Cognición & Foco */}
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-cyan-500/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-bold text-white">Cognición & Foco Profundo</span>
                <span className="font-mono font-bold text-cyan-400">{profile.attributes.cognitive}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-400 rounded-full transition-all duration-500"
                  style={{ width: `${profile.attributes.cognitive}%` }}
                />
              </div>
            </div>
          </div>

          {/* 3. Zen & Regulación */}
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-emerald-500/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-bold text-white">Zen & Calma Vagal</span>
                <span className="font-mono font-bold text-emerald-400">{profile.attributes.zen}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${profile.attributes.zen}%` }}
                />
              </div>
            </div>
          </div>

          {/* 4. Disciplina & Voluntad */}
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-purple-500/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-bold text-white">Disciplina & Voluntad Inquebrantable</span>
                <span className="font-mono font-bold text-purple-400">{profile.attributes.discipline}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-500"
                  style={{ width: `${profile.attributes.discipline}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Resumen rápido de rachas y métricas */}
        <div className="relative z-10 grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800">
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1 text-orange-400 mb-0.5">
              <Flame className="w-4 h-4" />
              <span className="text-lg font-black font-mono">{profile.streakDays}</span>
            </div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Días de Racha</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-400 mb-0.5">
              <Sparkles className="w-4 h-4" />
              <span className="text-lg font-black font-mono">{profile.habitsCompletedToday}</span>
            </div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Completados Hoy</span>
          </div>
        </div>
      </div>
    </div>
  );
};
