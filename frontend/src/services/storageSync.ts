/**
 * Taskia Offline Storage & Sync Engine (Local-First Architecture)
 * 
 * Permite usar la aplicación 100% desconectada (modo avión, sin servidor encendido, etc.)
 * guardando el estado completo en IndexedDB y en localStorage como respaldo.
 * Encola acciones pendientes y las sincroniza automáticamente apenas detecta el servidor en línea.
 */

import axios from 'axios';
import type { Habit, Program, MetricsSummary, CoachProfile } from '../types';
import defaultProgramsData from './defaultPrograms.json';

export const DEFAULT_PROGRAMS: Program[] = defaultProgramsData as unknown as Program[];

export interface PendingAction {
  id: string;
  type: 'toggle_today' | 'step_series' | 'save_habit' | 'delete_habit' | 'select_coach';
  habitId?: number;
  habitTitle?: string;
  step?: number;
  payload?: any;
  date: string;
  timestamp: number;
}

const STORAGE_KEYS = {
  HABITS: 'taskia_local_habits',
  PROGRAMS: 'taskia_local_programs',
  METRICS: 'taskia_local_metrics',
  COACHES: 'taskia_local_coaches',
  PENDING_QUEUE: 'taskia_pending_sync_queue',
  LAST_SYNC: 'taskia_last_sync_timestamp',
};

// ==========================================
// 1. GESTIÓN DE ALMACENAMIENTO LOCAL
// ==========================================

export const getLocalHabits = (): Habit[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HABITS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveLocalHabits = (habits: Habit[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  } catch (e) {
    console.error('Error guardando hábitos locales:', e);
  }
};

export const getLocalPrograms = (): Program[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROGRAMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Asegurarse de que si se añadieron nuevos programas por defecto (como Inglés Anki), estén incluidos
        const existingIds = new Set(parsed.map((p: Program) => p.id));
        const missingDefaults = DEFAULT_PROGRAMS.filter(dp => !existingIds.has(dp.id));
        if (missingDefaults.length > 0) {
          const merged = [...parsed, ...missingDefaults];
          saveLocalPrograms(merged);
          return merged;
        }
        return parsed;
      }
    }
    return DEFAULT_PROGRAMS;
  } catch {
    return DEFAULT_PROGRAMS;
  }
};

export const saveLocalPrograms = (programs: Program[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(programs));
  } catch (e) {
    console.error('Error guardando programas locales:', e);
  }
};

export const getLocalMetrics = (): MetricsSummary | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.METRICS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveLocalMetrics = (metrics: MetricsSummary) => {
  try {
    localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(metrics));
  } catch (e) {
    console.error('Error guardando métricas locales:', e);
  }
};

export const getLocalCoaches = (): CoachProfile[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COACHES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveLocalCoaches = (coaches: CoachProfile[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.COACHES, JSON.stringify(coaches));
  } catch (e) {
    console.error('Error guardando coaches locales:', e);
  }
};

// ==========================================
// 2. COLA DE SINCRONIZACIÓN OFFLINE
// ==========================================

