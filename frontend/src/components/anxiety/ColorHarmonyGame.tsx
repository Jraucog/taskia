import React, { useState, useEffect } from 'react';
import { Palette, Volume2, VolumeX, Check, RotateCcw, X, Sparkles, Award } from 'lucide-react';
import { zenAudio } from '../../services/zenAudio';
import { haptics } from '../../services/haptics';
import { saveZenSessionRecord } from '../../services/anxietyService';

interface ColorTile {
  id: number;
  correctIndex: number;
  color: string;
  isFixed: boolean;
}

interface PaletteConfig {
  id: string;
  name: string;
  colors: string[];
}

const PALETTES: PaletteConfig[] = [
  {
    id: 'sunset',
    name: 'Atardecer Índigo',
    colors: ['#3b1c6e', '#5a228b', '#8e2894', '#be3282', '#e44a67', '#f6724a', '#ffa633']
  },
  {
    id: 'ocean',
    name: 'Océano Pacífico',
    colors: ['#042630', '#0a424a', '#146766', '#228d7d', '#3ab48c', '#62d79d', '#9af7b4']
  },
  {
    id: 'lavender',
    name: 'Lavanda Mística',
    colors: ['#281745', '#45216e', '#673394', '#8a4cb7', '#af6bd8', '#d18df2', '#f3b4ff']
  },
  {
    id: 'emerald',
    name: 'Bosque Zen',
    colors: ['#0f281e', '#164230', '#206144', '#2d845b', '#42a774', '#64cb90', '#95efa9']
  }
];

interface ColorHarmonyGameProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (moves: number) => void;
}

