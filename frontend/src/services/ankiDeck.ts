export interface AnkiFlashcard {
  id: number;
  front: string; // Inglés (palabra o frase)
  ipa?: string; // Transcripción fonética
  partOfSpeech: string; // ej. "verb", "phrasal verb", "idiom", "business"
  back: string; // Español (traducción / significado)
  contextSentence: string; // Oración real de ejemplo en inglés
  sentenceTranslation: string; // Traducción de la oración
  tip?: string; // Mnemotécnica o dato clave
  category: 'Business & Tech' | 'Everyday Fluency' | 'Phrasal Verbs' | 'Power Idioms';
}

export const ANKI_DECK_INITIAL: AnkiFlashcard[] = [
  // --- Business & Tech ---
  {
    id: 1,
    front: "Leverage",
    ipa: "/ˈlev.ər.ɪdʒ/",
    partOfSpeech: "verb / noun",
    back: "Apalancar / Aprovechar al máximo un recurso",
    contextSentence: "We should leverage our automated pipeline to ship updates twice as fast.",
    sentenceTranslation: "Deberíamos aprovechar nuestro flujo automatizado para lanzar actualizaciones el doble de rápido.",
    tip: "Piensa en una palanca física (lever) que multiplica tu fuerza con menor esfuerzo.",
    category: "Business & Tech"
  },
  {
    id: 2,
    front: "Bottleneck",
    ipa: "/ˈbɒt.əl.nek/",
    partOfSpeech: "noun",
    back: "Cuello de botella / Punto de bloqueo",
    contextSentence: "Slow code reviews became the main bottleneck in our two-week sprint.",
    sentenceTranslation: "Las revisiones de código lentas se convirtieron en el principal cuello de botella en nuestro sprint de dos semanas.",
    tip: "El cuello de una botella: la parte angosta que limita el flujo del líquido.",
    category: "Business & Tech"
  },
  {
    id: 3,
    front: "Trade-off",
    ipa: "/ˈtreɪd.ɒf/",
    partOfSpeech: "noun",
    back: "Compromiso / Concesión mutua / Balance de costo vs beneficio",
    contextSentence: "Choosing a local-first SQLite database was a trade-off between simplicity and real-time syncing.",
    sentenceTranslation: "Elegir una base de datos SQLite local-first fue un balance entre simplicidad y sincronización en tiempo real.",
    tip: "Cuando 'comercias' (trade) una ventaja por otra para tomar una decisión pragmática.",
    category: "Business & Tech"
  },
  {
    id: 4,
    front: "Streamline",
    ipa: "/ˈstriːm.laɪn/",
    partOfSpeech: "verb",
    back: "Optimizar / Simplificar y hacer más eficiente un proceso",
    contextSentence: "We streamlined our onboarding flow, reducing churn by 35% on day one.",
    sentenceTranslation: "Optimizamos nuestro flujo de incorporación, reduciendo el abandono un 35% el primer día.",
    tip: "Dar forma aerodinámica a algo para que fluya sin resistencia.",
    category: "Business & Tech"
  },
  {
    id: 5,
    front: "Scalability",
    ipa: "/ˌskeɪ.ləˈbɪl.ə.ti/",
    partOfSpeech: "noun",
    back: "Escalabilidad / Capacidad de crecer sostenidamente",
    contextSentence: "Building modular components guarantees scalability as the user base expands.",
    sentenceTranslation: "Construir componentes modulares garantiza escalabilidad a medida que la base de usuarios crece.",
    tip: "Escala (scale) + habilidad (ability).",
    category: "Business & Tech"
  },
  {
    id: 6,
    front: "Runway",
    ipa: "/ˈrʌn.weɪ/",
    partOfSpeech: "noun",
    back: "Pista de despegue / Meses de caja financiera restantes",
    contextSentence: "With current revenue and expenses, the company has 18 months of runway.",
    sentenceTranslation: "Con los ingresos y gastos actuales, la empresa tiene 18 meses de pista financiera.",
    tip: "La pista de un aeropuerto antes de que el avión tenga que despegar o estrellarse.",
    category: "Business & Tech"
  },

  // --- Phrasal Verbs ---
  {
    id: 7,
    front: "Figure out",
    ipa: "/ˈfɪɡ.ər aʊt/",
    partOfSpeech: "phrasal verb",
    back: "Descifrar / Encontrar la solución a un problema",
    contextSentence: "Give me twenty minutes and I'll figure out what is causing that latency spike.",
    sentenceTranslation: "Dame veinte minutos y descifraré qué está causando ese pico de latencia.",
    tip: "Muy usado en el día a día para 'resolver' o 'entender'.",
    category: "Phrasal Verbs"
  },
  {
    id: 8,
    front: "Call off",
    ipa: "/kɔːl ɒf/",
    partOfSpeech: "phrasal verb",
    back: "Cancelar (una reunión, plan o evento)",
    contextSentence: "They had to call off the sync meeting because the team leads were offline.",
    sentenceTranslation: "Tuvieron que cancelar la reunión de sincronización porque los líderes de equipo estaban desconectados.",
    tip: "Diferente de 'put off' (posponer). 'Call off' es cancelación definitiva.",
    category: "Phrasal Verbs"
  },
  {
    id: 9,
    front: "Bring up",
    ipa: "/brɪŋ ʌp/",
    partOfSpeech: "phrasal verb",
    back: "Mencionar un tema / Sacar a relucir en una conversación",
    contextSentence: "Make sure to bring up the budget constraints during the quarterly review.",
    sentenceTranslation: "Asegúrate de sacar a relucir las limitaciones de presupuesto durante la revisión trimestral.",
    tip: "'Traer hacia arriba' el tema a la mesa de discusión.",
    category: "Phrasal Verbs"
  },
  {
    id: 10,
    front: "Keep up with",
    ipa: "/kiːp ʌp wɪð/",
    partOfSpeech: "phrasal verb",
    back: "Mantenerse al ritmo de / Seguir el paso",
    contextSentence: "It is hard to keep up with every AI tool release without a strict habit routine.",
    sentenceTranslation: "Es difícil mantenerse al ritmo de cada lanzamiento de herramientas de IA sin una rutina de hábitos estricta.",
    tip: "Caminar al lado de alguien sin quedarte atrás.",
    category: "Phrasal Verbs"
  },
  {
    id: 11,
    front: "Cut down on",
    ipa: "/kʌt daʊn ɒn/",
    partOfSpeech: "phrasal verb",
    back: "Reducir el consumo o frecuencia de algo",
    contextSentence: "I need to cut down on caffeine after 2:00 PM to improve my deep sleep score.",
    sentenceTranslation: "Necesito reducir la cafeína después de las 2:00 PM para mejorar mi puntaje de sueño profundo.",
    tip: "Cortar hacia abajo el volumen o cantidad.",
    category: "Phrasal Verbs"
  },

  // --- Power Idioms ---
  {
    id: 12,
    front: "Hit the nail on the head",
    ipa: "/hɪt ðə neɪl ɒn ðə hed/",
    partOfSpeech: "idiom",
    back: "Dar en el clavo / Acertar con precisión exacta",
    contextSentence: "Your diagnosis of the architecture issue hit the nail on the head.",
    sentenceTranslation: "Tu diagnóstico sobre el problema de arquitectura dio exactamente en el clavo.",
    tip: "Golpear con el martillo justo en la cabeza del clavo.",
    category: "Power Idioms"
  },
  {
    id: 13,
    front: "Cut corners",
    ipa: "/kʌt ˈkɔː.nəz/",
    partOfSpeech: "idiom",
    back: "Tomar atajos dudosos / Abaratar sacrificando calidad",
    contextSentence: "Never cut corners on security auditing when deploying financial code.",
    sentenceTranslation: "Nunca tomes atajos imprudentes en auditoría de seguridad al desplegar código financiero.",
    tip: "Cortar esquinas para ir más rápido, arriesgando tropezar.",
    category: "Power Idioms"
  },
  {
    id: 14,
    front: "On the same page",
    ipa: "/ɒn ðə seɪm peɪdʒ/",
    partOfSpeech: "idiom",
    back: "Estar alineados / Compartir el mismo entendimiento",
    contextSentence: "Let's review the product roadmap so that engineering and sales are on the same page.",
    sentenceTranslation: "Revisemos la hoja de ruta del producto para que ingeniería y ventas estén en la misma página.",
    tip: "Leyendo la misma página de un libro al mismo tiempo.",
    category: "Power Idioms"
  },
  {
    id: 15,
    front: "Under the weather",
    ipa: "/ˈʌn.dər ðə ˈweð.ər/",
    partOfSpeech: "idiom",
    back: "Sentirse algo indispuesto o con malestar físico",
    contextSentence: "I am feeling a bit under the weather today, so I will work asynchronously from home.",
    sentenceTranslation: "Me siento un poco indispuesto hoy, así que trabajaré de forma asíncrona desde casa.",
    tip: "Sentirse afectado por el clima (cansancio, resfrío leve).",
    category: "Power Idioms"
  },

  // --- Everyday Fluency ---
  {
    id: 16,
    front: "Reliant",
    ipa: "/rɪˈlaɪ.ənt/",
    partOfSpeech: "adjective",
    back: "Dependiente de / Que confía en un soporte externo",
    contextSentence: "The application is self-contained and not reliant on third-party servers.",
    sentenceTranslation: "La aplicación es autónoma y no depende de servidores de terceros.",
    tip: "De la raíz 'rely on' (depender de).",
    category: "Everyday Fluency"
  },
  {
    id: 17,
    front: "Consistent",
    ipa: "/kənˈsɪs.tənt/",
    partOfSpeech: "adjective",
    back: "Constante / Coherente / Disciplinado en el tiempo",
    contextSentence: "Consistent execution beats raw talent every single time.",
    sentenceTranslation: "La ejecución constante supera al talento puro en todas las ocasiones.",
    tip: "El pilar de los hábitos y el SLA.",
    category: "Everyday Fluency"
  },
  {
    id: 18,
    front: "Overwhelmed",
    ipa: "/ˌoʊ.vɚˈwelmd/",
    partOfSpeech: "adjective",
    back: "Abrumado / Saturado mentalmente por exceso de tareas",
    contextSentence: "When you feel overwhelmed, switch to Shield Mode and finish just one 5-minute task.",
    sentenceTranslation: "Cuando te sientas abrumado, activa el Modo Escudo y termina solo una tarea de 5 minutos.",
    tip: "Una ola gigante que te cubre por completo (whelm).",
    category: "Everyday Fluency"
  },
  {
    id: 19,
    front: "Crucial",
    ipa: "/ˈkruː.ʃəl/",
    partOfSpeech: "adjective",
    back: "Crucial / Decisivo / Fundamental",
    contextSentence: "Spaced repetition is crucial for moving words into long-term memory.",
    sentenceTranslation: "La repetición espaciada es crucial para trasladar palabras a la memoria de largo plazo.",
    tip: "Un cruce de caminos vital donde se decide el resultado.",
    category: "Everyday Fluency"
  },
  {
    id: 20,
    front: "Seamless",
    ipa: "/ˈsiːm.ləs/",
    partOfSpeech: "adjective",
    back: "Fluido / Sin fisuras / Sin fricción apreciable",
    contextSentence: "The offline-to-online transition should be seamless for the user.",
    sentenceTranslation: "La transición de offline a online debe ser fluida y sin fisuras para el usuario.",
    tip: "Sin costuras (seam = costura de ropa).",
    category: "Everyday Fluency"
  }
];