export const getPendingSyncQueue = (): PendingAction[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PENDING_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const enqueuePendingAction = (action: Omit<PendingAction, 'id' | 'timestamp'>) => {
  const queue = getPendingSyncQueue();
  const newAction: PendingAction = {
    ...action,
    id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: Date.now(),
  };
  queue.push(newAction);
  localStorage.setItem(STORAGE_KEYS.PENDING_QUEUE, JSON.stringify(queue));
  return newAction;
};

export const clearPendingSyncQueue = () => {
  localStorage.setItem(STORAGE_KEYS.PENDING_QUEUE, JSON.stringify([]));
};

export const removePendingAction = (actionId: string) => {
  const queue = getPendingSyncQueue().filter(a => a.id !== actionId);
  localStorage.setItem(STORAGE_KEYS.PENDING_QUEUE, JSON.stringify(queue));
};

// ==========================================
// 3. ACTUALIZACIÓN OPTIMISTA LOCAL DE HÁBITOS
// ==========================================

export const applyLocalToggle = (habitId: number): Habit[] => {
  const habits = getLocalHabits();
  const updated = habits.map(h => {
    if (h.id === habitId) {
      const currentCompleted = !!h.today_log?.completed;
      const nextCompleted = !currentCompleted;
      const nextValue = nextCompleted ? h.target_value : 0;
      
      const newComplianceRate = Math.min(100, Math.max(0, 
        nextCompleted 
          ? Math.min(100, (h.compliance_summary?.rate_percent || 0) + 14.2)
          : Math.max(0, (h.compliance_summary?.rate_percent || 0) - 14.2)
      ));

      return {
        ...h,
        today_log: {
          completed: nextCompleted,
          value: nextValue,
          is_in_sla: nextCompleted || (h.today_log?.is_in_sla ?? false),
        },
        compliance_summary: {
          ...h.compliance_summary,
          rate_percent: Math.round(newComplianceRate),
          meets_sla: newComplianceRate >= (h.sla_target_percent || 85),
          completed_last_7_days: nextCompleted 
            ? (h.compliance_summary?.completed_last_7_days || 0) + 1
            : Math.max(0, (h.compliance_summary?.completed_last_7_days || 1) - 1),
        }
      };
    }
    return h;
  });

  saveLocalHabits(updated);
  return updated;
};

export const applyLocalSeriesStep = (habitId: number, stepDelta: number): Habit[] => {
  const habits = getLocalHabits();
  const updated = habits.map(h => {
    if (h.id === habitId) {
      const currentValue = h.today_log?.value || 0;
      const nextValue = Math.max(0, Math.round((currentValue + stepDelta) * 10) / 10);
      const isCompleted = nextValue >= h.target_value;

      return {
        ...h,
        today_log: {
          completed: isCompleted,
          value: nextValue,
          is_in_sla: isCompleted,
        }
      };
    }
    return h;
  });

  saveLocalHabits(updated);
  return updated;
};

// ==========================================
// 4. SINCRONIZADOR CON BACKEND
// ==========================================

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  remainingCount: number;
  serverOnline: boolean;
  message: string;
}

export const syncWithBackend = async (
  apiBase: string,
  getHeaders: () => any
): Promise<SyncResult> => {
  const queue = getPendingSyncQueue();
  const headers = getHeaders();

  // Test de ping ultra-rápido para verificar si el servidor está online
  try {
    await axios.get(`${apiBase}/coaches/`, { ...headers, timeout: 2500 });
  } catch (pingErr) {
    return {
      success: false,
      syncedCount: 0,
      remainingCount: queue.length,
      serverOnline: false,
      message: 'Servidor desconectado. Modo Local Activo.',
    };
  }

  if (queue.length === 0) {
    return {
      success: true,
      syncedCount: 0,
      remainingCount: 0,
      serverOnline: true,
      message: 'Todos los datos están al día con el servidor.',
    };
  }

  let synced = 0;
  const failedActionIds: string[] = [];

  for (const action of queue) {
    try {
      if (action.type === 'toggle_today' && action.habitId) {
        await axios.post(`${apiBase}/habits/${action.habitId}/toggle_today/`, {}, headers);
        synced++;
      } else if (action.type === 'step_series' && action.habitId) {
        await axios.post(`${apiBase}/habits/${action.habitId}/toggle_today/`, { step: action.step }, headers);
        synced++;
      } else if (action.type === 'save_habit' && action.payload) {
        if (action.habitId) {
          await axios.patch(`${apiBase}/habits/${action.habitId}/`, action.payload, headers);
        } else {
          await axios.post(`${apiBase}/habits/`, action.payload, headers);
        }
        synced++;
      } else if (action.type === 'delete_habit' && action.habitId) {
        await axios.delete(`${apiBase}/habits/${action.habitId}/`, headers);
        synced++;
      } else if (action.type === 'select_coach' && action.payload?.coach_id) {
        await axios.post(`${apiBase}/auth/me/`, { coach_id: action.payload.coach_id }, headers);
        synced++;
      }
    } catch (actionErr) {
      console.warn(`No se pudo sincronizar la acción ${action.id}:`, actionErr);
      failedActionIds.push(action.id);
    }
  }

  // Conservar solo las que fallaron para reintentar después
  const remainingQueue = queue.filter(a => failedActionIds.includes(a.id));
  localStorage.setItem(STORAGE_KEYS.PENDING_QUEUE, JSON.stringify(remainingQueue));
  localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

  return {
    success: remainingQueue.length === 0,
    syncedCount: synced,
    remainingCount: remainingQueue.length,
    serverOnline: true,
    message: synced > 0 
      ? `¡Sincronizadas ${synced} acciones pendientes con éxito!`
      : 'Sincronización completada.',
  };
};
