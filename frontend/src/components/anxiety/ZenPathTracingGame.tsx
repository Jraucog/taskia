import React, { useState, useEffect, useRef } from 'react';
import { Compass, Volume2, VolumeX, Check, RotateCcw, X, Sparkles } from 'lucide-react';
import { zenAudio } from '../../services/zenAudio';
import { haptics } from '../../services/haptics';
import { saveZenSessionRecord } from '../../services/anxietyService';

interface ZenPathTracingGameProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (completedCycles: number) => void;
}

export const ZenPathTracingGame: React.FC<ZenPathTracingGameProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [completedCycles, setCompletedCycles] = useState<number>(0);
  const [isTracing, setIsTracing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      setCompletedCycles(0);
      setProgressPercent(0);
      setSessionSeconds(0);
    } else {
      zenAudio.stopTraceHum();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setSessionSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Dibujar el camino infinito (lemniscata / símbolo de infinito ∞) en el canvas
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const a = width * 0.38; // escala lemniscata

    ctx.clearRect(0, 0, width, height);

    // 1. Dibujar pista base suave
    ctx.beginPath();
    ctx.lineWidth = 14;
    ctx.strokeStyle = 'rgba(79, 70, 229, 0.15)';
    ctx.lineCap = 'round';
    for (let t = 0; t <= Math.PI * 2; t += 0.02) {
      const denom = 1 + Math.sin(t) * Math.sin(t);
      const x = centerX + (a * Math.cos(t)) / denom;
      const y = centerY + (a * Math.sin(t) * Math.cos(t)) / denom;
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 2. Dibujar estela activa según el ángulo actual
    ctx.beginPath();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 12;
    const maxT = angleRef.current;
    for (let t = 0; t <= maxT; t += 0.04) {
      const denom = 1 + Math.sin(t) * Math.sin(t);
      const x = centerX + (a * Math.cos(t)) / denom;
      const y = centerY + (a * Math.sin(t) * Math.cos(t)) / denom;
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 3. Orbe guía luminoso en la punta
    const curDenom = 1 + Math.sin(maxT) * Math.sin(maxT);
    const orbX = centerX + (a * Math.cos(maxT)) / curDenom;
    const orbY = centerY + (a * Math.sin(maxT) * Math.cos(maxT)) / curDenom;

    ctx.beginPath();
    ctx.arc(orbX, orbY, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [isOpen, progressPercent]);

  // Manejo del puntero / toque para trazar
  const handlePointerDown = () => {
    setIsTracing(true);
    haptics.tap();
    if (soundEnabled) {
      zenAudio.startTraceHum(432);
    }
  };

  const handlePointerMove = (_e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isTracing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Avanzar ángulo según la interacción
    angleRef.current += 0.05;
    const currentT = angleRef.current;
    const cycle = Math.floor(currentT / (Math.PI * 2));
    const currentPercent = Math.round(((currentT % (Math.PI * 2)) / (Math.PI * 2)) * 100);

    setProgressPercent(currentPercent);

    // Modular la frecuencia senoidal con el movimiento (432Hz +- 30Hz)
    if (soundEnabled) {
      const modulatedPitch = 432 + Math.sin(currentT) * 24;
      zenAudio.updateTraceHumFrequency(modulatedPitch);
    }

    if (cycle > completedCycles) {
      setCompletedCycles(cycle);
      haptics.impact();
      if (soundEnabled) {
        zenAudio.playBubbleChime(cycle % 7);
      }
    }
  };

  const handlePointerUp = () => {
    setIsTracing(false);
    zenAudio.stopTraceHum();
  };

  const handleFinish = () => {
    zenAudio.stopTraceHum();
    if (soundEnabled) {
      zenAudio.playZenCompletionChord();
    }
    haptics.success();
    saveZenSessionRecord({
      date: new Date().toISOString().split('T')[0],
      gameType: 'zen_trace',
      durationSeconds: sessionSeconds,
      metricAchieved: completedCycles,
    });
    if (onComplete) {
      onComplete(completedCycles);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-3 sm:p-4 select-none animate-fade-in">
      <div className="w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col relative overflow-hidden">
        {/* Cabecera y Controles */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-700/60 text-cyan-300">
              <Compass className="w-4 h-4" />
            </span>
            <div className="text-left">
              <h3 className="text-sm font-bold text-white leading-tight">Zen Path Tracing</h3>
              <p className="text-[11px] text-cyan-400 font-medium">
                Trazado infinito con resonancia de 432Hz
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
                soundEnabled ? 'text-cyan-300 bg-cyan-950/80 border border-cyan-700/50' : 'text-slate-500 bg-slate-800/60'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                zenAudio.stopTraceHum();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/50 hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Indicador de Ciclos y Calma */}
        <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 mb-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Ciclos Completados</span>
            <span className="text-lg font-black font-mono text-cyan-400">
              {completedCycles} {completedCycles === 1 ? 'órbita' : 'órbitas'}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Progreso de Órbita</span>
            <span className="text-xs font-mono font-bold text-white">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Lienzo Interactivo Lemniscata ∞ */}
        <div className="relative w-full aspect-square max-h-[300px] bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden touch-none">
          <canvas
            ref={canvasRef}
            width={340}
            height={300}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="w-full h-full cursor-pointer select-none"
          />

          {!isTracing && (
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
              <div className="bg-slate-900/90 border border-cyan-500/40 px-4 py-2 rounded-xl text-center shadow-xl">
                <Sparkles className="w-4 h-4 text-cyan-400 mx-auto mb-1 animate-pulse" />
                <span className="text-xs font-bold text-white block">
                  Mantén presionado y traza suavemente
                </span>
                <span className="text-[10px] text-cyan-300/80">
                  Sincroniza tu respiración con el sonido continuo
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Barra Inferior */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => {
              angleRef.current = 0;
              setCompletedCycles(0);
              setProgressPercent(0);
              haptics.selection();
            }}
            className="p-3 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-xl transition flex items-center justify-center active:scale-95"
            title="Reiniciar trazado"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleFinish}
            className="flex-1 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40 active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Listo • Finalizar Sesión ({completedCycles} órbitas)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
