import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CheckCircle2, Circle, Flame, Zap, 
  Layers, Play, RefreshCw,
  User, LogOut, LogIn, UserPlus, Dumbbell, Calendar,
  Timer, Check, Plus, Minus, ChevronDown, ChevronRight,
  ArrowLeft, CheckSquare, Sparkles, BookOpen, HelpCircle
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'today' | 'calendar' | 'programs' | 'inject'>('today');

  // Estado de navegación tipo carpeta: entrar dentro de un plan
  const [selectedPlanName, setSelectedPlanName] = useState<string | null>(null);

  // Estado de colapsar / expandir bloques o categorías
  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<string, boolean>>({});

  // Estado para modal de 10 Metas Oficiales de Referencia y Pregunta de Control
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [confirmingHabit, setConfirmingHabit] = useState<Habit | null>(null);
  const [restTimer, setRestTimer] = useState<number | null>(null);

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
      const [habitsRes, programsRes, metricsRes] = await Promise.all([
        axios.get(`${API_BASE}/habits/today/`, headers),
        axios.get(`${API_BASE}/programs/`, headers),
        axios.get(`${API_BASE}/metrics/summary/`, headers)
      ]);
      setHabits(habitsRes.data);
      setPrograms(programsRes.data);
      setMetrics(metricsRes.data);
      if (metricsRes.data?.current_user) {
        setCurrentUser(metricsRes.data.current_user);
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

  const toggleHabit = async (habit: Habit) => {
    // Si es del reto Brian Tracy y no está completado aún, mostrar la pregunta de control primero
    if (getPlanNameFromHabit(habit).toLowerCase().includes('brian tracy') && !habit.today_log?.completed) {
      setConfirmingHabit(habit);
      return;
    }

    try {
      await axios.post(`${API_BASE}/habits/${habit.id}/toggle_today/`, {}, getHeaders());
      fetchData();
    } catch (err) {
      console.error("Error al marcar hábito:", err);
    }
  };

  const confirmBrianTracyCheck = async () => {
    if (!confirmingHabit) return;
    try {
      await axios.post(`${API_BASE}/habits/${confirmingHabit.id}/toggle_today/`, {}, getHeaders());
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
      {/* Top Header Responsivo */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-4 py-3 w-full">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-amber-500 to-indigo-600 p-2 rounded-xl shadow-md shadow-indigo-500/20">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-amber-400 to-indigo-300 bg-clip-text text-transparent">
                TASKIA
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {restTimer !== null && (
              <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] sm:text-xs px-2 py-0.5 rounded-lg font-mono font-bold animate-pulse">
                <Timer className="w-3 h-3" />
                <span>{restTimer}s</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded-xl text-xs">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-300 font-medium max-w-[80px] sm:max-w-none truncate">
                {currentUser?.username ? `@${currentUser.username}` : 'demo'}
              </span>
              {authToken ? (
                <button onClick={handleLogout} className="ml-1 text-slate-500 hover:text-red-400">
                  <LogOut className="w-3 h-3" />
                </button>
              ) : (
                <button onClick={() => { setShowAuthModal(true); setIsRegister(false); }} className="text-indigo-400 font-semibold text-[11px]">
                  Entrar
                </button>
              )}
            </div>

            <button onClick={fetchData} className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto w-full px-3 sm:px-4 py-4 flex-1 flex flex-col gap-4">
        
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
        {/* PESTAÑA 3: CATÁLOGO DE PLANES */}
        {/* ======================================================== */}
        {activeTab === 'programs' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" /> Catálogo de Programas
              </h2>
              <p className="text-xs text-slate-400">Inscríbete para cargar los ejercicios a tu día a día</p>
            </div>

            <div className="space-y-3">
              {programs.map((program) => (
                <div key={program.id} className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
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
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 mb-2"
                    >
                      {collapsedBlocks[`prog_${program.id}`] ? 'Ocultar ejercicios' : `Ver ${program.items?.length || 0} ejercicios incluidos`}
                      {collapsedBlocks[`prog_${program.id}`] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>

                    {collapsedBlocks[`prog_${program.id}`] && (
                      <div className="space-y-1 mb-3 max-h-48 overflow-y-auto">
                        {program.items?.map(it => (
                          <div key={it.id} className="text-[11px] bg-slate-950/60 p-2 rounded-lg text-slate-300 flex justify-between">
                            <span>{it.title}</span>
                            <span className="text-slate-400 font-mono">{it.target_value} {it.unit}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => handleEnroll(program.id)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" /> Activar este Plan
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 4: INYECCIÓN API */}
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
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
              activeTab === 'today' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dumbbell className="w-5 h-5" />
            <span className="text-[10px]">Mis Planes</span>
          </button>

          <button 
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
              activeTab === 'calendar' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px]">SLA Semanal</span>
          </button>

          <button 
            onClick={() => setActiveTab('programs')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
              activeTab === 'programs' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px]">Catálogo</span>
          </button>

          <button 
            onClick={() => setActiveTab('inject')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
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
    </div>
  );
}
