import React from 'react';
import { Calendar, Flame, Trophy, Award, TrendingUp } from 'lucide-react';
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
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" /> Matriz Semanal de SLA
          </h2>
          <p className="text-xs text-slate-400">Racha, cumplimiento y acuerdos de servicio personal</p>
        </div>
      </div>

      {/* Dashboard de Racha y Estadísticas */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gradient-to-br from-amber-950/60 to-slate-900 border border-amber-800/40 p-3 rounded-2xl text-center">
          <Flame className="w-5 h-5 text-amber-400 mx-auto mb-1" />
          <span className="text-xl font-black text-amber-300 font-mono block">{streakData.current}</span>
          <span className="text-[10px] text-amber-400/80 uppercase font-bold">Racha Actual</span>
        </div>
        <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-800/40 p-3 rounded-2xl text-center">
          <Trophy className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
          <span className="text-xl font-black text-indigo-300 font-mono block">{streakData.best}</span>
          <span className="text-[10px] text-indigo-400/80 uppercase font-bold">Mejor Racha</span>
        </div>
        <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-800/40 p-3 rounded-2xl text-center">
          <Award className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <span className="text-xl font-black text-emerald-300 font-mono block">{earnedBadgesCount}/{badges.length}</span>
          <span className="text-[10px] text-emerald-400/80 uppercase font-bold">Logros</span>
        </div>
      </div>

      {/* Explicación Pedagógica del SLA */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/30 border border-indigo-900/40 p-3.5 rounded-2xl">
        <h3 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 mb-1">
          🛡️ ¿Qué es tu SLA (Service Level Agreement)?
        </h3>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          El SLA no te pide perfección irreal del 100% todos los días; define un <strong>piso mínimo de cumplimiento (ej. 85%)</strong>. Si mantienes tus hábitos en verde dentro de la semana, tu sistema es sostenible y previene recaídas o abandono.
        </p>
      </div>

      {/* Tarjeta Métricas Resumen */}
      {metrics && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Cumplimiento Hoy</span>
            <div className="text-lg font-black text-white mt-0.5">
              {metrics.completed_today} / {metrics.scheduled_today_count ?? habits.length}
            </div>
            <span className="text-[11px] text-indigo-400 font-semibold">{metrics.today_compliance_percent}%</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Salud Global SLA</span>
            <div className="text-lg font-black text-emerald-400 mt-0.5">{metrics.habits_meeting_sla_percent}%</div>
            <span className="text-[11px] text-slate-400">{metrics.healthy_habits} en meta</span>
          </div>
        </div>
      )}

      {/* Heatmap mini estilo GitHub por hábito */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3">
        <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>Heatmap de Consistencia (últimos 7 días)</span>
        </h4>
        <div className="space-y-1.5">
          {habits.slice(0, 8).map(habit => (
            <div key={`hm-${habit.id}`} className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-medium truncate w-24 sm:w-36 shrink-0">{cleanTitle(habit.title)}</span>
              <div className="flex items-center gap-0.5 flex-1">
                {habit.compliance_summary.history?.map((h, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-sm transition-all ${
                      h.completed 
                        ? 'bg-emerald-500/90 shadow-sm shadow-emerald-500/20' 
                        : 'bg-slate-800/80'
                    }`}
                    title={`${h.date} (${h.day_name}): ${h.completed ? '✓' : '✗'}`}
                  />
                ))}
              </div>
              <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                habit.compliance_summary.meets_sla ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {habit.compliance_summary.rate_percent}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla de Cumplimiento */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 overflow-x-auto shadow-sm">
        <table className="w-full text-left text-xs min-w-[280px]">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="pb-2 font-semibold">Tarea</th>
              <th className="pb-2 text-center font-semibold">7 Días</th>
              <th className="pb-2 text-right font-semibold">SLA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {habits.map((habit) => (
              <tr key={habit.id} className="hover:bg-slate-800/20">
                <td className="py-2.5 pr-2">
                  <div className="font-semibold text-white max-w-[130px] sm:max-w-[200px] truncate">
                    {cleanTitle(habit.title)}
                  </div>
                </td>

                <td className="py-2.5 px-1 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {habit.compliance_summary.history?.map((h, i) => (
                      <div 
                        key={i} 
                        className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold ${
                          h.completed 
                            ? 'bg-emerald-500 text-slate-950 font-black' 
                            : 'bg-slate-800 text-slate-500'
                        }`}
                        title={`${h.date}: ${h.completed ? 'Cumplido' : 'Pendiente'}`}
                      >
                        {h.day_name.slice(0, 1)}
                      </div>
                    ))}
                  </div>
                </td>

                <td className="py-2.5 pl-2 text-right">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    habit.compliance_summary.meets_sla 
                      ? 'bg-emerald-950 text-emerald-400' 
                      : 'bg-amber-950 text-amber-400'
                  }`}>
                    {habit.compliance_summary.rate_percent}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
