/**
 * Backup & Restore Service for Taskia PWA.
 * Enables 100% offline data portability: export all habits, logs, zen sessions,
 * assessments, themes, and goals as a standalone timestamped JSON file,
 * and restore them at any time.
 */

export interface TaskiaBackupPayload {
  version: number;
  app: 'taskia';
  exportedAt: string;
  data: Record<string, string>;
}

export function generateBackupPayload(): TaskiaBackupPayload {
  const data: Record<string, string> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('taskia_') || key.startsWith('offline_'))) {
      const val = localStorage.getItem(key);
      if (val !== null) {
        data[key] = val;
      }
    }
  }

  return {
    version: 1,
    app: 'taskia',
    exportedAt: new Date().toISOString(),
    data
  };
}

export function downloadBackupFile(): void {
  const payload = generateBackupPayload();
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().split('T')[0];

  const link = document.createElement('a');
  link.href = url;
  link.download = `taskia-backup-${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function restoreBackupFromJSON(jsonContent: string): { success: boolean; keysRestored: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonContent) as Partial<TaskiaBackupPayload>;
    if (!parsed || typeof parsed !== 'object' || !parsed.data) {
      return { success: false, keysRestored: 0, error: 'El archivo no contiene un formato de respaldo válido de Taskia.' };
    }

    let count = 0;
    const entries = Object.entries(parsed.data);
    for (const [k, v] of entries) {
      if (k.startsWith('taskia_') || k.startsWith('offline_')) {
        localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
        count++;
      }
    }

    return { success: true, keysRestored: count };
  } catch (err: any) {
    return { success: false, keysRestored: 0, error: err?.message || 'Error al procesar el archivo JSON.' };
  }
}
