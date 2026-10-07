import React from 'react';
import { Edit3, Plus, Clock, Check, Trash2, Bell } from 'lucide-react';
import type { Habit } from '../types';

export interface HabitFormData {
  planName: string;
  title: string;
  description: string;
  habit_type: 'boolean' | 'numeric';
  target_value: number;
  unit: string;
  estimated_minutes: number;
  reminder_time: string; // Formato "HH:mm" o ""
  frequency_type: string;
  days_of_week: string;
  sla_target_percent: number;
  reset_on_miss: boolean;
}

interface HabitFormModalProps {
  isOpen: boolean;
  editingHabit: Habit | null;
  formData: HabitFormData;
  planSummaryList: { name: string }[];
  onFormDataChange: (data: HabitFormData) => void;
  onClose: () => void;
  onSave: () => void;
  onDelete: (habitId: number, title: string) => void;
}

export const HabitFormModal: React.FC<HabitFormModalProps> = ({
  isOpen,
  editingHabit,
  formData,
  planSummaryList,
  onFormDataChange,
  onClose,
  onSave,
  onDelete
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-md w-full shadow-2xl flex flex-col gap-3.5 max-h-[92vh] overflow-y-auto">
        {/* Header del Modal */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            {editingHabit ? <Edit3 className="w-4 h-4 text-indigo-400" /> : <Plus className="w-4 h-4 text-emerald-400" />}
            {editingHabit ? 'Editar Hábito / Tarea' : 'Crear Nuevo Hábito o Plan'}
          </h3>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white text-sm p-1"
          >
            ✕
          </button>
        </div>

        {/* Selector de Plan o Categoría */}
        <div>
          <label className="text-[11px] font-bold text-slate-300 block mb-1">
            Carpeta / Plan al que Pertenece
          </label>
          <input
            type="text"
            list="existing-plans"
            value={formData.planName}
            onChange={(e) => onFormDataChange({ ...formData, planName: e.target.value })}
            placeholder="ej. Rehabilitación Aquiles, Brian Tracy 10 Metas, Hábitos Personales..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
          <datalist id="existing-plans">
            {planSummaryList.map(p => (
              <option key={p.name} value={p.name} />
            ))}
          </datalist>
          <p className="text-[10px] text-slate-500 mt-1">
            Escribe un nombre nuevo para crear un nuevo plan, o selecciona uno existente para agruparlo.
          </p>
        </div>

        {/* Título de la Tarea / Hábito */}
        <div>
          <label className="text-[11px] font-bold text-slate-300 block mb-1">
            Nombre de la Tarea / Hábito *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => onFormDataChange({ ...formData, title: e.target.value })}
            placeholder="ej. Sentadillas con TRX, Escribir 10 Metas 3P, Respiración 4-7-8..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Descripción / Indicaciones Técnicas */}
        <div>
          <label className="text-[11px] font-bold text-slate-300 block mb-1">
            Descripción o Indicación Técnica
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
            placeholder="ej. 3 series de 10 reps controladas en 3-4 segundos de bajada..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 h-20"
          />
        </div>

        {/* Tiempo Estimado (minutos) */}
        <div>
          <label className="text-[11px] font-bold text-slate-300 block mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-indigo-400" />
            <span>Tiempo Estimado para Completarla (minutos) *</span>
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="number"
              min="1"
              max="180"
              value={formData.estimated_minutes}
              onChange={(e) => onFormDataChange({ ...formData, estimated_minutes: Number(e.target.value) || 5 })}
              placeholder="ej. 5, 10, 25..."
              className="w-28 bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
            <div className="flex items-center gap-1 flex-wrap">
              {[3, 5, 10, 15, 25, 45].map(min => (
                <button
                  key={min}
                  type="button"
                  onClick={() => onFormDataChange({ ...formData, estimated_minutes: min })}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                    formData.estimated_minutes === min
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {min}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hora Programada de Recordatorio Diaria (Opcional) */}
        <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Hora de Recordatorio Fijo (Notificación Coach)</span>
            </label>
            {formData.reminder_time && (
              <button
                type="button"
                onClick={() => onFormDataChange({ ...formData, reminder_time: '' })}
                className="text-[10px] text-slate-400 hover:text-red-400 underline"
              >
                Quitar alarma
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="time"
              value={formData.reminder_time || ''}
              onChange={(e) => onFormDataChange({ ...formData, reminder_time: e.target.value })}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { time: '07:00', label: '07:00 AM' },
                { time: '13:00', label: '01:00 PM' },
                { time: '18:00', label: '06:00 PM' },
                { time: '21:00', label: '09:00 PM' }
              ].map(preset => (
                <button
                  key={preset.time}
                  type="button"
                  onClick={() => onFormDataChange({ ...formData, reminder_time: preset.time })}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                    formData.reminder_time === preset.time
                      ? 'bg-amber-600 border-amber-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            A esta hora exacta, tu coach te enviará un recordatorio al móvil para entrar directo a cumplir esta tarea.
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Tipo de Registro
            </label>
            <select
              value={formData.habit_type}
              onChange={(e) => onFormDataChange({ ...formData, habit_type: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none"
            >
              <option value="boolean">Check Sí / No</option>
              <option value="numeric">Numérico / Series / Minutos</option>
            </select>
          </div>

          {formData.habit_type === 'numeric' ? (
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Meta</label>
                <input
                  type="number"
                  min="1"
                  value={formData.target_value}
                  onChange={(e) => onFormDataChange({ ...formData, target_value: Number(e.target.value) || 1 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Unidad</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => onFormDataChange({ ...formData, unit: e.target.value })}
                  placeholder="series, min, vasos"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Frecuencia</label>
              <select
                value={formData.frequency_type}
                onChange={(e) => onFormDataChange({ ...formData, frequency_type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none"
              >
                <option value="daily">Todos los días</option>
                <option value="specific_days">Días específicos</option>
              </select>
            </div>
          )}
        </div>

        {/* Selector de Días de la Semana */}
        <div>
          <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
            Días Programados de la Semana
          </label>
          <div className="flex items-center justify-between gap-1">
            {[
              { id: '0', label: 'L' },
              { id: '1', label: 'M' },
              { id: '2', label: 'X' },
              { id: '3', label: 'J' },
              { id: '4', label: 'V' },
              { id: '5', label: 'S' },
              { id: '6', label: 'D' }
            ].map(day => {
              const currentDays = formData.days_of_week ? formData.days_of_week.split(',').map(s => s.trim()) : [];
              const isSelected = currentDays.includes(day.id);

              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => {
                    let updated: string[];
                    if (isSelected) {
                      updated = currentDays.filter(d => d !== day.id);
                    } else {
                      updated = [...currentDays, day.id].sort();
                    }
                    onFormDataChange({
                      ...formData,
                      days_of_week: updated.join(','),
                      frequency_type: updated.length === 7 ? 'daily' : 'specific_days'
                    });
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Target SLA Percent */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold text-slate-300">
              Exigencia SLA de Cumplimiento ({formData.sla_target_percent}%)
            </label>
            <span className="text-[10px] text-amber-400 font-mono">
              {formData.sla_target_percent >= 85 ? '⭐ Alta Disciplina' : 'Balanceado'}
            </span>
          </div>
          <input
            type="range"
            min="50"
            max="100"
            step="5"
            value={formData.sla_target_percent}
            onChange={(e) => onFormDataChange({ ...formData, sla_target_percent: Number(e.target.value) })}
            className="w-full accent-indigo-500"
          />
        </div>

        {/* Configuración de Reinicio Estricto (ej. Reto 21 Días) */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.reset_on_miss}
              onChange={(e) => onFormDataChange({ ...formData, reset_on_miss: e.target.checked })}
              className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
            />
            <div>
              <span className="text-xs font-bold text-white block">Reinicio estricto si se falla 1 día</span>
              <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                Ideal para retos como Brian Tracy (21 días). Si no se completa en un día programado, el progreso vuelve a 0.
              </span>
            </div>
          </label>
        </div>

        {/* Botones de Guardar / Cancelar */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 mt-1">
          {editingHabit ? (
            <button
              type="button"
              onClick={() => onDelete(editingHabit.id, editingHabit.title)}
              className="text-red-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1 p-2"
            >
              <Trash2 className="w-3.5 h-3.5" /> Eliminar
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSave}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editingHabit ? 'Guardar Cambios' : 'Crear Tarea'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
