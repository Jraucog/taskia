import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CheckCircle2, Circle, Flame, Zap, 
  Layers, Play, RefreshCw,
  User, LogOut, LogIn, UserPlus, Dumbbell, Calendar,
  Timer, Check, Plus, Minus, ChevronDown, ChevronRight,
  ArrowLeft, CheckSquare, Sparkles, BookOpen, HelpCircle,
  Bell, BellOff, ShieldAlert, Compass, Edit3, Trash2, Eye, ListChecks,
  Wind, Pause, Target, Info, Clock, Volume2, VolumeX,
  Search, Award, TrendingUp, Trophy,
  Palette
} from 'lucide-react';
import confetti from 'canvas-confetti';

const API_BASE = window.location.hostname.includes('trycloudflare.com')
  ? 'https://asset-discretion-expenditure-willow.trycloudflare.com/api'
  : `http://${window.location.hostname}:8000/api`;

interface DayHistory {
  date: string;
  day_name: string;
  completed: boolean;
  value: number;
}


interface Habit {
  id: number;
  title: string;
  description: string;
  habit_type: 'boolean' | 'numeric';
  target_value: number;
  unit: string;
  estimated_minutes?: number;
  frequency_type?: string;
  days_of_week?: string;
  day_offset?: number | null;
  sla_target_percent: number;
  reset_on_miss?: boolean;
  enrollment?: number | null;
  today_log?: {
    completed: boolean;
    value: number;
    is_in_sla: boolean;
  } | null;
  compliance_summary: {
    completed_last_7_days: number;
    rate_percent: number;
    meets_sla: boolean;
    history?: DayHistory[];
  };
}

interface ProgramItem {
  id: number;
  title: string;
  day_offset: number;
  habit_type: string;
  target_value: number;
  unit: string;
  description: string;
  estimated_minutes?: number;
}

interface CoachProfile {
  id: number;
  name: string;
  slug: string;
  tone: string;
  tone_display: string;
  avatar_emoji: string;
  bio: string;
  morning_quote: string;
  midday_reminder: string;
  evening_warning: string;
}

interface Program {
  id: number;
  title: string;
  description: string;
  category: string;
  duration_days: number;
  items: ProgramItem[];
}

interface MetricsSummary {
  current_user?: {
    id: number;
    username: string;
    email: string;
  };
  total_active_habits: number;
  scheduled_today_count?: number;
  completed_today: number;
  today_compliance_percent: number;
  habits_meeting_sla_percent: number;
  healthy_habits: number;
  at_risk_habits: number;
}

