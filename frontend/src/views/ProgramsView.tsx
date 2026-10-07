import React from 'react';
import { Sparkles, Zap, Search, ChevronDown, ChevronRight, Clock, Eye, Play } from 'lucide-react';
import type { Program } from '../types';

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
  onNavigateInject
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

      <div className="space-y-3">
        {programs
          .filter(p => {
            const matchesCategory = selectedCatalogCategory === 'all' || p.category.toLowerCase().includes(selectedCatalogCategory.toLowerCase());
            const matchesSearch = !catalogSearchQuery.trim() || 
              p.title.toLowerCase().includes(catalogSearchQuery.toLowerCase()) || 
              p.description.toLowerCase().includes(catalogSearchQuery.toLowerCase()) ||
              p.category.toLowerCase().includes(catalogSearchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
          })
          .map((program) => (
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

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
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
        ))}
      </div>
    </div>
  );
};
