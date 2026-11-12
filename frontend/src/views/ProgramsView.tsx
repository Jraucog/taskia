import React from 'react';
import { Sparkles, Zap, Search, ChevronDown, ChevronRight, Clock, Eye, Play } from 'lucide-react';
import type { Program } from '../types';
import { normalizeSearchText } from '../services/storageSync';

interface ProgramsViewProps {
  programs: Program[];
  catalogSearchQuery: string;
  setCatalogSearchQuery: (query: string) => void;
  selectedCatalogCategory: string;
  setSelectedCatalogCategory: (cat: string) => void;
  collapsedBlocks: Record<string, boolean>;
  toggleBlockCollapse: (key: string) => void;
  setPreviewProgram: (program: Program) => void;
  handleEnroll: (programId: number) => void;
  onNavigateInject: () => void;
  onStartAnkiSession?: (program?: Program) => void;
}

export const ProgramsView: React.FC<ProgramsViewProps> = ({
  programs,
  catalogSearchQuery,
  setCatalogSearchQuery,
  selectedCatalogCategory,
  setSelectedCatalogCategory,
  collapsedBlocks,
  toggleBlockCollapse,
  setPreviewProgram,
  handleEnroll,
  onNavigateInject,
  onStartAnkiSession
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Catálogo de Programas
          </h2>
          <p className="text-xs text-slate-400">Explora o previsualiza plantillas antes de activarlas</p>
        </div>
        <div className="flex items-center gap-1.5">
          {onNavigateInject && (
            <button
              onClick={onNavigateInject}
              className="text-[10px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 px-2 py-1 rounded-xl flex items-center gap-1 transition"
              title="Herramienta avanzada: Inyector de Programas JSON"
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">Avanzado</span>
            </button>
          )}
          <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-2 py-1 rounded-xl">
            {programs.length} plantillas
          </span>
        </div>
      </div>

      {/* Búsqueda en Catálogo */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input
          type="text"
          value={catalogSearchQuery}
          onChange={(e) => setCatalogSearchQuery(e.target.value)}
          placeholder="Buscar programa o plantilla..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60 placeholder:text-slate-600 transition"
        />
        {catalogSearchQuery && (
          <button onClick={() => setCatalogSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs">✕</button>
        )}
      </div>

      {/* Barra de Filtros por Categoría */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {[
          { id: 'all', label: 'Todas las Plantillas' },
          { id: 'Idiomas', label: '🇬🇧 Inglés & Método Anki' },
          { id: 'Respiración', label: '🫁 Respiración & Estrés' },
          { id: 'Fuerza', label: '🦵 TRX & Aquiles' },
          { id: 'Disciplina', label: '✍️ Brian Tracy (Fórmula 3P)' },
          { id: 'Software', label: '💻 Software & 100M' },
          { id: 'Sueño', label: '🌙 Sueño & Circadiano' },
          { id: 'Nutrición', label: '🥗 Nutrición & 85kg' },
          { id: 'Música', label: '🎵 Producción Musical' },
          { id: 'Hogar', label: '🏡 Hogar & Proyectos' },
          { id: 'Desarrollo', label: '🌅 Mañanas SAVERS' },
          { id: 'Foco', label: '⚡ Desintoxicación Dopamina' }
        ].map((categoryItem) => {
          const cat = categoryItem.id;
          const label = categoryItem.label;
          const isSelected = selectedCatalogCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCatalogCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition border ${
                isSelected
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* BANNER DESTACADO SI ESTÁ EN CATEGORÍA INGLÉS O BUSCANDO ANKI */}
      {(normalizeSearchText(selectedCatalogCategory) === 'idiomas' || 
        normalizeSearchText(catalogSearchQuery).includes('anki') || 
        normalizeSearchText(catalogSearchQuery).includes('ingles')) && onStartAnkiSession && (
        <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-indigo-950/60 border border-amber-500/40 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-800/50">
                  🇬🇧 Mazo Interactivo Disponible
                </span>
                <span className="text-[10px] text-slate-400 font-mono">25 Flashcards SRS</span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">Entrenador de Flashcards Anki & Shadowing</h3>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Repetición espaciada con algoritmo Anki (Again, Hard, Good, Easy), audio nativo con síntesis de voz, modo Shadowing y frecuencia 528Hz.
              </p>
            </div>
          </div>
          <button
            onClick={() => onStartAnkiSession()}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-5 py-3 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 shrink-0 active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Practicar Flashcards Ahora</span>
          </button>
        </div>
      )}

      <div className="space-y-3">
        {(() => {
          const q = normalizeSearchText(catalogSearchQuery);
          const selectedNorm = normalizeSearchText(selectedCatalogCategory);

          const filtered = programs.filter(p => {
            const titleNorm = normalizeSearchText(p.title);
            const descNorm = normalizeSearchText(p.description || '');
            const catNorm = normalizeSearchText(p.category || '');

            // Coincidencia de categoría (insensible a tildes)
            const matchesCategory = selectedCatalogCategory === 'all' || 
              catNorm.includes(selectedNorm) ||
              (selectedNorm === 'idiomas' && (titleNorm.includes('anki') || titleNorm.includes('ingles') || catNorm.includes('idioma')));

            // Coincidencia de búsqueda (en título, descripción, categoría y en cualquiera de sus ítems internos)
            const matchesSearch = !q ||
              titleNorm.includes(q) ||
              descNorm.includes(q) ||
              catNorm.includes(q) ||
              (p.items && p.items.some(it => 
                normalizeSearchText(it.title).includes(q) || 
                normalizeSearchText(it.description || '').includes(q)
              ));

            return matchesCategory && matchesSearch;
          });

          if (filtered.length === 0) {
            return (
              <div className="text-center py-12 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-6">
                <p className="text-sm font-semibold text-slate-300">No se encontraron programas con "{catalogSearchQuery}"</p>
                <p className="text-xs text-slate-500 mt-1">Prueba seleccionando otra categoría o borrando la búsqueda.</p>
                <button
                  onClick={() => {
                    setCatalogSearchQuery('');
                    setSelectedCatalogCategory('all');
                  }}
                  className="mt-3 text-xs bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl transition"
                >
                  Restablecer filtros
                </button>
              </div>
            );
          }

          return filtered.map((program) => {
            const isAnkiProg = normalizeSearchText(program.title).includes('anki') || 
                               normalizeSearchText(program.title).includes('ingles') || 
                               normalizeSearchText(program.category).includes('idioma');

            return (
              <div key={program.id} className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-800/50">
                      {program.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{program.duration_days} días</span>
                  </div>
                  <h3 className="font-bold text-sm text-white">{program.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-3">{program.description}</p>
                  
                  {/* Botón para colapsar / expandir lista de ejercicios */}
                  <button 
                    onClick={() => toggleBlockCollapse(`prog_${program.id}`)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 mb-3"
                  >
                    {collapsedBlocks[`prog_${program.id}`] ? 'Ocultar desglose' : `Ver ${program.items?.length || 0} hábitos/ítems incluidos`}
                    {collapsedBlocks[`prog_${program.id}`] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>

                  {collapsedBlocks[`prog_${program.id}`] && (
                    <div className="space-y-1.5 mb-3 max-h-52 overflow-y-auto pr-1">
                      {program.items?.map((it, idx) => (
                        <div key={it.id || idx} className="text-[11px] bg-slate-950/80 border border-slate-800/60 p-2.5 rounded-xl text-slate-300 flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-white">{it.title}</p>
                            {it.description && <p className="text-[10px] text-slate-400 mt-0.5">{it.description}</p>}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[10px] text-amber-400 font-mono font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              {it.target_value} {it.unit}
                            </span>
                            {it.estimated_minutes ? (
                              <span className="text-[9px] font-mono text-slate-400 flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5 text-indigo-400" />
                                <span>~{it.estimated_minutes}m</span>
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 flex-wrap">
                  {/* Botón directo de Flashcards Anki si el programa corresponde */}
                  {isAnkiProg && onStartAnkiSession && (
                    <button
                      onClick={() => onStartAnkiSession(program)}
                      className="w-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 mb-1 shadow-sm"
                      title="Abrir entrenador interactivo de Flashcards Anki SRS"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>Practicar Flashcards Anki Ahora</span>
                    </button>
                  )}

                  <button 
                    onClick={() => setPreviewProgram(program)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-400" /> Ver Plantilla
                  </button>

                  <button 
                    onClick={() => handleEnroll(program.id)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" /> Inscribirme
                  </button>
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
};
