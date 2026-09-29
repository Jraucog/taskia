import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import type { VisionCard } from '../types';

interface VisionCardEditModalProps {
  card: VisionCard | null;
  onClose: () => void;
  onUpdate: (updatedCard: VisionCard) => void;
  onDelete: (cardId: string) => void;
}

export const VisionCardEditModal: React.FC<VisionCardEditModalProps> = ({
  card,
  onClose,
  onUpdate,
  onDelete
}) => {
  if (!card) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-md w-full shadow-2xl flex flex-col gap-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-indigo-400" /> Editar Meta del Vision Board
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm p-1">✕</button>
        </div>

        <div>
          <label className="text-[11px] text-slate-400 block mb-1">Título de la Meta (Fórmula 3P)</label>
          <textarea
            value={card.title}
            onChange={(e) => onUpdate({ ...card, title: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none h-16"
          />
        </div>

        <div>
          <label className="text-[11px] text-slate-400 block mb-1">El "Por Qué" (Motivo Profundo)</label>
          <textarea
            value={card.why}
            onChange={(e) => onUpdate({ ...card, why: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none h-16"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Fecha Límite</label>
            <input
              type="text"
              value={card.deadline}
              onChange={(e) => onUpdate({ ...card, deadline: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Progreso ({card.progress}%)</label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={card.progress}
              onChange={(e) => onUpdate({ ...card, progress: Number(e.target.value) })}
              className="w-full accent-indigo-500 mt-2"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800 mt-1">
          <button
            onClick={() => onDelete(card.id)}
            className="text-red-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1 p-2"
          >
            <Trash2 className="w-3.5 h-3.5" /> Eliminar
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
