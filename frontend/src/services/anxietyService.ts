/**
 * Servicio de Evaluación de Ansiedad y Métricas Zen (Inspirado en Impulse Brain Training).
 * Proporciona screening psicométrico validado (basado en GAD-7 + Escala Somática),
 * almacenamiento local de check-ins diarios y cálculo de tendencias emocionales.
 */

export type AnxietySeverity = 'minimal' | 'mild' | 'moderate' | 'severe';
export type AssessmentType = 'anxiety_gad7' | 'mental_burnout';

export interface AnxietyQuestion {
  id: number;
  text: string;
  dimension: 'cognitive' | 'somatic' | 'stress_reactivity';
  explanation?: string;
}

export interface AnxietyAssessmentResult {
  id: string;
  date: string;
  timestamp: number;
  testType: AssessmentType;
  rawScore: number;
  maxScore: number;
  normalizedScore: number; // 0 a 100
  severity: AnxietySeverity;
  severityLabel: string;
  breakdown: {
    cognitivePercent: number;
    somaticPercent: number;
    stressPercent: number;
  };
  recommendations: string[];
}

export interface DailyAnxietyLog {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  score: number; // 1 (Paz Absoluta) a 10 (Pánico / Desborde)
  symptoms: string[];
  trigger: string;
  notes?: string;
}

export interface ZenSessionRecord {
  id: string;
  date: string;
  timestamp: number;
  gameType: 'bubble_pop' | 'color_flow' | 'zen_trace' | 'grounding_54321' | 'physiological_sigh';
  durationSeconds: number;
  metricAchieved: number; // Ej. burbujas disueltas, pasos de grounding completados, etc.
}

const STORAGE_KEYS = {
  ASSESSMENTS: 'taskia_anxiety_assessments',
  DAILY_LOGS: 'taskia_anxiety_daily_logs',
  ZEN_SESSIONS: 'taskia_zen_sessions_history',
};

// ==========================================
// PREGUNTAS DEL TEST (GAD-7 + SOMÁTICO IMPULSE)
// ==========================================

export const GAD7_QUESTIONS: AnxietyQuestion[] = [
  {
    id: 1,
    text: "¿Con qué frecuencia te has sentido nervioso(a), ansioso(a) o con los nervios de punta?",
    dimension: 'stress_reactivity',
    explanation: "Mide la hiperactividad del sistema nervioso simpático."
  },
  {
    id: 2,
    text: "¿Has sentido que no puedes parar o controlar tus preocupaciones recurrentes (sobrepensar)?",
    dimension: 'cognitive',
    explanation: "Evalúa los bucles de rumiación mental y dificultad para desenganchar la mente."
  },
  {
    id: 3,
    text: "¿Te has preocupado demasiado por diferentes cosas que podrían salir mal en el futuro?",
    dimension: 'cognitive',
    explanation: "Mide la ansiedad anticipatoria y sesgo de catastrofismo."
  },
  {
    id: 4,
    text: "¿Has experimentado tensión muscular notable, mandíbula apretada, opresión en el pecho o cuello tenso?",
    dimension: 'somatic',
    explanation: "Detecta la manifestación física y somatización del cortisol acumulado."
  },
  {
    id: 5,
    text: "¿Has sentido tanta inquietud física que te cuesta quedarte quieto(a) o relajarte en reposo?",
    dimension: 'somatic',
    explanation: "Mide la sobreexcitación motora e incapacidad de desacelerar."
  },
  {
    id: 6,
    text: "¿Te has sentido fácilmente irritable, molesto(a) o con muy poca tolerancia a la frustración?",
    dimension: 'stress_reactivity',
    explanation: "Mide el agotamiento del filtro emocional ante estímulos cotidianos."
  },
  {
    id: 7,
    text: "¿Has experimentado miedo repentino o sensación de que algo terrible va a suceder sin causa justificada?",
    dimension: 'cognitive',
    explanation: "Detecta picos de alarma amigdalina y reactividad de pánico."
  }
];

