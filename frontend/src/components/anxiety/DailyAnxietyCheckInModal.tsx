import React, { useState, useEffect } from 'react';
import { 
  Smile, Frown, Meh, AlertCircle, Check, X, 
  Activity
} from 'lucide-react';
import { 
  ANXIETY_SYMPTOMS_LIST, 
  ANXIETY_TRIGGERS_LIST, 
  saveDailyAnxietyLog, 
  getTodayAnxietyLog,
  type DailyAnxietyLog 
} from '../../services/anxietyService';
import { haptics } from '../../services/haptics';
import { zenAudio } from '../../services/zenAudio';

interface DailyAnxietyCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (log: DailyAnxietyLog) => void;
}

export const DailyAnxietyCheckInModal: React.FC<DailyAnxietyCheckInModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [score, setScore] = useState<number>(3);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedTrigger, setSelectedTrigger] = useState<string>('Sin causa aparente (Alerta Basal)');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const today = getTodayAnxietyLog();
      if (today) {
        setScore(today.score);
        setSelectedSymptoms(today.symptoms);
        setSelectedTrigger(today.trigger);
        setNotes(today.notes || '');
      } else {
        setScore(3);
        setSelectedSymptoms([]);
        setSelectedTrigger('Sin causa aparente (Alerta Basal)');
        setNotes('');
      }
    }
  }, [isOpen]);

  const toggleSymptom = (sym: string) => {
    haptics.tap();
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  };

  const handleScoreChange = (newScore: number) => {
    setScore(newScore);
    haptics.selection();
    zenAudio.playBubbleChime(newScore % 7);
  };

  const handleSave = () => {
    haptics.success();
    zenAudio.playZenCompletionChord();

    const todayStr = new Date().toISOString().split('T')[0];
    const saved = saveDailyAnxietyLog({
      date: todayStr,
      score,
      symptoms: selectedSymptoms,
      trigger: selectedTrigger,
      notes: notes.trim() ? notes.trim() : undefined,
    });

    if (onSaved) {
      onSaved(saved);
    }
    onClose();
  };

  if (!isOpen) return null;

  // Calificación cualitativa según puntaje
  let scoreText = 'Calma Óptima';
  let scoreColor = 'text-emerald-400 bg-emerald-950/80 border-emerald-700/60';
  let ScoreIcon = Smile;

  if (score <= 2) {
    scoreText = 'Paz Profunda / Estado Zen';
    scoreColor = 'text-emerald-400 bg-emerald-950/80 border-emerald-700/60';
    ScoreIcon = Smile;
  } else if (score <= 4) {
    scoreText = 'Calma Activa & Enfoque';
    scoreColor = 'text-teal-400 bg-teal-950/80 border-teal-700/60';
    ScoreIcon = Smile;
  } else if (score <= 6) {
    scoreText = 'Inquietud Leve / Tensión';
    scoreColor = 'text-amber-400 bg-amber-950/80 border-amber-700/60';
    ScoreIcon = Meh;
  } else if (score <= 8) {
    scoreText = 'Ansiedad Elevada / Rumiación';
    scoreColor = 'text-orange-400 bg-orange-950/80 border-orange-700/60';
    ScoreIcon = Frown;
  } else {
    scoreText = 'Sobrecarga Crítica / Pánico';
    scoreColor = 'text-rose-400 bg-rose-950/80 border-rose-700/60';
    ScoreIcon = AlertCircle;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-3 sm:p-4 select-none animate-fade-in">
      <div className="anxiety-modal-card w-full max-w-md max-h-[88vh] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col relative overflow-y-auto scrollbar-none">
        {/* Cabecera */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-950/80 border border-teal-700/60 text-teal-300">
              <Activity className="w-4 h-4" />
            </span>
            <div className="text-left">
              <h3 className="text-sm font-bold text-white leading-tight">Check-In Diario de Ansiedad</h3>
              <p className="text-[11px] text-teal-400 font-medium">
                10 segundos para calibrar tu sistema nervioso
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/50 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Selector Visual de Nivel de Ansiedad (1 al 10) */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 mb-4 text-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-2">
            ¿Cuál es tu nivel de ansiedad actual?
          </span>

          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-3xl font-black font-mono text-white">
              {score}
            </span>
            <span className="text-sm font-semibold text-slate-500">/ 10</span>
          </div>

          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-4 ${scoreColor}`}>
            <ScoreIcon className="w-3.5 h-3.5" />
            <span>{scoreText}</span>
          </div>

          {/* Slider suave de 1 a 10 */}
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={score}
            onChange={(e) => handleScoreChange(parseInt(e.target.value))}
            className="w-full accent-teal-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
          />

          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2 px-1">
            <span>1 (Zen Total)</span>
            <span>5 (Neutro)</span>
            <span>10 (Pánico)</span>
          </div>
        </div>

        {/* 2. Síntomas Somáticos / Cognitivos */}
        <div className="mb-4 text-left">
          <label className="text-xs font-bold text-slate-300 block mb-1.5">
            ¿Qué sensaciones o síntomas notas hoy? (Opcional)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ANXIETY_SYMPTOMS_LIST.map((sym) => {
              const active = selectedSymptoms.includes(sym);
              return (
                <button
                  key={sym}
                  onClick={() => toggleSymptom(sym)}
                  className={`text-[11px] font-medium px-2.5 py-1.5 rounded-xl border transition active:scale-95 ${
                    active
                      ? 'bg-teal-950 border-teal-500 text-teal-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sym}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Desencadenante Principal */}
        <div className="mb-4 text-left">
          <label className="text-xs font-bold text-slate-300 block mb-1.5">
            ¿Principal factor o foco de estrés?
          </label>
          <select
            value={selectedTrigger}
            onChange={(e) => { setSelectedTrigger(e.target.value); haptics.selection(); }}
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 focus:border-teal-500 focus:outline-none"
          >
            {ANXIETY_TRIGGERS_LIST.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* 4. Breve reflexión opcional */}
        <div className="mb-4 text-left">
          <label className="text-xs font-bold text-slate-300 block mb-1.5">
            Nota de desahogo (Opcional)
          </label>
          <input
            type="text"
            placeholder="Ej. 'Día con muchas reuniones' o 'Dormí 5 horas'..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 placeholder-slate-600 focus:border-teal-500 focus:outline-none"
            maxLength={120}
          />
        </div>

        {/* Botón Guardar */}
        <button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-teal-950/40 active:scale-95"
        >
          <Check className="w-4 h-4" />
          <span>Guardar Check-In Diario</span>
        </button>
      </div>
    </div>
  );
};
