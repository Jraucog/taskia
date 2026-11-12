import React from 'react';
import { Eye, Clock, Play, Sparkles } from 'lucide-react';
import type { Program } from '../types';
import { normalizeSearchText } from '../services/storageSync';

interface ProgramPreviewModalProps {
  program: Program | null;
  onClose: () => void;
  onEnroll: (programId: number) => void;
  onStartAnkiSession?: (program: Program) => void;
}

export const ProgramPreviewModal: React.FC<ProgramPreviewModalProps> = ({
  program,
  onClose,
  onEnroll,
  onStartAnkiSession
}) => {
  if (!program) return null;

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
        className="surface-depth border border-white/[0.1] rounded-3xl p-5 max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl my-auto overflow-hidden overscroll-contain shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl theme-badge">
              <Eye className="w-5 h-5 opacity-90" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider theme-badge px-2 py-0.5 rounded-full">
                {program.category}
              </span>
              <h3 className="text-sm font-bold text-white mt-1">{program.title}</h3>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm p-1">✕</button>
        </div>

        <p className="text-xs text-slate-300 my-3 leading-relaxed bg-white/[0.03] p-3 rounded-2xl border border-white/[0.06]">
          {program.description}
        </p>

        <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
          <span className="font-semibold text-white">Estructura de la Plantilla ({program.items?.length || 0} ítems):</span>
          <span className="font-mono text-slate-300 font-semibold">{program.duration_days} días</span>
        </div>

        <div 
          className="overflow-y-auto overscroll-contain space-y-2 pr-1 flex-1 mb-3 touch-pan-y"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {program.items?.map((it, idx) => (
            <div key={it.id || idx} className="bg-white/[0.02] p-3 rounded-2xl border border-white/[0.06] flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-white/[0.06] text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div>
                  <p className="text-xs font-bold text-white">{it.title}</p>
                  {it.description && <p className="text-[11px] text-slate-400 mt-0.5">{it.description}</p>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[11px] font-mono text-slate-300 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-lg">
                  {it.target_value} {it.unit}
                </span>
                {it.estimated_minutes ? (
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5 text-slate-400" />
                    <span>~{it.estimated_minutes}m</span>
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.08]">
          {(normalizeSearchText(program.title).includes('anki') || 
            normalizeSearchText(program.title).includes('ingles') || 
            normalizeSearchText(program.category).includes('idioma')) && onStartAnkiSession && (
            <button
              onClick={() => {
                onClose();
                onStartAnkiSession(program);
              }}
              className="w-full theme-badge hover:brightness-110 font-bold text-xs py-2.5 px-3 rounded-2xl transition flex items-center justify-center gap-2 active:scale-95 shadow-sm"
            >
              <Sparkles className="w-4 h-4 opacity-80" />
              <span>Practicar Mazo de Flashcards Anki Ahora</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-semibold transition"
            >
              Cerrar Previa
            </button>
            <button 
              onClick={() => {
                const pId = program.id;
                onClose();
                onEnroll(pId);
              }}
              className="flex-1 py-2.5 rounded-xl theme-btn-primary text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Cargar & Usar Esta Plantilla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
