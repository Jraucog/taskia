import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CheckCircle2, Circle, Flame, Zap, 
  Layers, Play, RefreshCw,
  User, LogOut, LogIn, UserPlus, Dumbbell, Calendar,
  Timer, Check, Plus, Minus, ChevronDown, ChevronRight,
  ArrowLeft, CheckSquare, Sparkles, BookOpen, HelpCircle,
  Bell, BellOff, ShieldAlert, Compass, Edit3, Trash2, Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';

const API_BASE = `http://${window.location.hostname}:8000/api`;

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
  sla_target_percent: number;
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
    typeof Notification !== 'undefined' && Notification.permission !== 'granted'
  );

  // Estado de Dynamic Island
  const [islandExpanded, setIslandExpanded] = useState(false);
  const [islandMessage, setIslandMessage] = useState<string | null>(null);

  // Estado para modal de 10 Metas Oficiales de Referencia y Pregunta de Control
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [confirmingHabit, setConfirmingHabit] = useState<Habit | null>(null);
  const [restTimer, setRestTimer] = useState<number | null>(null);

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
    } catch (err) {
      console.error("Error al cargar datos:", err);
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
      setRestTimer((prev) => (prev && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [restTimer]);

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
            <span className="text-[11px] font-mono text-slate-300 font-bold">
              {habits.filter(h => h.today_log?.completed).length}/{habits.length}
            </span>
            {restTimer !== null && (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 bg-amber-950/50 px-1.5 py-0.5 rounded-full border border-amber-900/60">
                <Timer className="w-2.5 h-2.5" />
                <span>{restTimer}s</span>
              </span>
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

        {/* Frase Motivacional en 1 sola línea sutil y limpia */}
        <div className="max-w-2xl mx-auto mt-2 px-0.5">
          <div 
            onClick={changeQuote}
            className="group bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 cursor-pointer transition"
            title="Toca para rotar la frase"
          >
            <div className="flex items-center gap-2 overflow-hidden flex-1">
              <span className="text-amber-500 text-xs shrink-0">“</span>
              <p className="text-[11px] text-slate-300 italic truncate font-medium flex-1">
                {motivationalQuotes[currentQuoteIndex].quote}
              </p>
              <span className="text-[10px] text-slate-400 shrink-0 font-medium hidden sm:inline">
                — {motivationalQuotes[currentQuoteIndex].author}
              </span>
            </div>
            <RefreshCw className="w-3 h-3 text-slate-400 group-hover:text-slate-200 shrink-0 group-hover:rotate-180 transition-transform duration-500" />
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
        
        {/* Banner de Notificaciones discreto */}
        {showNotificationBanner && (
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Activa notificaciones de disciplina</h4>
                <p className="text-[10px] text-slate-400">Recordatorios para proteger tu racha diaria.</p>
              </div>
            </div>

            <button 
              onClick={requestNotificationPermission}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-semibold py-1.5 px-3 rounded-xl shrink-0 transition"
            >
              Activar
            </button>
          </div>
        )}


        
        {/* ======================================================== */}
        {/* PESTAÑA 1: MIS PLANES Y TAREAS (SISTEMA DE DRILL-DOWN / ENTRAR Y SALIR) */}
        {/* ======================================================== */}
        {activeTab === 'today' && (
          <div className="space-y-4">
            
            {/* Si el usuario NO ha entrado dentro de un plan -> VISTA DE COLECCIÓN DE PLANES COLAPSABLES */}
            {!selectedPlanName && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" /> Mis Planes y Hábitos
                    </h2>
                    <p className="text-xs text-slate-400">Toca un plan para entrar dentro y registrar cada tarea</p>
                  </div>
                  <span className="text-[11px] font-mono bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full border border-slate-800">
                    {habits.length} tareas hoy
                  </span>
                </div>

                {/* Lista de Tarjetas de Planes (Estilo Apps Nativas iOS/Android) */}
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
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <span className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isCompleted ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                            }`}>
                              {idx + 1}
                            </span>
                            <h3 className={`font-bold text-xs sm:text-sm truncate ${isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}>
                              {title}
                            </h3>
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
                              <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/60 p-2 rounded-xl border border-slate-800/60 mb-3">
                                💡 {habit.description}
                              </p>
                            )}

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
                              /* Botón Toggle Booleano */
                              <div className="flex justify-end">
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
                <p className="text-xs text-slate-400">Rendimiento día por día en los últimos 7 días</p>
              </div>
            </div>

            {/* Tarjeta Métricas Resumen */}
            {metrics && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Cumplimiento Hoy</span>
                  <div className="text-lg font-black text-white mt-0.5">{metrics.completed_today} / {metrics.total_active_habits}</div>
                  <span className="text-[11px] text-indigo-400 font-semibold">{metrics.today_compliance_percent}%</span>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Salud Global SLA</span>
                  <div className="text-lg font-black text-emerald-400 mt-0.5">{metrics.habits_meeting_sla_percent}%</div>
                  <span className="text-[11px] text-slate-400">{metrics.healthy_habits} en meta</span>
                </div>
              </div>
            )}

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
              <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-2 py-0.5 rounded-full">
                {programs.length} disponibles
              </span>
            </div>

            <div className="space-y-3">
              {programs.map((program) => (
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
                            <span className="text-[10px] text-amber-400 font-mono font-bold shrink-0 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              {it.target_value} {it.unit}
                            </span>
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

      {/* Bottom Navigation Bar Fija para Móviles (Estilo App Nativa) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-2 safe-bottom">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button 
            onClick={() => { setActiveTab('today'); setSelectedPlanName(null); }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
              activeTab === 'today' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dumbbell className="w-5 h-5" />
            <span className="text-[10px]">Mis Planes</span>
          </button>

          <button 
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
              activeTab === 'calendar' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px]">SLA</span>
          </button>

          <button 
            onClick={() => setActiveTab('vision')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
              activeTab === 'vision' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px]">Vision Board</span>
          </button>

          <button 
            onClick={() => setActiveTab('programs')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
              activeTab === 'programs' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px]">Catálogo</span>
          </button>

          <button 
            onClick={() => setActiveTab('inject')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
              activeTab === 'inject' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-5 h-5" />
            <span className="text-[10px]">API</span>
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
                Pregunta de Control Diaria
              </span>
              <h3 className="text-sm font-bold text-white mt-2">
                {cleanTitle(confirmingHabit.title)}
              </h3>
              <p className="text-xs text-slate-300 mt-3 p-3 bg-slate-950 rounded-2xl border border-slate-800 font-medium leading-relaxed">
                "¿Hiciste hoy la acción prioritaria para mover tu meta más importante?"
              </p>
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

      {/* Modal de Selección y Configuración de Perfil de Entrenador */}
      {showCoachModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Tono del Motivador</h3>
                  <p className="text-[11px] text-slate-400">Elige quién te exigirá cumplir tus hábitos</p>
                </div>
              </div>
              <button onClick={() => setShowCoachModal(false)} className="text-slate-400 hover:text-white text-sm p-1">✕</button>
            </div>

            <div className="overflow-y-auto space-y-3 my-3 pr-1 flex-1">
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

                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] text-amber-300/90 italic">
                      "{coach.morning_quote}"
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button 
                onClick={() => {
                  const activeCoach = coaches.find(c => c.id === selectedCoachId) || coaches[0];
                  sendCoachNotification(
                    `⚡ ${activeCoach?.name || 'Coach'}: Alerta de Prueba`,
                    activeCoach?.midday_reminder || '¡Esta es una notificación de disciplina! Tu meta no se negocia.',
                    activeCoach?.avatar_emoji || '🔥'
                  );
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                title="Probar sonido y notificación ahora"
              >
                <Bell className="w-3.5 h-3.5 text-amber-400" /> Probar Alerta
              </button>

              <button 
                onClick={() => setShowCoachModal(false)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl transition"
              >
                Confirmar Entrenador
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
                  <span className="text-[11px] font-mono text-indigo-300 bg-indigo-950/80 border border-indigo-900 px-2 py-0.5 rounded-lg shrink-0">
                    {it.target_value} {it.unit}
                  </span>
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
    </div>
  );
}

