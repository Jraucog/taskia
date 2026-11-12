import type { Habit } from '../types';

export interface SkillAttributes {
  physical: number;    // 0 - 100%
  cognitive: number;   // 0 - 100%
  zen: number;         // 0 - 100%
  discipline: number;  // 0 - 100%
}

export interface SkillTreeProfile {
  level: number;
  title: string;
  totalXP: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progressPercent: number;
  attributes: SkillAttributes;
  habitsCompletedToday: number;
  streakDays: number;
}

const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: "Iniciado de la Disciplina" },
  { level: 2, xp: 200, title: "Operador Consistente" },
  { level: 3, xp: 500, title: "Guerrero del Hábito" },
  { level: 4, xp: 950, title: "Especialista Táctico" },
  { level: 5, xp: 1550, title: "Bio-Hacker de Élite" },
  { level: 6, xp: 2350, title: "Maestro de Rendimiento" },
  { level: 7, xp: 3350, title: "Monje de Acero" },
  { level: 8, xp: 4600, title: "Soberano de la Voluntad" },
  { level: 9, xp: 6200, title: "Migatte no Gokui (Ultra Instinto)" }
];

export function calculateSkillTree(
  habits: Habit[],
  streakDays: number = 0,
  overallSLA: number = 80
): SkillTreeProfile {
  let physicalXP = 0;
  let cognitiveXP = 0;
  let zenXP = 0;
  let disciplineXP = 0;
  let completedTodayCount = 0;

  habits.forEach(h => {
    const title = h.title.toLowerCase();
    const isCompleted = !!h.today_log?.completed;
    const completedLast7 = h.compliance_summary?.completed_last_7_days || 0;
    const meetsSLA = h.compliance_summary?.meets_sla;

    if (isCompleted) {
      completedTodayCount++;
    }

    // Ponderación de XP por consistencia de 7 días (25 XP por día cumplido en ventana rodante)
    const habitXP = (completedLast7 * 25) + (isCompleted ? 30 : 0) + (meetsSLA ? 40 : 0);

    // Clasificación por palabras clave en los 4 pilares
    if (
      title.includes('trx') || title.includes('fuerza') || title.includes('calistenia') ||
      title.includes('cardio') || title.includes('pasos') || title.includes('agua') ||
      title.includes('aquiles') || title.includes('sentadilla') || title.includes('movilidad') ||
      title.includes('caminar') || title.includes('estiramiento')
    ) {
      physicalXP += habitXP;
    } else if (
      title.includes('anki') || title.includes('flashcard') || title.includes('inglés') ||
      title.includes('ingles') || title.includes('lectura') || title.includes('deep work') ||
      title.includes('código') || title.includes('software') || title.includes('vocabulario')
    ) {
      cognitiveXP += habitXP;
    } else if (
      title.includes('respir') || title.includes('suspiro') || title.includes('ansiedad') ||
      title.includes('calma') || title.includes('relax') || title.includes('grounding') ||
      title.includes('bubble') || title.includes('4-7-8') || title.includes('zen') ||
      title.includes('medit') || title.includes('sueño')
    ) {
      zenXP += habitXP;
    } else {
      disciplineXP += habitXP;
    }

    // Las metas de Brian Tracy suman a disciplina
    if (title.includes('brian tracy') || title.includes('10 meta')) {
      disciplineXP += habitXP * 1.5;
    }
  });

  // Bonos por racha y SLA general de la cuenta
  disciplineXP += (streakDays * 35) + (overallSLA >= 85 ? 120 : 0);

  const totalXP = physicalXP + cognitiveXP + zenXP + disciplineXP;

  // Determinar nivel actual
  let currentLevelObj = LEVEL_THRESHOLDS[0];
  let nextLevelObj = LEVEL_THRESHOLDS[1];

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i].xp) {
      currentLevelObj = LEVEL_THRESHOLDS[i];
      nextLevelObj = LEVEL_THRESHOLDS[i + 1] || {
        level: currentLevelObj.level + 1,
        xp: currentLevelObj.xp + 1500,
        title: "Maestría Infinita"
      };
      break;
    }
  }

  const rangeXP = nextLevelObj.xp - currentLevelObj.xp;
  const currentLevelProgress = Math.max(0, totalXP - currentLevelObj.xp);
  const progressPercent = Math.min(100, Math.round((currentLevelProgress / rangeXP) * 100));

  // Normalizar atributos a escala de 0 a 100
  const maxCap = Math.max(100, Math.max(physicalXP, cognitiveXP, zenXP, disciplineXP));
  const attributes: SkillAttributes = {
    physical: Math.min(100, Math.round((physicalXP / maxCap) * 100)),
    cognitive: Math.min(100, Math.round((cognitiveXP / maxCap) * 100)),
    zen: Math.min(100, Math.round((zenXP / maxCap) * 100)),
    discipline: Math.min(100, Math.round((disciplineXP / maxCap) * 100)),
  };

  return {
    level: currentLevelObj.level,
    title: currentLevelObj.title,
    totalXP,
    currentLevelXP: currentLevelProgress,
    nextLevelXP: rangeXP,
    progressPercent,
    attributes,
    habitsCompletedToday: completedTodayCount,
    streakDays,
  };
}
