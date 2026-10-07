import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CheckCircle2, Circle, Flame, Zap, 
  Layers, RefreshCw, Sparkles,
  User, LogOut, LogIn, UserPlus, Dumbbell, Calendar,
  Check, Plus, Minus, ChevronDown, ChevronRight,
  ArrowLeft, CheckSquare, BookOpen,
  Bell, BellOff, ShieldAlert, Compass, Edit3, Trash2, ListChecks,
  Wind, Info, Clock,
  Search, Users,
  Cloud, CloudOff
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getLocalHabits,
  saveLocalHabits,
  getLocalPrograms,
  saveLocalPrograms,
  getLocalMetrics,
  saveLocalMetrics,
  getLocalCoaches,
  saveLocalCoaches,
  getPendingSyncQueue,
  enqueuePendingAction,
  applyLocalToggle,
  applyLocalSeriesStep,
  syncWithBackend
} from './services/storageSync';
import { haptics } from './services/haptics';
import type {
  Habit,
  CoachProfile,
  Program,
  MetricsSummary,
  ProgramGroup,
  AppTheme,
  ThemeOption,
  Badge,
  VisionCard,
  BrianTracyGoal
} from './types';
import { UserProfileModal } from './components/UserProfileModal';
import { ProgramPreviewModal } from './components/ProgramPreviewModal';
import { BreathingModal } from './components/BreathingModal';
import { VisionCardEditModal } from './components/VisionCardEditModal';
import { GrillMeModal } from './components/GrillMeModal';
import { HabitFormModal } from './components/HabitFormModal';
import { HabitDetailModal } from './components/HabitDetailModal';
import { GoalsReferenceModal } from './components/GoalsReferenceModal';
import { BrianTracyConfirmModal } from './components/BrianTracyConfirmModal';
import { AuthModal } from './components/AuthModal';
import { ShareModal } from './components/ShareModal';
import { TacticalFocusSessionModal } from './components/TacticalFocusSessionModal';
import { VisionView } from './views/VisionView';
import { CalendarView } from './views/CalendarView';
import { ProgramsView } from './views/ProgramsView';

