import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Eye, Hand, Ear, Wind, Heart, 
  Check, X, Volume2, VolumeX, ArrowRight
} from 'lucide-react';
import { zenAudio } from '../../services/zenAudio';
import { haptics } from '../../services/haptics';
import { saveZenSessionRecord } from '../../services/anxietyService';

interface GroundingSOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const GROUNDING_STEPS = [
  {
    step: 1,
    title: '5 Cosas que puedes VER',
    instruction: 'Mira a tu alrededor. Identifica 5 objetos distintos con detenimiento: sus formas, colores o detalles.',
    count: 5,
    icon: Eye,
    colorClass: 'text-blue-400 bg-blue-950/70 border-blue-600/60',
    itemPlaceholder: 'Objeto visto',
  },
  {
    step: 2,
    title: '4 Cosas que puedes TOCAR',
    instruction: 'Siente la textura de tu ropa, la firmeza del suelo bajo tus pies, la temperatura de tus manos o el teclado.',
    count: 4,
    icon: Hand,
    colorClass: 'text-teal-400 bg-teal-950/70 border-teal-600/60',
    itemPlaceholder: 'Textura sentida',
  },
  {
    step: 3,
    title: '3 Cosas que puedes ESCUCHAR',
    instruction: 'Cierra los ojos un segundo. Detecta 3 sonidos presentes: el aire, tu respiración, un murmullo o ruido lejano.',
    count: 3,
    icon: Ear,
    colorClass: 'text-amber-400 bg-amber-950/70 border-amber-600/60',
    itemPlaceholder: 'Sonido detectado',
  },
  {
    step: 4,
    title: '2 Cosas que puedes OLER',
    instruction: 'Inhala profundamente por la nariz. ¿Percibes café, aire fresco, tu piel o un aroma en el ambiente?',
    count: 2,
    icon: Wind,
    colorClass: 'text-rose-400 bg-rose-950/70 border-rose-600/60',
    itemPlaceholder: 'Aroma identificado',
  },
  {
    step: 5,
    title: '1 Sensación Positiva o GRATITUD',
    instruction: 'Nombra mentalmente una cosa buena en tu vida hoy, o agradece a tu cuerpo por estar sosteniéndote aquí y ahora.',
    count: 1,
    icon: Heart,
    colorClass: 'text-emerald-400 bg-emerald-950/70 border-emerald-600/60',
    itemPlaceholder: 'Elemento de gratitud',
  }
];

