import React, { useState } from 'react';
import { BookOpen, Edit3, Plus, Trash2, Check, RotateCcw } from 'lucide-react';
import type { BrianTracyGoal } from '../types';

interface GoalsReferenceModalProps {
  isOpen: boolean;
  goals: BrianTracyGoal[];
  onClose: () => void;
  onUpdateGoals: (newGoals: BrianTracyGoal[]) => void;
  onResetToDefault: () => void;
}

export const GoalsReferenceModal: React.FC<GoalsReferenceModalProps> = ({
  isOpen,
  goals,
  onClose,
  onUpdateGoals,
  onResetToDefault
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableGoals, setEditableGoals] = useState<BrianTracyGoal[]>(goals);
  const [newGoalText, setNewGoalText] = useState('');
  const [newGoalCat, setNewGoalCat] = useState('Salud');
  const [newGoalDate, setNewGoalDate] = useState('31/12/2026');

  // Sincronizar estado editable cuando se abre el modal
  React.useEffect(() => {
    setEditableGoals(goals);
  }, [goals, isOpen]);

  if (!isOpen) return null;

  const handleSaveAll = () => {
    onUpdateGoals(editableGoals);
    setIsEditing(false);
  };

  const handleGoalChange = (id: number, field: keyof BrianTracyGoal, val: any) => {
    setEditableGoals(prev => prev.map(g => g.id === id ? { ...g, [field]: val } : g));
  };

  const handleDeleteGoal = (id: number) => {
    const filtered = editableGoals.filter(g => g.id !== id);
    // Reindexar IDs del 1 al N
    const reindexed = filtered.map((g, idx) => ({ ...g, id: idx + 1 }));
    setEditableGoals(reindexed);
  };

  const handleAddGoal = () => {
    if (!newGoalText.trim()) return;
    const nextId = editableGoals.length + 1;
    const newEntry: BrianTracyGoal = {
      id: nextId,
      text: newGoalText.trim(),
      cat: newGoalCat,
      date: newGoalDate.trim() || 'Meta Anual'
    };
    setEditableGoals([...editableGoals, newEntry]);
    setNewGoalText('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-lg w-full max-h-[88vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">10 Metas de Referencia (Fórmula 3P)</h3>
              <p className="text-[11px] text-slate-400">Personalizadas para tu enfoque y visión</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition ${
                isEditing 
                  ? 'bg-amber-950/80 border-amber-800 text-amber-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isEditing ? 'Volver a modo lectura' : 'Personalizar mis metas'}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isEditing ? 'Modo Edición' : 'Editar Metas'}</span>
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="text-slate-400 hover:text-white text-sm p-1"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="text-[11px] text-amber-300/80 bg-amber-950/30 p-2.5 rounded-xl border border-amber-900/30 my-3 flex items-start justify-between gap-2">
          <div>
            💡 <em>Regla Brian Tracy: Redáctalas en primera persona, tiempo presente y positivo ("Yo peso...", "Yo logro..."). Cada mañana escríbelas de memoria en tu libreta.</em>
          </div>
          {isEditing && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('¿Restablecer las metas sugeridas por defecto?')) {
                  onResetToDefault();
                  setIsEditing(false);
                }
              }}
              className="text-[10px] text-slate-400 hover:text-amber-300 underline shrink-0 flex items-center gap-1"
              title="Restaurar valores de referencia sugeridos"
            >
              <RotateCcw className="w-3 h-3" /> Restaurar
            </button>
          )}
        </div>

        {/* LISTA DE METAS */}
        <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
          {editableGoals.map((goal) => (
            <div key={goal.id} className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 flex items-start gap-2.5">
              <span className="w-5 h-5 shrink-0 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center justify-center mt-1">
                {goal.id}
              </span>

              {isEditing ? (
                <div className="flex-1 space-y-2">
                  <textarea
                    rows={2}
                    value={goal.text}
                    onChange={(e) => handleGoalChange(goal.id, 'text', e.target.value)}
                    className="w-full bg-slate-900 text-xs text-white p-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                    placeholder="Ej. Yo peso 75 kg con excelente salud y vitalidad para el..."
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={goal.date}
                      onChange={(e) => handleGoalChange(goal.id, 'date', e.target.value)}
                      placeholder="Fecha límite (ej. 31/12/2026)"
                      className="bg-slate-900 text-[11px] text-slate-200 px-2 py-1 rounded-lg border border-slate-700 w-32"
                    />
                    <select
                      value={goal.cat}
                      onChange={(e) => handleGoalChange(goal.id, 'cat', e.target.value)}
                      className="bg-slate-900 text-[11px] text-indigo-300 px-2 py-1 rounded-lg border border-slate-700"
                    >
                      <option value="Salud">Salud</option>
                      <option value="Físico">Físico</option>
                      <option value="Deporte">Deporte</option>
                      <option value="Negocios">Negocios</option>
                      <option value="Carrera">Carrera</option>
                      <option value="Finanzas">Finanzas</option>
                      <option value="Hogar">Hogar</option>
                      <option value="Familia">Familia</option>
                      <option value="Creatividad">Creatividad</option>
                      <option value="Música">Música</option>
                      <option value="Software">Software</option>
                      <option value="Espiritual">Espiritual</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="ml-auto text-slate-500 hover:text-red-400 p-1"
                      title="Eliminar meta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <p className="text-xs text-white leading-relaxed font-medium">{goal.text}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                      📅 {goal.date}
                    </span>
                    <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded">
                      {goal.cat}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Formulario rápido para añadir nueva meta si está en modo edición */}
          {isEditing && (
            <div className="p-3 bg-slate-900/90 border border-dashed border-indigo-700/50 rounded-2xl space-y-2 mt-2">
              <span className="text-[11px] font-bold text-indigo-300 block">+ Agregar Meta #{editableGoals.length + 1}</span>
              <input
                type="text"
                value={newGoalText}
                onChange={(e) => setNewGoalText(e.target.value)}
                placeholder="Escribe tu meta en fórmula 3P (Personal, Presente, Positivo)..."
                className="w-full bg-slate-950 text-xs text-white p-2 rounded-xl border border-slate-800 focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newGoalDate}
                  onChange={(e) => setNewGoalDate(e.target.value)}
                  placeholder="Fecha objetivo"
                  className="bg-slate-950 text-[11px] text-slate-200 px-2 py-1 rounded-lg border border-slate-800 w-28"
                />
                <select
                  value={newGoalCat}
                  onChange={(e) => setNewGoalCat(e.target.value)}
                  className="bg-slate-950 text-[11px] text-indigo-300 px-2 py-1 rounded-lg border border-slate-800"
                >
                  <option value="Salud">Salud</option>
                  <option value="Físico">Físico</option>
                  <option value="Negocios">Negocios</option>
                  <option value="Finanzas">Finanzas</option>
                  <option value="Hogar">Hogar</option>
                  <option value="Desarrollo">Desarrollo</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddGoal}
                  disabled={!newGoalText.trim()}
                  className="ml-auto bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs px-3 py-1 rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ACCIONES INFERIORES */}
        <div className="mt-4 pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setEditableGoals(goals);
                  setIsEditing(false);
                }}
                className="py-2.5 px-4 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveAll}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
              >
                <Check className="w-4 h-4" /> Guardar Mis 10 Metas
              </button>
            </>
          ) : (
            <button 
              type="button"
              onClick={onClose}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl transition"
            >
              Cerrar y Volver al Tablero
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
