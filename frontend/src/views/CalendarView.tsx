import React, { useState } from 'react';
import { Calendar, Flame, Award, TrendingUp, ChevronDown, Info } from 'lucide-react';
import type { Habit, MetricsSummary, Badge } from '../types';

interface CalendarViewProps {
  habits: Habit[];
  metrics: MetricsSummary | null;
  streakData: { current: number; best: number };
  badges: Badge[];
  earnedBadgesCount: number;
  cleanTitle: (title: string) => string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  habits,
  metrics,
  streakData,
  badges,
  earnedBadgesCount,
  cleanTitle
}) => {
  const [showSlaInfo, setShowSlaInfo] = useState(false);

  return (
    <div className="space-y-4 text-left animate-fade-in">
      {/* Encabezado Sereno */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" /> Matriz Semanal de SLA
          </h2>
          <p className="text-xs text-slate-400">Racha, cumplimiento y acuerdos de servicio personal</p>
        </div>
      </div>

      {/* 1. Panel de Métricas Unificado (Sin cajas de colores chillones) */}
      <div className="surface-depth p-4 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 border border-white/[0.08]">
        {/* Racha */}
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 tracking-wider">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Racha
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black font-mono text-white tabular-nums">{streakData.current}</span>
            <span className="text-[10px] text-slate-500 font-medium">días</span>
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">Récord: {streakData.best}d</span>
        </div>

        {/* Cumplimiento Hoy */}
        {metrics && (
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Hoy
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black font-mono text-white tabular-nums">
                {metrics.completed_today} / {metrics.scheduled_today_count ?? habits.length}
              </span>
            </div>
            <span className="text-[10px] text-indigo-400 font-semibold block">{metrics.today_compliance_percent}% ejecutado</span>
          </div>
        )}

        {/* Salud Global SLA */}
        {metrics && (
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 tracking-wider">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Salud SLA
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black font-mono text-emerald-400 tabular-nums">
                {metrics.habits_meeting_sla_percent}%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block">{metrics.healthy_habits} en meta</span>
          </div>
        )}

        {/* Logros */}
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 tracking-wider">
            <Award className="w-3.5 h-3.5 text-indigo-400" /> Logros
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black font-mono text-white tabular-nums">
              {earnedBadgesCount} / {badges.length}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block">desbloqueados</span>
        </div>
      </div>

      {/* 2. Explicación Pedagógica del SLA (Discreta y Colapsable) */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowSlaInfo(!showSlaInfo)}
          className="w-full text-left px-3.5 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs text-slate-400 hover:text-slate-300 transition flex items-center justify-between select-none"
        >
          <span className="flex items-center gap-1.5 font-medium text-[11px]">
            <Info className="w-3.5 h-3.5 text-indigo-400" /> ¿Cómo funciona tu SLA? (Piso mínimo 85%)
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showSlaInfo ? 'rotate-180' : ''}`} />
        </button>

        {showSlaInfo && (
          <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-slate-300 leading-relaxed animate-fade-in space-y-1">
            <p>
              El SLA no te exige un 100% rígido todos los días; define un <strong>piso mínimo de cumplimiento sostenible (ej. 85%)</strong>.
            </p>
            <p className="text-slate-400 text-[11px]">
              Mantener tus hábitos en verde a lo largo de la semana protege tu resiliencia y previene el abandono por sobrecarga.
            </p>
          </div>
        )}
      </div>

      {/* 3. Matriz Unificada de Consistencia (7 Días) - Sin duplicaciones */}
      <div className="surface-depth rounded-2xl p-3.5 sm:p-4 border border-white/[0.08] shadow-sm">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Consistencia Semanal
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Objetivo: &ge;85%</span>
        </div>

        {habits.length > 0 ? (
          <div className="divide-y divide-white/[0.04]">
            {habits.map((habit) => (
              <div 
                key={habit.id} 
                className="py-2.5 flex items-center justify-between gap-2 hover:bg-white/[0.02] px-1 rounded-lg transition"
              >
                {/* Título del Hábito */}
                <div className="min-w-0 flex-1 pr-2">
                  <span className="text-xs font-semibold text-white block truncate">
                    {cleanTitle(habit.title)}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {habit.frequency_type || 'Diario'} &bull; Meta {habit.sla_target_percent}%
                  </span>
                </div>

                {/* Cápsulas de los 7 Días */}
                <div className="flex items-center gap-1 shrink-0">
                  {habit.compliance_summary.history?.map((h, i) => (
                    <div
                      key={i}
                      className={`w-6 h-6 rounded-lg flex flex-col items-center justify-center text-[9px] transition-all ${
                        h.completed
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold'
                          : 'bg-white/[0.03] border border-white/[0.05] text-slate-500 font-medium'
                      }`}
                      title={`${h.date} (${h.day_name}): ${h.completed ? 'Cumplido' : 'Pendiente'}`}
                    >
                      <span className="text-[8px] leading-none opacity-80">{h.day_name.slice(0, 1)}</span>
                      <span className="text-[9px] leading-none mt-0.5">{h.completed ? '✓' : '·'}</span>
                    </div>
                  ))}
                </div>

                {/* Tasa SLA */}
                <div className="w-12 text-right shrink-0">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${
                    habit.compliance_summary.meets_sla
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {habit.compliance_summary.rate_percent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            No hay hábitos registrados aún para calcular la matriz de SLA.
          </div>
        )}
      </div>
    </div>
  );
};