export const GroundingSOSModal: React.FC<GroundingSOSModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'grounding' | 'sigh' | 'reframe'>('grounding');
  // Grounding state
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [checkedItems, setCheckedItems] = useState<boolean[]>([]);
  // Suspiro fisiológico state
  const [sighSeconds, setSighSeconds] = useState<number>(60);
  const [sighPhase, setSighPhase] = useState<'inhale1' | 'inhale2' | 'exhale'>('inhale1');
  const [isSighRunning, setIsSighRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Inicializar items del paso actual
  useEffect(() => {
    if (isOpen) {
      const step = GROUNDING_STEPS[currentStepIdx];
      setCheckedItems(new Array(step.count).fill(false));
    }
  }, [isOpen, currentStepIdx]);

  // Temporizador para el Suspiro Fisiológico
  useEffect(() => {
    let interval: any = null;
    if (isOpen && activeTab === 'sigh' && isSighRunning && sighSeconds > 0) {
      interval = setInterval(() => {
        setSighSeconds(s => s - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, activeTab, isSighRunning, sighSeconds]);

  // Ciclo rítmico del Suspiro Fisiológico (Inhala 2.5s, Doble Inhala 1.5s, Exhala 5s)
  useEffect(() => {
    let timeout: any = null;
    if (isOpen && activeTab === 'sigh' && isSighRunning) {
      if (sighPhase === 'inhale1') {
        if (soundEnabled) zenAudio.playBubbleChime(2);
        timeout = setTimeout(() => setSighPhase('inhale2'), 2500);
      } else if (sighPhase === 'inhale2') {
        if (soundEnabled) zenAudio.playBubbleChime(4);
        timeout = setTimeout(() => setSighPhase('exhale'), 1500);
      } else if (sighPhase === 'exhale') {
        if (soundEnabled) zenAudio.playBubbleChime(0);
        timeout = setTimeout(() => setSighPhase('inhale1'), 5000);
      }
    }
    return () => clearTimeout(timeout);
  }, [isOpen, activeTab, isSighRunning, sighPhase, soundEnabled]);

  const toggleCheckItem = (idx: number) => {
    const updated = [...checkedItems];
    updated[idx] = !updated[idx];
    setCheckedItems(updated);
    haptics.tap();
    if (soundEnabled) {
      zenAudio.playBubbleChime(idx + 1);
    }

    // Si completó todos los de este paso
    if (updated.every(Boolean)) {
      haptics.impact();
      if (currentStepIdx < GROUNDING_STEPS.length - 1) {
        setTimeout(() => {
          setCurrentStepIdx(s => s + 1);
        }, 350);
      }
    }
  };

  const handleFinishGrounding = () => {
    if (soundEnabled) {
      zenAudio.playZenCompletionChord();
    }
    haptics.success();
    saveZenSessionRecord({
      date: new Date().toISOString().split('T')[0],
      gameType: 'grounding_54321',
      durationSeconds: 90,
      metricAchieved: 5,
    });
    if (onComplete) {
      onComplete();
    }
    onClose();
  };

  if (!isOpen) return null;

  const currentStep = GROUNDING_STEPS[currentStepIdx];
  const StepIcon = currentStep.icon;
  const allCurrentChecked = checkedItems.every(Boolean);
  const isLastStep = currentStepIdx === GROUNDING_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-3 sm:p-4 select-none animate-fade-in">
      <div className="anxiety-modal-card w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-red-900/40 rounded-3xl p-5 shadow-2xl flex flex-col relative overflow-hidden">
        {/* Cabecera SOS con selector de modo */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-950/80 border border-red-700/60 text-red-400">
              <ShieldAlert className="w-4 h-4 animate-pulse" />
            </span>
            <div className="text-left">
              <h3 className="text-sm font-bold text-white leading-tight">SOS Ansiedad & Pánico</h3>
              <p className="text-[11px] text-red-400 font-medium">
                Regulación táctica del sistema nervioso
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                zenAudio.setMuted(!next);
                haptics.tap();
              }}
              className={`p-2 rounded-xl transition ${
                soundEnabled ? 'text-red-300 bg-red-950/80 border border-red-700/50' : 'text-slate-500 bg-slate-800/60'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/50 hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pestañas SOS */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-4">
          <button
            onClick={() => { setActiveTab('grounding'); haptics.selection(); }}
            className={`py-2 text-[11px] font-bold rounded-xl transition ${
              activeTab === 'grounding' 
                ? 'bg-blue-900/60 text-blue-200 border border-blue-600/50' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            5-4-3-2-1
          </button>
          <button
            onClick={() => { setActiveTab('sigh'); haptics.selection(); }}
            className={`py-2 text-[11px] font-bold rounded-xl transition ${
              activeTab === 'sigh' 
                ? 'bg-teal-900/60 text-teal-200 border border-teal-600/50' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Suspiro 60s
          </button>
          <button
            onClick={() => { setActiveTab('reframe'); haptics.selection(); }}
            className={`py-2 text-[11px] font-bold rounded-xl transition ${
              activeTab === 'reframe' 
                ? 'bg-amber-900/60 text-amber-200 border border-amber-600/50' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Reencuadre
          </button>
        </div>

        {/* 1. VISTA GROUNDING 5-4-3-2-1 */}
        {activeTab === 'grounding' && (
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Barra de Pasos 5-4-3-2-1 */}
              <div className="flex items-center justify-between gap-1 mb-3">
                {GROUNDING_STEPS.map((s, idx) => (
                  <div
                    key={s.step}
                    className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                      idx <= currentStepIdx ? 'bg-blue-500' : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>

              {/* Tarjeta del Paso Activo */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 mb-3 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`p-2 rounded-xl border ${currentStep.colorClass}`}>
                    <StepIcon className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                      Paso {currentStepIdx + 1} de 5
                    </span>
                    <h4 className="text-sm font-bold text-white">
                      {currentStep.title}
                    </h4>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {currentStep.instruction}
                </p>

                {/* Elementos a marcar interactivamente */}
                <div className="grid grid-cols-1 gap-2">
                  {checkedItems.map((checked, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleCheckItem(idx)}
                      className={`w-full p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all active:scale-98 ${
                        checked
                          ? 'bg-blue-950/80 border-blue-500/70 text-blue-200'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          checked ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {idx + 1}
                        </span>
                        <span>{checked ? '¡Identificado!' : `${currentStep.itemPlaceholder} #${idx + 1}`}</span>
                      </span>

                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                        checked ? 'bg-blue-600 border-blue-400 text-white' : 'border-slate-700'
                      }`}>
                        {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Botones de navegación de pasos */}
            <div className="flex items-center gap-2 mt-2">
              {currentStepIdx > 0 && (
                <button
                  onClick={() => {
                    setCurrentStepIdx(s => s - 1);
                    haptics.selection();
                  }}
                  className="px-3 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
                >
                  Anterior
                </button>
              )}

              {isLastStep ? (
                <button
                  onClick={handleFinishGrounding}
                  disabled={!allCurrentChecked}
                  className={`flex-1 font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                    allCurrentChecked
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Completar Aterrizaje Sensorial</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setCurrentStepIdx(s => s + 1);
                    haptics.selection();
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                >
                  <span>Siguiente Paso</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2. VISTA SUSPIRO FISIOLÓGICO EXPRESS */}
        {activeTab === 'sigh' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-teal-400 bg-teal-950/80 px-3 py-1 rounded-full border border-teal-800/50 mb-3">
              Reset Neurobiológico de 60s
            </span>

            {/* Orbe dinámico del suspiro fisiológico */}
            <div className="my-4 relative flex items-center justify-center w-48 h-48">
              <div 
                className={`w-36 h-36 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-1000 ease-in-out ${
                  sighPhase === 'inhale1'
                    ? 'scale-110 bg-gradient-to-br from-teal-500 to-emerald-700 shadow-teal-500/50'
                    : sighPhase === 'inhale2'
                    ? 'scale-125 bg-gradient-to-br from-cyan-400 to-teal-500 shadow-cyan-400/60 ring-4 ring-cyan-300/40'
                    : 'scale-90 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700'
                }`}
              >
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  {sighPhase === 'inhale1' && '1. Inhala Profundo'}
                  {sighPhase === 'inhale2' && '2. ¡Inhala de nuevo!'}
                  {sighPhase === 'exhale' && '3. Exhala Lento'}
                </span>
                <span className="text-[10px] text-teal-200 mt-1">
                  {sighPhase === 'inhale1' && 'Por la nariz'}
                  {sighPhase === 'inhale2' && 'Llena los alvéolos'}
                  {sighPhase === 'exhale' && 'Por la boca'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 max-w-xs mb-4">
              Dos inhalaciones por la nariz abren los alvéolos colapsados y la exhalación lenta colapsa el ritmo cardíaco.
            </p>

            <button
              onClick={() => {
                setIsSighRunning(!isSighRunning);
                haptics.tap();
              }}
              className={`w-full font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                isSighRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-950/40'
              }`}
            >
              {isSighRunning ? 'Pausar Suspiro' : 'Iniciar Respiración de 60s'}
            </button>
          </div>
        )}

        {/* 3. VISTA REENCUADRE COGNITIVO */}
        {activeTab === 'reframe' && (
          <div className="flex-1 flex flex-col justify-between text-left">
            <div className="space-y-2.5">
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  1. ¿Hecho o Pensamiento?
                </span>
                <p className="text-xs text-slate-300">
                  "Tu mente no predice el futuro; solo genera hipótesis catastróficas para intentar protegerte. No todo lo que piensas es verdad."
                </p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  2. ¿Qué probabilidad real tiene?
                </span>
                <p className="text-xs text-slate-300">
                  "El 85% de las cosas que tememos nunca ocurren. Y en el 15% restante, nuestros recursos de afrontamiento son mucho más fuertes de lo que imaginamos."
                </p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  3. Acción Inmediata
                </span>
                <p className="text-xs text-slate-300">
                  "Pregúntate: ¿Qué pequeña acción física puedo hacer en los próximos 5 minutos que esté 100% bajo mi control?"
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Entendido • Regresar al Presente</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
