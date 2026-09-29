import React from 'react';
import { Eye, Clock, Play } from 'lucide-react';
import type { Program } from '../types';

interface ProgramPreviewModalProps {
  program: Program | null;
  onClose: () => void;
  onEnroll: (programId: number) => void;
}

export const ProgramPreviewModal: React.FC<ProgramPreviewModalProps> = ({
  program,
  onClose,
  onEnroll
}) => {
  if (!program) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-800/50">
                {program.category}
              </span>
              <h3 className="text-sm font-bold text-white mt-1">{program.title}</h3>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm p-1">✕</button>
        </div>

        <p className="text-xs text-slate-300 my-3 leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
          {program.description}
        </p>

        <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
          <span className="font-semibold text-white">Estructura de la Plantilla ({program.items?.length || 0} ítems):</span>
          <span className="font-mono text-amber-400 font-bold">{program.duration_days} días</span>
        </div>

        <div className="overflow-y-auto space-y-2 pr-1 flex-1 mb-3">
          {program.items?.map((it, idx) => (
            <div key={it.id || idx} className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div>
                  <p className="text-xs font-bold text-white">{it.title}</p>
                  {it.description && <p className="text-[11px] text-slate-400 mt-0.5">{it.description}</p>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[11px] font-mono text-indigo-300 bg-indigo-950/80 border border-indigo-900 px-2 py-0.5 rounded-lg">
                  {it.target_value} {it.unit}
                </span>
                {it.estimated_minutes ? (
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5 text-indigo-400" />
                    <span>~{it.estimated_minutes}m</span>
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
          >
            Cerrar Previa
          </button>
          <button 
            onClick={() => {
              const pId = program.id;
              onClose();
              onEnroll(pId);
            }}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-white" /> Cargar & Usar Esta Plantilla
          </button>
        </div>
      </div>
    </div>
  );
};