export const BURNOUT_QUESTIONS: AnxietyQuestion[] = [
  {
    id: 101,
    text: "¿Sientes que tus niveles de energía mental están agotados incluso después de descansar o dormir?",
    dimension: 'somatic',
  },
  {
    id: 102,
    text: "¿Te cuesta concentrarte en una sola tarea sin sentir fatiga inmediata o ganas de postergarla?",
    dimension: 'cognitive',
  },
  {
    id: 103,
    text: "¿Sientes cinismo, desapego o saturación emocional frente a tus responsabilidades habituales?",
    dimension: 'stress_reactivity',
  },
  {
    id: 104,
    text: "¿Experimentas sobrecarga sensorial con ruidos, notificaciones o demandas de atención simultáneas?",
    dimension: 'stress_reactivity',
  },
  {
    id: 105,
    text: "¿Sientes niebla mental (brain fog), olvidos frecuentes o dificultad para tomar decisiones sencillas?",
    dimension: 'cognitive',
  }
];

export const ANSWER_OPTIONS = [
  { label: 'Nunca o casi nunca', value: 0, desc: 'En absoluto los últimos 14 días' },
  { label: 'Varios días', value: 1, desc: 'Aproximadamente 3 a 5 días' },
  { label: 'Más de la mitad de los días', value: 2, desc: 'Frecuencia habitual de 6 a 10 días' },
  { label: 'Casi todos los días', value: 3, desc: 'Presencia constante casi a diario' },
];

export const ANXIETY_SYMPTOMS_LIST = [
  'Mente acelerada / Rumiación',
  'Tensión en hombros y cuello',
  'Mandíbula apretada / Bruxismo',
  'Respiración corta o superficial',
  'Palpitaciones / Pecho cerrado',
  'Inquietud motora en piernas',
  'Fatiga o desgana profunda',
  'Niebla mental (Brain Fog)',
  'Dificultad para conciliar el sueño',
  'Sensación de agobio por tiempo'
];

export const ANXIETY_TRIGGERS_LIST = [
  'Trabajo o Proyectos Profesionales',
  'Sobrecarga de Decisiones',
  'Incertidumbre Financiera',
  'Relaciones o Familia',
  'Salud o Rendimiento Físico',
  'Falta de Sueño o Descanso',
  'Exceso de Pantallas / Redes',
  'Café o Estimulantes',
  'Sin causa aparente (Alerta Basal)'
];

// ==========================================
// CÁLCULO Y EVALUACIÓN
// ==========================================

