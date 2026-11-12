import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, VolumeX, Sparkles, Check, RotateCcw, X, Heart } from 'lucide-react';
import { zenAudio } from '../../services/zenAudio';
import { haptics } from '../../services/haptics';
import { saveZenSessionRecord } from '../../services/anxietyService';

interface Bubble {
  id: number;
  x: number; // percentage 5..90
  y: number; // percentage 10..85
  size: number; // px 56..90
  label?: string;
  colorClass: string;
  speed: number;
  pitchIndex: number;
}

const POSITIVE_AFFIRMATIONS = [
  'Paz interior',
  'Calma profunda',
  'Confianza plena',
  'Mente clara',
  'Aquí y ahora',
  'Soy suficiente',
  'Todo fluye',
  'Fuerza serena',
  'Gratitud',
  'Respira hondo',
  'Poder interior',
  'Seguridad',
  'Tranquilidad',
  'Claridad',
  'Equilibrio',
  'Amor propio',
  'Enfoque sereno',
  'Aceptación',
  'Luz y paz',
  'Soy capaz',
  'Armonía',
  'Serenidad',
  'Merezco paz',
  'Confío en mí',
  'Paso a paso',
  'Todo está bien'
];

const BUBBLE_COLORS = [
  'from-cyan-400/80 to-blue-500/80 border-cyan-300/60 shadow-cyan-500/30',
  'from-teal-400/80 to-emerald-500/80 border-teal-300/60 shadow-teal-500/30',
  'from-indigo-400/80 to-violet-500/80 border-indigo-300/60 shadow-indigo-500/30',
  'from-pink-400/80 to-rose-500/80 border-rose-300/60 shadow-rose-500/30',
  'from-amber-400/80 to-orange-500/80 border-amber-300/60 shadow-amber-500/30',
];

interface ZenBubblePopGameProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (poppedCount: number) => void;
}

