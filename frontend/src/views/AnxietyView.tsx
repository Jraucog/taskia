import { useState, useEffect } from 'react';
import { 
  Brain, ShieldAlert, Sparkles, Palette, Compass, Activity, 
  Wind, Heart, ArrowRight, Plus, History
} from 'lucide-react';
import type { Habit } from '../types';
import { 
  getTodayAnxietyLog, 
  getLatestAssessment, 
  getDailyAnxietyLogs,
  getZenSessionsHistory,
  type DailyAnxietyLog, 
  type AnxietyAssessmentResult,
  type ZenSessionRecord
} from '../services/anxietyService';
import { AnxietyCorrelationCard } from '../components/anxiety/AnxietyCorrelationCard';
import { haptics } from '../services/haptics';

interface AnxietyViewProps {
  habits?: Habit[];
  onOpenCheckIn: () => void;
  onOpenAssessment: () => void;
  onOpenBubblePop: () => void;
  onOpenColorHarmony: () => void;
  onOpenZenTracing: () => void;
  onOpenSOSGrounding: () => void;
  onOpenBreathing?: () => void;
}

export const AnxietyView: React.FC<AnxietyViewProps> = ({
  habits = [],
  onOpenCheckIn,
  onOpenAssessment,
  onOpenBubblePop,
  onOpenColorHarmony,
  onOpenZenTracing,
  onOpenSOSGrounding,
  onOpenBreathing,
}) => {
  const [todayLog, setTodayLog] = useState<DailyAnxietyLog | null>(null);
  const [latestAssessment, setLatestAssessment] = useState<AnxietyAssessmentResult | null>(null);
  const [recentLogs, setRecentLogs] = useState<DailyAnxietyLog[]>([]);
  const [zenSessions, setZenSessions] = useState<ZenSessionRecord[]>([]);

  const reloadData = () => {
    setTodayLog(getTodayAnxietyLog());
    setLatestAssessment(getLatestAssessment());
    setRecentLogs(getDailyAnxietyLogs().slice(0, 7));
    setZenSessions(getZenSessionsHistory().slice(0, 5));
  };

  useEffect(() => {
    reloadData();
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto px-3 sm:px-4 py-4 pb-28 text-left space-y-5 animate-fade-in">
      {/* 1. HERO HEADER */}
      <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 p-5 rounded-3xl border border-indigo-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300">
              <Brain className="w-5 h-5" />
            </span>
            <span className="text-[11px] uppercase tracking-widest font-black text-indigo-400 bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-800/60">
              Impulse Neuro-Calm
            </span>
          </div>

          {/* Botón SOS Pánico Inmediato */}
          <button
            onClick={() => {
              haptics.impact();
              onOpenSOSGrounding();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/90 hover:bg-red-900 border border-red-600/70 text-red-300 text-xs font-bold transition shadow-lg shadow-red-950/50 active:scale-95 animate-pulse"
          >
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>SOS Pánico</span>
          </button>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Gestión de Ansiedad & Calma Mental
        </h2>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-md">
          Herramientas psicofisiológicas para desarmar la rumiación mental, regular el sistema nervioso y elevar tu resiliencia ante el estrés.
        </p>

        {/* Tarjeta Rápida de Estado Hoy */}
        <div className="mt-4 pt-3 border-t border-white/[0.08] grid grid-cols-2 gap-2.5">
          {/* Check-In Diario */}
          <button
            onClick={() => { haptics.tap(); onOpenCheckIn(); }}
            className="surface-depth surface-interactive p-3.5 rounded-2xl text-left group active:scale-95"
          >
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Check-In Hoy</span>
            {todayLog ? (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-lg font-black font-mono text-teal-400">
                  {todayLog.score}/10
                </span>
                <span className="text-[11px] text-teal-200 font-medium truncate">
                  {todayLog.score <= 3 ? 'Calma' : todayLog.score <= 6 ? 'Inquietud' : 'Tensión'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs font-bold text-indigo-400 mt-1">
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar (10s)</span>
              </div>
            )}
          </button>

          {/* Test Psicométrico GAD-7 */}
          <button
            onClick={() => { haptics.tap(); onOpenAssessment(); }}
            className="surface-depth surface-interactive p-3.5 rounded-2xl text-left group active:scale-95"
          >
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Test GAD-7</span>
            {latestAssessment ? (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-lg font-black font-mono text-indigo-400">
                  {latestAssessment.rawScore} pts
                </span>
                <span className="text-[11px] text-indigo-200 font-medium truncate">
                  {latestAssessment.severity === 'minimal' ? 'Mínima' : latestAssessment.severity === 'mild' ? 'Leve' : 'Alerta'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs font-bold text-teal-400 mt-1">
                <Activity className="w-3.5 h-3.5" />
                <span>Evaluar ahora</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Tarjeta de Correlación Neurobiológica: Hábitos vs Ansiedad */}
      <AnxietyCorrelationCard habits={habits} />

      {/* 2. JUEGOS COGNITIVOS RELAJANTES (IMPULSE CALMING GAMES) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-950/80 text-teal-400 border border-teal-800/40">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Juegos Anti-Ansiedad (Impulse Zen)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Estimulación Sensorial</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Juego 1: Zen Bubble Pop */}
          <button
            onClick={() => { haptics.tap(); onOpenBubblePop(); }}
            className="surface-depth surface-interactive p-4 rounded-2xl border border-teal-500/30 text-left group active:scale-95 relative overflow-hidden"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-950/80 border border-teal-500/50 flex items-center justify-center text-teal-300 mb-2 group-hover:scale-110 transition">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white group-hover:text-teal-300 transition">
              Zen Bubble Pop
            </h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              Integra afirmaciones positivas y calma con vibración y arpa 528Hz.
            </p>
          </button>

          {/* Juego 2: Color Harmony Flow */}
          <button
            onClick={() => { haptics.tap(); onOpenColorHarmony(); }}
            className="surface-depth surface-interactive p-4 rounded-2xl border border-violet-500/30 text-left group active:scale-95 relative overflow-hidden"
          >
            <div className="w-8 h-8 rounded-xl bg-violet-950/80 border border-violet-500/50 flex items-center justify-center text-violet-300 mb-2 group-hover:scale-110 transition">
              <Palette className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white group-hover:text-violet-300 transition">
              Color Harmony
            </h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              Ordena gradientes de color suaves para relajar la corteza visual.
            </p>
          </button>

          {/* Juego 3: Zen Path Tracing */}
          <button
            onClick={() => { haptics.tap(); onOpenZenTracing(); }}
            className="surface-depth surface-interactive p-4 rounded-2xl border border-cyan-500/30 text-left group active:scale-95 relative overflow-hidden"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-300 mb-2 group-hover:scale-110 transition">
              <Compass className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition">
              Zen Path Tracing
            </h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              Trazado infinito continuo con resonancia alfa de 432Hz.
            </p>
          </button>
        </div>
      </div>

      {/* 3. PROTOCOLOS SOS & HERRAMIENTAS SOMÁTICAS */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-red-950/80 text-red-400 border border-red-800/40">
            <Heart className="w-4 h-4" />
          </span>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Herramientas Tácticas de Intervención
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Grounding 5-4-3-2-1 */}
          <button
            onClick={() => { haptics.tap(); onOpenSOSGrounding(); }}
            className="surface-depth surface-interactive p-4 rounded-2xl text-left flex items-center justify-between group active:scale-95"
          >
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-500/60 flex items-center justify-center text-blue-300 shrink-0">
                <Wind className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition">
                  Grounding 5-4-3-2-1
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Aterrizaje sensorial para disipar el pánico y la desrealización.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition shrink-0 ml-2" />
          </button>

          {/* Suspiro Fisiológico de Huberman */}
          <button
            onClick={() => {
              haptics.tap();
              if (onOpenBreathing) onOpenBreathing();
              else onOpenSOSGrounding();
            }}
            className="surface-depth surface-interactive p-4 rounded-2xl text-left flex items-center justify-between group active:scale-95"
          >
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-teal-950/80 border border-teal-500/60 flex items-center justify-center text-teal-300 shrink-0">
                <Activity className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-teal-300 transition">
                  Suspiro Fisiológico
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Doble inhalación nasal rápida para colapsar picos de taquicardia.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition shrink-0 ml-2" />
          </button>
        </div>
      </div>

      {/* 4. HISTORIAL Y TENDENCIAS SEMANALES */}
      <div className="bg-slate-950/80 p-4 rounded-3xl border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Historial de Calma & Sesiones
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Últimos Registros</span>
        </div>

        {recentLogs.length > 0 ? (
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div 
                key={log.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-300">{log.date}</span>
                    <span className="text-[10px] text-slate-500">({log.trigger})</span>
                  </div>
                  {log.symptoms.length > 0 && (
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {log.symptoms.slice(0, 2).join(', ')}{log.symptoms.length > 2 ? '...' : ''}
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className={`font-mono font-bold px-2 py-0.5 rounded-md border text-[11px] ${
                    log.score <= 3 
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50'
                      : log.score <= 6 
                      ? 'bg-amber-950/80 text-amber-300 border-amber-800/50'
                      : 'bg-rose-950/80 text-rose-300 border-rose-800/50'
                  }`}>
                    {log.score}/10
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-slate-500">
            Aún no has registrado check-ins diarios. Haz uno hoy para ver tu tendencia de serenidad.
          </div>
        )}

        {/* Micro-Sesiones Zen Completadas */}
        {zenSessions.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-2">
              Micro-Sesiones Zen Realizadas ({zenSessions.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {zenSessions.map((s) => (
                <span 
                  key={s.id}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-teal-300 font-mono flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-2.5 h-2.5 text-teal-400" />
                  <span>
                    {s.gameType === 'bubble_pop' ? 'Bubble Pop' : s.gameType === 'color_flow' ? 'Color Flow' : s.gameType === 'zen_trace' ? 'Zen Trace' : 'Grounding'}
                  </span>
                  <span className="text-slate-500">({s.durationSeconds}s)</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