const API_BASE = import.meta.env.VITE_API_URL 
  || (window.location.hostname.includes('trycloudflare.com')
    ? 'https://management-hose-patches-duck.trycloudflare.com/api'
    : `http://${window.location.hostname}:8000/api`);

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('taskia_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('taskia_token'));
  
  // Auth Form State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authError, setAuthError] = useState('');

  const [habits, setHabits] = useState<Habit[]>(() => getLocalHabits());
  const [programs, setPrograms] = useState<Program[]>(() => getLocalPrograms());
  const [metrics, setMetrics] = useState<MetricsSummary | null>(() => getLocalMetrics());
  const [loading, setLoading] = useState(false);

  // Estado Local-First y Sincronización Offline
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => getPendingSyncQueue().length);
  
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
  const [coaches, setCoaches] = useState<CoachProfile[]>(() => getLocalCoaches());
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

  // Estado de Dynamic Island Reactiva
  const [islandExpanded, setIslandExpanded] = useState(false);
  const [islandMessage, setIslandMessage] = useState<string | null>(null);
  const [islandBadge, setIslandBadge] = useState<{ text: string; color: string } | null>(null);

  // Modo Estación de Enfoque Táctico
  const [showFocusModal, setShowFocusModal] = useState(false);

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

  const themesCatalog: ThemeOption[] = [
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
  const defaultBadgesList: Badge[] = [
    { id: 'first_check', icon: '✅', title: 'Primer Paso', description: 'Completar tu primer hábito del día', earned: false },
    { id: 'perfect_day', icon: '🌟', title: 'Día Perfecto', description: 'Completar el 100% de los hábitos programados', earned: false },
    { id: 'week_streak', icon: '🔥', title: 'Semana de Fuego', description: 'Alcanzar 7 días consecutivos en SLA', earned: false },
    { id: 'iron_will', icon: '💪', title: 'Voluntad de Hierro', description: 'Alcanzar 14 días consecutivos de racha', earned: false },
    { id: 'unstoppable_30', icon: '⚡', title: 'Imparable (30 Días)', description: 'Mantener la disciplina durante 30 días seguidos', earned: false },
    { id: 'centurion', icon: '🏆', title: 'Centurión (100 Tareas)', description: 'Superar 100 ejecuciones totales registradas', earned: false },
    { id: 'brian_tracy', icon: '✍️', title: 'Reto Brian Tracy (21 Días)', description: 'Escribir tus 10 metas diarias durante 21 días sin fallar', earned: false },
    { id: 'zen_master', icon: '🧘', title: 'Maestro de Respiración', description: 'Completar sesiones tácticas de regulación de estrés', earned: false },
    { id: 'hydration_god', icon: '💧', title: 'Hidratación Óptima', description: 'Cumplir la ingesta diaria de agua (3L)', earned: false },
    { id: 'trx_warrior', icon: '🏋️', title: 'Guerrero TRX & Fuerza', description: 'Ejecutar tus series de calistenia y tren inferior', earned: false },
    { id: 'early_bird', icon: '🌅', title: 'Madrugador de Acero', description: 'Completar tus hábitos prioritarios antes de las 12:00', earned: false },
    { id: 'night_shield', icon: '🛡️', title: 'Higiene del Sueño', description: 'Desconectar pantallas y proteger tu descanso reparador', earned: false },
    { id: 'visionary', icon: '🧭', title: 'Mente Visionaria', description: 'Crear y dar seguimiento a tus metas 3P en el Vision Board', earned: false },
    { id: 'sla_guardian', icon: '🎯', title: 'Guardián del SLA', description: 'Tener más de 5 hábitos activos cumpliendo su SLA', earned: false },
    { id: 'saiyan_instinct', icon: '🌌', title: 'Ultra Instinto', description: 'Activar el tema Saiyan Blue y mantener disciplina divina', earned: false },
    { id: 'spartan_mindset', icon: '⚔️', title: 'Mentalidad Espartana', description: 'Completar tareas aún en los días de mayor exigencia', earned: false },
  ];

  const [badges, setBadges] = useState<Badge[]>(() => {
    const saved = localStorage.getItem('taskia_badges');
    if (!saved) return defaultBadgesList;
    try {
      const parsed: Badge[] = JSON.parse(saved);
      // Merge with new badges so previously saved state doesn't hide newly added badges
      return defaultBadgesList.map(def => {
        const found = parsed.find(p => p.id === def.id);
        return found ? found : def;
      });
    } catch {
      return defaultBadgesList;
    }
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

  // Tarjetas del Vision Board de Joshua (preservadas para su cuenta)
  const joshuaVisionCards: VisionCard[] = [
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

  // Tarjetas de Vision Board universales y aspiracionales para nuevos usuarios
  const universalVisionCards: VisionCard[] = [
    {
      id: "uv-1",
      category: "Salud & Energía",
      emoji: "⚡",
      title: "Condición Física de Alto Rendimiento & Salud Integral",
      why: "Vivir con energía desbordante, claridad mental y longevidad activa.",
      deadline: "31/12/2026",
      progress: 50,
      color: "from-emerald-950/60 to-emerald-900/20 border-emerald-500/40"
    },
    {
      id: "uv-2",
      category: "Finanzas & Libertad",
      emoji: "📈",
      title: "Fondo de Libertad Financiera e Inversiones Estratégicas",
      why: "Tener tranquilidad, autonomía de tiempo y respaldo sólido para mi futuro.",
      deadline: "31/12/2027",
      progress: 35,
      color: "from-indigo-950/60 to-indigo-900/20 border-indigo-500/40"
    },
    {
      id: "uv-3",
      category: "Carrera & Impacto",
      emoji: "🚀",
      title: "Maestría Profesional & Proyectos de Alto Impacto",
      why: "Desarrollar mi máximo potencial, liderar con el ejemplo y aportar valor tangible.",
      deadline: "30/06/2027",
      progress: 45,
      color: "from-amber-950/60 to-amber-900/20 border-amber-500/40"
    },
    {
      id: "uv-4",
      category: "Paz Mental & Relaciones",
      emoji: "🧘",
      title: "Equilibrio Emocional, Presencia Familiar y Sabiduría",
      why: "Cultivar relaciones profundas y vivir con serenidad interior cada día.",
      deadline: "31/12/2026",
      progress: 60,
      color: "from-purple-950/60 to-purple-900/20 border-purple-500/40"
    }
  ];

  const [visionCards, setVisionCards] = useState<VisionCard[]>(() => {
    const userKey = currentUser?.username ? `taskia_vision_cards_${currentUser.username.toLowerCase()}` : 'taskia_vision_cards';
    const saved = localStorage.getItem(userKey);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* fallback */ }
    }
    // Si ya existía un guardado previo en 'taskia_vision_cards', respetarlo para Joshua
    const legacySaved = localStorage.getItem('taskia_vision_cards');
    if (legacySaved) {
      try { return JSON.parse(legacySaved); } catch { /* fallback */ }
    }
    const isJoshuaUser = currentUser?.username?.toLowerCase().includes('joshua') || !currentUser?.username;
    return isJoshuaUser ? joshuaVisionCards : universalVisionCards;
  });

  // Actualizar tarjetas al cambiar de usuario
  useEffect(() => {
    const userKey = currentUser?.username ? `taskia_vision_cards_${currentUser.username.toLowerCase()}` : 'taskia_vision_cards';
    const saved = localStorage.getItem(userKey);
    if (saved) {
      try {
        setVisionCards(JSON.parse(saved));
        return;
      } catch { /* fallback */ }
    }
    const isJoshuaUser = currentUser?.username?.toLowerCase().includes('joshua');
    setVisionCards(isJoshuaUser ? joshuaVisionCards : universalVisionCards);
  }, [currentUser?.username]);

  useEffect(() => {
    const userKey = currentUser?.username ? `taskia_vision_cards_${currentUser.username.toLowerCase()}` : 'taskia_vision_cards';
    localStorage.setItem(userKey, JSON.stringify(visionCards));
    // Mantener sincronizado legacy para compatibilidad
    if (currentUser?.username?.toLowerCase().includes('joshua') || !currentUser?.username) {
      localStorage.setItem('taskia_vision_cards', JSON.stringify(visionCards));
    }
  }, [visionCards, currentUser?.username]);

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

    // Week Streak (7 days)
    if (!newBadges.find(b => b.id === 'week_streak')?.earned && streakData.current >= 7) {
      const b = newBadges.find(b => b.id === 'week_streak');
      if (b) { b.earned = true; b.earnedDate = today; changed = true; }
    }

    // Iron Will (14 days)
    if (!newBadges.find(b => b.id === 'iron_will')?.earned && streakData.current >= 14) {
      const b = newBadges.find(b => b.id === 'iron_will');
      if (b) { b.earned = true; b.earnedDate = today; changed = true; }
    }

    // Unstoppable (30 days)
    if (!newBadges.find(b => b.id === 'unstoppable_30')?.earned && streakData.current >= 30) {
      const b = newBadges.find(b => b.id === 'unstoppable_30');
      if (b) { b.earned = true; b.earnedDate = today; changed = true; }
    }

    // Visionary (Vision Cards active)
    if (!newBadges.find(b => b.id === 'visionary')?.earned && visionCards.length >= 3) {
      const b = newBadges.find(b => b.id === 'visionary');
      if (b) { b.earned = true; b.earnedDate = today; changed = true; }
    }

    // SLA Guardian (at least 5 habits meeting SLA)
    const healthyCount = habits.filter(h => h.compliance_summary?.meets_sla).length;
    if (!newBadges.find(b => b.id === 'sla_guardian')?.earned && healthyCount >= 5) {
      const b = newBadges.find(b => b.id === 'sla_guardian');
      if (b) { b.earned = true; b.earnedDate = today; changed = true; }
    }

    // Hydration God (Completed water habit)
    const waterHabit = habits.find(h => h.title.toLowerCase().includes('agua') || h.title.toLowerCase().includes('hidrat'));
    if (!newBadges.find(b => b.id === 'hydration_god')?.earned && waterHabit?.today_log?.completed) {
      const b = newBadges.find(b => b.id === 'hydration_god');
      if (b) { b.earned = true; b.earnedDate = today; changed = true; }
    }

    // TRX Warrior (Completed TRX or Fuerza habit)
    const trxHabit = habits.find(h => h.title.toLowerCase().includes('trx') || h.title.toLowerCase().includes('calistenia') || h.title.toLowerCase().includes('fuerza'));
    if (!newBadges.find(b => b.id === 'trx_warrior')?.earned && trxHabit?.today_log?.completed) {
      const b = newBadges.find(b => b.id === 'trx_warrior');
      if (b) { b.earned = true; b.earnedDate = today; changed = true; }
    }

    // Ultra Instinct (Theme saiyan or saiyan-light with completed tasks)
    if (!newBadges.find(b => b.id === 'saiyan_instinct')?.earned && (currentTheme === 'saiyan' || currentTheme === 'saiyan-light') && completedToday > 0) {
      const b = newBadges.find(b => b.id === 'saiyan_instinct');
      if (b) { b.earned = true; b.earnedDate = today; changed = true; }
    }

    // Spartan Mindset (Completed 100% on challenging day)
    if (!newBadges.find(b => b.id === 'spartan_mindset')?.earned && pctToday === 100 && totalToday >= 5) {
      const b = newBadges.find(b => b.id === 'spartan_mindset');
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

  // Modal para compartir hábito/tarea o plan completo con otros usuarios
  const [shareModalHabit, setShareModalHabit] = useState<Habit | null>(null);
  const [shareModalPlanName, setShareModalPlanName] = useState<string | null>(null);

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


  // Metas por defecto de Joshua (preservadas intactas para su cuenta)
  const joshua10Goals: BrianTracyGoal[] = [
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

  // Plantilla universal y profesional para nuevos usuarios
  const universal10Goals: BrianTracyGoal[] = [
    { id: 1, text: "Yo mantengo mi peso óptimo con energía, fuerza y vitalidad todos los días.", date: "31/12/2026", cat: "Salud" },
    { id: 2, text: "Yo entreno un mínimo de 4 días a la semana con intensidad y foco absoluto.", date: "Semanal", cat: "Deporte" },
    { id: 3, text: "Yo duermo 7 a 8 horas diarias de sueño reparador y despierto con alta claridad mental.", date: "Diario", cat: "Salud" },
    { id: 4, text: "Yo incremento mis ingresos mensuales ahorrando e invirtiendo el 20% de mis ganancias.", date: "31/12/2026", cat: "Finanzas" },
    { id: 5, text: "Yo cumplo con excelencia mis proyectos estratégicos entregando valor medible cada mes.", date: "Mensual", cat: "Carrera" },
    { id: 6, text: "Yo leo un libro de crecimiento y aplico sus lecciones clave cada mes.", date: "Mensual", cat: "Desarrollo" },
    { id: 7, text: "Yo dedico tiempo de calidad presente y sin distracciones a mi familia y seres queridos.", date: "Semanal", cat: "Familia" },
    { id: 8, text: "Yo mantengo mi hogar y espacio de trabajo ordenados, limpios y armoniosos.", date: "Diario", cat: "Hogar" },
    { id: 9, text: "Yo gestiono mi tiempo con serenidad priorizando siempre lo importante sobre lo urgente.", date: "Diario", cat: "Enfoque" },
    { id: 10, text: "Yo construyo libertad financiera viviendo con propósito, gratitud y disciplina inquebrantable.", date: "31/12/2027", cat: "Visión" },
  ];

  // Metas de Brian Tracy gestionadas dinámicamente por usuario
  const [userGoals, setUserGoals] = useState<BrianTracyGoal[]>(() => {
    const userKey = currentUser?.username ? `taskia_goals_${currentUser.username.toLowerCase()}` : 'taskia_goals_default';
    const saved = localStorage.getItem(userKey);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* fallback */ }
    }
    const isJoshuaUser = currentUser?.username?.toLowerCase().includes('joshua') || !currentUser?.username;
    return isJoshuaUser ? joshua10Goals : universal10Goals;
  });

  // Actualizar metas al cambiar de usuario
  useEffect(() => {
    const userKey = currentUser?.username ? `taskia_goals_${currentUser.username.toLowerCase()}` : 'taskia_goals_default';
    const saved = localStorage.getItem(userKey);
    if (saved) {
      try {
        setUserGoals(JSON.parse(saved));
        return;
      } catch { /* fallback */ }
    }
    const isJoshuaUser = currentUser?.username?.toLowerCase().includes('joshua');
    setUserGoals(isJoshuaUser ? joshua10Goals : universal10Goals);
  }, [currentUser?.username]);

  const handleUpdateGoals = (newGoals: BrianTracyGoal[]) => {
    setUserGoals(newGoals);
    const userKey = currentUser?.username ? `taskia_goals_${currentUser.username.toLowerCase()}` : 'taskia_goals_default';
    localStorage.setItem(userKey, JSON.stringify(newGoals));
    setIslandMessage('🎯 10 Metas actualizadas y guardadas con éxito.');
    setIslandExpanded(true);
    setTimeout(() => setIslandExpanded(false), 3000);
  };

  const handleResetGoalsToDefault = () => {
    const isJoshuaUser = currentUser?.username?.toLowerCase().includes('joshua');
    const defaultTemplate = isJoshuaUser ? joshua10Goals : universal10Goals;
    setUserGoals(defaultTemplate);
    const userKey = currentUser?.username ? `taskia_goals_${currentUser.username.toLowerCase()}` : 'taskia_goals_default';
    localStorage.setItem(userKey, JSON.stringify(defaultTemplate));
  };


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

  // Escuchar cambios de conectividad de red
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sincronizar si volvemos a estar online
      triggerManualSync(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sincronización en segundo plano: al volver a enfocar la pestaña (visibilitychange)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        fetchData(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Polling periódico cada 20s para que listas compartidas (ej. supermercado con la esposa)
    // se actualicen automáticamente sin tener que recargar la página manualmente
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        fetchData(false);
      }
    }, 20000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(pollInterval);
    };
  }, []);

  const triggerManualSync = async (notifyFeedback = true) => {
    setIsSyncing(true);
    try {
      const res = await syncWithBackend(API_BASE, getHeaders);
      setPendingSyncCount(res.remainingCount);
      setIsOnline(res.serverOnline);

      if (res.serverOnline) {
        // Si el servidor está online, refrescar datos del backend
        await fetchData(false);
      }

      if (notifyFeedback) {
        if (res.serverOnline) {
          triggerCelebration();
          setIslandMessage(res.message);
        } else {
          setIslandMessage("Modo Local Activo: El servidor no está respondiendo. Tus cambios se guardan en este dispositivo.");
        }
        setIslandExpanded(true);
        setTimeout(() => setIslandExpanded(false), 4000);
      }
    } catch (e) {
      console.warn("Fallo al intentar sincronizar:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchData = async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner && habits.length === 0) {
        setLoading(true);
      }
      const headers = getHeaders();
      const [habitsRes, programsRes, metricsRes, coachesRes] = await Promise.all([
        axios.get(`${API_BASE}/habits/today/`, { ...headers, timeout: 3500 }),
        axios.get(`${API_BASE}/programs/`, { ...headers, timeout: 3500 }),
        axios.get(`${API_BASE}/metrics/summary/`, { ...headers, timeout: 3500 }),
        axios.get(`${API_BASE}/coaches/`, { ...headers, timeout: 3500 })
      ]);

      // Servidor respondió con éxito: actualizar estado y caché local
      setIsOnline(true);
      setHabits(habitsRes.data);
      saveLocalHabits(habitsRes.data);

      setPrograms(programsRes.data);
      saveLocalPrograms(programsRes.data);

      setMetrics(metricsRes.data);
      saveLocalMetrics(metricsRes.data);

      setCoaches(coachesRes.data);
      saveLocalCoaches(coachesRes.data);

      if (metricsRes.data?.current_user) {
        setCurrentUser(metricsRes.data.current_user);
        try {
          localStorage.setItem('taskia_user', JSON.stringify(metricsRes.data.current_user));
        } catch (e) {
          console.error(e);
        }
        if (metricsRes.data.current_user.coach_preference?.coach) {
          setSelectedCoachId(metricsRes.data.current_user.coach_preference.coach);
        } else if (coachesRes.data.length > 0) {
          setSelectedCoachId(coachesRes.data[0].id);
        }
      } else if (coachesRes.data.length > 0) {
        setSelectedCoachId(coachesRes.data[0].id);
      }
    } catch (err: any) {
      console.warn("No se pudo conectar con el servidor backend (Modo Local/Offline activo):", err.message);
      setIsOnline(false);
      
      // Fallback a almacenamiento local persistente
      const localH = getLocalHabits();
      if (localH.length > 0) setHabits(localH);

      const localP = getLocalPrograms();
      if (localP.length > 0) setPrograms(localP);

      const localM = getLocalMetrics();
      if (localM) setMetrics(localM);

      const localC = getLocalCoaches();
      if (localC.length > 0) setCoaches(localC);

      if (err.response?.status === 401 && authToken) {
        localStorage.removeItem('taskia_token');
        localStorage.removeItem('taskia_user');
        setAuthToken(null);
        setCurrentUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShareHabit = async (habitId: number, targetUsername: string, actionType: 'add' | 'remove') => {
    try {
      const headers = getHeaders();
      const res = await axios.post(`${API_BASE}/habits/${habitId}/share/`, {
        username: targetUsername,
        action: actionType
      }, headers);

      // Actualizar localmente el hábito en el estado
      setHabits(prev => prev.map(h => {
        if (h.id === habitId) {
          return {
            ...h,
            shared_with_usernames: res.data.shared_with,
            is_shared: res.data.shared_with.length > 0
          };
        }
        return h;
      }));

      // Si el modal de detalle o compartir tiene este hábito, actualizarlo
      if (shareModalHabit && shareModalHabit.id === habitId) {
        setShareModalHabit(prev => prev ? {
          ...prev,
          shared_with_usernames: res.data.shared_with,
          is_shared: res.data.shared_with.length > 0
        } : null);
      }
      if (selectedDetailHabit && selectedDetailHabit.id === habitId) {
        setSelectedDetailHabit(prev => prev ? {
          ...prev,
          shared_with_usernames: res.data.shared_with,
          is_shared: res.data.shared_with.length > 0
        } : null);
      }

      return { ok: true, message: res.data.message };
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Error al conectar con el servidor';
      return { ok: false, message: msg };
    }
  };

  const handleSharePlan = async (planName: string, targetUsername: string, actionType: 'add' | 'remove') => {
    try {
      const headers = getHeaders();
      const res = await axios.post(`${API_BASE}/habits/share_plan/`, {
        plan_name: planName,
        username: targetUsername,
        action: actionType
      }, headers);

      // Refrescar los hábitos desde el backend para actualizar estado de compartir en todas las tareas del plan
      await fetchData(false);
      return { ok: true, message: res.data.message };
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Error al conectar con el servidor';
      return { ok: false, message: msg };
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
      if (res.data.user) {
        localStorage.setItem('taskia_user', JSON.stringify(res.data.user));
      }
      setAuthToken(token);
      setCurrentUser(res.data.user);
      setShowAuthModal(false);
    } catch (err: any) {
      setAuthError(err.response?.data?.error || 'Error al autenticar. Revisa tus credenciales.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('taskia_token');
    localStorage.removeItem('taskia_user');
    setAuthToken(null);
    setCurrentUser(null);
    fetchData();
  };

  const sendCoachNotification = (title: string, body: string, emoji = '🔥') => {
    // 1. In-App alert con sonido y vibración
    showInAppNotification(title, body, emoji);

    // 2. Disparar notificación de sistema si los permisos están concedidos
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const notificationOptions: any = {
        body,
        icon: '/taskia/pwa-192x192.png',
        badge: '/taskia/pwa-192x192.png',
        tag: 'taskia-coach-reminder',
        data: { url: '/taskia/' },
        vibrate: [150, 60, 150]
      };

      if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, notificationOptions);
        }).catch(() => {
          try {
            new Notification(title, notificationOptions);
          } catch (e) {
            console.log("Fallback notification", e);
          }
        });
      } else {
        try {
          new Notification(title, notificationOptions);
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
    // Feedback táctil PWA (vibración en móviles compatibles)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate([40, 30, 80]); } catch {}
    }
    // Sonido sutil de recompensa dopamínica (Acorde C Mayor)
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.18); // C6
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {}
  };

  const toggleHabit = async (habit: Habit) => {
    // Si es del reto Brian Tracy y no está completado aún, mostrar la pregunta de control primero
    if (getPlanNameFromHabit(habit).toLowerCase().includes('brian tracy') && !habit.today_log?.completed) {
      setConfirmingHabit(habit);
      return;
    }

    // 1. Mutación optimista local INMEDIATA (cero latencia, funciona 100% offline)
    const updatedHabits = applyLocalToggle(habit.id);
    setHabits(updatedHabits);

    const updatedHabit = updatedHabits.find(h => h.id === habit.id);
    const isNowCompleted = !!updatedHabit?.today_log?.completed;

    if (isNowCompleted) {
      triggerCelebration();
      const remaining = updatedHabits.filter(h => !h.today_log?.completed);
      if (remaining.length === 0) {
        setIslandBadge({ text: '100% VICTORIA', color: 'bg-emerald-500 text-slate-950' });
        setIslandMessage(`🏆 ¡Día perfecto completado! Todos tus hábitos están en verde.`);
      } else {
        const nextTask = remaining[0];
        setIslandBadge({ text: 'RITMO ACTIVO', color: 'bg-indigo-500 text-white' });
        setIslandMessage(`🎉 ¡${cleanTitle(habit.title)} cumplido! Siguiente recomendado: ${cleanTitle(nextTask.title)}.`);
      }
      setIslandExpanded(true);
      setTimeout(() => setIslandExpanded(false), 4500);
    } else {
      haptics.tap();
    }

    // 2. Encolar acción pendiente para sincronizar cuando el servidor esté disponible
    enqueuePendingAction({
      type: 'toggle_today',
      habitId: habit.id,
      habitTitle: habit.title,
      date: new Date().toISOString().split('T')[0],
    });
    setPendingSyncCount(getPendingSyncQueue().length);

    // 3. Si hay conectividad, intentar enviar al servidor en background sin bloquear la UI
    if (isOnline) {
      try {
        await axios.post(`${API_BASE}/habits/${habit.id}/toggle_today/`, {}, getHeaders());
        // Al tener éxito directo, retirar de la cola
        const queue = getPendingSyncQueue();
        const lastAction = queue.filter(a => a.type === 'toggle_today' && a.habitId === habit.id).pop();
        if (lastAction) {
          const filtered = queue.filter(a => a.id !== lastAction.id);
          localStorage.setItem('taskia_pending_sync_queue', JSON.stringify(filtered));
          setPendingSyncCount(filtered.length);
        }
      } catch (err: any) {
        console.warn("Servidor no accesible para toggle_today; guardado localmente en cola:", err.message);
        setIsOnline(false);
      }
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

    // Mutación optimista local
    const updatedHabits = applyLocalToggle(confirmingHabit.id);
    setHabits(updatedHabits);
    triggerCelebration();
    setIslandMessage(`🔥 ¡Día de Brian Tracy desbloqueado! Racha sostenida.`);
    setIslandExpanded(true);
    setTimeout(() => setIslandExpanded(false), 4000);

    const habitId = confirmingHabit.id;
    const habitTitle = confirmingHabit.title;
    setConfirmingHabit(null);

    enqueuePendingAction({
      type: 'toggle_today',
      habitId,
      habitTitle,
      date: new Date().toISOString().split('T')[0],
    });
    setPendingSyncCount(getPendingSyncQueue().length);

    if (isOnline) {
      try {
        await axios.post(`${API_BASE}/habits/${habitId}/toggle_today/`, {}, getHeaders());
        const queue = getPendingSyncQueue();
        const lastAction = queue.filter(a => a.type === 'toggle_today' && a.habitId === habitId).pop();
        if (lastAction) {
          const filtered = queue.filter(a => a.id !== lastAction.id);
          localStorage.setItem('taskia_pending_sync_queue', JSON.stringify(filtered));
          setPendingSyncCount(filtered.length);
        }
      } catch (err: any) {
        console.warn("Servidor no accesible para confirmBrianTracyCheck; guardado local:", err.message);
        setIsOnline(false);
      }
    }
  };

  const logSeriesStep = async (habitId: number, stepDelta: number) => {
    // 1. Mutación optimista local inmediata
    const updatedHabits = applyLocalSeriesStep(habitId, stepDelta);
    setHabits(updatedHabits);
    if (stepDelta > 0) {
      setRestTimer(45);
    }

    const currentHabit = updatedHabits.find(h => h.id === habitId);
    if (currentHabit && currentHabit.today_log?.completed) {
      triggerCelebration();
      setIslandMessage(`🏆 ¡Objetivo de series alcanzado! ${cleanTitle(currentHabit.title)}`);
      setIslandExpanded(true);
      setTimeout(() => setIslandExpanded(false), 3500);
    }

    // 2. Encolar acción pendiente
    enqueuePendingAction({
      type: 'step_series',
      habitId,
      step: stepDelta,
      habitTitle: currentHabit?.title,
      date: new Date().toISOString().split('T')[0],
    });
    setPendingSyncCount(getPendingSyncQueue().length);

    // 3. Intentar sincronización si está online
    if (isOnline) {
      try {
        await axios.post(`${API_BASE}/habits/${habitId}/toggle_today/`, { step: stepDelta }, getHeaders());
        const queue = getPendingSyncQueue();
        const lastAction = queue.filter(a => a.type === 'step_series' && a.habitId === habitId).pop();
        if (lastAction) {
          const filtered = queue.filter(a => a.id !== lastAction.id);
          localStorage.setItem('taskia_pending_sync_queue', JSON.stringify(filtered));
          setPendingSyncCount(filtered.length);
        }
      } catch (err: any) {
        console.warn("Servidor no accesible para logSeriesStep; guardado localmente:", err.message);
        setIsOnline(false);
      }
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

    if (editingHabit) {
      localStorage.setItem(`taskia_reset_on_miss_${editingHabit.id}`, String(habitFormData.reset_on_miss));
    }

    // Actualización local inmediata
    if (editingHabit) {
      const updated = habits.map(h => h.id === editingHabit.id ? { ...h, ...payload } : h);
      setHabits(updated);
      saveLocalHabits(updated);
      setIslandMessage(`✏️ Hábito "${habitFormData.title}" actualizado.`);
    } else {
      const tempId = Date.now();
      // Si el plan ya tiene colaboradores compartidos, heredarlos inmediatamente en el estado local
      const planNameVal = habitFormData.planName.trim();
      let inheritedSharedWith: string[] = [];
      let inheritedOwner = currentUser?.username || 'Usuario';
      if (planNameVal) {
        const sibling = habits.find(h => getPlanNameFromHabit(h).toLowerCase() === planNameVal.toLowerCase());
        if (sibling) {
          inheritedSharedWith = sibling.shared_with_usernames || [];
          if (sibling.owner_username) inheritedOwner = sibling.owner_username;
        }
      }

      const newLocalHabit: Habit = {
        id: tempId,
        title: payload.title,
        description: payload.description,
        habit_type: payload.habit_type,
        target_value: payload.target_value,
        unit: payload.unit,
        estimated_minutes: payload.estimated_minutes,
        frequency_type: payload.frequency_type,
        days_of_week: payload.days_of_week,
        sla_target_percent: payload.sla_target_percent,
        reset_on_miss: habitFormData.reset_on_miss,
        owner_username: inheritedOwner,
        shared_with_usernames: inheritedSharedWith,
        is_shared: inheritedSharedWith.length > 0,
        today_log: { completed: false, value: 0, is_in_sla: false },
        compliance_summary: { rate_percent: 0, meets_sla: false, completed_last_7_days: 0 }
      };
      const updated = [...habits, newLocalHabit];
      setHabits(updated);
      saveLocalHabits(updated);
      setIslandMessage(`✨ Nuevo hábito "${habitFormData.title}" añadido al plan.`);
      triggerCelebration();
    }

    setIslandExpanded(true);
    setTimeout(() => setIslandExpanded(false), 3500);
    setShowHabitModal(false);
    const wasEditing = editingHabit;
    setEditingHabit(null);
    if (selectedDetailHabit && wasEditing && selectedDetailHabit.id === wasEditing.id) {
      setSelectedDetailHabit(null);
    }

    // Encolar y enviar al servidor si está disponible
    enqueuePendingAction({
      type: 'save_habit',
      habitId: wasEditing?.id,
      habitTitle: payload.title,
      payload,
      date: new Date().toISOString().split('T')[0],
    });
    setPendingSyncCount(getPendingSyncQueue().length);

    if (isOnline) {
      try {
        if (wasEditing) {
          await axios.patch(`${API_BASE}/habits/${wasEditing.id}/`, payload, getHeaders());
        } else {
          await axios.post(`${API_BASE}/habits/`, payload, getHeaders());
        }
        // Desencolar acción directa exitosa
        const queue = getPendingSyncQueue();
        const lastAction = queue.filter(a => a.type === 'save_habit').pop();
        if (lastAction) {
          const filtered = queue.filter(a => a.id !== lastAction.id);
          localStorage.setItem('taskia_pending_sync_queue', JSON.stringify(filtered));
          setPendingSyncCount(filtered.length);
        }
      } catch (err: any) {
        console.warn("Servidor offline para saveHabit; guardado en cola local:", err.message);
        setIsOnline(false);
      }
    }
  };

  const handleDeleteHabit = async (habitId: number, habitTitle: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${cleanTitle(habitTitle)}"?\nEsta acción no se puede deshacer.`)) {
      return;
    }

    // Eliminación local inmediata
    const updated = habits.filter(h => h.id !== habitId);
    setHabits(updated);
    saveLocalHabits(updated);

    setIslandMessage(`🗑️ Hábito eliminado.`);
    setIslandExpanded(true);
    setTimeout(() => setIslandExpanded(false), 3000);
    if (selectedDetailHabit && selectedDetailHabit.id === habitId) {
      setSelectedDetailHabit(null);
    }

    // Encolar para backend
    enqueuePendingAction({
      type: 'delete_habit',
      habitId,
      habitTitle,
      date: new Date().toISOString().split('T')[0],
    });
    setPendingSyncCount(getPendingSyncQueue().length);

    if (isOnline) {
      try {
        await axios.delete(`${API_BASE}/habits/${habitId}/`, getHeaders());
        const queue = getPendingSyncQueue();
        const lastAction = queue.filter(a => a.type === 'delete_habit' && a.habitId === habitId).pop();
        if (lastAction) {
          const filtered = queue.filter(a => a.id !== lastAction.id);
          localStorage.setItem('taskia_pending_sync_queue', JSON.stringify(filtered));
          setPendingSyncCount(filtered.length);
        }
      } catch (err: any) {
        console.warn("Servidor offline para deleteHabit; encolado local:", err.message);
        setIsOnline(false);
      }
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
    // Extraer lista única de usuarios con quienes está compartido este plan
    const sharedUsersSet = new Set<string>();
    list.forEach(h => {
      (h.shared_with_usernames || []).forEach(u => sharedUsersSet.add(u));
    });
    const sharedWith = Array.from(sharedUsersSet);
    const isShared = sharedWith.length > 0 || list.some(h => h.is_shared);

    return {
      name,
      habits: list,
      totalCount: list.length,
      completedCount: completed,
      progressPercent: list.length > 0 ? Math.round((completed / list.length) * 100) : 0,
      sharedWith,
      isShared
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
                  placeholder="ej. tu_usuario" 
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

  // === MICRO-COACH REACTIVO EN TIEMPO REAL (DYNAMIC ISLAND INTELIGENTE) ===
  const slaRate = metrics?.habits_meeting_sla_percent ?? 100;
  const pendingCount = habits.filter(h => !h.today_log?.completed).length;
  const completedCount = habits.filter(h => h.today_log?.completed).length;
  const activeCoach = coaches.find(c => c.id === selectedCoachId);

  // Determinar consejo reactivo táctico
  const getReactiveCoachContext = () => {
    if (slaRate < 80) {
      return {
        badge: 'MODO ESCUDO',
        badgeColor: 'bg-amber-500 text-slate-950',
        message: 'Modo Escudo activo: Tu SLA cayó bajo 80%. No hagas todo a la vez, enfócate en solo 1 micro-tarea de 5 min para volver a zona segura.',
        actionText: 'Iniciar Micro-Enfoque'
      };
    }
    if (pendingCount === 0 && habits.length > 0) {
      return {
        badge: 'DÍA ÉLITE',
        badgeColor: 'bg-emerald-500 text-slate-950',
        message: '¡Victoria total hoy! Todos tus hábitos están cumplidos en SLA. Tu disciplina está forjando identidad ganadora.',
        actionText: 'Ver Visión'
      };
    }
    if (completedCount > 0 && pendingCount > 0) {
      const nextPending = habits.find(h => !h.today_log?.completed);
      return {
        badge: 'EN FLUJO',
        badgeColor: 'bg-indigo-500 text-white',
        message: `Excelente impulso (${completedCount}/${habits.length}). Próximo paso de alto impacto: ${cleanTitle(nextPending?.title || 'Siguiente hábito')}.`,
        actionText: 'Continuar Tarea'
      };
    }
    return {
      badge: 'LISTO PARA ACCIÓN',
      badgeColor: 'bg-slate-700 text-slate-200',
      message: activeCoach?.morning_quote || 'El primer paso del día es el que vence la inercia. Abre tu primera micro-sesión.',
      actionText: 'Comenzar Hoy'
    };
  };

  const reactiveCoach = getReactiveCoachContext();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans w-full max-w-full overflow-x-hidden pb-28 md:pb-12">
      {/* Top Header Responsivo - Minimalista y Sofisticado (Ajustado con safe-top en PWA Standalone) */}
      <header className="border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-4 py-2.5 w-full safe-top pwa-standalone-header shadow-sm">
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
            onClick={() => {
              haptics.tap();
              setIslandExpanded(!islandExpanded);
            }}
            className={`flex items-center gap-2 bg-slate-900/95 border px-3 py-1.5 rounded-full cursor-pointer transition-all duration-300 min-h-[44px] shadow-sm select-none active:scale-95 ${
              slaRate < 80 
                ? 'border-amber-600/70 hover:border-amber-500 shadow-amber-950/30' 
                : 'border-slate-800/90 hover:border-slate-700'
            }`}
            title="Toca para ver consejo táctico en tiempo real del Coach"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                slaRate < 80 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                slaRate < 80 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}></span>
            </span>
            {/* Circular progress mini */}
            <div className="relative w-7 h-7">
              <svg className="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
                <circle cx="14" cy="14" r="11" fill="none" stroke="rgb(30,41,59)" strokeWidth="2.5" />
                <circle cx="14" cy="14" r="11" fill="none" stroke={
                  habits.length > 0 && habits.filter(h => h.today_log?.completed).length === habits.length
                    ? 'rgb(52,211,153)' 
                    : slaRate < 80 ? 'rgb(245,158,11)' : 'rgb(99,102,241)'
                } strokeWidth="2.5" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 11}`}
                  strokeDashoffset={`${2 * Math.PI * 11 * (1 - (habits.length > 0 ? habits.filter(h => h.today_log?.completed).length / habits.length : 0))}`}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white font-mono">
                {habits.length > 0 ? Math.round((habits.filter(h => h.today_log?.completed).length / habits.length) * 100) : 0}
              </span>
            </div>

            {/* Micro-Coach Reactive Label / Tag */}
            <div className="flex items-center gap-1.5">
              <span className={`text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-md font-mono hidden xs:inline-block ${
                islandBadge ? islandBadge.color : reactiveCoach.badgeColor
              }`}>
                {islandBadge ? islandBadge.text : reactiveCoach.badge}
              </span>
              <span className="text-xs transition-transform duration-300 hover:scale-110">
                {activeCoach?.avatar_emoji || '🔥'}
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
          </div>

          <div className="flex items-center gap-1.5">
            {/* Botón de Perfil de Usuario y Coach */}
            <button 
              onClick={() => {
                if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
                  requestNotificationPermission();
                }
                setShowCoachModal(true);
              }}
              className="flex items-center gap-1.5 p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition"
              title="Perfil, Entrenador & Notificaciones"
            >
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {notificationPermission !== 'granted' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </div>
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

            {/* Indicador y Botón de Sincronización Local-First */}
            <button
              onClick={() => triggerManualSync(true)}
              disabled={isSyncing}
              className={`flex items-center gap-1 px-2 py-1 rounded-xl border text-[11px] font-semibold transition ${
                !isOnline
                  ? 'bg-amber-950/70 border-amber-800/80 text-amber-300 hover:bg-amber-900/60'
                  : pendingSyncCount > 0
                    ? 'bg-indigo-950/80 border-indigo-700 text-indigo-300 hover:bg-indigo-900/70'
                    : 'bg-slate-900 border-slate-800 text-emerald-400 hover:border-emerald-800/60'
              }`}
              title={
                !isOnline
                  ? `Modo Local Offline (${pendingSyncCount} cambios pendientes). Toca para sincronizar si encendiste el servidor.`
                  : pendingSyncCount > 0
                    ? `${pendingSyncCount} cambios pendientes por sincronizar. Toca para enviar ahora.`
                    : 'Conectado y sincronizado con el servidor.'
              }
            >
              {isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : !isOnline ? (
                <CloudOff className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="hidden sm:inline">
                {isSyncing
                  ? 'Sincronizando...'
                  : !isOnline
                    ? 'Modo Local'
                    : 'En línea'}
              </span>
              {pendingSyncCount > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full ml-0.5">
                  {pendingSyncCount}
                </span>
              )}
            </button>

            <button 
              onClick={() => fetchData(true)} 
              className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
              title="Recargar datos del servidor"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Vista Desplegada de la Dynamic Island (Si el usuario la toca) */}
        {islandExpanded && (
          <div className="max-w-md mx-auto mt-2 bg-slate-900/95 border border-slate-800 p-4 rounded-3xl shadow-2xl backdrop-blur-md transition-all animate-island-enter relative overflow-hidden">
            {/* Ambient accent top bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${
              slaRate < 80 
                ? 'bg-gradient-to-r from-amber-500 to-red-500' 
                : 'bg-gradient-to-r from-indigo-500 via-emerald-400 to-teal-400'
            }`} />

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl p-1 bg-slate-800/80 rounded-xl">{activeCoach?.avatar_emoji || '🔥'}</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white">
                      {activeCoach?.name || 'Entrenador Taskia'}
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                      islandBadge ? islandBadge.color : reactiveCoach.badgeColor
                    }`}>
                      {islandBadge ? islandBadge.text : reactiveCoach.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    SLA Actual: <strong className={slaRate < 80 ? 'text-amber-400' : 'text-emerald-400'}>{slaRate}%</strong>
                  </span>
                </div>
              </div>
              <button 
                onClick={() => {
                  haptics.tap();
                  setIslandExpanded(false);
                }} 
                className="text-slate-400 hover:text-white text-xs p-1.5 rounded-lg hover:bg-slate-800 transition min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-medium bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
              "{islandMessage || reactiveCoach.message}"
            </p>

            <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-800/80 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span>Progreso hoy:</span>
                <span className="font-bold font-mono text-slate-200">
                  {completedCount}/{habits.length} ({metrics?.today_compliance_percent || 0}%)
                </span>
              </div>

              {/* Botón de acción táctica rápida */}
              <button
                type="button"
                onClick={() => {
                  haptics.success();
                  setIslandExpanded(false);
                  setShowFocusModal(true);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 transition active:scale-95 shadow-md min-h-[38px] ${
                  slaRate < 80
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                <Zap className="w-3 h-3 fill-current" />
                <span>{slaRate < 80 ? 'Activar Escudo (5m)' : 'Estación de Enfoque'}</span>
              </button>
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

      {/* Alerta Flotante Estilo Notificación de Sistema (In-App Push Banner con Acción Táctica) */}
      {activeAlert && (
        <div className="fixed top-3 left-3 right-3 z-50 max-w-md mx-auto animate-bounce-short">
          <div 
            onClick={() => {
              haptics.tap();
              setActiveAlert(null);
              setShowFocusModal(true);
            }}
            className="bg-slate-900 border border-slate-700 hover:border-indigo-500 text-white rounded-2xl p-3 shadow-2xl flex items-start gap-2.5 backdrop-blur-md cursor-pointer transition active:scale-98"
          >
            <span className="text-xl shrink-0 mt-0.5">{activeAlert.emoji}</span>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-white">{activeAlert.title}</h4>
                <span className="text-[9px] font-mono bg-indigo-900/80 text-indigo-300 px-1.5 py-0.2 rounded">Toca para actuar</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{activeAlert.body}</p>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveAlert(null);
              }} 
              className="text-slate-500 hover:text-white text-xs p-1 min-h-[32px] min-w-[32px] flex items-center justify-center"
            >
              ✕
            </button>
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

                    {/* Barra de Acciones Clave: Modo Enfoque Táctico y Escudo SLA */}
                    <div className="flex items-center justify-between gap-2 p-2.5 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                          (metrics?.habits_meeting_sla_percent ?? 100) >= 80 
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80' 
                            : 'bg-amber-950 text-amber-300 border border-amber-800/80'
                        }`}>
                          <span>🛡️ Escudo SLA</span>
                          <span>{metrics?.habits_meeting_sla_percent ?? 100}%</span>
                        </span>
                        <span className="text-[11px] text-slate-300 truncate hidden sm:inline">
                          {(metrics?.habits_meeting_sla_percent ?? 100) >= 80 ? 'Sistema saludable' : 'Hábitos en riesgo'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          haptics.tap();
                          setShowFocusModal(true);
                        }}
                        className="bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-black px-4 min-h-[44px] rounded-xl shadow-md shadow-emerald-900/30 transition flex items-center gap-2 active:scale-95 shrink-0"
                        title="Abrir estación guiada de ejecución paso a paso con timer y audio 528Hz"
                      >
                        <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                        <span>Sesión de Enfoque</span>
                      </button>
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
                                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white disabled:opacity-30 active:scale-95 transition"
                                                >
                                                  <Minus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="text-xs font-mono font-bold px-1.5 text-slate-200 tabular-nums">
                                                  {currentVal}/{targetVal}
                                                </span>
                                                <button
                                                  onClick={() => logSeriesStep(habit.id, 1)}
                                                  className={`min-h-[34px] px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition active:scale-95 ${
                                                    isCompleted ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                                  }`}
                                                >
                                                  <Plus className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            ) : (
                                              <button
                                                onClick={() => toggleHabit(habit)}
                                                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 select-none ${
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
                      <div className="text-center py-12 px-6 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl max-w-lg mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-400 mx-auto flex items-center justify-center border border-indigo-500/20 mb-3">
                          <Dumbbell className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold text-white mb-1">¡Bienvenido a tu Espacio de Disciplina!</h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                          Aún no tienes hábitos registrados para hoy. Puedes activar un plan estructurado desde el catálogo o crear tu propio primer hábito.
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                          <button 
                            type="button"
                            onClick={() => setActiveTab('programs')}
                            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Explorar Catálogo de Planes</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => openCreateHabitModal()}
                            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Crear Hábito Propio</span>
                          </button>
                        </div>
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
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-sm text-white line-clamp-1">{plan.name}</h3>
                                  {plan.isShared && (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 font-medium px-2 py-0.5 rounded-full">
                                      <Users className="w-2.5 h-2.5" />
                                      <span>Compartido {plan.sharedWith && plan.sharedWith.length > 0 ? `(${plan.sharedWith.map(u => `@${u}`).join(', ')})` : ''}</span>
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {plan.completedCount} de {plan.totalCount} completadas hoy
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                title="Compartir este plan con otro usuario"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShareModalPlanName(plan.name);
                                }}
                                className={`p-1.5 rounded-lg transition ${
                                  plan.isShared 
                                    ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300 hover:bg-emerald-900' 
                                    : 'bg-slate-800 hover:bg-indigo-600/40 text-slate-400 hover:text-indigo-200'
                                }`}
                              >
                                <Users className="w-3.5 h-3.5" />
                              </button>
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
                    type="button"
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
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 border border-amber-800/50 px-2 py-0.5 rounded-full">
                        Plan Activo
                      </span>
                      <button
                        type="button"
                        onClick={() => setShareModalPlanName(selectedPlanName)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-300 hover:text-white bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/50 px-2.5 py-0.5 rounded-full transition"
                      >
                        <Users className="w-3 h-3 text-indigo-400" />
                        Compartir Plan
                      </button>
                    </div>
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
                        type="button"
                        onClick={() => setShowGoalsModal(true)}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs py-2 px-3 rounded-xl border border-amber-500/30 flex items-center justify-center gap-2 transition shadow-sm"
                      >
                        <BookOpen className="w-4 h-4 text-amber-400" />
                        <span>Ver y Personalizar Mis 10 Metas (Fórmula 3P)</span>
                      </button>
                    </div>
                  )}
                  {/* Botón para agregar tarea al plan actual */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-400">¿Quieres ajustar las tareas de este plan?</span>
                    <button
                      type="button"
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
                              habit.compliance_summary?.meets_sla 
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' 
                                : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                            }`}>
                              SLA {habit.compliance_summary?.rate_percent ?? 0}%
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
                                type="button"
                                onClick={() => setSelectedDetailHabit(habit)}
                                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                              >
                                <Info className="w-3.5 h-3.5" /> Guía de Ejecución
                              </button>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShareModalHabit(habit);
                                  }}
                                  className="p-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 hover:text-white transition flex items-center gap-1 text-[11px]"
                                  title="Compartir con otro usuario (ej. lista de compras con tu esposa)"
                                >
                                  <Users className="w-3 h-3 text-indigo-400" />
                                  <span className="hidden sm:inline">Compartir</span>
                                </button>
                                <button
                                  type="button"
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
                                  type="button"
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
                                    type="button"
                                    onClick={() => logSeriesStep(habit.id, -1)}
                                    disabled={currentVal <= 0}
                                    className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40"
                                    title="Restar 1"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>

                                  <button 
                                    type="button"
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
                                  type="button"
                                  onClick={() => startBreathingSession(habit)}
                                  className="bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 font-bold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95"
                                  title="Iniciar Guía Visual Rítmica Interactiva"
                                >
                                  <Wind className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                                  <span>Iniciar Guía Rítmica</span>
                                </button>
                              )}

                              <button 
                                type="button"
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
          <CalendarView
            habits={habits}
            metrics={metrics}
            streakData={streakData}
            badges={badges}
            earnedBadgesCount={earnedBadgesCount}
            cleanTitle={cleanTitle}
          />
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 3: CATÁLOGO DE PLANES Y PLANTILLAS */}
        {/* ======================================================== */}
        {activeTab === 'programs' && (
          <ProgramsView
            programs={programs}
            catalogSearchQuery={catalogSearchQuery}
            setCatalogSearchQuery={setCatalogSearchQuery}
            selectedCatalogCategory={selectedCatalogCategory}
            setSelectedCatalogCategory={setSelectedCatalogCategory}
            collapsedBlocks={collapsedBlocks}
            toggleBlockCollapse={toggleBlockCollapse}
            setPreviewProgram={setPreviewProgram}
            handleEnroll={handleEnroll}
            onNavigateInject={() => setActiveTab('inject')}
          />
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 4: VISION BOARD Y GRILL-ME INTERACTIVO */}
        {/* ======================================================== */}
        {activeTab === 'vision' && (
          <VisionView
            visionCards={visionCards}
            habits={habits}
            onOpenGrillMe={() => {
              setGrillStep(0);
              setGrillAnswers({ area: 'Cuerpo & Salud', goal: '', why: '', deadline: '', commitment: '90%' });
              setShowGrillMeModal(true);
            }}
            onEditCard={(card) => setEditingCard(card)}
          />
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

      {/* Bottom Navigation Bar Limpia, Táctil y Ergonómica (4 Secciones Esenciales con Hit Area de 48px y Haptics) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/90 px-2 sm:px-3 pt-1.5 pb-2 safe-bottom pwa-standalone-nav shadow-2xl">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
          <button 
            onClick={() => {
              haptics.tap();
              setActiveTab('today');
              setSelectedPlanName(null);
            }}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl transition active:scale-95 select-none ${
              activeTab === 'today' ? 'bg-indigo-950/70 text-indigo-300 font-bold border border-indigo-700/60 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span className="text-[10px] tracking-tight leading-none">Hoy</span>
          </button>

          <button 
            onClick={() => {
              haptics.tap();
              setActiveTab('calendar');
            }}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl transition active:scale-95 select-none ${
              activeTab === 'calendar' ? 'bg-indigo-950/70 text-indigo-300 font-bold border border-indigo-700/60 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-[10px] tracking-tight leading-none">Racha & SLA</span>
          </button>

          <button 
            onClick={() => {
              haptics.tap();
              setActiveTab('vision');
            }}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl transition active:scale-95 select-none ${
              activeTab === 'vision' ? 'bg-amber-950/70 text-amber-300 font-bold border border-amber-700/60 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="text-[10px] tracking-tight leading-none">Vision Board</span>
          </button>

          <button 
            onClick={() => {
              haptics.tap();
              setActiveTab('programs');
            }}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl transition active:scale-95 select-none ${
              activeTab === 'programs' || activeTab === 'inject' ? 'bg-indigo-950/70 text-indigo-300 font-bold border border-indigo-700/60 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="text-[10px] tracking-tight leading-none">Catálogo</span>
          </button>
        </div>
      </nav>


      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        isRegister={isRegister}
        username={authUsername}
        email={authEmail}
        password={authPassword}
        error={authError}
        onClose={() => setShowAuthModal(false)}
        onToggleRegister={() => { setIsRegister(!isRegister); setAuthError(''); }}
        onUsernameChange={setAuthUsername}
        onEmailChange={setAuthEmail}
        onPasswordChange={setAuthPassword}
        onSubmit={handleAuthSubmit}
      />

      {/* Modal de 10 Metas Oficiales de Referencia */}
      <GoalsReferenceModal
        isOpen={showGoalsModal}
        goals={userGoals}
        onClose={() => setShowGoalsModal(false)}
        onUpdateGoals={handleUpdateGoals}
        onResetToDefault={handleResetGoalsToDefault}
      />

      {/* Modal / Pregunta de Control Diaria para Brian Tracy */}
      <BrianTracyConfirmModal
        habit={confirmingHabit}
        onClose={() => setConfirmingHabit(null)}
        onConfirm={confirmBrianTracyCheck}
        onShowGoalsModal={() => setShowGoalsModal(true)}
        cleanTitle={cleanTitle}
      />

      


      {/* Modal de Configuración y Perfil de Usuario Organizado en Pestañas */}
      <UserProfileModal
        isOpen={showCoachModal}
        onClose={() => setShowCoachModal(false)}
        currentUser={currentUser}
        authToken={authToken}
        metrics={metrics}
        badges={badges}
        coaches={coaches}
        selectedCoachId={selectedCoachId}
        currentTheme={currentTheme}
        themesCatalog={themesCatalog}
        profileActiveTab={profileActiveTab}
        setProfileActiveTab={setProfileActiveTab}
        setCurrentTheme={setCurrentTheme}
        handleSelectCoach={handleSelectCoach}
        sendCoachNotification={sendCoachNotification}
        requestNotificationPermission={requestNotificationPermission}
        notificationPermission={notificationPermission}
        handleLogout={handleLogout}
      />

      {/* Modal: Previsualizar Plantilla del Catálogo */}
      <ProgramPreviewModal
        program={previewProgram}
        onClose={() => setPreviewProgram(null)}
        onEnroll={handleEnroll}
      />

      {/* Modal: Asistente Grill Me Wizard */}
      <GrillMeModal
        isOpen={showGrillMeModal}
        step={grillStep}
        answers={grillAnswers}
        onStepChange={setGrillStep}
        onAnswersChange={(ans) => setGrillAnswers({ commitment: grillAnswers.commitment, ...ans })}
        onClose={() => setShowGrillMeModal(false)}
        onSave={(newCard) => {
          setVisionCards(prev => [newCard, ...prev]);
          setShowGrillMeModal(false);
          setActiveTab('vision');
          triggerCelebration();
          setIslandMessage('🎯 Nueva meta 3P añadida a tu Vision Board');
          setIslandExpanded(true);
          setTimeout(() => setIslandExpanded(false), 4000);
        }}
      />

      {/* Modal: Editar Tarjeta del Vision Board */}
      <VisionCardEditModal
        card={editingCard}
        onClose={() => setEditingCard(null)}
        onUpdate={(updated) => setEditingCard(updated)}
        onDelete={(cardId) => {
          setVisionCards(prev => prev.filter(c => c.id !== cardId));
          setEditingCard(null);
        }}
      />
      {/* Modal: Entrenador Visual Interactivo de Respiración */}
      <BreathingModal
        habit={activeBreathingHabit}
        isRunning={breathingIsRunning}
        phase={breathingPhase}
        secondsLeft={breathingSecondsLeft}
        totalSeconds={breathingTotalSeconds}
        completedRounds={breathingCompletedRounds}
        soundEnabled={breathingSoundEnabled}
        onToggleSound={() => setBreathingSoundEnabled(!breathingSoundEnabled)}
        onToggleRunning={() => setBreathingIsRunning(!breathingIsRunning)}
        onComplete={() => {
          if (activeBreathingHabit) toggleHabit(activeBreathingHabit);
          setActiveBreathingHabit(null);
          setBreathingIsRunning(false);
        }}
        onClose={() => {
          setActiveBreathingHabit(null);
          setBreathingIsRunning(false);
        }}
        cleanTitle={cleanTitle}
      />
      {/* Modal / Guía de Ejecución Detallada de Tarea */}
      <HabitDetailModal
        habit={selectedDetailHabit}
        restTimer={restTimer}
        onClose={() => setSelectedDetailHabit(null)}
        onShowGoalsModal={() => setShowGoalsModal(true)}
        onStartBreathingSession={startBreathingSession}
        onSetRestTimer={setRestTimer}
        onOpenEditHabitModal={openEditHabitModal}
        onOpenShareModal={(h) => setShareModalHabit(h)}
        onDeleteHabit={handleDeleteHabit}
        onLogSeriesStep={logSeriesStep}
        onToggleHabit={toggleHabit}
        getPlanNameFromHabit={getPlanNameFromHabit}
        cleanTitle={cleanTitle}
      />

      {/* Modal: Compartir Tarea / Lista con otros usuarios */}
      <ShareModal
        isOpen={!!shareModalHabit || !!shareModalPlanName}
        habit={shareModalHabit}
        planName={shareModalPlanName}
        planSharedWith={shareModalPlanName ? planSummaryList.find(p => p.name === shareModalPlanName)?.sharedWith : undefined}
        planOwner={shareModalPlanName ? planSummaryList.find(p => p.name === shareModalPlanName)?.habits[0]?.owner_username : undefined}
        currentUsername={currentUser?.username || 'Usuario'}
        onClose={() => {
          setShareModalHabit(null);
          setShareModalPlanName(null);
        }}
        onShare={handleShareHabit}
        onSharePlan={handleSharePlan}
      />

      {/* Modal: Crear / Editar Manualmente Hábitos y Planes */}
      <HabitFormModal
        isOpen={showHabitModal}
        editingHabit={editingHabit}
        formData={habitFormData}
        planSummaryList={planSummaryList}
        onFormDataChange={setHabitFormData}
        onClose={() => {
          setShowHabitModal(false);
          setEditingHabit(null);
        }}
        onSave={handleSaveHabit}
        onDelete={handleDeleteHabit}
      />

      {/* Modal: Estación Táctica de Enfoque con Cronómetro Solfeggio */}
      <TacticalFocusSessionModal
        isOpen={showFocusModal}
        habits={habits}
        onClose={() => setShowFocusModal(false)}
        onToggleHabit={toggleHabit}
        onLogSeriesStep={logSeriesStep}
        onStartBreathing={startBreathingSession}
        cleanTitle={cleanTitle}
      />
    </div>
  );
}

