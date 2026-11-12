import React, { useState, useEffect } from 'react';
import { 
  Brain, Check, X, ArrowLeft, 
  RotateCcw, Activity, Heart, Sparkles, Wind
} from 'lucide-react';
import { 
  GAD7_QUESTIONS, 
  BURNOUT_QUESTIONS, 
  ANSWER_OPTIONS, 
  evaluateAssessment, 
  saveAssessmentResult,
  type AnxietyAssessmentResult,
  type AssessmentType 
} from '../../services/anxietyService';
import { haptics } from '../../services/haptics';
import { zenAudio } from '../../services/zenAudio';

interface AnxietyAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchZenTool?: (toolName: 'bubble_pop' | 'color_flow' | 'zen_trace' | 'grounding' | 'sigh') => void;
}

export const AnxietyAssessmentModal: React.FC<AnxietyAssessmentModalProps> = ({
  isOpen,
  onClose,
  onLaunchZenTool,
}) => {
  const [testType, setTestType] = useState<AssessmentType>('anxiety_gad7');
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<AnxietyAssessmentResult | null>(null);

  const questions = testType === 'anxiety_gad7' ? GAD7_QUESTIONS : BURNOUT_QUESTIONS;
  const currentQ = questions[currentIdx];

  useEffect(() => {
    if (isOpen) {
      setCurrentIdx(0);
      setAnswers({});
      setResult(null);
    }
  }, [isOpen, testType]);

  const handleSelectOption = (value: number) => {
    haptics.selection();
    zenAudio.playBubbleChime(value + 1);

    const updated = { ...answers, [currentQ.id]: value };
    setAnswers(updated);

    if (currentIdx < questions.length - 1) {
      setTimeout(() => {
        setCurrentIdx(i => i + 1);
      }, 200);
    } else {
      // Finalizar y calcular resultado
      setTimeout(() => {
        const evalRes = evaluateAssessment(testType, updated);
        setResult(evalRes);
        saveAssessmentResult(evalRes);
        haptics.success();
        zenAudio.playZenCompletionChord();
      }, 250);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setAnswers({});
    setResult(null);
    haptics.selection();
  };

  if (!isOpen) return null;

  const progressPercent = Math.round(((currentIdx + 1) / questions.length) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-3 sm:p-4 select-none animate-fade-in">
      <div className="anxiety-modal-card w-full max-w-md max-h-[88vh] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col relative overflow-y-auto scrollbar-none">
        {/* Cabecera */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-700/60 text-indigo-300">
              <Brain className="w-4 h-4" />
            </span>
            <div className="text-left">
              <h3 className="text-sm font-bold text-white leading-tight">
                {testType === 'anxiety_gad7' ? 'Test de Nivel de Ansiedad' : 'Test de Fatiga Mental'}
              </h3>
              <p className="text-[11px] text-indigo-400 font-medium">
                Autoevaluación clínica validada (GAD-7)
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

        {/* Selector de Test si no ha finalizado */}
        {!result && (
          <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-4">
            <button
              onClick={() => { setTestType('anxiety_gad7'); handleRestart(); }}
              className={`py-2 text-[11px] font-bold rounded-xl transition ${
                testType === 'anxiety_gad7' 
                  ? 'bg-indigo-900/60 text-indigo-200 border border-indigo-600/50' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ansiedad GAD-7
            </button>
            <button
              onClick={() => { setTestType('mental_burnout'); handleRestart(); }}
              className={`py-2 text-[11px] font-bold rounded-xl transition ${
                testType === 'mental_burnout' 
                  ? 'bg-indigo-900/60 text-indigo-200 border border-indigo-600/50' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fatiga & Burnout
            </button>
          </div>
        )}

        {/* PANTALLA 1: PREGUNTAS DEL TEST */}
        {!result && (
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Barra de Progreso */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
                  <span>Pregunta {currentIdx + 1} de {questions.length}</span>
                  <span className="text-indigo-400 font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Tarjeta de la Pregunta */}
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 mb-4 text-left">
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-800/40 inline-block mb-2">
                  Últimos 14 días
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white leading-relaxed">
                  {currentQ.text}
                </h4>
                {currentQ.explanation && (
                  <p className="text-xs text-slate-400 mt-2">
                    {currentQ.explanation}
                  </p>
                )}
              </div>

              {/* Opciones de Respuesta */}
              <div className="space-y-2">
                {ANSWER_OPTIONS.map((opt) => {
                  const isSelected = answers[currentQ.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleSelectOption(opt.value)}
                      className={`w-full min-h-[52px] p-3 rounded-xl border text-left flex items-center justify-between transition-all active:scale-98 ${
                        isSelected
                          ? 'bg-indigo-950/90 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-900/80 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold block">{opt.label}</span>
                        <span className="text-[10px] text-slate-400">{opt.desc}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                        isSelected ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-slate-700'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navegación anterior si aplica */}
            {currentIdx > 0 && (
              <button
                onClick={() => { setCurrentIdx(i => i - 1); haptics.tap(); }}
                className="mt-4 text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Pregunta anterior</span>
              </button>
            )}
          </div>
        )}

        {/* PANTALLA 2: RESULTADOS Y DESGLOSE CLÍNICO */}
        {result && (
          <div className="flex-1 flex flex-col justify-between text-left animate-scale-up">
            <div>
              {/* Tarjeta de Puntuación Principal */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-3 text-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1">
                  Diagnóstico Psicofisiológico
                </span>
                <div className="text-3xl font-black font-mono text-white mb-1">
                  {result.rawScore} <span className="text-sm font-normal text-slate-500">/ {result.maxScore} pts</span>
                </div>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                  result.severity === 'minimal'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                    : result.severity === 'mild'
                    ? 'bg-blue-950/80 text-blue-300 border-blue-700/60'
                    : result.severity === 'moderate'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                    : 'bg-rose-950/80 text-rose-300 border-rose-700/60'
                }`}>
                  {result.severityLabel}
                </div>
              </div>

              {/* Desglose Tridimensional: Cognitivo, Somático y Reactividad */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 mb-3 space-y-2.5">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
                  Perfil de Carga Sensorial:
                </span>

                {/* Cognitivo */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                      <Brain className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Rumiación Cognitiva</span>
                    </span>
                    <span className="font-mono font-bold text-indigo-300">
                      {result.breakdown.cognitivePercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full"
                      style={{ width: `${result.breakdown.cognitivePercent}%` }}
                    />
                  </div>
                </div>

                {/* Somático */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                      <Activity className="w-3.5 h-3.5 text-teal-400" />
                      <span>Tensión Física / Somática</span>
                    </span>
                    <span className="font-mono font-bold text-teal-300">
                      {result.breakdown.somaticPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-teal-500 h-full rounded-full"
                      style={{ width: `${result.breakdown.somaticPercent}%` }}
                    />
                  </div>
                </div>

                {/* Reactividad */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                      <Heart className="w-3.5 h-3.5 text-rose-400" />
                      <span>Reactividad al Estrés</span>
                    </span>
                    <span className="font-mono font-bold text-rose-300">
                      {result.breakdown.stressPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full rounded-full"
                      style={{ width: `${result.breakdown.stressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Recomendaciones Tácticas */}
              <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Protocolo Sugerido de Acción:</span>
                </span>
                <ul className="space-y-1.5">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-slate-300 leading-snug">
                      • {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Botones de lanzamiento rápido según el perfil */}
              {onLaunchZenTool && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() => {
                      onLaunchZenTool('bubble_pop');
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-teal-950/80 border border-teal-700/60 text-teal-200 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-teal-900 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Zen Bubble Pop</span>
                  </button>

                  <button
                    onClick={() => {
                      onLaunchZenTool('grounding');
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-blue-950/80 border border-blue-700/60 text-blue-200 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-900 transition"
                  >
                    <Wind className="w-3.5 h-3.5" />
                    <span>Grounding 5-4-3-2-1</span>
                  </button>
                </div>
              )}
            </div>

            {/* Barra Inferior */}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handleRestart}
                className="p-3 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-xl transition flex items-center justify-center active:scale-95"
                title="Repetir test"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Guardar y Volver a Taskia</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