export function evaluateAssessment(
  testType: AssessmentType,
  answers: Record<number, number>
): AnxietyAssessmentResult {
  const questions = testType === 'anxiety_gad7' ? GAD7_QUESTIONS : BURNOUT_QUESTIONS;
  let rawScore = 0;
  const maxScore = questions.length * 3;

  let cogSum = 0, cogCount = 0;
  let somSum = 0, somCount = 0;
  let strSum = 0, strCount = 0;

  questions.forEach(q => {
    const val = answers[q.id] ?? 0;
    rawScore += val;
    if (q.dimension === 'cognitive') {
      cogSum += val;
      cogCount++;
    } else if (q.dimension === 'somatic') {
      somSum += val;
      somCount++;
    } else {
      strSum += val;
      strCount++;
    }
  });

  const normalizedScore = Math.round((rawScore / maxScore) * 100);

  let severity: AnxietySeverity = 'minimal';
  let severityLabel = 'Ansiedad Mínima / Estado Zen';

  if (testType === 'anxiety_gad7') {
    if (rawScore <= 4) {
      severity = 'minimal';
      severityLabel = 'Ansiedad Mínima (Enfoque Óptimo)';
    } else if (rawScore <= 9) {
      severity = 'mild';
      severityLabel = 'Ansiedad Leve (Tensión Manejable)';
    } else if (rawScore <= 14) {
      severity = 'moderate';
      severityLabel = 'Ansiedad Moderada (Sobrecarga Activa)';
    } else {
      severity = 'severe';
      severityLabel = 'Ansiedad Elevada (Alerta del Sistema)';
    }
  } else {
    if (normalizedScore <= 25) {
      severity = 'minimal';
      severityLabel = 'Fatiga Baja (Energía Sostenible)';
    } else if (normalizedScore <= 50) {
      severity = 'mild';
      severityLabel = 'Fatiga Leve (Señales de Alerta)';
    } else if (normalizedScore <= 75) {
      severity = 'moderate';
      severityLabel = 'Fatiga Moderada (Burnout Inicial)';
    } else {
      severity = 'severe';
      severityLabel = 'Sobrecarga Cognitiva Crítica';
    }
  }

  const cognitivePercent = cogCount > 0 ? Math.round((cogSum / (cogCount * 3)) * 100) : 0;
  const somaticPercent = somCount > 0 ? Math.round((somSum / (somCount * 3)) * 100) : 0;
  const stressPercent = strCount > 0 ? Math.round((strSum / (strCount * 3)) * 100) : 0;

  // Recomendaciones accionables según el perfil
  const recommendations: string[] = [];

  if (somaticPercent >= 50) {
    recommendations.push("Tu cuerpo acumula tensión muscular: practica el Suspiro Fisiológico de Andrew Huberman o Grounding 5-4-3-2-1 para resetear el nervio vago.");
  }
  if (cognitivePercent >= 50) {
    recommendations.push("Sobrecarga de rumiación mental: juega 3 minutos a Zen Bubble Pop para romper el bucle o aplica Reencuadre Cognitivo.");
  }
  if (stressPercent >= 50) {
    recommendations.push("Filtro de estrés saturado: reduce estímulos digitales y ordena gradientes con Color Harmony Flow para descansar el córtex.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Mantén tu ritmo: tu sistema nervioso está equilibrado. Un check-in diario o 5 min de trazado zen consolidarán tu resiliencia.");
  }

  const result: AnxietyAssessmentResult = {
    id: `assessment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now(),
    testType,
    rawScore,
    maxScore,
    normalizedScore,
    severity,
    severityLabel,
    breakdown: {
      cognitivePercent,
      somaticPercent,
      stressPercent,
    },
    recommendations,
  };

  return result;
}

// ==========================================
// PERSISTENCIA LOCAL (LOCAL-FIRST)
// ==========================================

export function saveAssessmentResult(result: AnxietyAssessmentResult) {
  try {
    const existing = getAssessmentHistory();
    const updated = [result, ...existing].slice(0, 30); // guardar últimos 30
    localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(updated));
  } catch (e) {
    console.error('Error guardando resultado de evaluación:', e);
  }
}

export function getAssessmentHistory(): AnxietyAssessmentResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ASSESSMENTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLatestAssessment(): AnxietyAssessmentResult | null {
  const history = getAssessmentHistory();
  return history.length > 0 ? history[0] : null;
}

export function saveDailyAnxietyLog(log: Omit<DailyAnxietyLog, 'id' | 'timestamp'>): DailyAnxietyLog {
  const fullLog: DailyAnxietyLog = {
    ...log,
    id: `anx_log_${Date.now()}`,
    timestamp: Date.now(),
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_LOGS);
    const existing: DailyAnxietyLog[] = raw ? JSON.parse(raw) : [];
    // Reemplazar si ya existe un log hoy o añadir nuevo
    const filtered = existing.filter(l => l.date !== log.date);
    const updated = [fullLog, ...filtered].slice(0, 60);
    localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(updated));
  } catch (e) {
    console.error('Error guardando log diario de ansiedad:', e);
  }

  return fullLog;
}

export function getDailyAnxietyLogs(): DailyAnxietyLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getTodayAnxietyLog(): DailyAnxietyLog | null {
  const today = new Date().toISOString().split('T')[0];
  const logs = getDailyAnxietyLogs();
  return logs.find(l => l.date === today) || null;
}

export function saveZenSessionRecord(record: Omit<ZenSessionRecord, 'id' | 'timestamp'>) {
  const full: ZenSessionRecord = {
    ...record,
    id: `zen_rec_${Date.now()}`,
    timestamp: Date.now(),
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ZEN_SESSIONS);
    const existing: ZenSessionRecord[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(STORAGE_KEYS.ZEN_SESSIONS, JSON.stringify([full, ...existing].slice(0, 100)));
  } catch (e) {
    console.error('Error guardando registro de sesión zen:', e);
  }
}

export function getZenSessionsHistory(): ZenSessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ZEN_SESSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
