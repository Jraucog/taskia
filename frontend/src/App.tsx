import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CheckCircle2, Circle, Flame, Zap, 
  Layers, Play, RefreshCw,
  User, LogOut, LogIn, UserPlus, Dumbbell, Calendar,
  Timer, Check, Plus, Minus
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
  
  // Navegación principal intuitiva
  const [viewMode, setViewMode] = useState<'workout' | 'habits' | 'calendar' | 'programs' | 'inject'>('workout');

  // Temporizador de descanso para entrenar
  const [restTimer, setRestTimer] = useState<number | null>(null);

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

  // Countdown para el temporizador de descanso
  useEffect(() => {
    if (restTimer === null || restTimer <= 0) return;
    const interval = setInterval(() => {
      setRestTimer((prev) => (prev && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [restTimer]);

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

  // Toggle rápido o incremento de series
  const toggleHabit = async (habitId: number) => {
    try {
      await axios.post(`${API_BASE}/habits/${habitId}/toggle_today/`, {}, getHeaders());
      fetchData();
    } catch (err) {
      console.error("Error al marcar hábito:", err);
    }
  };

  const logSeriesStep = async (habitId: number, stepDelta: number) => {
    try {
      await axios.post(`${API_BASE}/habits/${habitId}/toggle_today/`, { step: stepDelta }, getHeaders());
      if (stepDelta > 0) {
        // Lanzar temporizador de descanso de 45 segundos
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
      setViewMode('workout');
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

  // Separar y limpiar tareas:
  // 1. Tareas de Entrenamiento (TRX, series, ejercicios)
  // 2. Hábitos Diarios Personales (agua, lectura, etc.)
  const cleanTitle = (rawTitle: string) => {
    return rawTitle.replace(/^\[.*?\]\s*/, '');
  };

  const workoutHabits = habits.filter(h => 
    h.unit === 'series' || 
    h.title.toLowerCase().includes('trx') || 
    h.title.toLowerCase().includes('squat') ||
    h.title.toLowerCase().includes('talón') ||
    h.title.toLowerCase().includes('dorsiflexión') ||
    h.title.toLowerCase().includes('cardio') ||
    h.title.toLowerCase().includes('fuerza')
  );

  const dailyHabits = habits.filter(h => !workoutHabits.includes(h));

  const workoutCompletedCount = workoutHabits.filter(h => h.today_log?.completed).length;
  const workoutProgressPercent = workoutHabits.length > 0 
    ? Math.round((workoutCompletedCount / workoutHabits.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-24 md:pb-10">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-tr from-amber-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight bg-gradient-to-r from-amber-400 via-indigo-300 to-white bg-clip-text text-transparent">
                  TASKIA
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-indigo-950 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-800/80">
                  TRAIN & SLA
                </span>
              </div>
            </div>
          </div>

          {/* User profile & actions */}
          <div className="flex items-center gap-2">
            {restTimer !== null && (
              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs px-2.5 py-1 rounded-xl animate-pulse font-mono font-bold">
                <Timer className="w-3.5 h-3.5" />
                <span>Descanso: {restTimer}s</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl text-xs">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-300 font-medium">
                {currentUser?.username ? `@${currentUser.username}` : 'demo_user'}
              </span>
              {authToken ? (
                <button 
                  onClick={handleLogout}
                  title="Cerrar Sesión" 
                  className="ml-1 text-slate-500 hover:text-red-400 transition"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              ) : (
                <button 
                  onClick={() => { setShowAuthModal(true); setIsRegister(false); }}
                  className="ml-1 text-indigo-400 hover:text-indigo-300 font-semibold text-xs"
                >
                  Entrar
                </button>
              )}
            </div>

            <button 
              onClick={fetchData} 
              className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
              title="Recargar datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full p-4 flex-1 flex flex-col gap-5">
        
        {/* Intuitiva Barra de Navegación por Pestañas */}
        <div className="bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl flex items-center justify-between gap-1 shadow-md">
          <button 
            onClick={() => setViewMode('workout')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              viewMode === 'workout' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Dumbbell className="w-4 h-4" /> 
            <span>Entrenamiento</span>
            {workoutHabits.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${viewMode === 'workout' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-300'}`}>
                {workoutCompletedCount}/{workoutHabits.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setViewMode('habits')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              viewMode === 'habits' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" /> 
            <span>Mis Hábitos</span>
            {dailyHabits.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${viewMode === 'habits' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-300'}`}>
                {dailyHabits.filter(h => h.today_log?.completed).length}/{dailyHabits.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setViewMode('calendar')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              viewMode === 'calendar' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Calendar className="w-4 h-4" /> 
            <span>Semana & SLA</span>
          </button>

          <button 
            onClick={() => setViewMode('programs')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              viewMode === 'programs' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
            title="Catálogo de Programas e Inyección"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Planes</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* VISTA 1: MODO ENTRENAMIENTO GUIADO (SUPER INTUITIVO) */}
        {/* ======================================================== */}
        {viewMode === 'workout' && (
          <div className="space-y-4">
            {/* Header del Workout con Progreso */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 border border-amber-800/50 px-2 py-0.5 rounded-full">
                    Sesión del Día
                  </span>
                  <h2 className="text-base font-bold text-white mt-1">Fuerza Tren Inferior y Prevención Aquiles (TRX)</h2>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-amber-400">{workoutProgressPercent}%</div>
                  <div className="text-[11px] text-slate-400">completado</div>
                </div>
              </div>

              {/* Barra de progreso visual */}
              <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${workoutProgressPercent}%` }}
                />
              </div>

              {workoutProgressPercent === 100 && (
                <div className="mt-3 p-2 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> ¡Excelente! Has completado todos los ejercicios de la sesión de hoy.
                </div>
              )}
            </div>

            {/* Lista de Ejercicios como Tareas Claras e Interactivas */}
            <div className="space-y-3">
              {workoutHabits.map((habit, idx) => {
                const currentSeries = habit.today_log?.value ?? 0;
                const targetSeries = habit.target_value;
                const isCompleted = habit.today_log?.completed ?? false;
                const title = cleanTitle(habit.title);

                return (
                  <div 
                    key={habit.id}
                    className={`border rounded-2xl p-4 transition-all duration-200 ${
                      isCompleted 
                        ? 'bg-slate-900/50 border-emerald-900/50' 
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isCompleted ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {idx + 1}
                          </span>
                          <h3 className={`font-bold text-sm ${isCompleted ? 'text-slate-300 line-through' : 'text-white'}`}>
                            {title}
                          </h3>
                        </div>

                        {habit.description && (
                          <p className="text-xs text-slate-400 mt-1.5 ml-7 leading-relaxed bg-slate-950/40 p-2 rounded-xl border border-slate-800/50">
                            💡 {habit.description}
                          </p>
                        )}
                      </div>

                      {/* SLA badge */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        habit.compliance_summary.meets_sla 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' 
                          : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                      }`}>
                        SLA {habit.compliance_summary.rate_percent}%
                      </span>
                    </div>

                    {/* Botones de control de Series (Marcar 1/3, 2/3, 3/3) */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">Series completadas:</span>
                        <span className="text-xs font-black font-mono px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-lg text-amber-400">
                          {currentSeries} / {targetSeries} {habit.unit}
                        </span>
                      </div>

                      {/* Contador con botones +/- rápidos */}
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => logSeriesStep(habit.id, -1)}
                          disabled={currentSeries <= 0}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40 transition"
                          title="Restar 1 serie"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <button 
                          onClick={() => logSeriesStep(habit.id, 1)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                            isCompleted 
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Lista
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" /> Marcar Serie
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {workoutHabits.length === 0 && (
                <div className="text-center py-10 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
                  <Dumbbell className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No hay ejercicios de entrenamiento activos.</p>
                  <button 
                    onClick={() => setViewMode('programs')}
                    className="mt-3 text-xs bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl"
                  >
                    Activar Plan TRX Aquiles
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VISTA 2: MIS HÁBITOS DIARIOS GENERALES (CHECKLIST RÁPIDO) */}
        {/* ======================================================== */}
        {viewMode === 'habits' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Hábitos Personales del Día</h2>
                <p className="text-xs text-slate-400">Rutinas fuera del entrenamiento para sostener tus hábitos saludables</p>
              </div>
            </div>

            <div className="space-y-3">
              {dailyHabits.map((habit) => {
                const isCompleted = habit.today_log?.completed ?? false;
                const meetsSla = habit.compliance_summary.meets_sla;

                return (
                  <div 
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id)}
                    className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                      isCompleted 
                        ? 'bg-slate-900/60 border-indigo-900/50' 
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl transition ${
                        isCompleted ? 'text-indigo-400 bg-indigo-950' : 'text-slate-500 bg-slate-800'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                      </div>

                      <div>
                        <h3 className={`font-semibold text-sm ${isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}>
                          {cleanTitle(habit.title)}
                        </h3>
                        {habit.description && (
                          <p className="text-xs text-slate-400 mt-0.5">{habit.description}</p>
                        )}
                        {habit.unit && (
                          <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded mt-1 inline-block">
                            Meta: {habit.target_value} {habit.unit}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        meetsSla 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' 
                          : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                      }`}>
                        {meetsSla ? '✓ En SLA' : '⚠ En Riesgo'} ({habit.compliance_summary.rate_percent}%)
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {habit.compliance_summary.completed_last_7_days}/7 días completados
                      </div>
                    </div>
                  </div>
                );
              })}

              {dailyHabits.length === 0 && (
                <div className="text-center py-10 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
                  <p className="text-xs text-slate-400">Todos tus hábitos actuales son parte de tus entrenamientos.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VISTA 3: MATRIZ SEMANAL & MONITOREO DE SLA (CALENDARIO) */}
        {/* ======================================================== */}
        {viewMode === 'calendar' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Cumplimiento Semanal & SLA</h2>
                <p className="text-xs text-slate-400">Supervisa de un vistazo qué días cumpliste cada tarea en los últimos 7 días</p>
              </div>
            </div>

            {/* Tarjeta de Resumen Global */}
            {metrics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cumplimiento Hoy</span>
                  <div className="text-xl font-bold text-white mt-1">{metrics.completed_today} / {metrics.total_active_habits}</div>
                  <div className="text-xs text-indigo-400 font-medium">{metrics.today_compliance_percent}%</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Salud SLA 7 Días</span>
                  <div className="text-xl font-bold text-emerald-400 mt-1">{metrics.habits_meeting_sla_percent}%</div>
                  <div className="text-xs text-slate-400">{metrics.healthy_habits} hábitos en meta</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">En Riesgo</span>
                  <div className="text-xl font-bold text-amber-400 mt-1">{metrics.at_risk_habits}</div>
                  <div className="text-xs text-slate-400">Bajo umbral mínimo</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Programas</span>
                  <div className="text-xl font-bold text-white mt-1">{programs.length}</div>
                  <div className="text-xs text-violet-400">Activos en catálogo</div>
                </div>
              </div>
            )}

            {/* Matriz Heatmap / Días de la Semana */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 overflow-x-auto shadow-sm">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">Hábito / Tarea</th>
                    <th className="pb-3 text-center font-semibold">Historial (7 Días)</th>
                    <th className="pb-3 text-right font-semibold">SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {habits.map((habit) => (
                    <tr key={habit.id} className="hover:bg-slate-800/30">
                      <td className="py-3 pr-2">
                        <div className="font-semibold text-white max-w-[200px] truncate">{cleanTitle(habit.title)}</div>
                        <div className="text-[10px] text-slate-400">Meta: {habit.target_value} {habit.unit}</div>
                      </td>

                      <td className="py-3 px-2">
                        <div className="flex items-center justify-center gap-1.5">
                          {habit.compliance_summary.history?.map((h, i) => (
                            <div 
                              key={i} 
                              className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                                h.completed 
                                  ? 'bg-emerald-500 text-slate-950 font-black' 
                                  : 'bg-slate-800 text-slate-500'
                              }`}
                              title={`${h.date}: ${h.completed ? 'Cumplido' : 'No cumplido'}`}
                            >
                              {h.day_name.slice(0, 1)}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 pl-2 text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          habit.compliance_summary.meets_sla 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' 
                            : 'bg-amber-950 text-amber-400 border border-amber-800/60'
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
        {/* VISTA 4: PROGRAMAS & SIMULADOR DE INYECCIÓN API */}
        {/* ======================================================== */}
        {viewMode === 'programs' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-white">Catálogo de Programas</h2>
              <p className="text-xs text-slate-400">Planes estructurados inyectados por API</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {programs.map((program) => (
                <div key={program.id} className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-800/50">
                        {program.category}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{program.duration_days} días</span>
                    </div>
                    <h3 className="font-bold text-sm text-white mb-1">{program.title}</h3>
                    <p className="text-xs text-slate-400 mb-3">{program.description}</p>
                    
                    <span className="text-xs font-semibold text-slate-300">Ejercicios ({program.items?.length || 0}):</span>
                    <div className="space-y-1 mt-1 max-h-32 overflow-y-auto pr-1">
                      {program.items?.map(it => (
                        <div key={it.id} className="text-[11px] bg-slate-950/60 p-1.5 rounded-lg text-slate-300 flex justify-between">
                          <span>{it.title}</span>
                          <span className="text-slate-400 font-mono">{it.target_value} {it.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => handleEnroll(program.id)}
                    className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" /> Activar este Programa
                  </button>
                </div>
              ))}
            </div>

            {/* Simulador API */}
            <div className="border-t border-slate-800 pt-5">
              <h3 className="text-sm font-bold text-white mb-1">Inyector de Programas (API Simulator)</h3>
              <p className="text-xs text-slate-400 mb-3">Envía un JSON con un nuevo plan al endpoint <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300 font-mono">POST /api/programs/inject/</code></p>
              
              <textarea 
                value={jsonPayload}
                onChange={(e) => setJsonPayload(e.target.value)}
                className="w-full h-48 bg-slate-950 font-mono text-xs text-emerald-400 p-3 rounded-xl border border-slate-800 focus:border-indigo-500 focus:outline-none"
              />

              <div className="flex items-center justify-between mt-2">
                <button 
                  onClick={handleInjectProgram}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition"
                >
                  <Zap className="w-3.5 h-3.5" /> Inyectar Programa al Backend
                </button>
                {injectStatus && <span className="text-xs text-indigo-400">{injectStatus}</span>}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {isRegister ? <UserPlus className="w-4 h-4 text-indigo-400" /> : <LogIn className="w-4 h-4 text-indigo-400" />}
                {isRegister ? 'Crear Cuenta en Taskia' : 'Iniciar Sesión'}
              </h3>
              <button onClick={() => setShowAuthModal(false)} className="text-slate-500 hover:text-white text-sm">✕</button>
            </div>

            {authError && (
              <div className="bg-red-950/60 border border-red-800/80 text-red-300 text-xs p-2.5 rounded-lg mb-4">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nombre de Usuario</label>
                <input 
                  type="text" 
                  required
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  placeholder="ej. juan_runner" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {isRegister && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Correo Electrónico (opcional)</label>
                  <input 
                    type="email" 
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="tu@email.com" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400 block mb-1">Contraseña</label>
                <input 
                  type="password" 
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 rounded-xl transition mt-2"
              >
                {isRegister ? 'Registrarse y Entrar' : 'Ingresar'}
              </button>
            </form>

            <div className="text-center mt-4">
              <button 
                onClick={() => { setIsRegister(!isRegister); setAuthError(''); }}
                className="text-xs text-slate-400 hover:text-indigo-400 transition"
              >
                {isRegister ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate aquí'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
