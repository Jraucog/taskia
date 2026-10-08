import React, { useState, useEffect } from 'react';
import { 
  Volume2, RotateCw, Sparkles, Layers, Award, X
} from 'lucide-react';
import type { Habit } from '../types';
import { ANKI_DECK_INITIAL, type AnkiFlashcard } from '../services/ankiDeck';

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
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [, setDifficultyHistory] = useState<Record<number, 'again' | 'hard' | 'good' | 'easy'>>({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

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
      setIsFinished(false);
    }
  }, [isOpen]);

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

  // Calificar tarjeta según algoritmo Anki SRS
  const handleRateCard = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    const cardId = currentCard.id;
    setDifficultyHistory(prev => ({ ...prev, [cardId]: rating }));
    const newCount = sessionCount + 1;
    setSessionCount(newCount);

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
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm shadow-sm">
              <Layers className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-800/60">
                  Método Anki SRS
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {currentIndex + 1} / {filteredCards.length}
                </span>
              </div>
              <h2 className="text-sm font-bold text-white mt-0.5">
                Active Recall & Spaced Repetition
              </h2>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-750 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filtros de Categorías de Mazo */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 no-scrollbar text-[11px]">
          {['All', 'Business & Tech', 'Phrasal Verbs', 'Power Idioms', 'Everyday Fluency'].map(cat => (
            <button
              key={cat}
              onClick={() => {
                setSelectedFilter(cat);
                setCurrentIndex(0);
                setIsFlipped(false);
                setIsFinished(false);
              }}
              className={`px-2.5 py-1 rounded-xl font-medium whitespace-nowrap transition border ${
                selectedFilter === cat
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat === 'All' ? '⚡ Todo el Mazo' : cat}
            </button>
          ))}
        </div>

        {/* Barra de progreso de la sesión */}
        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mb-3 border border-slate-800/50">
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
              <h3 className="text-lg font-bold text-white">¡Mazo Diario Completado!</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Has repasado <strong>{sessionCount} tarjetas</strong> mediante repetición activa. Tu cerebro consolidó las sinapsis antes de la curva del olvido.
              </p>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 w-full text-left text-xs space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Tarjetas repasadas hoy:</span>
                <span className="font-mono font-bold text-white">{sessionCount}</span>
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
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition"
              >
                Repasar de nuevo
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md"
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
              onClick={() => setIsFlipped(!isFlipped)}
              className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 relative min-h-[260px] flex flex-col justify-between select-none ${
                isFlipped 
                  ? 'bg-slate-950 border-amber-500/40 shadow-lg shadow-amber-500/5' 
                  : 'bg-gradient-to-b from-slate-900 to-slate-950 border-slate-700/80 hover:border-slate-600'
              }`}
            >
              {/* Etiqueta de la tarjeta */}
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="text-[10px] font-mono uppercase bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                  {currentCard.partOfSpeech}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <RotateCw className="w-3 h-3 text-slate-500" />
                  {isFlipped ? 'Volteada (Respuesta)' : 'Toca para voltear'}
                </span>
              </div>

              {/* Lado Frontal (Inglés con Fonética y Botón de Audio Nativo) */}
              <div className="my-auto text-center py-2">
                <div className="flex items-center justify-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {currentCard.front}
                  </h1>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakText(currentCard.front);
                    }}
                    className="p-2 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition active:scale-90"
                    title="Escuchar pronunciación nativa"
                  >
                    <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse text-emerald-400' : ''}`} />
                  </button>
                </div>

                {currentCard.ipa && (
                  <p className="text-xs font-mono text-slate-400 mt-1">
                    {currentCard.ipa}
                  </p>
                )}

                {/* Si no está volteada, sugerir Active Recall */}
                {!isFlipped && (
                  <div className="mt-5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 text-left">
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <strong>Active Recall:</strong> Intenta recordar su significado y cómo usarla en una oración antes de voltear.
                    </p>
                  </div>
                )}
              </div>

              {/* Lado Trasero (Respuesta, Traducción y Ejemplo en Contexto) */}
              {isFlipped && (
                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3 animate-fade-in text-left">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Significado en Español:</span>
                    <p className="text-sm font-bold text-emerald-300 mt-0.5">
                      {currentCard.back}
                    </p>
                  </div>

                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Ejemplo en contexto:</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakText(currentCard.contextSentence);
                        }}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <Volume2 className="w-3 h-3" /> Escuchar oración
                      </button>
                    </div>
                    <p className="text-xs text-white font-medium italic">
                      "{currentCard.contextSentence}"
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {currentCard.sentenceTranslation}
                    </p>
                  </div>

                  {currentCard.tip && (
                    <div className="text-[11px] text-amber-300/90 bg-amber-950/20 p-2.5 rounded-lg border border-amber-800/30 flex items-start gap-1.5">
                      <span className="shrink-0">💡</span>
                      <span>{currentCard.tip}</span>
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
                <button
                  type="button"
                  onClick={() => setIsFlipped(true)}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-lg active:scale-95"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Mostrar Respuesta & Ejemplo (Espacio / Click)</span>
                </button>
              ) : (
                <div className="space-y-1.5 animate-fade-in">
                  <div className="grid grid-cols-4 gap-1.5">
                    {/* Botón 1: Otra vez (Fallo) */}
                    <button
                      onClick={() => handleRateCard('again')}
                      className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 py-2.5 px-1 rounded-xl text-center transition flex flex-col items-center justify-center active:scale-95"
                    >
                      <span className="text-[10px] font-bold">Repetir</span>
                      <span className="text-[9px] text-rose-400/80 font-mono mt-0.5">&lt; 1 min</span>
                    </button>

                    {/* Botón 2: Difícil */}
                    <button
                      onClick={() => handleRateCard('hard')}
                      className="bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-300 py-2.5 px-1 rounded-xl text-center transition flex flex-col items-center justify-center active:scale-95"
                    >
                      <span className="text-[10px] font-bold">Difícil</span>
                      <span className="text-[9px] text-amber-400/80 font-mono mt-0.5">1 día</span>
                    </button>

                    {/* Botón 3: Bien */}
                    <button
                      onClick={() => handleRateCard('good')}
                      className="bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/60 text-indigo-300 py-2.5 px-1 rounded-xl text-center transition flex flex-col items-center justify-center active:scale-95"
                    >
                      <span className="text-[10px] font-bold">Bien</span>
                      <span className="text-[9px] text-indigo-400/80 font-mono mt-0.5">3 días</span>
                    </button>

                    {/* Botón 4: Fácil */}
                    <button
                      onClick={() => handleRateCard('easy')}
                      className="bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 py-2.5 px-1 rounded-xl text-center transition flex flex-col items-center justify-center active:scale-95"
                    >
                      <span className="text-[10px] font-bold">Fácil</span>
                      <span className="text-[9px] text-emerald-400/80 font-mono mt-0.5">5 días</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 text-center">
                    Califica según tu esfuerzo mental para programar el próximo intervalo espaciado.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
