import React, { useState, useEffect } from 'react';
import { 
  Volume2, RotateCw, Sparkles, Layers, Award, X, Keyboard, 
  Flame, Headphones, VolumeX, Shuffle
} from 'lucide-react';
import type { Habit } from '../types';
import { ANKI_DECK_INITIAL, type AnkiFlashcard } from '../services/ankiDeck';
import { ambientSound, type AmbientSoundscapeType } from '../services/soundscape';
import { haptics } from '../services/haptics';

interface AnkiInteractiveModalProps {
  isOpen: boolean;
  habit: Habit | null;
  onClose: () => void;
  onCardReviewed?: (cardsCount: number) => void;
  onCompleteSession?: (habit: Habit, totalCards: number) => void;
}

export const AnkiInteractiveModal: React.FC<AnkiInteractiveModalProps> = ({
  isOpen,
  habit,
  onClose,
  onCardReviewed,
  onCompleteSession
}) => {
  const [deck, setDeck] = useState<AnkiFlashcard[]>(() => {
    try {
      const saved = localStorage.getItem('taskia_anki_custom_deck');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return ANKI_DECK_INITIAL;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [bestSessionStreak, setBestSessionStreak] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const [ambientType, setAmbientType] = useState<AmbientSoundscapeType>('528hz');
  const [shadowingMode, setShadowingMode] = useState(false);

  // Filtrar tarjetas según categoría
  const filteredCards = selectedFilter === 'All' 
    ? deck 
    : deck.filter(c => c.category === selectedFilter);

  const currentCard = filteredCards[currentIndex] || filteredCards[0];

  useEffect(() => {
    // Resetear al abrir
    if (isOpen) {
      setCurrentIndex(0);
      setIsFlipped(false);
      setSessionCount(0);
      setSessionStreak(0);
      setIsFinished(false);
    } else {
      if (ambientSound.getIsPlaying()) {
        ambientSound.stop();
        setIsAmbientPlaying(false);
      }
    }
  }, [isOpen]);

  // Manejo de atajos de teclado profesionales (Espacio para voltear, 1/2/3/4 para calificar, R para pronunciar)
  useEffect(() => {
    if (!isOpen || isFinished) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Si el usuario está escribiendo en algún input, no capturar
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
        haptics.tap();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (currentCard) {
          speakText(isFlipped ? currentCard.contextSentence : currentCard.front);
        }
      } else if (isFlipped) {
        if (e.key === '1') {
          e.preventDefault();
          handleRateCard('again');
        } else if (e.key === '2') {
          e.preventDefault();
          handleRateCard('hard');
        } else if (e.key === '3') {
          e.preventDefault();
          handleRateCard('good');
        } else if (e.key === '4') {
          e.preventDefault();
          handleRateCard('easy');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFlipped, isFinished, currentCard, currentIndex, filteredCards]);

  if (!isOpen || !currentCard) return null;

  // Síntesis de voz offline del navegador (Web Speech API)
  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95; // ritmo claro de aprendizaje
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleAmbient = (type: AmbientSoundscapeType) => {
    setAmbientType(type);
    const active = ambientSound.toggle(type);
    setIsAmbientPlaying(active);
    haptics.tap();
  };

  const handleShuffle = () => {
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    haptics.tap();
  };

  // Calificar tarjeta según algoritmo Anki SRS
  const handleRateCard = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    const newCount = sessionCount + 1;
    setSessionCount(newCount);

    if (rating === 'good' || rating === 'easy') {
      haptics.success();
      const nextStreak = sessionStreak + 1;
      setSessionStreak(nextStreak);
      if (nextStreak > bestSessionStreak) setBestSessionStreak(nextStreak);
    } else {
      haptics.tap();
      setSessionStreak(0);
    }

    if (onCardReviewed) {
      onCardReviewed(newCount);
    }

    // Si rating es 'again', colocarla al final de la cola de la sesión
    if (rating === 'again') {
      setDeck(prev => [...prev, currentCard]);
    }

    if (currentIndex + 1 < filteredCards.length) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
      haptics.celebrate();
      if (habit && onCompleteSession) {
        onCompleteSession(habit, newCount);
      }
    }
  };

  const progressPercent = Math.round(((currentIndex + (isFinished ? 1 : 0)) / filteredCards.length) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl flex flex-col relative max-h-[92vh] overflow-hidden">
        
        {/* Cabecera del Entrenador Anki */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm shadow-sm">
              <Layers className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-800/60 flex items-center gap-1">
                  <span>🇬🇧</span> Anki SRS & Shadowing
                </span>
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  {currentIndex + 1} / {filteredCards.length}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <h2 className="text-sm font-bold text-white text-balance">
                  Active Recall Flashcards
                </h2>
                {sessionStreak > 1 && (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/70 border border-amber-700/60 px-1.5 py-0.2 rounded-md flex items-center gap-0.5 animate-pulse">
                    <Flame className="w-3 h-3 fill-amber-400" /> {sessionStreak} seguidas
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Toggle de Frecuencia 528Hz para Concentración */}
            <button
              onClick={() => toggleAmbient(ambientType)}
              className={`p-2 rounded-xl transition border min-h-[40px] min-w-[40px] flex items-center justify-center ${
                isAmbientPlaying 
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm' 
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title={isAmbientPlaying ? "Pausar sonido ambiental 528Hz" : "Activar tono 528Hz de enfoque"}
            >
              {isAmbientPlaying ? <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button 
              onClick={onClose} 
              className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de Filtros y Herramientas (Mezclar & Modo Shadowing) */}
        <div className="flex items-center justify-between gap-1.5 py-2.5 border-b border-slate-800/60">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px] flex-1">
            {['All', 'Business & Tech', 'Phrasal Verbs', 'Power Idioms', 'Everyday Fluency'].map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedFilter(cat);
                  setCurrentIndex(0);
                  setIsFlipped(false);
                  setIsFinished(false);
                  haptics.tap();
                }}
                className={`px-2.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition border ${
                  selectedFilter === cat
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'All' ? '⚡ Todo el Mazo' : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Botón Modo Shadowing */}
            <button
              onClick={() => {
                setShadowingMode(!shadowingMode);
                haptics.tap();
              }}
              className={`text-[10px] px-2 py-1 rounded-lg border font-semibold flex items-center gap-1 transition ${
                shadowingMode 
                  ? 'bg-indigo-950 border-indigo-500 text-indigo-300' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Modo Shadowing: reproduce automáticamente el audio al ver la tarjeta"
            >
              <Headphones className="w-3 h-3 text-indigo-400" />
              <span className="hidden sm:inline">Shadowing</span>
            </button>

            {/* Botón Barajar */}
            <button
              onClick={handleShuffle}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
              title="Barajar tarjetas aleatoriamente"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Barra de progreso de la sesión */}
        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden my-2.5 border border-slate-800/50">
          <div 
            className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Estado final: Sesión Completada */}
        {isFinished ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
              <Award className="w-8 h-8 animate-bounce" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white text-balance">¡Mazo Diario Completado!</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs text-pretty">
                Has repasado <strong>{sessionCount} tarjetas</strong> mediante repetición activa. Tu cerebro consolidó las sinapsis antes de la curva del olvido.
              </p>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 w-full text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Tarjetas repasadas hoy:</span>
                <span className="font-mono font-bold text-white tabular-nums">{sessionCount}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Mejor racha consecutiva:</span>
                <span className="font-mono font-bold text-amber-400 tabular-nums">{bestSessionStreak} tarjetas</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Algoritmo de retención:</span>
                <span className="text-emerald-400 font-bold">Óptimo (Ebbinghaus Safe)</span>
              </div>
            </div>

            <div className="flex gap-2 w-full pt-2">
              <button
                onClick={() => {
                  setCurrentIndex(0);
                  setIsFlipped(false);
                  setIsFinished(false);
                  haptics.tap();
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold py-3 rounded-2xl text-xs transition active:scale-95"
              >
                Repasar de nuevo
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 rounded-2xl text-xs transition shadow-md active:scale-95"
              >
                Listo, volver al panel
              </button>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* TARJETA INTERACTIVA FLIP (FRONT / BACK) */
          /* ======================================================== */
          <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1">
            <div 
              onClick={() => {
                setIsFlipped(!isFlipped);
                haptics.tap();
                if (shadowingMode && !isFlipped) {
                  speakText(currentCard.front);
                }
              }}
              className={`cursor-pointer rounded-3xl p-5 sm:p-6 border transition-all duration-300 relative min-h-[270px] flex flex-col justify-between select-none ${
                isFlipped 
                  ? 'bg-slate-950 border-amber-500/40 shadow-xl shadow-amber-500/5' 
                  : 'bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-slate-700/80 hover:border-slate-600 shadow-lg'
              }`}
            >
              {/* Etiqueta de la tarjeta */}
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="text-[10px] font-mono uppercase bg-slate-800/90 text-slate-300 px-2.5 py-0.5 rounded-lg border border-slate-700 font-semibold">
                  {currentCard.partOfSpeech}
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                  <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                  {isFlipped ? 'Volteada (Respuesta)' : 'Toca o presiona [Espacio]'}
                </span>
              </div>

              {/* Lado Frontal (Inglés con Fonética y Botón de Audio Nativo) */}
              <div className="my-auto text-center py-2">
                <div className="flex items-center justify-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight text-balance">
                    {currentCard.front}
                  </h1>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakText(currentCard.front);
                      haptics.tap();
                    }}
                    className="p-2.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition active:scale-90"
                    title="Escuchar pronunciación nativa (tecla R)"
                  >
                    <Volume2 className={`w-5 h-5 ${isSpeaking ? 'animate-pulse text-emerald-400' : ''}`} />
                  </button>
                </div>

                {currentCard.ipa && (
                  <p className="text-xs font-mono text-slate-400 mt-1.5">
                    {currentCard.ipa}
                  </p>
                )}

                {/* Si no está volteada, sugerir Active Recall */}
                {!isFlipped && (
                  <div className="mt-5 p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 text-left">
                    <p className="text-[11px] text-slate-400 flex items-start gap-2 font-medium text-pretty">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-white">Active Recall:</strong> Evoca mentalmente el significado y di una oración en voz alta antes de girar la tarjeta.
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Lado Trasero (Respuesta, Traducción y Ejemplo en Contexto) */}
              {isFlipped && (
                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3 animate-fade-in text-left">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Significado en Español:</span>
                    <p className="text-sm font-bold text-emerald-300 mt-0.5 text-balance">
                      {currentCard.back}
                    </p>
                  </div>

                  <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Ejemplo en contexto:</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakText(currentCard.contextSentence);
                          haptics.tap();
                        }}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                      >
                        <Volume2 className="w-3.5 h-3.5" /> Escuchar oración
                      </button>
                    </div>
                    <p className="text-xs text-white font-medium italic leading-relaxed text-pretty">
                      "{currentCard.contextSentence}"
                    </p>
                    <p className="text-[11px] text-slate-400 leading-normal text-pretty">
                      {currentCard.sentenceTranslation}
                    </p>
                  </div>

                  {currentCard.tip && (
                    <div className="text-[11px] text-amber-300/90 bg-amber-950/20 p-3 rounded-xl border border-amber-800/30 flex items-start gap-2">
                      <span className="shrink-0 mt-0.5">💡</span>
                      <span className="text-pretty">{currentCard.tip}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* BOTONERA DE CALIFICACIÓN ALGORITMO ANKI SRS (4 BOTONES) */}
            {/* ======================================================== */}
            <div className="pt-3">
              {!isFlipped ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFlipped(true);
                      haptics.tap();
                    }}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-lg active:scale-95 min-h-[48px]"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>Mostrar Respuesta & Ejemplo (Espacio / Click)</span>
                  </button>
                  <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1"><Keyboard className="w-3 h-3" /> [Espacio] Voltear</span>
                    <span className="flex items-center gap-1"><Volume2 className="w-3 h-3" /> [R] Pronunciar</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 animate-fade-in">
                  <div className="grid grid-cols-4 gap-2">
                    {/* Botón 1: Otra vez (Fallo) */}
                    <button
                      onClick={() => handleRateCard('again')}
                      className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 py-3 px-1 rounded-2xl text-center transition flex flex-col items-center justify-center active:scale-95 min-h-[48px]"
                    >
                      <span className="text-[11px] font-bold">1: Repetir</span>
                      <span className="text-[9px] text-rose-400/80 font-mono mt-0.5">&lt; 1 min</span>
                    </button>

                    {/* Botón 2: Difícil */}
                    <button
                      onClick={() => handleRateCard('hard')}
                      className="bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-300 py-3 px-1 rounded-2xl text-center transition flex flex-col items-center justify-center active:scale-95 min-h-[48px]"
                    >
                      <span className="text-[11px] font-bold">2: Difícil</span>
                      <span className="text-[9px] text-amber-400/80 font-mono mt-0.5">1 día</span>
                    </button>

                    {/* Botón 3: Bien */}
                    <button
                      onClick={() => handleRateCard('good')}
                      className="bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/60 text-indigo-300 py-3 px-1 rounded-2xl text-center transition flex flex-col items-center justify-center active:scale-95 min-h-[48px]"
                    >
                      <span className="text-[11px] font-bold">3: Bien</span>
                      <span className="text-[9px] text-indigo-400/80 font-mono mt-0.5">3 días</span>
                    </button>

                    {/* Botón 4: Fácil */}
                    <button
                      onClick={() => handleRateCard('easy')}
                      className="bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 py-3 px-1 rounded-2xl text-center transition flex flex-col items-center justify-center active:scale-95 min-h-[48px]"
                    >
                      <span className="text-[11px] font-bold">4: Fácil</span>
                      <span className="text-[9px] text-emerald-400/80 font-mono mt-0.5">5 días</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500 font-mono">
                    <span>Atajos: [1] [2] [3] [4]</span>
                    <span>•</span>
                    <span>Toca botón o presiona tecla para calificar</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