interface ProgramGroup {
  name: string;
  habits: Habit[];
  completedCount: number;
  totalCount: number;
  progressPercent: number;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('taskia_token'));
  
  // Auth Form State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authError, setAuthError] = useState('');

  const [habits, setHabits] = useState<Habit[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Navegación principal
  const [activeTab, setActiveTab] = useState<'today' | 'calendar' | 'programs' | 'vision' | 'inject'>('today');

  // Estado de navegación tipo carpeta: entrar dentro de un plan
  const [selectedPlanName, setSelectedPlanName] = useState<string | null>(null);

  // Modo de visualización en 'today': 'checklist' (resumen directo de lo que hay que hacer) o 'plans' (por programas)
  const [todayViewMode, setTodayViewMode] = useState<'checklist' | 'plans'>('checklist');
  const [todayFilter, setTodayFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  // Agrupar visualmente por plan/programa dentro del Resumen de Hoy
  const [groupByPlan, setGroupByPlan] = useState<boolean>(true);

  // Filtro de categorías para el Catálogo de Programas
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<string>('all');

  // Estado de colapsar / expandir bloques o categorías
  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<string, boolean>>({});

  // Estado para Coaches y Motivación
  const [coaches, setCoaches] = useState<CoachProfile[]>([]);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [selectedCoachId, setSelectedCoachId] = useState<number | null>(null);

  // Frases motivacionales dinámicas (Tony Robbins, Brian Tracy, Seneca, Kobe, Goggins, etc.)
  const motivationalQuotes = [
    { quote: "Si haces lo que siempre has hecho, obtendrás lo que siempre has conseguido.", author: "Tony Robbins" },
    { quote: "El éxito no es un accidente, es el resultado directo de la disciplina diaria.", author: "Brian Tracy" },
    { quote: "No es que tengamos poco tiempo, sino que perdemos mucho.", author: "Séneca" },
    { quote: "El momento en que te rindes es el momento en que dejas que otra persona gane.", author: "Kobe Bryant" },
    { quote: "No te detengas cuando estés cansado. Detente cuando hayas terminado.", author: "David Goggins" },
    { quote: "Tú no te elevas al nivel de tus metas, caes al nivel de tus sistemas.", author: "James Clear" },
    { quote: "La acción es el antídoto fundamental para la desesperanza y la duda.", author: "Tony Robbins" },
    { quote: "Escribe tus metas a diario y reprogramarás tu subconsciente para triunfar.", author: "Brian Tracy" },
    { quote: "Exígete mucho a ti mismo y espera poco de los demás. Así te ahorrarás disgustos.", author: "Confucio" },
    { quote: "Dedicación ve lo que la mayoría no ve. Compromiso hace lo que la mayoría no hace.", author: "Kobe Bryant" }
  ];
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(() => Math.floor(Math.random() * motivationalQuotes.length));

  const changeQuote = () => {
    setCurrentQuoteIndex(prev => (prev + 1) % motivationalQuotes.length);
  };

  // Estado de Notificaciones Web/PWA
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [showNotificationBanner, setShowNotificationBanner] = useState(
    () => typeof Notification !== 'undefined' && Notification.permission !== 'granted' && localStorage.getItem('taskia_dismiss_notif_banner') !== 'true'
  );

  // Estado de Dynamic Island
  const [islandExpanded, setIslandExpanded] = useState(false);
  const [islandMessage, setIslandMessage] = useState<string | null>(null);

  // Estado para modal de 10 Metas Oficiales de Referencia y Pregunta de Control
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [confirmingHabit, setConfirmingHabit] = useState<Habit | null>(null);
  const [restTimer, setRestTimer] = useState<number | null>(null);

  // Guía Visual Interactiva de Respiración Táctica (Box, 4-7-8, Suspiro Fisiológico, Coherencia)
  const [activeBreathingHabit, setActiveBreathingHabit] = useState<Habit | null>(null);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale' | 'hold_empty'>('inhale');
  const [breathingSecondsLeft, setBreathingSecondsLeft] = useState(4);
  const [breathingTotalSeconds, setBreathingTotalSeconds] = useState(180); // 3 minutos por sesión
  const [breathingIsRunning, setBreathingIsRunning] = useState(false);
  const [breathingCompletedRounds, setBreathingCompletedRounds] = useState(0);
  const [breathingSoundEnabled, setBreathingSoundEnabled] = useState(true);

  // === SISTEMA DE TEMAS Y PERSONALIZACIÓN VISUAL ===
  type AppTheme = 'dark' | 'light' | 'cyberpunk' | 'emerald' | 'dracula' | 'saiyan' | 'saiyan-light';
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('taskia_theme') as AppTheme) || 'dark';
  });
  const [profileActiveTab, setProfileActiveTab] = useState<'profile' | 'theme' | 'coach' | 'badges'>('profile');


  useEffect(() => {
    localStorage.setItem('taskia_theme', currentTheme);
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (currentTheme === 'light') {
      document.documentElement.style.backgroundColor = '#f8fafc';
      document.body.style.backgroundColor = '#f8fafc';
    } else if (currentTheme === 'cyberpunk') {
      document.documentElement.style.backgroundColor = '#0b0914';
      document.body.style.backgroundColor = '#0b0914';
    } else if (currentTheme === 'emerald') {
      document.documentElement.style.backgroundColor = '#022c22';
      document.body.style.backgroundColor = '#022c22';
    } else if (currentTheme === 'dracula') {
      document.documentElement.style.backgroundColor = '#181028';
      document.body.style.backgroundColor = '#181028';
    } else if (currentTheme === 'saiyan') {
      document.documentElement.style.backgroundColor = '#020914';
      document.body.style.backgroundColor = '#020914';
    } else if (currentTheme === 'saiyan-light') {
      document.documentElement.style.backgroundColor = '#f0f9ff';
      document.body.style.backgroundColor = '#f0f9ff';
    } else {
      document.documentElement.style.backgroundColor = '#020617';
      document.body.style.backgroundColor = '#020617';
    }
  }, [currentTheme]);

  const themesCatalog: { id: AppTheme; name: string; desc: string; icon: string; bgBadge: string; border: string; preview: string }[] = [
    {
      id: 'dark',
      name: 'Oscuro Élite (Slate)',
      desc: 'Negro espacial con acentos índigo y pizarra. Diseñado para concentración profunda y descanso visual.',
      icon: '🌌',
      bgBadge: 'bg-slate-900 text-slate-300',
      border: 'border-slate-800',
      preview: 'from-slate-950 via-slate-900 to-indigo-950'
    },
    {
      id: 'light',
      name: 'Luz Diurna (Claro)',
      desc: 'Fondo blanco papel con contrastes nítidos. Ideal para entrenamiento al aire libre o ambientes iluminados.',
      icon: '☀️',
      bgBadge: 'bg-slate-100 text-slate-800',
      border: 'border-slate-300',
      preview: 'from-white via-slate-50 to-blue-50'
    },
    {
      id: 'cyberpunk',
      name: 'Cyberpunk Neón',
      desc: 'Oscuridad total de medianoche con pulsos magenta, violeta y cian.',
      icon: '⚡',
      bgBadge: 'bg-fuchsia-950 text-fuchsia-300',
      border: 'border-fuchsia-800',
      preview: 'from-purple-950 via-slate-950 to-fuchsia-950'
    },
    {
      id: 'emerald',
      name: 'Bio-Hacking Esmeralda',
      desc: 'Inspirado en la salud celular, rendimiento físico, longevidad y tono vital.',
      icon: '🌿',
      bgBadge: 'bg-emerald-950 text-emerald-300',
      border: 'border-emerald-800',
      preview: 'from-emerald-950 via-teal-950 to-slate-950'
    },
    {
      id: 'dracula',
      name: 'Drácula & Obsidiana',
      desc: 'Atmósfera gótica refinada con púrpuras profundos y dorados para hábitos inquebrantables.',
      icon: '🔮',
      bgBadge: 'bg-purple-950 text-purple-300',
      border: 'border-purple-800',
      preview: 'from-violet-950 via-slate-950 to-amber-950'
    },
    {
      id: 'saiyan',
      name: 'Saiyan Blue • Migatte no Gokui (Ultra Instinto)',
      desc: 'Energía de los dioses y estado mental sin esfuerzo ni dudas. Aura celeste divina (#0284c7) y destellos de plata pura (#f0f9ff) para romper cualquier límite de disciplina.',
      icon: '🌌',
      bgBadge: 'bg-sky-950 text-sky-300',
      border: 'border-sky-500',
      preview: 'from-sky-500 via-indigo-600 to-slate-950'
    },
    {
      id: 'saiyan-light',
      name: 'Saiyan Blue Divino (Modo Claro)',
      desc: 'Versión luminosa celestial. Fondo blanco hielo (#f0f9ff), acentos celestes puros (#0284c7), destellos cian y plata brillante. Sin oscuridades, máxima claridad divina.',
      icon: '✨',
      bgBadge: 'bg-sky-100 text-sky-800',
      border: 'border-sky-300',
      preview: 'from-sky-100 via-sky-300 to-sky-500'
    },
  ];

  // === MEJORA: Búsqueda rápida ===
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');

  // === MEJORA: Racha (Streak) ===
  const [streakData, setStreakData] = useState<{ current: number; best: number }>(() => {
    const saved = localStorage.getItem('taskia_streak');
    return saved ? JSON.parse(saved) : { current: 0, best: 0 };
  });

  // === MEJORA: Badges / Logros ===
  interface Badge {
    id: string;
    icon: string;
    title: string;
    description: string;
    earned: boolean;
    earnedDate?: string;
  }
  const [badges, setBadges] = useState<Badge[]>(() => {
    const saved = localStorage.getItem('taskia_badges');
    return saved ? JSON.parse(saved) : [
      { id: 'first_check', icon: '✅', title: 'Primer Paso', description: 'Completar tu primer hábito', earned: false },
      { id: 'perfect_day', icon: '🌟', title: 'Día Perfecto', description: 'Completar el 100% de un día', earned: false },
      { id: 'week_streak', icon: '🔥', title: 'Semana de Fuego', description: '7 días consecutivos ≥80%', earned: false },
      { id: 'zen_master', icon: '🧘', title: 'Maestro Zen', description: 'Completar 10 sesiones de respiración', earned: false },
      { id: 'brian_tracy', icon: '📝', title: 'Discípulo Tracy', description: '21 días consecutivos escribiendo metas', earned: false },
      { id: 'iron_will', icon: '💪', title: 'Voluntad de Hierro', description: 'Racha de 14 días ≥80%', earned: false },
      { id: 'centurion', icon: '🏆', title: 'Centurión', description: 'Completar 100 tareas en total', earned: false },
      { id: 'early_bird', icon: '🌅', title: 'Madrugador', description: 'Completar todo antes del mediodía', earned: false },
    ];
  });

  // Reproducir campana tibetana suave para guiar la respiración con ojos cerrados
  const playBreathingChime = (phase: 'inhale' | 'hold' | 'exhale' | 'hold_empty') => {
    if (!breathingSoundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Frecuencias binaurales armónicas: Inhale = 528Hz (Solfeo / Calma), Hold = 432Hz, Exhale = 396Hz
      const freq = phase === 'inhale' ? 528 : phase === 'hold' ? 432 : phase === 'exhale' ? 396 : 352;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch {
      // Audio context policy
    }
  };

  // Modal Detalle Interactivo de Tarea / Guía de Ejecución
  const [selectedDetailHabit, setSelectedDetailHabit] = useState<Habit | null>(null);

  // Modal para inspeccionar plantilla en el Catálogo antes de inscribir
  const [previewProgram, setPreviewProgram] = useState<Program | null>(null);

  // Vision Board y Grill-Me Interactivo
  interface VisionCard {
    id: string;
    category: string;
    emoji: string;
    title: string;
    why: string;
    deadline: string;
    progress: number;
    color: string;
  }

  const defaultVisionCards: VisionCard[] = [
    {
      id: "v-1",
      category: "Salud y Tren Inferior",
      emoji: "🦵",
      title: "Rehabilitación Aquiles & Peso 85 kg con Fuerza TRX",
      why: "Tener la agilidad de jugar fútbol sin dolor ni recaídas y tono muscular de alto rendimiento.",
      deadline: "28/02/2027",
      progress: 65,
      color: "from-emerald-950/60 to-emerald-900/20 border-emerald-500/40"
    },
    {
      id: "v-2",
      category: "Software & Negocios",
      emoji: "💻",
      title: "MVP de Software Lanzado & Camino a 100M Anuales",
      why: "Construir libertad financiera e independencia operativa con usuarios recurrentes de pago.",
      deadline: "31/05/2027",
      progress: 40,
      color: "from-indigo-950/60 to-indigo-900/20 border-indigo-500/40"
    },
    {
      id: "v-3",
      category: "Música y Creación",
      emoji: "🎵",
      title: "Primer Single Oficial Masterizado & Publicado",
      why: "Expresar mi identidad creativa y producir un sonido auténtico con beat estructurado.",
      deadline: "30/04/2027",
      progress: 30,
      color: "from-amber-950/60 to-amber-900/20 border-amber-500/40"
    },
    {
      id: "v-4",
      category: "Hogar y Entorno",
      emoji: "🏡",
      title: "Termopaneles Instalados en Toda la Casa",
      why: "Confort térmico total, aislamiento acústico y eficiencia energética en mi hogar.",
      deadline: "31/03/2027",
      progress: 50,
      color: "from-purple-950/60 to-purple-900/20 border-purple-500/40"
    }
  ];

  const [visionCards, setVisionCards] = useState<VisionCard[]>(() => {
    const saved = localStorage.getItem('taskia_vision_cards');
    return saved ? JSON.parse(saved) : defaultVisionCards;
  });

  useEffect(() => {
    localStorage.setItem('taskia_vision_cards', JSON.stringify(visionCards));
  }, [visionCards]);

  // Persist streak and badges
  useEffect(() => {
    localStorage.setItem('taskia_streak', JSON.stringify(streakData));
  }, [streakData]);

  useEffect(() => {
    localStorage.setItem('taskia_badges', JSON.stringify(badges));
  }, [badges]);

  // Check and award badges when habits change
  useEffect(() => {
    if (!habits.length) return;
    const completedToday = habits.filter(h => h.today_log?.completed).length;
    const totalToday = habits.length;
    const pctToday = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

    const newBadges = [...badges];
    let changed = false;
    const today = new Date().toISOString().split('T')[0];

    // First Check
    if (!newBadges.find(b => b.id === 'first_check')?.earned && completedToday > 0) {
      const b = newBadges.find(b => b.id === 'first_check');
      if (b) { b.earned = true; b.earnedDate = today; changed = true; }
    }

    // Perfect Day
    if (!newBadges.find(b => b.id === 'perfect_day')?.earned && pctToday === 100 && totalToday > 0) {
      const b = newBadges.find(b => b.id === 'perfect_day');
      if (b) { b.earned = true; b.earnedDate = today; changed = true; }
    }

    // Week Streak
    if (!newBadges.find(b => b.id === 'week_streak')?.earned && streakData.current >= 7) {
      const b = newBadges.find(b => b.id === 'week_streak');
      if (b) { b.earned = true; b.earnedDate = today; changed = true; }
    }

    // Iron Will (14 days)
    if (!newBadges.find(b => b.id === 'iron_will')?.earned && streakData.current >= 14) {
      const b = newBadges.find(b => b.id === 'iron_will');
      if (b) { b.earned = true; b.earnedDate = today; changed = true; }
    }

    // Update streak
    if (pctToday >= 80 && totalToday > 0) {
      const lastStreakDate = localStorage.getItem('taskia_last_streak_date');
      if (lastStreakDate !== today) {
        localStorage.setItem('taskia_last_streak_date', today);
        setStreakData(prev => {
          const newCurrent = prev.current + 1;
          return { current: newCurrent, best: Math.max(newCurrent, prev.best) };
        });
      }
    }

    if (changed) setBadges(newBadges);
  }, [habits]);

  // Grill-Me Wizard State dentro de la App
  const [showGrillMeModal, setShowGrillMeModal] = useState(false);
  const [grillStep, setGrillStep] = useState(0);
  const [grillAnswers, setGrillAnswers] = useState({
    area: 'Cuerpo & Salud',
    goal: '',
    why: '',
    deadline: '',
    commitment: '90%'
  });

  // Modal para editar tarjeta individual del Vision Board
  const [editingCard, setEditingCard] = useState<VisionCard | null>(null);

  // Modal para Crear o Editar Hábitos / Planes Manualmente
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitFormData, setHabitFormData] = useState({
    planName: '',
    title: '',
    description: '',
    habit_type: 'boolean' as 'boolean' | 'numeric',
    target_value: 1,
    unit: '',
    estimated_minutes: 5,
    frequency_type: 'daily',
    days_of_week: '0,1,2,3,4,5,6',
    sla_target_percent: 85,
    reset_on_miss: false
  });

  // Sistema de notificación/alerta en pantalla (In-App Coach Banners & Push Simulation)
  const [activeAlert, setActiveAlert] = useState<{ title: string; body: string; emoji: string } | null>(null);

  const playNotificationTone = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // AudioContext prevented by browser policy
    }
  };

  const showInAppNotification = (title: string, body: string, emoji = '🔥') => {
    playNotificationTone();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate([100, 50, 100]); } catch { /* ignore */ }
    }
    setActiveAlert({ title, body, emoji });
    setTimeout(() => {
      setActiveAlert(null);
    }, 6000);
  };


  const brianTracy10Goals = [
    { id: 1, text: "Yo peso 91 kg con energía y constancia diaria para el 31 de octubre de 2026.", date: "31/10/2026", cat: "Físico" },
    { id: 2, text: "Yo cumplo mi rutina de 3 entrenamientos semanales más 1 partido de fútbol cada semana.", date: "Semanal", cat: "Deporte" },
    { id: 3, text: "Yo camino un mínimo de 8.000 pasos diarios durante mi jornada laboral de lunes a viernes.", date: "Lunes a Viernes", cat: "Salud" },
    { id: 4, text: "Yo tengo completamente cotizado, medido y seleccionado el proveedor de termopaneles para mi casa para el 15 de noviembre de 2026.", date: "15/11/2026", cat: "Hogar" },
    { id: 5, text: "Yo produzco y tengo lista la maqueta (beat y estructura) del primer track de mi proyecto musical para el 30 de noviembre de 2026.", date: "30/11/2026", cat: "Música" },
    { id: 6, text: "Yo defino y termino el prototipo funcional (MVP) de mi proyecto de desarrollo de software para el 15 de diciembre de 2026.", date: "15/12/2026", cat: "Software" },
    { id: 7, text: "Yo peso 85 kg con excelente tono muscular y resistencia para el 28 de febrero de 2027.", date: "28/02/2027", cat: "Físico" },
    { id: 8, text: "Yo tengo instalados y funcionando los termopaneles en toda mi casa para el 31 de marzo de 2027.", date: "31/03/2027", cat: "Hogar" },
    { id: 9, text: "Yo lanzo mi primer single oficial terminado y masterizado en plataformas para el 30 de abril de 2027.", date: "30/04/2027", cat: "Música" },
    { id: 10, text: "Yo genero mis primeros clientes de pago monetizando mi software para el 31 de mayo de 2027 (camino a los 100M anuales).", date: "31/05/2027", cat: "Negocios" },
  ];


  const [jsonPayload, setJsonPayload] = useState(JSON.stringify({
    title: "Plan de Movilidad y Cadena Posterior",
    description: "Rutina corta de 15 minutos para salud articular y tendones",
    category: "Movilidad",
    duration_days: 14,
    items: [
      {
        title: "Dorsiflexión dinámica en pared",
        day_offset: 0,
        habit_type: "numeric",
        target_value: 3,
        unit: "series",
        description: "10 repeticiones por pierna"
      },
      {
        title: "Puente glúteo isométrico",
        day_offset: 0,
        habit_type: "numeric",
        target_value: 3,
        unit: "series",
        description: "30 segundos de contracción sostenida"
      }
    ]
  }, null, 2));
  
  const [injectStatus, setInjectStatus] = useState<string | null>(null);

  const getHeaders = () => {
    return authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {};
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = getHeaders();
      const [habitsRes, programsRes, metricsRes, coachesRes] = await Promise.all([
        axios.get(`${API_BASE}/habits/today/`, headers),
        axios.get(`${API_BASE}/programs/`, headers),
        axios.get(`${API_BASE}/metrics/summary/`, headers),
        axios.get(`${API_BASE}/coaches/`, headers)
      ]);
      setHabits(habitsRes.data);
      setPrograms(programsRes.data);
      setMetrics(metricsRes.data);
      setCoaches(coachesRes.data);

      if (metricsRes.data?.current_user) {
        setCurrentUser(metricsRes.data.current_user);
        if (metricsRes.data.current_user.coach_preference?.coach) {
          setSelectedCoachId(metricsRes.data.current_user.coach_preference.coach);
        } else if (coachesRes.data.length > 0) {
          setSelectedCoachId(coachesRes.data[0].id);
        }
      } else if (coachesRes.data.length > 0) {
        setSelectedCoachId(coachesRes.data[0].id);
      }
    } catch (err: any) {
      console.error("Error al cargar datos:", err);
      if (err.response?.status === 401) {
        // Token inválido o expirado: resetear sesión limpia
        localStorage.removeItem('taskia_token');
        setAuthToken(null);
        setCurrentUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [authToken]);

  useEffect(() => {
    if (restTimer === null || restTimer <= 0) return;
    const interval = setInterval(() => {
      setRestTimer((prev) => {
        if (prev && prev > 1) return prev - 1;
        // Timer completado: sonar campana
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + 0.5);
          }
        } catch {}
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try { navigator.vibrate([150, 50, 150]); } catch {}
        }
        return null;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [restTimer]);

  // Loop de Respiración Táctica (Box Breathing: 4s Inhala, 4s Retiene, 4s Exhala, 4s Retiene vacío)
  useEffect(() => {
    if (!activeBreathingHabit || !breathingIsRunning) return;

    const interval = setInterval(() => {
      setBreathingTotalSeconds((total) => {
        if (total <= 1) {
          // Completado
          setBreathingIsRunning(false);
          toggleHabit(activeBreathingHabit);
          setIslandMessage("✨ Sesión de Respiración completada con éxito. Sistema nervioso regulado.");
          setIslandExpanded(true);
          setTimeout(() => setIslandExpanded(false), 4500);
          return 0;
        }
        return total - 1;
      });

      setBreathingSecondsLeft((sec) => {
        if (sec <= 1) {
          // Transición de fase
          // Box Breathing standard: Inhale 4s -> Hold 4s -> Exhale 4s -> Hold Empty 4s
          const isPhysiologicalSigh = activeBreathingHabit.title.toLowerCase().includes('suspiro') || activeBreathingHabit.title.toLowerCase().includes('fisiol');
          const is478 = activeBreathingHabit.title.includes('4-7-8');

          if (is478) {
            if (breathingPhase === 'inhale') { setBreathingPhase('hold'); playBreathingChime('hold'); return 7; }
            if (breathingPhase === 'hold') { setBreathingPhase('exhale'); playBreathingChime('exhale'); return 8; }
            setBreathingPhase('inhale');
            playBreathingChime('inhale');
            setBreathingCompletedRounds(r => r + 1);
            return 4;
          } else if (isPhysiologicalSigh) {
            if (breathingPhase === 'inhale') { setBreathingPhase('hold'); playBreathingChime('hold'); return 1; }
            if (breathingPhase === 'hold') { setBreathingPhase('exhale'); playBreathingChime('exhale'); return 6; }
            setBreathingPhase('inhale');
            playBreathingChime('inhale');
            setBreathingCompletedRounds(r => r + 1);
            return 3;
          } else {
            // Box Breathing 4-4-4-4
            if (breathingPhase === 'inhale') { setBreathingPhase('hold'); playBreathingChime('hold'); return 4; }
            if (breathingPhase === 'hold') { setBreathingPhase('exhale'); playBreathingChime('exhale'); return 4; }
            if (breathingPhase === 'exhale') { setBreathingPhase('hold_empty'); playBreathingChime('hold_empty'); return 4; }
            setBreathingPhase('inhale');
            playBreathingChime('inhale');
            setBreathingCompletedRounds(r => r + 1);
            return 4;
          }
        }
        return sec - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeBreathingHabit, breathingIsRunning, breathingPhase, breathingSoundEnabled]);

  // Recordatorios periódicos del Coach (cada 45 minutos si quedan hábitos pendientes)
  useEffect(() => {
    const reminderInterval = setInterval(() => {
      const pendingHabits = habits.filter(h => !h.today_log?.completed);
      if (pendingHabits.length > 0) {
        const activeCoach = coaches.find(c => c.id === selectedCoachId) || coaches[0];
        const coachName = activeCoach ? activeCoach.name : 'Entrenador Taskia';
        const msg = activeCoach?.midday_reminder || `Tienes ${pendingHabits.length} hábitos pendientes hoy. ¡No negocies con la flojera!`;
        sendCoachNotification(`🔔 ${coachName}: Pendientes hoy`, msg, activeCoach?.avatar_emoji || '🔥');
      }
    }, 45 * 60 * 1000);

    return () => clearInterval(reminderInterval);
  }, [habits, coaches, selectedCoachId]);

  const toggleBlockCollapse = (blockKey: string) => {
    setCollapsedBlocks(prev => ({
      ...prev,
      [blockKey]: !prev[blockKey]
    }));
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const endpoint = isRegister ? `${API_BASE}/auth/register/` : `${API_BASE}/auth/login/`;
      const payload = isRegister 
        ? { username: authUsername, password: authPassword, email: authEmail }
        : { username: authUsername, password: authPassword };
      
      const res = await axios.post(endpoint, payload);
      const token = res.data.tokens.access;
      localStorage.setItem('taskia_token', token);
      setAuthToken(token);
      setCurrentUser(res.data.user);
      setShowAuthModal(false);
    } catch (err: any) {
      setAuthError(err.response?.data?.error || 'Error al autenticar. Revisa tus credenciales.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('taskia_token');
    setAuthToken(null);
    fetchData();
  };

  const sendCoachNotification = (title: string, body: string, emoji = '🔥') => {
    // 1. In-App alert con sonido y vibración
    showInAppNotification(title, body, emoji);

    // 2. Disparar notificación de sistema si los permisos están concedidos
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png'
          });
        }).catch(() => {
          try {
            new Notification(title, { body, icon: '/pwa-192x192.png' });
          } catch (e) {
            console.log("Fallback notification", e);
          }
        });
      } else {
        try {
          new Notification(title, { body, icon: '/pwa-192x192.png' });
        } catch (e) {
          console.log("Direct notification", e);
        }
      }
    }
  };

  const requestNotificationPermission = async () => {
    const activeCoach = coaches.find(c => c.id === selectedCoachId) || coaches[0];
    const coachName = activeCoach ? activeCoach.name : 'Entrenador Taskia';
    const msg = activeCoach ? activeCoach.morning_quote : '¡Notificaciones activadas! Ahora sí estás obligado a cumplir tu meta.';

    if (typeof Notification === 'undefined') {
      sendCoachNotification(`🔥 ${coachName} activado`, msg, activeCoach?.avatar_emoji || '🔥');
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        setShowNotificationBanner(false);
        sendCoachNotification(`🔥 ${coachName} activado`, msg, activeCoach?.avatar_emoji || '🔥');

        // Actualizar preferencia en el backend
        await axios.post(`${API_BASE}/auth/me/`, {
          notifications_enabled: true,
          coach_id: selectedCoachId
        }, getHeaders());
      } else {
        // Modo In-App si el usuario o navegador lo bloquea
        showInAppNotification(`⚠️ Notificaciones en modo In-App`, 'Activamos el sonido y alertas de disciplina dentro de la aplicación.', '🛡️');
      }
    } catch (err) {
      console.error("Error pidiendo permiso de notificación:", err);
      sendCoachNotification(`🔥 ${coachName} activado`, msg, activeCoach?.avatar_emoji || '🔥');
    }
  };


  const handleSelectCoach = async (coachId: number) => {
    setSelectedCoachId(coachId);
    try {
      await axios.post(`${API_BASE}/auth/me/`, {
        coach_id: coachId
      }, getHeaders());
      
      const coach = coaches.find(c => c.id === coachId);
      if (coach) {
        setIslandMessage(`${coach.avatar_emoji} ${coach.name}: "${coach.midday_reminder}"`);
        setIslandExpanded(true);
        setTimeout(() => setIslandExpanded(false), 5000);
      }
      fetchData();
    } catch (err) {
      console.error("Error actualizando coach:", err);
    }
  };

  const triggerCelebration = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const toggleHabit = async (habit: Habit) => {
    // Si es del reto Brian Tracy y no está completado aún, mostrar la pregunta de control primero
    if (getPlanNameFromHabit(habit).toLowerCase().includes('brian tracy') && !habit.today_log?.completed) {
      setConfirmingHabit(habit);
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}/habits/${habit.id}/toggle_today/`, {}, getHeaders());
      if (res.data.completed) {
        triggerCelebration();
        setIslandMessage(`¡Hábito cumplido! ${cleanTitle(habit.title)}`);
        setIslandExpanded(true);
        setTimeout(() => setIslandExpanded(false), 3500);
      }
      fetchData();
    } catch (err) {
      console.error("Error al marcar hábito:", err);
    }
  };

  const startBreathingSession = (habit: Habit) => {
    setActiveBreathingHabit(habit);
    setBreathingPhase('inhale');
    setBreathingSecondsLeft(4);
    // Configurar duración inteligente: si la unidad son minutos, usar target_value; si no, usar estimated_minutes (ej. 3 a 5 min)
    let minutes = 3;
    if (habit.unit?.toLowerCase().includes('min')) {
      minutes = habit.target_value > 0 ? habit.target_value : 3;
    } else if (habit.estimated_minutes && habit.estimated_minutes > 0) {
      minutes = habit.estimated_minutes;
    }
    setBreathingTotalSeconds(Math.round(minutes * 60));
    setBreathingCompletedRounds(0);
    setBreathingIsRunning(true);
    playBreathingChime('inhale');
  };

  const confirmBrianTracyCheck = async () => {
    if (!confirmingHabit) return;
    try {
      await axios.post(`${API_BASE}/habits/${confirmingHabit.id}/toggle_today/`, {}, getHeaders());
      triggerCelebration();
      setIslandMessage(`🔥 ¡Día de Brian Tracy desbloqueado! Racha sostenida.`);
      setIslandExpanded(true);
      setTimeout(() => setIslandExpanded(false), 4000);
      setConfirmingHabit(null);
      fetchData();
    } catch (err) {
      console.error("Error al confirmar día:", err);
    }
  };

  const logSeriesStep = async (habitId: number, stepDelta: number) => {
    try {
      await axios.post(`${API_BASE}/habits/${habitId}/toggle_today/`, { step: stepDelta }, getHeaders());
      if (stepDelta > 0) {
        setRestTimer(45);
      }
      fetchData();
    } catch (err) {
      console.error("Error al registrar serie:", err);
    }
  };

  const handleEnroll = async (programId: number) => {
    try {
      const res = await axios.post(`${API_BASE}/programs/${programId}/enroll/`, {}, getHeaders());
      alert(res.data.message || "¡Programa inscrito correctamente!");
      fetchData();
      setActiveTab('today');
      setSelectedPlanName(null);
    } catch (err) {
      console.error("Error al inscribir programa:", err);
      alert("Error al inscribirse en el programa.");
    }
  };

  const handleInjectProgram = async () => {
    try {
      setInjectStatus("Inyectando por API...");
      const parsed = JSON.parse(jsonPayload);
      const res = await axios.post(`${API_BASE}/programs/inject/`, parsed, getHeaders());
      setInjectStatus(`¡Programa "${res.data.title}" inyectado exitosamente!`);
      fetchData();
    } catch (err: any) {
      console.error("Error inyectando:", err);
      setInjectStatus(`Error: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
    }
  };

  // Controladores de Creación y Edición Manual de Hábitos y Planes
  const openCreateHabitModal = (defaultPlanName?: string) => {
    setEditingHabit(null);
    setHabitFormData({
      planName: defaultPlanName || (selectedPlanName || ''),
      title: '',
      description: '',
      habit_type: 'boolean',
      target_value: 1,
      unit: '',
      estimated_minutes: 5,
      frequency_type: 'daily',
      days_of_week: '0,1,2,3,4,5,6',
      sla_target_percent: 85,
      reset_on_miss: (defaultPlanName || selectedPlanName || '').toLowerCase().includes('brian tracy') || (defaultPlanName || selectedPlanName || '').toLowerCase().includes('21 d')
    });
    setShowHabitModal(true);
  };

  const openEditHabitModal = (habit: Habit) => {
    setEditingHabit(habit);
    const planName = getPlanNameFromHabit(habit);
    setHabitFormData({
      planName: planName === 'Hábitos Personales' ? '' : planName,
      title: cleanTitle(habit.title),
      description: habit.description || '',
      habit_type: habit.habit_type || 'boolean',
      target_value: habit.target_value || 1,
      unit: habit.unit || '',
      estimated_minutes: habit.estimated_minutes ?? 5,
      frequency_type: habit.frequency_type || 'daily',
      days_of_week: habit.days_of_week || '0,1,2,3,4,5,6',
      sla_target_percent: habit.sla_target_percent || 85,
      reset_on_miss: habit.reset_on_miss ?? (habit.title.toLowerCase().includes('brian tracy') || habit.title.toLowerCase().includes('21 d'))
    });
    setShowHabitModal(true);
  };

  const handleSaveHabit = async () => {
    if (!habitFormData.title.trim()) {
      alert("Por favor ingresa un título para la tarea o hábito.");
      return;
    }

    const fullTitle = habitFormData.planName.trim()
      ? `[${habitFormData.planName.trim()}] ${habitFormData.title.trim()}`
      : habitFormData.title.trim();

    const payload = {
      title: fullTitle,
      description: habitFormData.description.trim(),
      habit_type: habitFormData.habit_type,
      target_value: habitFormData.target_value,
      unit: habitFormData.unit.trim(),
      estimated_minutes: Number(habitFormData.estimated_minutes) || 5,
      frequency_type: habitFormData.frequency_type,
      days_of_week: habitFormData.days_of_week,
      sla_target_percent: Number(habitFormData.sla_target_percent) || 85
    };
    // Guardar preferencia de reinicio por hábito en localStorage
    if (editingHabit) {
      localStorage.setItem(`taskia_reset_on_miss_${editingHabit.id}`, String(habitFormData.reset_on_miss));
    }

    try {
      if (editingHabit) {
        await axios.patch(`${API_BASE}/habits/${editingHabit.id}/`, payload, getHeaders());
        setIslandMessage(`✏️ Hábito "${habitFormData.title}" actualizado con éxito.`);
      } else {
        await axios.post(`${API_BASE}/habits/`, payload, getHeaders());
        setIslandMessage(`✨ Nuevo hábito "${habitFormData.title}" añadido al plan.`);
        triggerCelebration();
      }
      setIslandExpanded(true);
      setTimeout(() => setIslandExpanded(false), 3500);
      setShowHabitModal(false);
      setEditingHabit(null);
      if (selectedDetailHabit && editingHabit && selectedDetailHabit.id === editingHabit.id) {
        setSelectedDetailHabit(null);
      }
      fetchData();
    } catch (err: any) {
      console.error("Error guardando hábito:", err);
      alert(`Error al guardar: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
    }
  };

  const handleDeleteHabit = async (habitId: number, habitTitle: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${cleanTitle(habitTitle)}"?\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/habits/${habitId}/`, getHeaders());
      setIslandMessage(`🗑️ Hábito eliminado.`);
      setIslandExpanded(true);
      setTimeout(() => setIslandExpanded(false), 3000);
      if (selectedDetailHabit && selectedDetailHabit.id === habitId) {
        setSelectedDetailHabit(null);
      }
      fetchData();
    } catch (err: any) {
      console.error("Error eliminando hábito:", err);
      alert(`Error al eliminar: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
    }
  };

  // Helper para extraer nombre del plan o categoría a partir de títulos como "[Plan XYZ] Titulo"
  const getPlanNameFromHabit = (habit: Habit) => {
    const match = habit.title.match(/^\[(.*?)\]/);
    if (match && match[1]) {
      return match[1].trim();
    }
    return "Hábitos Personales";
  };

  const cleanTitle = (rawTitle: string) => {
    return rawTitle.replace(/^\[.*?\]\s*/, '');
  };

  // Agrupar hábitos por Plan/Colección
  const planGroups: Record<string, Habit[]> = {};
  habits.forEach(h => {
    const planName = getPlanNameFromHabit(h);
    if (!planGroups[planName]) {
      planGroups[planName] = [];
    }
    planGroups[planName].push(h);
  });

  const planSummaryList: ProgramGroup[] = Object.keys(planGroups).map(name => {
    const list = planGroups[name];
    const completed = list.filter(h => h.today_log?.completed).length;
    return {
      name,
      habits: list,
      totalCount: list.length,
      completedCount: completed,
      progressPercent: list.length > 0 ? Math.round((completed / list.length) * 100) : 0
    };
  });

  // Hábitos a mostrar cuando se entra dentro de un plan
  const selectedPlanHabits = selectedPlanName ? (planGroups[selectedPlanName] || []) : [];

  // === MEJORA: Tiempo total estimado del día ===
  const totalEstimatedMinutes = habits.reduce((sum, h) => sum + (h.estimated_minutes || 5), 0);
  const completedEstimatedMinutes = habits
    .filter(h => h.today_log?.completed)
    .reduce((sum, h) => sum + (h.estimated_minutes || 5), 0);
  const pendingEstimatedMinutes = totalEstimatedMinutes - completedEstimatedMinutes;

  // Earned badges count
  const earnedBadgesCount = badges.filter(b => b.earned).length;

  // PANTALLA DE INICIO DE SESIÓN OBLIGATORIA (Privacidad de Hábitos y Metas Personales)
  if (!authToken) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Glow de fondo sofisticado */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-sm relative z-10 space-y-6">
          {/* Logo y Branding */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl shadow-indigo-950/30">
              <Flame className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">TASKIA</h1>
            <p className="text-xs text-slate-400 font-medium">
              Tu espacio privado de hábitos, disciplina y visualización 3P
            </p>
          </div>

          {/* Tarjeta de Login / Registro */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                {isRegister ? <UserPlus className="w-4 h-4 text-indigo-400" /> : <LogIn className="w-4 h-4 text-indigo-400" />}
                {isRegister ? 'Crear mi Cuenta' : 'Iniciar Sesión'}
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-800/50">
                Privado
              </span>
            </div>

            {authError && (
              <div className="bg-red-950/60 border border-red-800 text-red-300 text-xs p-2.5 rounded-xl mb-4 leading-snug">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Nombre de Usuario</label>
                <input 
                  type="text" 
                  required
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  placeholder="ej. joshua" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {isRegister && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Correo Electrónico</label>
                  <input 
                    type="email" 
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="tu@correo.com" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Contraseña</label>
                <input 
                  type="password" 
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition mt-2"
              >
                {isRegister ? 'Registrarme y Comenzar' : 'Entrar a mi Cuenta'}
              </button>
            </form>

            <div className="text-center mt-4 pt-3 border-t border-slate-800/80">
              <button 
                onClick={() => { setIsRegister(!isRegister); setAuthError(''); }}
                className="text-xs text-slate-400 hover:text-indigo-400 font-medium transition"
              >
                {isRegister ? '¿Ya tienes cuenta? Inicia sesión aquí' : '¿Nuevo usuario? Crea tu cuenta aquí'}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            🔒 Tus hábitos, notas de entrenamiento, SLAs y tarjetas de visualización están completamente cifradas y asociadas a tu usuario.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans w-full max-w-full overflow-x-hidden safe-top safe-bottom pb-28 md:pb-12">
      {/* Top Header Responsivo - Minimalista y Sofisticado */}
      {/* Top Header Limpio y Minimalista (Sin saturación visual) */}
      <header className="border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-4 py-2.5 w-full">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <span className="text-sm font-black tracking-tight text-white">
                TASKIA
              </span>
            </div>
          </div>

          {/* Dynamic Island Compacta en Barra Superior */}
          <div 
            onClick={() => setIslandExpanded(!islandExpanded)}
            className="flex items-center gap-2 bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 px-3 py-1 rounded-full cursor-pointer transition"
            title="Toca para ver mensaje del Coach"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {/* Circular progress mini */}
            <div className="relative w-7 h-7">
              <svg className="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
                <circle cx="14" cy="14" r="11" fill="none" stroke="rgb(30,41,59)" strokeWidth="2.5" />
                <circle cx="14" cy="14" r="11" fill="none" stroke={
                  habits.length > 0 && habits.filter(h => h.today_log?.completed).length === habits.length
                    ? 'rgb(52,211,153)' : 'rgb(99,102,241)'
                } strokeWidth="2.5" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 11}`}
                  strokeDashoffset={`${2 * Math.PI * 11 * (1 - (habits.length > 0 ? habits.filter(h => h.today_log?.completed).length / habits.length : 0))}`}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white">
                {habits.length > 0 ? Math.round((habits.filter(h => h.today_log?.completed).length / habits.length) * 100) : 0}
              </span>
            </div>
            {restTimer !== null && (
              <div className="relative w-6 h-6 shrink-0">
                <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" fill="none" stroke="rgb(120,53,15)" strokeWidth="2" />
                  <circle cx="12" cy="12" r="9" fill="none" stroke="rgb(251,191,36)" strokeWidth="2" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 9}`}
                    strokeDashoffset={`${2 * Math.PI * 9 * (1 - (restTimer / 60))}`}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-amber-300 font-mono">{restTimer}</span>
              </div>
            )}
            <span className="text-[11px]">{coaches.find(c => c.id === selectedCoachId)?.avatar_emoji || '🔥'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Botón de Perfil de Usuario y Coach */}
            <button 
              onClick={() => setShowCoachModal(true)}
              className="flex items-center gap-1.5 p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition"
              title="Perfil & Entrenador"
            >
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-medium text-slate-300 hidden sm:inline">
                {currentUser?.username ? `@${currentUser.username}` : 'demo'}
              </span>
            </button>


            {/* Indicador de Notificaciones */}
            <button 
              onClick={requestNotificationPermission}
              className={`p-1.5 rounded-xl border transition ${
                notificationPermission === 'granted' 
                  ? 'bg-slate-900 border-emerald-800/60 text-emerald-400' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title={notificationPermission === 'granted' ? 'Notificaciones activas' : 'Activar notificaciones'}
            >
              {notificationPermission === 'granted' ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
            </button>

            {authToken ? (
              <button onClick={handleLogout} className="p-1.5 text-slate-500 hover:text-red-400">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button onClick={() => { setShowAuthModal(true); setIsRegister(false); }} className="text-slate-300 hover:text-white font-semibold text-[11px] px-2 py-1 bg-slate-900 border border-slate-800 rounded-xl">
                Entrar
              </button>
            )}

            <button onClick={fetchData} className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Vista Desplegada de la Dynamic Island (Si el usuario la toca) */}
        {islandExpanded && (
          <div className="max-w-md mx-auto mt-2 bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-xl transition-all">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base">{coaches.find(c => c.id === selectedCoachId)?.avatar_emoji || '🔥'}</span>
                <span className="text-xs font-bold text-white">
                  {coaches.find(c => c.id === selectedCoachId)?.name || 'Entrenador Taskia'}
                </span>
              </div>
              <button onClick={() => setIslandExpanded(false)} className="text-slate-500 hover:text-white text-xs">✕</button>
            </div>
            <p className="text-xs text-slate-300 italic leading-relaxed">
              "{islandMessage || coaches.find(c => c.id === selectedCoachId)?.morning_quote || '¡Despierta! Hoy es el día para mover la aguja.'}"
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 mt-2 border-t border-slate-800/80">
              <span>Cumplimiento hoy:</span>
              <span className="font-bold text-slate-200">
                {habits.filter(h => h.today_log?.completed).length} de {habits.length} ({metrics?.today_compliance_percent || 0}%)
              </span>
            </div>
          </div>
        )}

        {/* Frase Motivacional Destacada y Completa (Sin recortar) */}
        <div className="max-w-2xl mx-auto mt-2 px-0.5">
          <div 
            onClick={changeQuote}
            className="group bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 hover:border-slate-700 border border-slate-800 rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition shadow-sm"
            title="Toca para rotar la frase motivacional"
          >
            <div className="flex items-start gap-2.5 flex-1 min-w-0">
              <span className="text-amber-400 text-base font-serif font-black leading-none shrink-0 mt-0.5">“</span>
              <div className="flex-1">
                <p className="text-xs text-slate-200 italic font-medium leading-relaxed">
                  {motivationalQuotes[currentQuoteIndex].quote}
                </p>
                <span className="text-[10px] text-amber-400/90 font-semibold block mt-1 tracking-wide">
                  — {motivationalQuotes[currentQuoteIndex].author}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 shrink-0 pl-1 border-l border-slate-800">
              <RefreshCw className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 group-hover:rotate-180 transition-transform duration-500" />
              <span className="text-[9px] text-slate-500 font-mono hidden sm:inline">rotar</span>
            </div>
          </div>
        </div>
      </header>

      {/* Alerta Flotante Estilo Notificación de Sistema (In-App Push Banner) */}
      {activeAlert && (
        <div className="fixed top-3 left-3 right-3 z-50 max-w-md mx-auto animate-bounce-short">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl p-3 shadow-2xl flex items-start gap-2.5 backdrop-blur-md">
            <span className="text-xl shrink-0 mt-0.5">{activeAlert.emoji}</span>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-white">{activeAlert.title}</h4>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{activeAlert.body}</p>
            </div>
            <button onClick={() => setActiveAlert(null)} className="text-slate-500 hover:text-white text-xs p-1">✕</button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto w-full px-3 sm:px-4 py-3 flex-1 flex flex-col gap-4">
        
        {/* Banner de Notificaciones con opción de cerrar y silenciar */}
        {showNotificationBanner && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-slate-200 truncate">Notificaciones de disciplina</h4>
                <p className="text-[10px] text-slate-400">Recordatorios para proteger tu racha diaria.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={requestNotificationPermission}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold py-1.5 px-3 rounded-xl transition"
              >
                Activar
              </button>
              <button 
                onClick={() => {
                  setShowNotificationBanner(false);
                  localStorage.setItem('taskia_dismiss_notif_banner', 'true');
                }}
                className="text-slate-500 hover:text-white p-1 rounded-lg text-xs"
                title="Descartar este aviso"
              >
                ✕
              </button>
            </div>
          </div>
        )}


        
        {/* ======================================================== */}
        {/* PESTAÑA 1: MIS PLANES Y TAREAS (SISTEMA DE DRILL-DOWN / ENTRAR Y SALIR) */}
        {/* ======================================================== */}
        {activeTab === 'today' && (
          <div className="space-y-4">
            
            {/* Si el usuario NO ha entrado dentro de un plan -> VISTA DE RESUMEN DIARIO O COLECCIÓN DE PLANES */}
            {!selectedPlanName && (
              <div className="space-y-3.5">
                {/* Cabecera con selector de modo: Resumen Directo vs Carpetas de Planes */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl shadow-sm">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                      {todayViewMode === 'checklist' ? 'Resumen de Hoy' : 'Mis Planes y Programas'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {todayViewMode === 'checklist' 
                        ? `${habits.filter(h => !h.today_log?.completed).length} pendientes · ~${pendingEstimatedMinutes} min restantes`
                        : 'Organizado por carpetas y disciplinas'}
                    </p>
                  </div>

                  {/* Switcher entre Resumen Directo, Vista por Planes y Botón + Nuevo Hábito */}
                  <div className="flex items-center gap-1.5 flex-wrap shrink-0 self-start sm:self-auto">
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
                      <button
                        onClick={() => setTodayViewMode('checklist')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                          todayViewMode === 'checklist'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <ListChecks className="w-3.5 h-3.5" />
                        <span>Resumen Directo</span>
                      </button>
                      <button
                        onClick={() => setTodayViewMode('plans')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                          todayViewMode === 'plans'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Por Planes ({planSummaryList.length})</span>
                      </button>
                    </div>

                    <button
                      onClick={() => openCreateHabitModal()}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95"
                      title="Crear un nuevo hábito o plan manual"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Nuevo Hábito</span>
                    </button>
                  </div>
                </div>

                {/* ======================================================== */}
                {/* MODO 1: RESUMEN DE HOY (LISTA DE TAREAS Y ACCIÓN DIRECTA) */}
                {/* ======================================================== */}
                {todayViewMode === 'checklist' && (
                  <div className="space-y-3">
                    {/* Filtros de estado y Toggle de Agrupación */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => setTodayFilter('pending')}
                          className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition ${
                            todayFilter === 'pending'
                              ? 'bg-amber-950/80 border-amber-500/80 text-amber-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Pendientes ({habits.filter(h => !h.today_log?.completed).length})
                        </button>
                        <button
                          onClick={() => setTodayFilter('all')}
                          className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition ${
                            todayFilter === 'all'
                              ? 'bg-indigo-950/80 border-indigo-500/80 text-indigo-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Todos ({habits.length})
                        </button>
                        <button
                          onClick={() => setTodayFilter('completed')}
                          className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition ${
                            todayFilter === 'completed'
                              ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Listos ({habits.filter(h => h.today_log?.completed).length})
                        </button>
                      </div>

                      {/* === MEJORA: Barra de Búsqueda Rápida === */}
                      <div className="w-full">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar tarea..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-8 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/60 placeholder:text-slate-600 transition"
                          />
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                            >✕</button>
                          )}
                        </div>
                      </div>

                      {/* === MEJORA: Resumen de Tiempo Estimado === */}
                      {habits.length > 0 && (
                        <div className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl p-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between text-[10px] mb-1">
                                <span className="text-slate-400">Tiempo del día</span>
                                <span className="font-mono font-bold text-slate-200">{completedEstimatedMinutes} / {totalEstimatedMinutes} min</span>
                              </div>
                              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${totalEstimatedMinutes > 0 ? Math.round((completedEstimatedMinutes / totalEstimatedMinutes) * 100) : 0}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          {streakData.current > 0 && (
                            <div className="flex items-center gap-1 bg-amber-950/60 border border-amber-800/50 px-2 py-1 rounded-lg shrink-0">
                              <Flame className="w-3 h-3 text-amber-400" />
                              <span className="text-[10px] font-black text-amber-300 font-mono">{streakData.current}d</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        {/* Toggle de Agrupar por Plan */}
                        <button
                          onClick={() => setGroupByPlan(!groupByPlan)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 ${
                            groupByPlan
                              ? 'bg-indigo-950/70 border-indigo-700/80 text-indigo-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                          title="Alternar entre ver agrupado por programas o lista continua"
                        >
                          <Layers className="w-3 h-3" />
                          <span>{groupByPlan ? 'Agrupado por Plan' : 'Lista Plana'}</span>
                        </button>

                        <span className="text-[11px] font-mono text-slate-400">
                          {metrics?.today_compliance_percent || 0}%
                        </span>
                      </div>
                    </div>

                    {/* VISTA 1: AGRUPADA POR PLAN/CATEGORÍA CON ACORDEÓN */}
                    {groupByPlan ? (
                      <div className="space-y-4">
                        {planSummaryList.map(plan => {
                          const planFilteredHabits = plan.habits.filter(h => {
                            if (searchQuery.trim()) {
                              const q = searchQuery.toLowerCase();
                              if (!h.title.toLowerCase().includes(q) && !h.description?.toLowerCase().includes(q)) return false;
                            }
                            if (todayFilter === 'pending') return !h.today_log?.completed;
                            if (todayFilter === 'completed') return !!h.today_log?.completed;
                            return true;
                          });

                          if (planFilteredHabits.length === 0 && todayFilter !== 'all') {
                            return null;
                          }

                          const isGroupCollapsed = collapsedBlocks[`group_${plan.name}`] !== undefined 
                            ? collapsedBlocks[`group_${plan.name}`] 
                            : true;
                          const completedInPlan = plan.habits.filter(h => h.today_log?.completed).length;

                          return (
                            <div key={plan.name} className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                              {/* Cabecera del Grupo (Tocable para colapsar/expandir el plan) */}
                              <div
                                onClick={() => toggleBlockCollapse(`group_${plan.name}`)}
                                className="p-3 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between gap-2 cursor-pointer select-none hover:bg-slate-900 transition"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div className="p-1.5 rounded-lg bg-indigo-950 text-indigo-400">
                                    <Layers className="w-4 h-4" />
                                  </div>
                                  <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                                    {plan.name}
                                  </h3>
                                  <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800 shrink-0">
                                    {completedInPlan}/{plan.totalCount}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs font-mono font-bold text-amber-400">
                                    {plan.progressPercent}%
                                  </span>
                                  {isGroupCollapsed ? <ChevronRight className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                </div>
                              </div>

                              {/* Tareas del Grupo */}
                              {!isGroupCollapsed && (
                                <div className="p-2.5 space-y-2">
                                  {planFilteredHabits.map((habit) => {
                                    const isCompleted = habit.today_log?.completed ?? false;
                                    const currentVal = habit.today_log?.value ?? 0;
                                    const targetVal = habit.target_value;
                                    const title = cleanTitle(habit.title);

                                    return (
                                      <div
                                        key={habit.id}
                                        className={`p-3 rounded-xl border transition-all duration-200 flex flex-col gap-2 ${
                                          isCompleted
                                            ? 'bg-slate-950/40 border-emerald-900/30 opacity-75'
                                            : 'bg-slate-950/80 border-slate-800/90 hover:border-slate-700'
                                        }`}
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                            <button
                                              onClick={() => toggleHabit(habit)}
                                              className="mt-0.5 shrink-0 text-slate-400 hover:text-emerald-400 transition"
                                            >
                                              {isCompleted ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-950" />
                                              ) : (
                                                <Circle className="w-5 h-5 text-slate-500 hover:text-white" />
                                              )}
                                            </button>

                                            <div 
                                              onClick={() => setSelectedDetailHabit(habit)}
                                              className="flex-1 min-w-0 cursor-pointer group/item select-none"
                                            >
                                              <div className="flex items-center gap-1.5 flex-wrap">
                                                <h4 className={`text-xs sm:text-sm font-semibold leading-snug group-hover/item:text-indigo-300 transition ${isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}>
                                                  {title}
                                                </h4>
                                                {habit.estimated_minutes ? (
                                                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                                    <Clock className="w-2.5 h-2.5 text-indigo-400" />
                                                    <span>~{habit.estimated_minutes}m</span>
                                                  </span>
                                                ) : null}
                                                <Info className="w-3 h-3 text-slate-500 opacity-0 group-hover/item:opacity-100 transition shrink-0" />
                                              </div>
                                              {habit.description && (
                                                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 group-hover/item:text-slate-300">
                                                  💡 {habit.description}
                                                </p>
                                              )}
                                            </div>
                                          </div>

                                          {/* Controles de registro rápido */}
                                          <div className="shrink-0 flex items-center gap-1.5">
                                            {/* Botón directo de 10 Metas para tareas de Brian Tracy */}
                                            {(habit.title.toLowerCase().includes('brian tracy') || habit.title.toLowerCase().includes('10 meta') || habit.title.toLowerCase().includes('fórmula 3p')) && (
                                              <button
                                                onClick={() => setShowGoalsModal(true)}
                                                className="bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 text-amber-300 font-bold text-xs px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm active:scale-95"
                                                title="Consultar las 10 metas oficiales de referencia"
                                              >
                                                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                                                <span>10 Metas</span>
                                              </button>
                                            )}

                                            {/* Botón de Guía Visual Interactiva de Respiración si corresponde */}
                                            {(habit.title.toLowerCase().includes('respir') || habit.title.toLowerCase().includes('suspiro') || habit.title.toLowerCase().includes('coherencia') || habit.title.toLowerCase().includes('4-7-8') || habit.title.toLowerCase().includes('box')) && (
                                              <button
                                                onClick={() => startBreathingSession(habit)}
                                                className="bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 font-bold text-xs px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95"
                                                title="Iniciar Guía Visual Rítmica Interactiva"
                                              >
                                                <Wind className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                                                <span>Guiar</span>
                                              </button>
                                            )}

                                            {habit.unit === 'series' || habit.habit_type === 'numeric' ? (
                                              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                                                <button
                                                  onClick={() => logSeriesStep(habit.id, -1)}
                                                  disabled={currentVal <= 0}
                                                  className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
                                                >
                                                  <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="text-xs font-mono font-bold px-1 text-slate-200">
                                                  {currentVal}/{targetVal}
                                                </span>
                                                <button
                                                  onClick={() => logSeriesStep(habit.id, 1)}
                                                  className={`px-2 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition ${
                                                    isCompleted ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                                  }`}
                                                >
                                                  <Plus className="w-3 h-3" />
                                                </button>
                                              </div>
                                            ) : (
                                              <button
                                                onClick={() => toggleHabit(habit)}
                                                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 ${
                                                  isCompleted
                                                    ? 'bg-slate-800 text-emerald-400 border border-emerald-900/60'
                                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                                                }`}
                                              >
                                                {isCompleted ? <Check className="w-3.5 h-3.5" /> : null}
                                                <span>{isCompleted ? 'Listo' : 'Hacer'}</span>
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* VISTA 2: LISTA PLANA CONTINUA */
                      <div className="space-y-2.5">
                        {habits
                          .filter(h => {
                            if (searchQuery.trim()) {
                              const q = searchQuery.toLowerCase();
                              if (!h.title.toLowerCase().includes(q) && !h.description?.toLowerCase().includes(q)) return false;
                            }
                            if (todayFilter === 'pending') return !h.today_log?.completed;
                            if (todayFilter === 'completed') return !!h.today_log?.completed;
                            return true;
                          })
                          .map((habit) => {
                            const isCompleted = habit.today_log?.completed ?? false;
                            const currentVal = habit.today_log?.value ?? 0;
                            const targetVal = habit.target_value;
                            const title = cleanTitle(habit.title);
                            const planName = getPlanNameFromHabit(habit);

                            return (
                              <div
                                key={habit.id}
                                className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col gap-2.5 ${
                                  isCompleted
                                    ? 'bg-slate-900/40 border-emerald-900/40 opacity-75'
                                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-sm'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                    <button
                                      onClick={() => toggleHabit(habit)}
                                      className="mt-0.5 shrink-0 text-slate-400 hover:text-emerald-400 transition"
                                      title={isCompleted ? 'Marcar incompleto' : 'Completar hábito'}
                                    >
                                      {isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-950" />
                                      ) : (
                                        <Circle className="w-5 h-5 text-slate-500 hover:text-white" />
                                      )}
                                    </button>

                                    <div 
                                      onClick={() => setSelectedDetailHabit(habit)}
                                      className="flex-1 min-w-0 cursor-pointer group/flat select-none"
                                    >
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-indigo-400 truncate max-w-[140px]">
                                          {planName}
                                        </span>
                                        {habit.estimated_minutes ? (
                                          <span className="text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                            <Clock className="w-2.5 h-2.5 text-indigo-400" />
                                            <span>~{habit.estimated_minutes}m</span>
                                          </span>
                                        ) : null}
                                        {habit.unit === 'series' && (
                                          <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-900/50">
                                            {currentVal}/{targetVal} {habit.unit}
                                          </span>
                                        )}
                                        <Info className="w-3 h-3 text-slate-500 opacity-0 group-hover/flat:opacity-100 transition shrink-0 ml-auto" />
                                      </div>
                                      <h3 className={`text-xs sm:text-sm font-bold mt-1 leading-snug group-hover/flat:text-indigo-300 transition ${isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}>
                                        {title}
                                      </h3>
                                      {habit.description && (
                                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 group-hover/flat:text-slate-300">
                                          💡 {habit.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Acciones rápidas según tipo */}
                                  <div className="shrink-0 flex items-center gap-1.5">
                                    {/* Botón directo de 10 Metas para tareas de Brian Tracy */}
                                    {(habit.title.toLowerCase().includes('brian tracy') || habit.title.toLowerCase().includes('10 meta') || habit.title.toLowerCase().includes('fórmula 3p')) && (
                                      <button
                                        onClick={() => setShowGoalsModal(true)}
                                        className="bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 text-amber-300 font-bold text-xs px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm active:scale-95"
                                        title="Consultar las 10 metas oficiales de referencia"
                                      >
                                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                                        <span>10 Metas</span>
                                      </button>
                                    )}

                                    {/* Botón de Guía Visual Interactiva de Respiración si corresponde */}
                                    {(habit.title.toLowerCase().includes('respir') || habit.title.toLowerCase().includes('suspiro') || habit.title.toLowerCase().includes('coherencia') || habit.title.toLowerCase().includes('4-7-8') || habit.title.toLowerCase().includes('box')) && (
                                      <button
                                        onClick={() => startBreathingSession(habit)}
                                        className="bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 font-bold text-xs px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95"
                                        title="Iniciar Guía Visual Rítmica Interactiva"
                                      >
                                        <Wind className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                                        <span>Guiar</span>
                                      </button>
                                    )}

                                    {habit.unit === 'series' || habit.habit_type === 'numeric' ? (
                                      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                                        <button
                                          onClick={() => logSeriesStep(habit.id, -1)}
                                          disabled={currentVal <= 0}
                                          className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
                                        >
                                          <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-xs font-mono font-bold px-1 text-slate-200">
                                          {currentVal}/{targetVal}
                                        </span>
                                        <button
                                          onClick={() => logSeriesStep(habit.id, 1)}
                                          className={`px-2 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition ${
                                            isCompleted ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                          }`}
                                        >
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => toggleHabit(habit)}
                                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 ${
                                          isCompleted
                                            ? 'bg-slate-800 text-emerald-400 border border-emerald-900/60'
                                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                                        }`}
                                      >
                                        {isCompleted ? <Check className="w-3.5 h-3.5" /> : null}
                                        <span>{isCompleted ? 'Listo' : 'Hacer'}</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}

                    {habits.length === 0 && (
                      <div className="text-center py-10 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-4">
                        <p className="text-xs text-slate-400">No tienes hábitos cargados para hoy.</p>
                        <button 
                          onClick={() => setActiveTab('programs')}
                          className="mt-3 text-xs bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl"
                        >
                          Explorar Catálogo de Programas
                        </button>
                      </div>
                    )}

                    {habits.length > 0 && habits.filter(h => !h.today_log?.completed).length === 0 && todayFilter === 'pending' && (
                      <div className="text-center py-8 bg-gradient-to-b from-emerald-950/40 to-slate-900/60 border border-emerald-800/40 rounded-2xl p-5">
                        <span className="text-3xl block mb-2">🎉</span>
                        <h4 className="text-base font-black text-emerald-400">¡Día Perfecto!</h4>
                        <p className="text-xs text-slate-300 mt-1.5">Has cumplido el 100% de tus objetivos. Disciplina pura.</p>
                        <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-emerald-900/40">
                          <div className="text-center">
                            <span className="text-sm font-black text-emerald-300 font-mono block">{habits.length}</span>
                            <span className="text-[9px] text-slate-400 uppercase font-bold">Tareas</span>
                          </div>
                          <div className="w-px h-6 bg-slate-800" />
                          <div className="text-center">
                            <span className="text-sm font-black text-amber-300 font-mono block">~{totalEstimatedMinutes}m</span>
                            <span className="text-[9px] text-slate-400 uppercase font-bold">Invertidos</span>
                          </div>
                          <div className="w-px h-6 bg-slate-800" />
                          <div className="text-center">
                            <span className="text-sm font-black text-indigo-300 font-mono flex items-center gap-0.5 justify-center"><Flame className="w-3 h-3 text-amber-400" />{streakData.current}d</span>
                            <span className="text-[9px] text-slate-400 uppercase font-bold">Racha</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setTodayFilter('all')}
                          className="mt-3 text-xs text-slate-300 hover:text-white underline"
                        >
                          Ver todos los hábitos completados
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ======================================================== */}
                {/* MODO 2: POR PLANES (VISTA EN CARPETAS/PROGRAMAS) */}
                {/* ======================================================== */}
                {todayViewMode === 'plans' && (
                  <div className="space-y-3">
                    {planSummaryList.map(plan => {
                      const isAllDone = plan.completedCount === plan.totalCount && plan.totalCount > 0;

                      return (
                        <div 
                          key={plan.name}
                          onClick={() => setSelectedPlanName(plan.name)}
                          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-[0.99] flex flex-col gap-3 ${
                            isAllDone
                              ? 'bg-slate-900/60 border-emerald-900/60 shadow-sm'
                              : 'bg-slate-900/90 border-slate-800 hover:border-indigo-800/80 shadow-md'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2.5 rounded-xl ${
                                isAllDone ? 'bg-emerald-950 text-emerald-400' : 'bg-indigo-950 text-indigo-400'
                              }`}>
                                {isAllDone ? <CheckSquare className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />}
                              </div>
                              <div>
                                <h3 className="font-bold text-sm text-white line-clamp-1">{plan.name}</h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {plan.completedCount} de {plan.totalCount} completadas hoy
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg ${
                                isAllDone ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-950 text-amber-400'
                              }`}>
                                {plan.progressPercent}%
                              </span>
                              <ChevronRight className="w-4 h-4 text-slate-500" />
                            </div>
                          </div>

                          {/* Barra de progreso interactiva */}
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                isAllDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-indigo-500'
                              }`}
                              style={{ width: `${plan.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {planSummaryList.length === 0 && (
                      <div className="text-center py-10 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-4">
                        <p className="text-xs text-slate-400">No tienes planes activos todavía.</p>
                        <button 
                          onClick={() => setActiveTab('programs')}
                          className="mt-3 text-xs bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl"
                        >
                          Explorar Catálogo de Planes
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Si el usuario ENTRÓ dentro de un plan -> VISTA INTERNA DETALLADA CON OPCIÓN DE VOLVER */}
            {selectedPlanName && (
              <div className="space-y-4">
                {/* Botón de Volver / Breadcrumb móvil */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <button 
                    onClick={() => setSelectedPlanName(null)}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 active:scale-95 transition"
                  >
                    <ArrowLeft className="w-4 h-4" /> Volver a Mis Planes
                  </button>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {selectedPlanHabits.filter(h => h.today_log?.completed).length} / {selectedPlanHabits.length} listos
                  </span>
                </div>

                {/* Banner de Cabecera del Plan Activo con Estadísticas de Reto */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 border border-amber-800/50 px-2 py-0.5 rounded-full">
                      Plan Activo
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {selectedPlanHabits.filter(h => h.today_log?.completed).length} / {selectedPlanHabits.length} días
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-white mt-1">{selectedPlanName}</h2>

                  {/* Widgets de Métricas del Desafío (Llevo, Me Faltan, Avance) */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80">
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Días Llevo</span>
                      <span className="text-base font-black text-emerald-400 font-mono">
                        {selectedPlanHabits.filter(h => h.today_log?.completed).length}
                      </span>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Me Faltan</span>
                      <span className="text-base font-black text-amber-400 font-mono">
                        {selectedPlanHabits.length - selectedPlanHabits.filter(h => h.today_log?.completed).length}
                      </span>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Avance</span>
                      <span className="text-base font-black text-indigo-400 font-mono">
                        {selectedPlanHabits.length > 0 ? Math.round((selectedPlanHabits.filter(h => h.today_log?.completed).length / selectedPlanHabits.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>

                  {/* Barra de progreso del plan seleccionado */}
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-3">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: `${selectedPlanHabits.length > 0 ? (selectedPlanHabits.filter(h => h.today_log?.completed).length / selectedPlanHabits.length) * 100 : 0}%` 
                      }}
                    />
                  </div>

                  {/* Regla de reinicio si es el reto Brian Tracy y botón para ver las 10 metas */}
                  {selectedPlanName.toLowerCase().includes('brian tracy') && (
                    <div className="mt-3 space-y-2">
                      <p className="text-[11px] text-amber-300/80 bg-amber-950/40 p-2 rounded-xl border border-amber-900/40 flex items-center gap-1.5">
                        ⚠️ <strong>Regla del Reto:</strong> Se escriben a mano sin mirar el día anterior. Si fallas un día, el ciclo vuelve a 0/21.
                      </p>

                      <button 
                        onClick={() => setShowGoalsModal(true)}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs py-2 px-3 rounded-xl border border-amber-500/30 flex items-center justify-center gap-2 transition shadow-sm"
                      >
                        <BookOpen className="w-4 h-4 text-amber-400" />
                        <span>Ver Mis 10 Metas Oficiales de Referencia (Fórmula 3P)</span>
                      </button>
                    </div>
                  )}
                  {/* Botón para agregar tarea al plan actual */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-400">¿Quieres ajustar las tareas de este plan?</span>
                    <button
                      onClick={() => openCreateHabitModal(selectedPlanName)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Agregar Tarea al Plan</span>
                    </button>
                  </div>
                </div>

                {/* Lista de Tareas / Ejercicios del Plan */}
                <div className="space-y-3">
                  {selectedPlanHabits.map((habit, idx) => {
                    const isCompleted = habit.today_log?.completed ?? false;
                    const currentVal = habit.today_log?.value ?? 0;
                    const targetVal = habit.target_value;
                    const title = cleanTitle(habit.title);
                    const isCollapsed = !!collapsedBlocks[`habit_${habit.id}`];

                    return (
                      <div 
                        key={habit.id}
                        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                          isCompleted 
                            ? 'bg-slate-900/50 border-emerald-900/50' 
                            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-sm'
                        }`}
                      >
                        {/* Cabecera del Ejercicio (Tocable para colapsar/expandir) */}
                        <div 
                          onClick={() => toggleBlockCollapse(`habit_${habit.id}`)}
                          className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0 flex-wrap">
                            <span className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isCompleted ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                            }`}>
                              {idx + 1}
                            </span>
                            <h3 className={`font-bold text-xs sm:text-sm truncate ${isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}>
                              {title}
                            </h3>
                            {habit.estimated_minutes ? (
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5 text-indigo-400" />
                                <span>~{habit.estimated_minutes} min</span>
                              </span>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              habit.compliance_summary.meets_sla 
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' 
                                : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                            }`}>
                              SLA {habit.compliance_summary.rate_percent}%
                            </span>
                            {isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                          </div>
                        </div>

                        {/* Contenido Desplegable (Detalles y Controles) */}
                        {!isCollapsed && (
                          <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-800/60 bg-slate-950/30">
                            {habit.description && (
                              <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 mb-3 flex items-start gap-2">
                                <span>💡</span>
                                <span>{habit.description}</span>
                              </p>
                            )}

                            <div className="flex items-center justify-between mb-3 bg-slate-900/60 p-2 rounded-xl border border-slate-800/60 text-xs">
                              <button
                                onClick={() => setSelectedDetailHabit(habit)}
                                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                              >
                                <Info className="w-3.5 h-3.5" /> Guía de Ejecución
                              </button>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditHabitModal(habit);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-[11px]"
                                  title="Editar meta o detalles de esta tarea"
                                >
                                  <Edit3 className="w-3 h-3 text-indigo-400" />
                                  <span className="hidden sm:inline">Editar</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteHabit(habit.id, habit.title);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition"
                                  title="Eliminar esta tarea del plan"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Controles de Registro */}
                            {habit.unit === 'series' || habit.habit_type === 'numeric' ? (
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-400">Progreso:</span>
                                  <span className="text-xs font-black font-mono px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-lg text-amber-400">
                                    {currentVal} / {targetVal} {habit.unit}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button 
                                    onClick={() => logSeriesStep(habit.id, -1)}
                                    disabled={currentVal <= 0}
                                    className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40"
                                    title="Restar 1"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>

                                  <button 
                                    onClick={() => logSeriesStep(habit.id, 1)}
                                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition ${
                                      isCompleted 
                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                                    }`}
                                  >
                                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                    <span>{isCompleted ? 'Listo' : '+ Serie'}</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                              {(habit.title.toLowerCase().includes('respir') || habit.title.toLowerCase().includes('suspiro') || habit.title.toLowerCase().includes('coherencia') || habit.title.toLowerCase().includes('4-7-8') || habit.title.toLowerCase().includes('box')) && (
                                <button
                                  onClick={() => startBreathingSession(habit)}
                                  className="bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 font-bold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95"
                                  title="Iniciar Guía Visual Rítmica Interactiva"
                                >
                                  <Wind className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                                  <span>Iniciar Guía Rítmica</span>
                                </button>
                              )}

                              <button 
                                onClick={() => toggleHabit(habit)}
                                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition active:scale-95 ${
                                  isCompleted 
                                    ? 'bg-emerald-600 text-white' 
                                    : 'bg-indigo-600 text-white hover:bg-indigo-500'
                                }`}
                              >
                                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                <span>{isCompleted ? 'Completado' : 'Marcar como Hecho'}</span>
                              </button>
                            </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 2: MATRIZ SEMANAL & SLA */}
        {/* ======================================================== */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" /> Matriz Semanal de SLA
                </h2>
                <p className="text-xs text-slate-400">Racha, cumplimiento y acuerdos de servicio personal</p>
              </div>
            </div>

            {/* === MEJORA: Dashboard de Racha y Estadísticas === */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gradient-to-br from-amber-950/60 to-slate-900 border border-amber-800/40 p-3 rounded-2xl text-center">
                <Flame className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <span className="text-xl font-black text-amber-300 font-mono block">{streakData.current}</span>
                <span className="text-[10px] text-amber-400/80 uppercase font-bold">Racha Actual</span>
              </div>
              <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-800/40 p-3 rounded-2xl text-center">
                <Trophy className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
                <span className="text-xl font-black text-indigo-300 font-mono block">{streakData.best}</span>
                <span className="text-[10px] text-indigo-400/80 uppercase font-bold">Mejor Racha</span>
              </div>
              <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-800/40 p-3 rounded-2xl text-center">
                <Award className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <span className="text-xl font-black text-emerald-300 font-mono block">{earnedBadgesCount}/{badges.length}</span>
                <span className="text-[10px] text-emerald-400/80 uppercase font-bold">Logros</span>
              </div>
            </div>

            {/* Explicación Pedagógica del SLA */}
            <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/30 border border-indigo-900/40 p-3.5 rounded-2xl">
              <h3 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 mb-1">
                🛡️ ¿Qué es tu SLA (Service Level Agreement)?
              </h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                El SLA no te pide perfección irreal del 100% todos los días; define un <strong>piso mínimo de cumplimiento (ej. 85%)</strong>. Si mantienes tus hábitos en verde dentro de la semana, tu sistema es sostenible y previene recaídas o abandono.
              </p>
            </div>

            {/* Tarjeta Métricas Resumen */}
            {metrics && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Cumplimiento Hoy</span>
                  <div className="text-lg font-black text-white mt-0.5">
                    {metrics.completed_today} / {metrics.scheduled_today_count ?? habits.length}
                  </div>
                  <span className="text-[11px] text-indigo-400 font-semibold">{metrics.today_compliance_percent}%</span>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Salud Global SLA</span>
                  <div className="text-lg font-black text-emerald-400 mt-0.5">{metrics.habits_meeting_sla_percent}%</div>
                  <span className="text-[11px] text-slate-400">{metrics.healthy_habits} en meta</span>
                </div>
              </div>
            )}

            {/* === MEJORA: Heatmap mini estilo GitHub por hábito === */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Heatmap de Consistencia (últimos 7 días)</span>
              </h4>
              <div className="space-y-1.5">
                {habits.slice(0, 8).map(habit => (
                  <div key={`hm-${habit.id}`} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-medium truncate w-24 sm:w-36 shrink-0">{cleanTitle(habit.title)}</span>
                    <div className="flex items-center gap-0.5 flex-1">
                      {habit.compliance_summary.history?.map((h, i) => (
                        <div
                          key={i}
                          className={`w-4 h-4 sm:w-5 sm:h-5 rounded-sm transition-all ${
                            h.completed 
                              ? 'bg-emerald-500/90 shadow-sm shadow-emerald-500/20' 
                              : 'bg-slate-800/80'
                          }`}
                          title={`${h.date} (${h.day_name}): ${h.completed ? '✓' : '✗'}`}
                        />
                      ))}
                    </div>
                    <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                      habit.compliance_summary.meets_sla ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {habit.compliance_summary.rate_percent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabla Colapsable de Cumplimiento */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 overflow-x-auto shadow-sm">
              <table className="w-full text-left text-xs min-w-[280px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2 font-semibold">Tarea</th>
                    <th className="pb-2 text-center font-semibold">7 Días</th>
                    <th className="pb-2 text-right font-semibold">SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {habits.map((habit) => (
                    <tr key={habit.id} className="hover:bg-slate-800/20">
                      <td className="py-2.5 pr-2">
                        <div className="font-semibold text-white max-w-[130px] sm:max-w-[200px] truncate">
                          {cleanTitle(habit.title)}
                        </div>
                      </td>

                      <td className="py-2.5 px-1 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {habit.compliance_summary.history?.map((h, i) => (
                            <div 
                              key={i} 
                              className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold ${
                                h.completed 
                                  ? 'bg-emerald-500 text-slate-950 font-black' 
                                  : 'bg-slate-800 text-slate-500'
                              }`}
                              title={`${h.date}: ${h.completed ? 'Cumplido' : 'Pendiente'}`}
                            >
                              {h.day_name.slice(0, 1)}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-2.5 pl-2 text-right">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          habit.compliance_summary.meets_sla 
                            ? 'bg-emerald-950 text-emerald-400' 
                            : 'bg-amber-950 text-amber-400'
                        }`}>
                          {habit.compliance_summary.rate_percent}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 3: CATÁLOGO DE PLANES Y PLANTILLAS */}
        {/* ======================================================== */}
        {activeTab === 'programs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> Catálogo de Programas
                </h2>
                <p className="text-xs text-slate-400">Explora o previsualiza plantillas antes de activarlas</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('inject')}
                  className="text-[10px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-2 py-1 rounded-xl flex items-center gap-1 transition"
                  title="Inyector de Programas JSON"
                >
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span>API JSON</span>
                </button>
                <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-2 py-1 rounded-xl">
                  {programs.length}
                </span>
              </div>
            </div>

            {/* === MEJORA: Búsqueda en Catálogo === */}
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
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 4: VISION BOARD Y GRILL-ME INTERACTIVO */}
        {/* ======================================================== */}
        {activeTab === 'vision' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-400" /> Mi Vision Board Personal
                </h2>
                <p className="text-xs text-slate-400">Metas maestras, horizonte temporal y por qué lo haces</p>
              </div>

              <button 
                onClick={() => {
                  setGrillStep(0);
                  setGrillAnswers({ area: 'Cuerpo & Salud', goal: '', why: '', deadline: '', commitment: '90%' });
                  setShowGrillMeModal(true);
                }}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Grill Me
              </button>
            </div>

            {/* Banner explicativo del Vision Board */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex items-start gap-2.5">
              <span className="text-base">🎯</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                El Vision Board conecta tus hábitos diarios con tus metas trascendentales de vida. Toca cualquier tarjeta para editarla o usa el botón <strong>"Grill Me"</strong> para que el asistente te entreviste y formule una nueva meta precisa con la fórmula 3P.
              </p>
            </div>

            {/* Cuadrícula o lista de Tarjetas del Vision Board */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {visionCards.map((card) => (
                <div 
                  key={card.id} 
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl flex flex-col justify-between shadow-sm relative group transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{card.emoji}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                          📅 {card.deadline}
                        </span>
                        <button 
                          onClick={() => setEditingCard(card)}
                          className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition"
                          title="Editar Meta"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                      {card.category}
                    </span>
                    <h3 className="font-bold text-sm text-slate-100 mt-0.5 leading-snug">
                      {card.title}
                    </h3>

                    <p className="text-[11px] text-slate-400 mt-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed italic">
                      "{card.why}"
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/60">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span>Progreso estimado:</span>
                      <span className="font-mono font-bold text-slate-300">{card.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="bg-slate-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${card.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 5: INYECCIÓN API */}
        {/* ======================================================== */}
        {activeTab === 'inject' && (
          <div className="space-y-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" /> Inyector de Programas (API)
              </h2>
              <p className="text-xs text-slate-400">Inyecta planes estructurados al backend vía JSON</p>
            </div>

            <textarea 
              value={jsonPayload}
              onChange={(e) => setJsonPayload(e.target.value)}
              className="w-full h-44 bg-slate-950 font-mono text-xs text-emerald-400 p-3 rounded-xl border border-slate-800 focus:outline-none"
            />

            <div className="flex items-center justify-between">
              <button 
                onClick={handleInjectProgram}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" /> Inyectar Programa
              </button>
              {injectStatus && <span className="text-xs text-indigo-400">{injectStatus}</span>}
            </div>
          </div>
        )}

      </main>

      {/* Bottom Navigation Bar Limpia y Ordenada (4 Secciones Esenciales) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-3 py-2 safe-bottom shadow-2xl">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
          <button 
            onClick={() => { setActiveTab('today'); setSelectedPlanName(null); }}
            className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition active:scale-95 ${
              activeTab === 'today' ? 'bg-indigo-950/60 text-indigo-400 font-bold border border-indigo-800/50' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">Hoy</span>
          </button>

          <button 
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition active:scale-95 ${
              activeTab === 'calendar' ? 'bg-indigo-950/60 text-indigo-400 font-bold border border-indigo-800/50' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">Racha & SLA</span>
          </button>

          <button 
            onClick={() => setActiveTab('vision')}
            className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition active:scale-95 ${
              activeTab === 'vision' ? 'bg-amber-950/60 text-amber-400 font-bold border border-amber-800/50' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">Vision Board</span>
          </button>

          <button 
            onClick={() => setActiveTab('programs')}
            className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition active:scale-95 ${
              activeTab === 'programs' || activeTab === 'inject' ? 'bg-indigo-950/60 text-indigo-400 font-bold border border-indigo-800/50' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">Catálogo</span>
          </button>
        </div>
      </nav>


      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-xs w-full shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                {isRegister ? <UserPlus className="w-4 h-4 text-indigo-400" /> : <LogIn className="w-4 h-4 text-indigo-400" />}
                {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
              </h3>
              <button onClick={() => setShowAuthModal(false)} className="text-slate-500 hover:text-white text-xs">✕</button>
            </div>

            {authError && (
              <div className="bg-red-950/60 border border-red-800/80 text-red-300 text-xs p-2 rounded-lg mb-3">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-2.5">
              <div>
                <label className="text-[11px] text-slate-400 block mb-0.5">Usuario</label>
                <input 
                  type="text" 
                  required
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  placeholder="ej. joshua" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              {isRegister && (
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Correo</label>
                  <input 
                    type="email" 
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="tu@correo.com" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] text-slate-400 block mb-0.5">Contraseña</label>
                <input 
                  type="password" 
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 rounded-xl transition mt-1"
              >
                {isRegister ? 'Registrarme' : 'Entrar'}
              </button>
            </form>

            <div className="text-center mt-3">
              <button 
                onClick={() => { setIsRegister(!isRegister); setAuthError(''); }}
                className="text-[11px] text-slate-400 hover:text-indigo-400"
              >
                {isRegister ? '¿Ya tienes cuenta? Ingresa' : '¿No tienes cuenta? Regístrate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de 10 Metas Oficiales de Referencia */}
      {showGoalsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">10 Metas Oficiales (Fórmula 3P)</h3>
                  <p className="text-[11px] text-slate-400">Referencia del Cuaderno de Brian Tracy</p>
                </div>
              </div>
              <button onClick={() => setShowGoalsModal(false)} className="text-slate-400 hover:text-white text-sm p-1">✕</button>
            </div>

            <div className="text-[11px] text-amber-300/80 bg-amber-950/30 p-2.5 rounded-xl border border-amber-900/30 my-3">
              💡 <em>Recuerda: Cada mañana debes redactarlas en tu cuaderno físico a mano y de memoria, sin mirar las anotaciones anteriores.</em>
            </div>

            <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
              {brianTracy10Goals.map(goal => (
                <div key={goal.id} className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 flex items-start gap-2.5">
                  <span className="w-5 h-5 shrink-0 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {goal.id}
                  </span>
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
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowGoalsModal(false)}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl transition"
            >
              Cerrar y Volver al Tablero
            </button>
          </div>
        </div>
      )}

      {/* Modal / Pregunta de Control Diaria para Brian Tracy */}
      {confirmingHabit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full shadow-2xl text-center flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/20">
              <HelpCircle className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-800/50">
                Pregunta de Control Diaria • Brian Tracy
              </span>
              <h3 className="text-sm font-bold text-white mt-2">
                {cleanTitle(confirmingHabit.title)}
              </h3>
              <p className="text-xs text-slate-300 mt-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 font-medium leading-relaxed">
                "¿Escribiste hoy tus 10 metas a mano en tu cuaderno, de memoria y en Fórmula 3P?"
              </p>

              {/* Botón para ver las 10 metas directamente en la pregunta */}
              <button
                onClick={() => setShowGoalsModal(true)}
                className="mt-2.5 w-full bg-amber-950/60 hover:bg-amber-950 border border-amber-800/60 text-amber-300 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Ver Mis 10 Metas de Referencia</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button 
                onClick={() => setConfirmingHabit(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
              >
                Aún no
              </button>
              
              <button 
                onClick={confirmBrianTracyCheck}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Sí, cumplido
              </button>
            </div>
          </div>
        </div>
      )}

      


      {/* Modal de Configuración y Perfil de Usuario Organizado en Pestañas */}
      {showCoachModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-md w-full max-h-[88vh] flex flex-col shadow-2xl">
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-base font-bold text-indigo-400">
                  {currentUser?.username ? currentUser.username.slice(0, 1).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{currentUser?.username ? `@${currentUser.username}` : 'Mi Perfil'}</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono font-bold px-1.5 py-0.5 rounded-md">
                      Activo
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                    {currentUser?.email || 'Cuenta personal segura'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowCoachModal(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg text-sm transition"
              >
                ✕
              </button>
            </div>

            {/* Pestañas de Navegación del Perfil */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-2xl border border-slate-800 my-3">
              <button
                type="button"
                onClick={() => setProfileActiveTab('profile')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                  profileActiveTab === 'profile'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span className="truncate">Cuenta</span>
              </button>

              <button
                type="button"
                onClick={() => setProfileActiveTab('theme')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                  profileActiveTab === 'theme'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span className="truncate">Temas</span>
              </button>

              <button
                type="button"
                onClick={() => setProfileActiveTab('coach')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                  profileActiveTab === 'coach'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span className="truncate">Coach</span>
              </button>

              <button
                type="button"
                onClick={() => setProfileActiveTab('badges')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                  profileActiveTab === 'badges'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span className="truncate">Logros</span>
              </button>
            </div>

            {/* Contenido Dinámico de la Pestaña Seleccionada */}
            <div className="overflow-y-auto space-y-3 pr-1 flex-1">
              
              {/* PESTAÑA 1: CUENTA Y RESUMEN DE DISCIPLINA */}
              {profileActiveTab === 'profile' && (
                <div className="space-y-3">
                  {/* Tarjetas de Estadísticas Rápidas */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Hábitos Sanos</span>
                      <span className="text-base font-black text-emerald-400 font-mono flex items-center justify-center gap-1 mt-0.5">
                        <Flame className="w-4 h-4 fill-emerald-400" />
                        <span>{metrics?.healthy_habits || 0}</span>
                      </span>
                    </div>

                    <div className="bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Cumplimiento Hoy</span>
                      <span className="text-base font-black text-indigo-400 font-mono block mt-0.5">
                        {metrics?.today_compliance_percent || 0}%
                      </span>
                    </div>

                    <div className="bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Logros</span>
                      <span className="text-base font-black text-amber-400 font-mono block mt-0.5">
                        {earnedBadgesCount}/{badges.length}
                      </span>
                    </div>
                  </div>

                  {/* Datos de Usuario y Seguridad */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Usuario:</span>
                      <span className="font-bold text-white font-mono">@{currentUser?.username || 'demo'}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Correo:</span>
                      <span className="text-slate-200">{currentUser?.email || 'No registrado'}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Entrenador Actual:</span>
                      <span className="text-indigo-300 font-semibold flex items-center gap-1">
                        <span>{coaches.find(c => c.id === selectedCoachId)?.avatar_emoji || '🔥'}</span>
                        <span>{coaches.find(c => c.id === selectedCoachId)?.name || 'Taskia'}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-400">Notificaciones PWA:</span>
                      <span className={`font-bold ${notificationPermission === 'granted' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {notificationPermission === 'granted' ? 'Habilitadas' : 'Pendientes'}
                      </span>
                    </div>
                  </div>

                  {/* Acciones de Cuenta */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={requestNotificationPermission}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <Bell className="w-3.5 h-3.5 text-amber-400" />
                      <span>{notificationPermission === 'granted' ? 'Notificaciones OK' : 'Activar Notifs'}</span>
                    </button>

                    {authToken && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowCoachModal(false);
                          handleLogout();
                        }}
                        className="flex-1 bg-red-950/60 hover:bg-red-950 border border-red-800/70 text-red-300 font-semibold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5 text-red-400" />
                        <span>Cerrar Sesión</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* PESTAÑA 2: SELECCIÓN DE TEMA VISUAL */}
              {profileActiveTab === 'theme' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-white">Paleta Activa</span>
                    <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-800/50">
                      {themesCatalog.find(t => t.id === currentTheme)?.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {themesCatalog.map((t) => {
                      const isSelected = currentTheme === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setCurrentTheme(t.id)}
                          className={`p-2.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                            isSelected
                              ? 'bg-indigo-950/90 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                              : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="text-xl">{t.icon}</span>
                            {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                          </div>
                          <span className="text-xs font-bold text-white leading-tight block truncate w-full">
                            {t.name}
                          </span>
                          <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                            {t.desc}
                          </span>
                          <div className={`w-full h-1.5 rounded-full mt-2 bg-gradient-to-r ${t.preview}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PESTAÑA 3: SELECCIÓN DE COACH & TONO MOTIVACIONAL */}
              {profileActiveTab === 'coach' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-400 px-1">
                    Elige el estilo de voz para tus alertas matutinas y recordatorios diarios:
                  </p>
                  {coaches.map(coach => {
                    const isSelected = coach.id === selectedCoachId;
                    return (
                      <div 
                        key={coach.id}
                        onClick={() => handleSelectCoach(coach.id)}
                        className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-500/10' 
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{coach.avatar_emoji}</span>
                            <div>
                              <h4 className="text-xs font-bold text-white">{coach.name}</h4>
                              <span className="text-[10px] text-indigo-400 font-medium">{coach.tone_display}</span>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" /> Activo
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{coach.bio}</p>

                        <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-amber-300/90 italic">
                          "{coach.morning_quote}"
                        </div>
                      </div>
                    );
                  })}

                  <button 
                    type="button"
                    onClick={() => {
                      const activeCoach = coaches.find(c => c.id === selectedCoachId) || coaches[0];
                      sendCoachNotification(
                        `⚡ ${activeCoach?.name || 'Coach'}: Alerta de Prueba`,
                        activeCoach?.midday_reminder || '¡Esta es una notificación de disciplina! Tu meta no se negocia.',
                        activeCoach?.avatar_emoji || '🔥'
                      );
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 mt-1"
                  >
                    <Bell className="w-3.5 h-3.5 text-amber-400" /> Probar Voz y Sonido del Coach
                  </button>
                </div>
              )}

              {/* PESTAÑA 4: COLECCIÓN DE LOGROS / BADGES */}
              {profileActiveTab === 'badges' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-white">Insignias Desbloqueadas</span>
                    <span className="text-[11px] font-mono font-bold text-amber-400">
                      {earnedBadgesCount} de {badges.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {badges.map(badge => (
                      <div 
                        key={badge.id}
                        className={`p-2.5 rounded-2xl text-center border transition flex flex-col items-center justify-between ${
                          badge.earned 
                            ? 'bg-amber-950/40 border-amber-800/40 shadow-sm' 
                            : 'bg-slate-950/60 border-slate-800/60 opacity-40 grayscale'
                        }`}
                        title={`${badge.title}: ${badge.description}${badge.earnedDate ? ` (${badge.earnedDate})` : ''}`}
                      >
                        <span className="text-2xl block">{badge.icon}</span>
                        <span className="text-[10px] font-bold text-slate-200 block mt-1 leading-tight line-clamp-1">
                          {badge.title}
                        </span>
                        <span className="text-[9px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                          {badge.description}
                        </span>
                        {badge.earnedDate && (
                          <span className="text-[8px] font-mono text-amber-400/90 mt-1 block">
                            {badge.earnedDate}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Pie del Modal */}
            <div className="pt-3 border-t border-slate-800 mt-2 flex items-center justify-end">
              <button 
                type="button"
                onClick={() => setShowCoachModal(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: PREVISUALIZAR PLANTILLA DEL CATÁLOGO */}
      {/* ======================================================== */}
      {previewProgram && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-800/50">
                    {previewProgram.category}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1">{previewProgram.title}</h3>
                </div>
              </div>
              <button onClick={() => setPreviewProgram(null)} className="text-slate-400 hover:text-white text-sm p-1">✕</button>
            </div>

            <p className="text-xs text-slate-300 my-3 leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
              {previewProgram.description}
            </p>

            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
              <span className="font-semibold text-white">Estructura de la Plantilla ({previewProgram.items?.length || 0} ítems):</span>
              <span className="font-mono text-amber-400 font-bold">{previewProgram.duration_days} días</span>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 flex-1 mb-3">
              {previewProgram.items?.map((it, idx) => (
                <div key={it.id || idx} className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white">{it.title}</p>
                      {it.description && <p className="text-[11px] text-slate-400 mt-0.5">{it.description}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[11px] font-mono text-indigo-300 bg-indigo-950/80 border border-indigo-900 px-2 py-0.5 rounded-lg">
                      {it.target_value} {it.unit}
                    </span>
                    {it.estimated_minutes ? (
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5 text-indigo-400" />
                        <span>~{it.estimated_minutes}m</span>
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button 
                onClick={() => setPreviewProgram(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cerrar Previa
              </button>
              <button 
                onClick={() => {
                  const pId = previewProgram.id;
                  setPreviewProgram(null);
                  handleEnroll(pId);
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Cargar & Usar Esta Plantilla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ASISTENTE "GRILL ME" PARA DESCUBRIR METAS 3P */}
      {/* ======================================================== */}
      {showGrillMeModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-md w-full shadow-2xl flex flex-col gap-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-800/50">
                    Grill Me Wizard • Paso {grillStep + 1} de 4
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1">Descubridor de Metas 3P</h3>
                </div>
              </div>
              <button onClick={() => setShowGrillMeModal(false)} className="text-slate-400 hover:text-white text-sm p-1">✕</button>
            </div>

            {/* Paso 0: Área de Vida */}
            {grillStep === 0 && (
              <div className="space-y-3">
                <p className="text-xs text-slate-300 font-medium">
                  1. ¿En qué dimensión de tu vida sientes que necesitas dar un salto cuántico y no puedes postergar más?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Cuerpo & Salud", icon: "🦵" },
                    { label: "Software & Negocio", icon: "💻" },
                    { label: "Música & Arte", icon: "🎵" },
                    { label: "Hogar & Entorno", icon: "🏡" }
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={() => setGrillAnswers({ ...grillAnswers, area: item.label })}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2 transition ${
                        grillAnswers.area === item.label
                          ? 'bg-amber-950/60 border-amber-500 text-white font-bold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-xs">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Paso 1: Redacción en Fórmula 3P */}
            {grillStep === 1 && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-white font-medium mb-1">
                    2. Define tu meta en Fórmula 3P (Presente, Positivo, Personal):
                  </p>
                  <p className="text-[11px] text-amber-300/80 italic">
                    Ejemplo: "Yo peso 85 kg con tono muscular atlético..." o "Yo consigo mis primeros 10 clientes de pago..."
                  </p>
                </div>
                <textarea
                  value={grillAnswers.goal}
                  onChange={(e) => setGrillAnswers({ ...grillAnswers, goal: e.target.value })}
                  placeholder="Yo ..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-amber-500/80 h-24"
                />
              </div>
            )}

            {/* Paso 2: Por qué es innegociable */}
            {grillStep === 2 && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-white font-medium mb-1">
                    3. ¿Por qué esto es vital para ti? ¿Qué pasa si NO lo cumples?
                  </p>
                  <p className="text-[11px] text-slate-400">
                    La motivación superficial se agota en 3 días. El motivo profundo te hace levantar a las 6 AM sin dudar.
                  </p>
                </div>
                <textarea
                  value={grillAnswers.why}
                  onChange={(e) => setGrillAnswers({ ...grillAnswers, why: e.target.value })}
                  placeholder="Porque quiero libertad total, jugar al fútbol sin dolor y estar orgulloso de mi disciplina..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-amber-500/80 h-24"
                />
              </div>
            )}

            {/* Paso 3: Fecha Límite */}
            {grillStep === 3 && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-white font-medium mb-1">
                    4. ¿Cuál es tu fecha límite de entrega exacta?
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Una meta sin fecha es solo un deseo que el cerebro pospone indefinidamente.
                  </p>
                </div>
                <input
                  type="text"
                  value={grillAnswers.deadline}
                  onChange={(e) => setGrillAnswers({ ...grillAnswers, deadline: e.target.value })}
                  placeholder="ej. 31/05/2027 o 15/12/2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-amber-500/80"
                />
              </div>
            )}

            {/* Botones de navegación del Wizard */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              {grillStep > 0 && (
                <button
                  onClick={() => setGrillStep(prev => prev - 1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Atrás
                </button>
              )}

              {grillStep < 3 ? (
                <button
                  onClick={() => setGrillStep(prev => prev + 1)}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition"
                >
                  Siguiente Pregunta →
                </button>
              ) : (
                <button
                  onClick={() => {
                    const newCard: VisionCard = {
                      id: `v-${Date.now()}`,
                      category: grillAnswers.area,
                      emoji: grillAnswers.area.includes('Salud') ? '🦵' : grillAnswers.area.includes('Software') ? '💻' : grillAnswers.area.includes('Música') ? '🎵' : '🏡',
                      title: grillAnswers.goal.trim() || 'Meta sin título',
                      why: grillAnswers.why.trim() || 'Compromiso de disciplina y excelencia',
                      deadline: grillAnswers.deadline.trim() || 'Pronto',
                      progress: 10,
                      color: grillAnswers.area.includes('Salud') 
                        ? 'from-emerald-950/60 to-emerald-900/20 border-emerald-500/40' 
                        : grillAnswers.area.includes('Software')
                        ? 'from-indigo-950/60 to-indigo-900/20 border-indigo-500/40'
                        : 'from-amber-950/60 to-amber-900/20 border-amber-500/40'
                    };
                    setVisionCards(prev => [newCard, ...prev]);
                    setShowGrillMeModal(false);
                    setActiveTab('vision');
                    triggerCelebration();
                    setIslandMessage(`🎯 Nueva meta 3P añadida a tu Vision Board`);
                    setIslandExpanded(true);
                    setTimeout(() => setIslandExpanded(false), 4000);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black text-xs shadow-lg transition"
                >
                  ✨ Guardar en mi Vision Board
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: EDITAR TARJETA DEL VISION BOARD */}
      {/* ======================================================== */}
      {editingCard && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-md w-full shadow-2xl flex flex-col gap-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" /> Editar Meta del Vision Board
              </h3>
              <button onClick={() => setEditingCard(null)} className="text-slate-400 hover:text-white text-sm p-1">✕</button>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Título de la Meta (Fórmula 3P)</label>
              <textarea
                value={editingCard.title}
                onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none h-16"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">El "Por Qué" (Motivo Profundo)</label>
              <textarea
                value={editingCard.why}
                onChange={(e) => setEditingCard({ ...editingCard, why: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none h-16"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Fecha Límite</label>
                <input
                  type="text"
                  value={editingCard.deadline}
                  onChange={(e) => setEditingCard({ ...editingCard, deadline: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Progreso ({editingCard.progress}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={editingCard.progress}
                  onChange={(e) => setEditingCard({ ...editingCard, progress: Number(e.target.value) })}
                  className="w-full accent-indigo-500 mt-2"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 mt-1">
              <button
                onClick={() => {
                  setVisionCards(prev => prev.filter(c => c.id !== editingCard.id));
                  setEditingCard(null);
                }}
                className="text-red-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1 p-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingCard(null)}
                  className="px-3 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setVisionCards(prev => prev.map(c => c.id === editingCard.id ? editingCard : c));
                    setEditingCard(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
      {/* ======================================================== */}
      {/* MODAL / ENTRENADOR VISUAL INTERACTIVO DE RESPIRACIÓN    */}
      {/* ======================================================== */}
      {activeBreathingHabit && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
            {/* Botones de control superior (Audio y Cerrar) */}
            <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
              <button
                onClick={() => setBreathingSoundEnabled(!breathingSoundEnabled)}
                className={`p-2 rounded-full transition ${
                  breathingSoundEnabled ? 'text-indigo-400 bg-indigo-950/80' : 'text-slate-500 hover:text-slate-300'
                }`}
                title={breathingSoundEnabled ? "Silenciar campana de respiración" : "Activar campana tibetana suave"}
              >
                {breathingSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  setActiveBreathingHabit(null);
                  setBreathingIsRunning(false);
                }}
                className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800/60 transition"
              >
                ✕
              </button>
            </div>

            {/* Cabecera y Técnica */}
            <div className="mb-4">
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded-full border border-indigo-800/50">
                Guía Visual Rítmica
              </span>
              <h3 className="text-base font-bold text-white mt-2">
                {cleanTitle(activeBreathingHabit.title)}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Sigue la expansión de la esfera. Inhala profundamente por la nariz y exhala por la boca.
              </p>
            </div>

            {/* Orbe Visual de Respiración con Animaciones de Escala y Resplandor */}
            <div className="my-6 relative flex items-center justify-center w-56 h-56">
              {/* Círculo de onda expansiva */}
              <div 
                className={`absolute inset-0 rounded-full border-2 border-indigo-500/30 transition-all duration-1000 ${
                  breathingIsRunning && breathingPhase === 'inhale' ? 'animate-breathe-ripple scale-125 opacity-70' : 'scale-90 opacity-20'
                }`} 
              />
              
              {/* Esfera central interactiva */}
              <div 
                className={`w-36 h-36 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-1000 ease-in-out ${
                  breathingPhase === 'inhale'
                    ? 'scale-125 bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-800 shadow-indigo-500/50'
                    : breathingPhase === 'hold'
                    ? 'scale-125 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 shadow-amber-500/50'
                    : breathingPhase === 'exhale'
                    ? 'scale-90 bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 shadow-teal-500/40'
                    : 'scale-85 bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 shadow-slate-700/30 border border-slate-700'
                }`}
              >
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  {breathingPhase === 'inhale' && 'Inhala'}
                  {breathingPhase === 'hold' && 'Retén'}
                  {breathingPhase === 'exhale' && 'Exhala'}
                  {breathingPhase === 'hold_empty' && 'Pausa'}
                </span>
                <span className="text-3xl font-black font-mono text-white mt-0.5">
                  {breathingSecondsLeft}s
                </span>
              </div>
            </div>

            {/* Progreso de la sesión y rondas */}
            <div className="w-full bg-slate-950 p-3 rounded-2xl border border-slate-800/80 mb-5 flex items-center justify-between text-xs">
              <div className="text-left">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Tiempo restante</span>
                <span className="font-mono font-bold text-white">
                  {Math.floor(breathingTotalSeconds / 60)}:{(breathingTotalSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Ciclos completados</span>
                <span className="font-mono font-bold text-indigo-400">
                  {breathingCompletedRounds} rondas
                </span>
              </div>
            </div>

            {/* Controles del Entrenador */}
            <div className="flex items-center gap-2 w-full">
              <button
                onClick={() => setBreathingIsRunning(!breathingIsRunning)}
                className={`flex-1 font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 ${
                  breathingIsRunning
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                }`}
              >
                {breathingIsRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{breathingIsRunning ? 'Pausar Guía' : 'Reanudar Guía'}</span>
              </button>

              <button
                onClick={() => {
                  toggleHabit(activeBreathingHabit);
                  setActiveBreathingHabit(null);
                  setBreathingIsRunning(false);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-3 rounded-xl transition flex items-center gap-1.5 shadow-md active:scale-95 shrink-0"
                title="Marcar como cumplido ahora"
              >
                <Check className="w-4 h-4" />
                <span>Listo</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ======================================================== */}
      {/* MODAL / GUÍA DE EJECUCIÓN DETALLADA DE CUALQUIER TAREA  */}
      {/* ======================================================== */}
      {selectedDetailHabit && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto relative">
            {/* Botón cerrar */}
            <button
              onClick={() => setSelectedDetailHabit(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800/80 transition z-10"
            >
              ✕
            </button>

            {/* Cabecera de la Tarea */}
            <div className="pb-3 border-b border-slate-800/80">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-800/50">
                {getPlanNameFromHabit(selectedDetailHabit)}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white mt-2 leading-snug">
                {cleanTitle(selectedDetailHabit.title)}
              </h3>
              {selectedDetailHabit.description && (
                <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                  💡 {selectedDetailHabit.description}
                </p>
              )}
            </div>

            {/* Panel de Métricas y Meta de la Tarea con Tiempo Estimado */}
            <div className="grid grid-cols-4 gap-2 my-3">
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800 text-center">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Estimado</span>
                <span className="text-xs font-black text-indigo-300 font-mono flex items-center justify-center gap-0.5 mt-0.5">
                  <Clock className="w-3 h-3 text-indigo-400" />
                  <span>{selectedDetailHabit.estimated_minutes ?? 5} min</span>
                </span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Meta diaria</span>
                <span className="text-sm font-black text-amber-400 font-mono">
                  {selectedDetailHabit.target_value} {selectedDetailHabit.unit || 'vez'}
                </span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Progreso Hoy</span>
                <span className="text-sm font-black text-indigo-400 font-mono">
                  {selectedDetailHabit.today_log?.value ?? 0} {selectedDetailHabit.unit || ''}
                </span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">SLA 7 Días</span>
                <span className={`text-sm font-black font-mono ${selectedDetailHabit.compliance_summary.meets_sla ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {selectedDetailHabit.compliance_summary.rate_percent}%
                </span>
              </div>
            </div>

            {/* Guía Técnica Específica de Ejecución según disciplina */}
            <div className="space-y-3 mb-4 flex-1">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                <span>Instrucciones de Ejecución y Técnica</span>
              </h4>

              {/* Si es ejercicio de fuerza / TRX / Calistenia */}
              {(selectedDetailHabit.unit === 'series' || selectedDetailHabit.title.toLowerCase().includes('trx') || selectedDetailHabit.title.toLowerCase().includes('sentadilla') || selectedDetailHabit.title.toLowerCase().includes('talón') || selectedDetailHabit.title.toLowerCase().includes('aquiles')) && (
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                    <p className="font-semibold text-white flex items-center gap-1.5">
                      <span>⏱️</span> <strong>Tempo y Control Muscular:</strong>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Ejecuta la fase excéntrica (bajada) en <strong>3-4 segundos lentos y controlados</strong>. Pausa isométrica de 1 segundo abajo y empuje potente hacia arriba. Esto protege tendones como el Aquiles y maximiza la hipertrofia funcional.
                    </p>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                    <p className="font-semibold text-white flex items-center gap-1.5">
                      <span>🧠</span> <strong>Enfoque de Conexión Mente-Músculo:</strong>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Mantén el core apretado, respiración fluida (exhala al hacer la fuerza) y asegúrate de no compensar con la otra pierna o la espalda baja.
                    </p>
                  </div>
                </div>
              )}

              {/* Si es de Brian Tracy (escritura de 10 metas) */}
              {selectedDetailHabit.title.toLowerCase().includes('brian tracy') && (
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="bg-amber-950/30 p-3 rounded-xl border border-amber-800/50 space-y-1.5">
                    <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                      <span>✍️</span> <strong>Fórmula 3P (Presente, Positiva, Personal):</strong>
                    </p>
                    <p className="text-[11px] text-amber-200/80">
                      Escribe tus 10 metas comenzando con "Yo gano...", "Yo peso...", "Yo conduzco...". Redacta siempre en presente como si ya fuese una realidad consolidada.
                    </p>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                    <p className="font-semibold text-white flex items-center gap-1.5">
                      <span>📖</span> <strong>Regla de Oro del Reto:</strong>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Tapa la hoja del día anterior. Deja que tu mente filtre las metas verdaderamente prioritarias. Si un día se olvida, el ciclo se reinicia a 0.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowGoalsModal(true)}
                    className="w-full bg-amber-950/60 hover:bg-amber-950 border border-amber-700/60 text-amber-300 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span>Ver Mis 10 Metas Oficiales de Referencia</span>
                  </button>
                </div>
              )}

              {/* Si es de Respiración */}
              {(selectedDetailHabit.title.toLowerCase().includes('respir') || selectedDetailHabit.title.toLowerCase().includes('suspiro') || selectedDetailHabit.title.toLowerCase().includes('coherencia') || selectedDetailHabit.title.toLowerCase().includes('4-7-8')) && (
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="bg-indigo-950/30 p-3 rounded-xl border border-indigo-800/50 space-y-1.5">
                    <p className="font-semibold text-indigo-300 flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5" /> <strong>Protocolo de Regulación del Cortisol:</strong>
                    </p>
                    <p className="text-[11px] text-indigo-200/80">
                      Inhala profundamente por la nariz expandiendo el diafragma y la caja torácica. Exhala largo y relajado por la boca. Activa inmediatamente el tono vagal parasimpático.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const h = selectedDetailHabit;
                      setSelectedDetailHabit(null);
                      startBreathingSession(h);
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition active:scale-95"
                  >
                    <Wind className="w-4 h-4 animate-pulse" />
                    <span>Lanzar Entrenador Visual Interactivo</span>
                  </button>
                </div>
              )}

              {/* Si es de Agua / Hidratación */}
              {selectedDetailHabit.title.toLowerCase().includes('agua') && (
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                  <p className="font-semibold text-white">💧 Estrategia de Ingesta:</p>
                  <p className="text-[11px] text-slate-400">
                    Bebe un vaso de 500ml nada más despertar con una pizca de sal marina. El resto distribúyelo cada 2 horas antes de las 19:00 para no interrumpir el descanso nocturno.
                  </p>
                </div>
              )}

              {/* Temporizador de Descanso Rápido entre Series */}
              {selectedDetailHabit.unit === 'series' && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Descanso entre Series</span>
                      <span className="text-[10px] text-slate-400">
                        {restTimer ? `Restante: ${restTimer}s` : 'Listo para la siguiente'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setRestTimer(45)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-slate-200 transition"
                    >
                      45s
                    </button>
                    <button
                      onClick={() => setRestTimer(60)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-slate-200 transition"
                    >
                      60s
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Acciones de Gestión (Editar / Eliminar Hábito) */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800/60 mb-2">
              <span className="text-[11px] text-slate-400">Administración de la tarea:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const habit = selectedDetailHabit;
                    setSelectedDetailHabit(null);
                    openEditHabitModal(habit);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold text-xs flex items-center gap-1.5 transition"
                  title="Editar parámetros, metas o textos de esta tarea"
                >
                  <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Editar Tarea</span>
                </button>
                <button
                  onClick={() => {
                    handleDeleteHabit(selectedDetailHabit.id, selectedDetailHabit.title);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/70 text-red-400 hover:text-red-300 font-semibold text-xs flex items-center gap-1.5 transition"
                  title="Eliminar esta tarea"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>

            {/* Acciones de Ejecución de la Tarea en el Modal */}
            <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
              {selectedDetailHabit.unit === 'series' || selectedDetailHabit.habit_type === 'numeric' ? (
                <div className="flex items-center justify-between w-full gap-2">
                  <button
                    onClick={() => logSeriesStep(selectedDetailHabit.id, -1)}
                    disabled={(selectedDetailHabit.today_log?.value ?? 0) <= 0}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => logSeriesStep(selectedDetailHabit.id, 1)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Registrar +1 Serie (45s descanso)</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    toggleHabit(selectedDetailHabit);
                    setSelectedDetailHabit(null);
                  }}
                  className={`w-full font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md active:scale-95 ${
                    selectedDetailHabit.today_log?.completed
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-900/60'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {selectedDetailHabit.today_log?.completed ? 'Completado (Desmarcar)' : 'Marcar como Completado Hoy'}
                  </span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: CREAR / EDITAR MANUALMENTE HÁBITOS Y PLANES   */}
      {/* ======================================================== */}
      {showHabitModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-md w-full shadow-2xl flex flex-col gap-3.5 max-h-[92vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {editingHabit ? <Edit3 className="w-4 h-4 text-indigo-400" /> : <Plus className="w-4 h-4 text-emerald-400" />}
                {editingHabit ? 'Editar Hábito / Tarea' : 'Crear Nuevo Hábito o Plan'}
              </h3>
              <button 
                onClick={() => {
                  setShowHabitModal(false);
                  setEditingHabit(null);
                }} 
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
                value={habitFormData.planName}
                onChange={(e) => setHabitFormData({ ...habitFormData, planName: e.target.value })}
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
                value={habitFormData.title}
                onChange={(e) => setHabitFormData({ ...habitFormData, title: e.target.value })}
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
                value={habitFormData.description}
                onChange={(e) => setHabitFormData({ ...habitFormData, description: e.target.value })}
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
                  value={habitFormData.estimated_minutes}
                  onChange={(e) => setHabitFormData({ ...habitFormData, estimated_minutes: Number(e.target.value) || 5 })}
                  placeholder="ej. 5, 10, 25..."
                  className="w-28 bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
                <div className="flex items-center gap-1 flex-wrap">
                  {[3, 5, 10, 15, 25, 45].map(min => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => setHabitFormData({ ...habitFormData, estimated_minutes: min })}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                        habitFormData.estimated_minutes === min
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

            {/* Tipo de Registro (Booleano vs Numérico) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Tipo de Registro
                </label>
                <select
                  value={habitFormData.habit_type}
                  onChange={(e) => setHabitFormData({ ...habitFormData, habit_type: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none"
                >
                  <option value="boolean">Check Sí / No</option>
                  <option value="numeric">Numérico / Series / Minutos</option>
                </select>
              </div>

              {habitFormData.habit_type === 'numeric' ? (
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Meta</label>
                    <input
                      type="number"
                      min="1"
                      value={habitFormData.target_value}
                      onChange={(e) => setHabitFormData({ ...habitFormData, target_value: Number(e.target.value) || 1 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Unidad</label>
                    <input
                      type="text"
                      value={habitFormData.unit}
                      onChange={(e) => setHabitFormData({ ...habitFormData, unit: e.target.value })}
                      placeholder="series, min, vasos"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Frecuencia</label>
                  <select
                    value={habitFormData.frequency_type}
                    onChange={(e) => setHabitFormData({ ...habitFormData, frequency_type: e.target.value })}
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
                  const currentDays = habitFormData.days_of_week ? habitFormData.days_of_week.split(',').map(s => s.trim()) : [];
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
                        setHabitFormData({
                          ...habitFormData,
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
                  Exigencia SLA de Cumplimiento ({habitFormData.sla_target_percent}%)
                </label>
                <span className="text-[10px] text-amber-400 font-mono">
                  {habitFormData.sla_target_percent >= 85 ? '⭐ Alta Disciplina' : 'Balanceado'}
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={habitFormData.sla_target_percent}
                onChange={(e) => setHabitFormData({ ...habitFormData, sla_target_percent: Number(e.target.value) })}
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Configuración de Reinicio Estricto (ej. Reto 21 Días) */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={habitFormData.reset_on_miss}
                  onChange={(e) => setHabitFormData({ ...habitFormData, reset_on_miss: e.target.checked })}
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
                  onClick={() => handleDeleteHabit(editingHabit.id, editingHabit.title)}
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
                  onClick={() => {
                    setShowHabitModal(false);
                    setEditingHabit(null);
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveHabit}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingHabit ? 'Guardar Cambios' : 'Crear Tarea'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