export const ColorHarmonyGame: React.FC<ColorHarmonyGameProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [selectedPaletteIdx, setSelectedPaletteIdx] = useState<number>(0);
  const [tiles, setTiles] = useState<ColorTile[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);

  // Inicializar el tablero desordenando las fichas intermedias
  const initBoard = (paletteIdx: number) => {
    const pal = PALETTES[paletteIdx];
    const total = pal.colors.length;
    const baseTiles: ColorTile[] = pal.colors.map((color, idx) => ({
      id: idx,
      correctIndex: idx,
      color,
      isFixed: idx === 0 || idx === total - 1, // extremos fijos como anclas
    }));

    // Desordenar solo las fichas intermedias
    const middleTiles = baseTiles.slice(1, total - 1);
    // Fisher-Yates shuffle asegurando que no queden ya ordenadas
    for (let i = middleTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [middleTiles[i], middleTiles[j]] = [middleTiles[j], middleTiles[i]];
    }

    const shuffled = [baseTiles[0], ...middleTiles, baseTiles[total - 1]];
    setTiles(shuffled);
    setSelectedIndex(null);
    setMovesCount(0);
    setIsCompleted(false);
  };

  useEffect(() => {
    if (isOpen) {
      initBoard(selectedPaletteIdx);
      setSessionSeconds(0);
    }
  }, [isOpen, selectedPaletteIdx]);

  useEffect(() => {
    if (!isOpen || isCompleted) return;
    const timer = setInterval(() => {
      setSessionSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, isCompleted]);

  // Manejo de intercambio de fichas al tocar
  const handleTileClick = (index: number) => {
    if (isCompleted) return;
    const tile = tiles[index];
    if (tile.isFixed) {
      haptics.tap();
      return;
    }

    if (selectedIndex === null) {
      // Primera selección
      setSelectedIndex(index);
      haptics.selection();
      if (soundEnabled) {
        zenAudio.playBubbleChime(index % 7);
      }
    } else if (selectedIndex === index) {
      // Deseleccionar si toca la misma
      setSelectedIndex(null);
      haptics.tap();
    } else {
      // Intercambiar fichas
      const newTiles = [...tiles];
      const temp = newTiles[selectedIndex];
      newTiles[selectedIndex] = newTiles[index];
      newTiles[index] = temp;

      setTiles(newTiles);
      setSelectedIndex(null);
      setMovesCount(m => m + 1);
      haptics.impact();

      if (soundEnabled) {
        zenAudio.playBubbleChime((index + 2) % 7);
      }

      // Verificar si se completó el gradiente
      const won = newTiles.every((t, i) => t.correctIndex === i);
      if (won) {
        setIsCompleted(true);
        haptics.success();
        if (soundEnabled) {
          zenAudio.playZenCompletionChord();
        }
        saveZenSessionRecord({
          date: new Date().toISOString().split('T')[0],
          gameType: 'color_flow',
          durationSeconds: sessionSeconds,
          metricAchieved: movesCount + 1,
        });
      }
    }
  };

  const handleFinish = () => {
    if (onComplete) {
      onComplete(movesCount);
    }
    onClose();
  };

  if (!isOpen) return null;

  const currentPalette = PALETTES[selectedPaletteIdx];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-3 sm:p-4 select-none animate-fade-in">
      <div className="zen-game-card w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col relative overflow-hidden">
        {/* Cabecera y Controles */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-violet-950/80 border border-violet-700/60 text-violet-300">
              <Palette className="w-4 h-4" />
            </span>
            <div className="text-left">
              <h3 className="text-sm font-bold text-white leading-tight">Color Harmony Flow</h3>
              <p className="text-[11px] text-violet-400 font-medium">
                Armoniza el espectro visual de luz
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
                soundEnabled ? 'text-violet-300 bg-violet-950/80 border border-violet-700/50' : 'text-slate-500 bg-slate-800/60'
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

        {/* Selector de Paletas Zen */}
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-none">
          {PALETTES.map((pal, idx) => (
            <button
              key={pal.id}
              onClick={() => {
                setSelectedPaletteIdx(idx);
                haptics.selection();
              }}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition flex items-center gap-1.5 ${
                selectedPaletteIdx === idx
                  ? 'bg-violet-900/60 text-violet-200 border border-violet-600/70 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span 
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: pal.colors[Math.floor(pal.colors.length / 2)] }}
              />
              <span>{pal.name}</span>
            </button>
          ))}
        </div>

        {/* Tablero de Gradiente Relajante */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 mb-4 flex flex-col items-center">
          <p className="text-[11px] text-slate-400 mb-3 text-center">
            Toca una ficha y luego otra para intercambiarlas hasta formar la transición suave perfecta.
          </p>

          {/* Fichas cromáticas ordenables */}
          <div className="w-full flex flex-col gap-2">
            {tiles.map((tile, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={tile.id}
                  onClick={() => handleTileClick(idx)}
                  style={{ backgroundColor: tile.color }}
                  className={`w-full h-12 rounded-xl transition-all duration-200 flex items-center justify-between px-3 relative shadow-md active:scale-98 ${
                    tile.isFixed ? 'opacity-90 cursor-default ring-1 ring-white/20' : 'cursor-pointer'
                  } ${
                    isSelected ? 'ring-4 ring-white shadow-xl scale-[1.02] z-10' : 'hover:scale-[1.01]'
                  }`}
                >
                  {tile.isFixed && (
                    <span className="w-2 h-2 rounded-full bg-white/70 shadow-sm" title="Ancla fija" />
                  )}
                  {!tile.isFixed && isSelected && (
                    <Sparkles className="w-4 h-4 text-white animate-spin-slow ml-auto" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Muestra del Gradiente Objetivo Suave */}
          <div className="w-full mt-4 pt-3 border-t border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1.5">
              Espectro Armónico Objetivo:
            </span>
            <div 
              className="w-full h-2 rounded-full opacity-60"
              style={{
                background: `linear-gradient(to right, ${currentPalette.colors.join(', ')})`
              }}
            />
          </div>
        </div>

        {/* Banner de Felicitación Zen al Completar */}
        {isCompleted && (
          <div className="bg-emerald-950/70 border border-emerald-500/50 p-3 rounded-2xl mb-4 text-center animate-scale-up">
            <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-xs mb-1">
              <Award className="w-4 h-4" />
              <span>¡Armonía Cromática Perfecta!</span>
            </div>
            <p className="text-[11px] text-emerald-200/90">
              Completado en {movesCount} movimientos. Tu córtex visual ha sincronizado una frecuencia de calma.
            </p>
          </div>
        )}

        {/* Barra Inferior */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              initBoard(selectedPaletteIdx);
              haptics.selection();
            }}
            className="p-3 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-xl transition flex items-center justify-center active:scale-95"
            title="Volver a barajar"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleFinish}
            className={`flex-1 font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
              isCompleted
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{isCompleted ? 'Finalizar y Registrar Calma' : 'Cerrar Juego'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