export const ZenBubblePopGame: React.FC<ZenBubblePopGameProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [poppedCount, setPoppedCount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [mode, setMode] = useState<'free' | 'affirmations'>('affirmations');
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const nextIdRef = useRef<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generador de una burbuja individual
  const createBubble = useCallback((): Bubble => {
    const id = nextIdRef.current++;
    const x = Math.floor(Math.random() * 75) + 10;
    const y = Math.floor(Math.random() * 65) + 15;
    const size = Math.floor(Math.random() * 26) + 64; // 64 a 90px
    const colorClass = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
    const speed = 0.4 + Math.random() * 0.6;
    const pitchIndex = Math.floor(Math.random() * 7);
    const label = mode === 'affirmations' 
      ? POSITIVE_AFFIRMATIONS[Math.floor(Math.random() * POSITIVE_AFFIRMATIONS.length)]
      : undefined;

    return { id, x, y, size, label, colorClass, speed, pitchIndex };
  }, [mode]);

  // Inicializar conjunto de burbujas
  useEffect(() => {
    if (isOpen) {
      setPoppedCount(0);
      setSessionSeconds(0);
      const initial: Bubble[] = [];
      for (let i = 0; i < 7; i++) {
        initial.push(createBubble());
      }
      setBubbles(initial);
    }
  }, [isOpen, mode, createBubble]);

  // Temporizador de sesión
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setSessionSeconds(s => s + 1);
    } , 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Flotación suave y reposición continua de burbujas
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setBubbles(prev => {
        // Mover burbujas ligeramente hacia arriba con ondulación
        const updated = prev.map(b => {
          let nextY = b.y - b.speed * 0.7;
          let nextX = b.x + (Math.sin(nextY * 0.1) * 0.4);
          if (nextY < -10) {
            // Reaparece por abajo
            nextY = 95;
            nextX = Math.floor(Math.random() * 75) + 10;
          }
          return { ...b, x: Math.max(5, Math.min(85, nextX)), y: nextY };
        });

        // Mantener siempre entre 6 y 8 burbujas activas
        if (updated.length < 6) {
          updated.push(createBubble());
        }
        return updated;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen, createBubble]);

  const handlePop = (bubble: Bubble) => {
    // 1. Sonido pentatónico suave offline
    if (soundEnabled) {
      zenAudio.playBubbleChime(bubble.pitchIndex);
    }
    // 2. Feedback táctil háptico de micro-impacto
    haptics.impact();

    // 3. Incrementar contador
    setPoppedCount(c => c + 1);

    // 4. Remover burbuja y generar una nueva abajo tras un breve retraso
    setBubbles(prev => prev.filter(b => b.id !== bubble.id));

    setTimeout(() => {
      setBubbles(prev => {
        if (prev.length < 7) {
          return [...prev, createBubble()];
        }
        return prev;
      });
    }, 200);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    zenAudio.setMuted(!next);
    haptics.tap();
  };

  const handleFinish = () => {
    if (soundEnabled) {
      zenAudio.playZenCompletionChord();
    }
    haptics.success();
    saveZenSessionRecord({
      date: new Date().toISOString().split('T')[0],
      gameType: 'bubble_pop',
      durationSeconds: sessionSeconds,
      metricAchieved: poppedCount,
    });
    if (onComplete) {
      onComplete(poppedCount);
    }
    onClose();
  };

  if (!isOpen) return null;

  // Nivel de serenidad alcanzado (cada 5 burbujas aumenta un escalón de calma)
  const calmnessLevel = Math.min(100, Math.round((poppedCount / 20) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-3 sm:p-4 select-none animate-fade-in">
      <div 
        ref={containerRef}
        className="zen-game-card w-full max-w-md h-[86vh] max-h-[720px] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col relative overflow-hidden"
      >
        {/* Luces y auras de fondo meditativas */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Cabecera Superior con Controles */}
        <div className="flex items-center justify-between z-10 mb-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-950/80 border border-teal-700/60 text-teal-300">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
            </span>
            <div className="text-left">
              <h3 className="text-sm font-bold text-white leading-tight">Zen Bubble Pop</h3>
              <p className="text-[11px] text-teal-400 font-medium">
                {mode === 'affirmations' ? 'Integra afirmaciones de paz y fuerza' : 'Modo Calma Libre'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-xl transition ${
                soundEnabled ? 'text-teal-300 bg-teal-950/80 border border-teal-700/50' : 'text-slate-500 bg-slate-800/60'
              }`}
              title={soundEnabled ? "Silenciar arpa" : "Activar arpa 528Hz"}
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

        {/* Selector de Modo y Barra de Serenidad */}
        <div className="z-10 bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800/80 mb-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex gap-1.5">
              <button
                onClick={() => { setMode('affirmations'); haptics.selection(); }}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition ${
                  mode === 'affirmations' 
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Afirmaciones
              </button>
              <button
                onClick={() => { setMode('free'); haptics.selection(); }}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition ${
                  mode === 'free' 
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Flujo Libre
              </button>
            </div>

            <div className="flex items-center gap-1 font-mono text-[11px] text-slate-300">
              <span className="text-teal-400 font-bold">{poppedCount}</span>
              <span className="text-slate-500">integradas</span>
            </div>
          </div>

          {/* Barra de progreso de serenidad */}
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-teal-500 to-indigo-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${calmnessLevel}%` }}
            />
          </div>
        </div>

        {/* Área del Canvas Flotante de Burbujas */}
        <div className="flex-1 relative overflow-hidden rounded-2xl bg-slate-950/60 border border-slate-800/50 touch-none">
          {bubbles.map(bubble => (
            <button
              key={bubble.id}
              onClick={() => handlePop(bubble)}
              style={{
                left: `${bubble.x}%`,
                top: `${bubble.y}%`,
                width: `${bubble.size}px`,
                height: `${bubble.size}px`,
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br ${bubble.colorClass} border backdrop-blur-sm shadow-lg flex items-center justify-center text-center p-2 transition-transform active:scale-90 hover:scale-105 cursor-pointer select-none group`}
            >
              {/* Reflejo de luz en la burbuja */}
              <div className="absolute top-1.5 left-2 w-3 h-2 rounded-full bg-white/50 rotate-[-30deg] pointer-events-none" />
              
              {bubble.label ? (
                <span className="text-[10px] font-bold text-white drop-shadow leading-tight line-clamp-2 px-1">
                  {bubble.label}
                </span>
              ) : (
                <Heart className="w-4 h-4 text-white/80 group-hover:scale-110 transition pointer-events-none" />
              )}
            </button>
          ))}

          {/* Consejo inferior sutil */}
          <div className="absolute bottom-2 inset-x-0 text-center pointer-events-none">
            <span className="text-[10px] text-slate-500 font-medium">
              Toca cada afirmación positiva para integrar su calma con arpa armónica 528Hz
            </span>
          </div>
        </div>

        {/* Barra Inferior de Acción */}
        <div className="flex items-center gap-2 mt-3 z-10">
          <button
            onClick={() => {
              setPoppedCount(0);
              haptics.selection();
            }}
            className="p-3 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-xl transition flex items-center justify-center active:scale-95"
            title="Reiniciar contador"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleFinish}
            className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-teal-900/30 active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Listo • Sesión Zen Completada ({poppedCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
