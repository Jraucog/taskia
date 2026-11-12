import React, { useState } from 'react';
import { 
  X, Share2, Copy, Check, Flame, Award, ShieldCheck, Sparkles 
} from 'lucide-react';
import type { SkillTreeProfile } from '../services/skillTreeService';
import { haptics } from '../services/haptics';

interface ShareSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: SkillTreeProfile;
  overallSLA: number;
  userName?: string;
}

export const ShareSnapshotModal: React.FC<ShareSnapshotModalProps> = ({
  isOpen,
  onClose,
  profile,
  overallSLA,
  userName = 'Operador'
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareText = `🔥 Registro de Disciplina en Taskia:
👤 ${userName} | Nivel ${profile.level}: ${profile.title}
⚡ Racha Actual: ${profile.streakDays} días consecutivos
🎯 SLA de Hábitos: ${overallSLA}%
🛡️ XP Total: ${profile.totalXP.toLocaleString()} XP
✨ Construyendo hábitos inquebrantables con @TaskiaApp`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      haptics.success();
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    haptics.tap();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Progreso de ${userName} en Taskia`,
          text: shareText,
          url: window.location.origin
        });
      } catch {
        // Ignorar cancelaciones del share picker
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-500/30 rounded-3xl p-5 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Share2 className="w-4 h-4" />
            </span>
            <span className="text-sm font-bold text-white">Compartir Progreso</span>
          </div>

          <button
            onClick={() => { haptics.tap(); onClose(); }}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tarjeta Visual de Compartir (Snapshot Card) */}
        <div className="my-4 p-5 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/40 shadow-xl relative overflow-hidden text-center space-y-3">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-300 font-bold">
              Taskia Mastery
            </span>
          </div>

          <div>
            <h3 className="text-lg font-black text-white">{userName}</h3>
            <div className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
              <Award className="w-3 h-3 text-amber-300" />
              <span>Nivel {profile.level}: {profile.title}</span>
            </div>
          </div>

          {/* Estadísticas en Tarjeta */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-center gap-1 text-orange-400">
                <Flame className="w-4 h-4" />
                <span className="text-xl font-black font-mono">{profile.streakDays}</span>
              </div>
              <span className="text-[9px] uppercase font-bold text-slate-400">Días de Racha</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-center gap-1 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xl font-black font-mono">{overallSLA}%</span>
              </div>
              <span className="text-[9px] uppercase font-bold text-slate-400">SLA de Hábitos</span>
            </div>
          </div>

          <div className="pt-1 text-[10px] text-slate-400 font-mono">
            {profile.totalXP.toLocaleString()} XP acumulada &bull; Consistencia Diaria
          </div>
        </div>

        {/* Acciones de compartir */}
        <div className="space-y-2 pt-1">
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-98 transition"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartir en Apps (WhatsApp / X)</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="w-full py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 active:scale-98 transition"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 font-bold">¡Copiado al portapapeles!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copiar texto de progreso</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
