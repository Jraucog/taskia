import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CheckCircle2, Circle, Flame, Target, Zap, 
  Layers, BarChart3, AlertCircle, Play, RefreshCw,
  User, LogOut, LogIn, UserPlus
} from 'lucide-react';

const API_BASE = `http://${window.location.hostname}:8000/api`;

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
  const [activeTab, setActiveTab] = useState<'today' | 'programs' | 'inject'>('today');

  const [jsonPayload, setJsonPayload] = useState(JSON.stringify({
    title: "Plan de Resistencia Running 21 Días",
    description: "Programa de preparación aeróbica e hidratación running",
    category: "Running / Atletismo",
    duration_days: 21,
    items: [
      {
        title: "Trote Progresivo (Kilómetros)",
        day_offset: 0,
        habit_type: "numeric",
        target_value: 5,
        unit: "km",
        description: "Ritmo cómodo zona 2"
      },
      {
        title: "Electrolitos y Recuperación",
        day_offset: 0,
        habit_type: "boolean",
        target_value: 1,
        unit: "",
        description: "Tomar sales minerales post entreno"
      },
      {
        title: "Movilidad de Tobillos y Cadera",
        day_offset: 0,
        habit_type: "boolean",
        target_value: 1,
        unit: "",
        description: "15 min de drills técnicos"
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

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isRegister) {
        const res = await axios.post(`${API_BASE}/auth/register/`, {
          username: authUsername,
          password: authPassword,
          email: authEmail
        });
        const token = res.data.tokens.access;
        localStorage.setItem('taskia_token', token);
        setAuthToken(token);
        setCurrentUser(res.data.user);
        setShowAuthModal(false);
      } else {
        const res = await axios.post(`${API_BASE}/auth/login/`, {
          username: authUsername,
          password: authPassword
        });
        const token = res.data.tokens.access;
        localStorage.setItem('taskia_token', token);
        setAuthToken(token);
        setCurrentUser(res.data.user);
        setShowAuthModal(false);
      }
    } catch (err: any) {
      setAuthError(err.response?.data?.error || 'Error al autenticar. Revisa tus credenciales.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('taskia_token');
    setAuthToken(null);
    fetchData();
  };

  const toggleHabit = async (habitId: number) => {
    try {
      await axios.post(`${API_BASE}/habits/${habitId}/toggle_today/`, {}, getHeaders());
      fetchData();
    } catch (err) {
      console.error("Error al marcar hábito:", err);
    }
  };

  const handleEnroll = async (programId: number) => {
    try {
      const res = await axios.post(`${API_BASE}/programs/${programId}/enroll/`, {}, getHeaders());
      alert(res.data.message || "¡Programa inscrito correctamente!");
      fetchData();
      setActiveTab('today');
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
      setInjectStatus(`Programa "${res.data.title}" inyectado exitosamente!`);
      fetchData();
    } catch (err: any) {
      console.error("Error inyectando:", err);
      setInjectStatus(`Error: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-violet-300 bg-clip-text text-transparent">
                TASKIA
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800">
                SLA & Program Engine
              </span>
            </div>
          </div>

          {/* User profile & actions */}
          <div className="flex items-center gap-3">
            {/* User badge */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
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
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button 
                  onClick={() => { setShowAuthModal(true); setIsRegister(false); }}
                  className="ml-1 text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Login
                </button>
              )}
            </div>

            <a 
              href={`http://${window.location.hostname}:8000/api/docs/`} 
              target="_blank" 
              rel="noreferrer"
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700 transition"
            >
              Swagger Docs
            </a>

            <button 
              onClick={fetchData} 
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
              title="Recargar datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

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

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full p-6 flex-1 flex flex-col gap-6">
        {/* Metric Cards Banner */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col gap-1 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
                <span>Cumplimiento Hoy</span>
                <Target className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-1">
                {metrics.completed_today} / {metrics.total_active_habits}
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${metrics.today_compliance_percent}%` }}
                />
              </div>
              <span className="text-xs text-indigo-400 font-medium mt-1">{metrics.today_compliance_percent}% completado</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col gap-1 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
                <span>Salud Global de SLA</span>
                <BarChart3 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-1">
                {metrics.habits_meeting_sla_percent}%
              </div>
              <div className="text-xs text-emerald-400 mt-2 font-medium">
                {metrics.healthy_habits} hábitos en SLA óptimo
              </div>
              <span className="text-xs text-slate-500 mt-1">Base: últimos 7 días</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col gap-1 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
                <span>Hábitos en Riesgo</span>
                <AlertCircle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400 mt-1">
                {metrics.at_risk_habits}
              </div>
              <span className="text-xs text-slate-400 mt-2">Bajo umbral de SLA asignado</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col gap-1 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
                <span>Programas Activos</span>
                <Layers className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-1">
                {programs.length}
              </div>
              <span className="text-xs text-slate-400 mt-2">Planes inyectados listos</span>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-6 text-sm font-medium">
          <button 
            onClick={() => setActiveTab('today')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'today' 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" /> Mi Día & Hábitos SLA ({habits.length})
          </button>

          <button 
            onClick={() => setActiveTab('programs')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'programs' 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" /> Catálogo de Programas ({programs.length})
          </button>

          <button 
            onClick={() => setActiveTab('inject')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'inject' 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" /> Inyector de Programas (API Simulator)
          </button>
        </div>

        {/* Tab 1: Mi Día & Hábitos */}
        {activeTab === 'today' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Hábitos de Hoy</h2>
                <p className="text-xs text-slate-400">Marca tu cumplimiento diario en 1-click y supervisa el SLA semanal</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {habits.map((habit) => {
                const isCompleted = habit.today_log?.completed ?? false;
                const meetsSla = habit.compliance_summary.meets_sla;

                return (
                  <div 
                    key={habit.id}
                    className={`p-4 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                      isCompleted 
                        ? 'bg-slate-900/90 border-indigo-900/60 shadow-sm' 
                        : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Check Button */}
                      <button 
                        onClick={() => toggleHabit(habit.id)}
                        className={`p-2 rounded-xl transition duration-150 ${
                          isCompleted 
                            ? 'text-indigo-400 bg-indigo-950/80 hover:bg-indigo-900' 
                            : 'text-slate-500 hover:text-slate-300 bg-slate-800/60'
                        }`}
                        title="Marcar / Desmarcar cumplimiento hoy"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-7 h-7 fill-indigo-500/20" />
                        ) : (
                          <Circle className="w-7 h-7" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`font-semibold text-base ${isCompleted ? 'text-slate-300 line-through' : 'text-white'}`}>
                            {habit.title}
                          </h3>
                          {habit.unit && (
                            <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                              Meta: {habit.target_value} {habit.unit}
                            </span>
                          )}
                        </div>
                        {habit.description && (
                          <p className="text-xs text-slate-400 mt-0.5">{habit.description}</p>
                        )}
                      </div>
                    </div>

                    {/* SLA Compliance Indicator */}
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            meetsSla 
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80' 
                              : 'bg-amber-950 text-amber-400 border border-amber-800/80'
                          }`}>
                            {meetsSla ? '✓ En SLA' : '⚠ En Riesgo'}
                          </span>
                          <span className="text-xs font-bold text-slate-300">
                            {habit.compliance_summary.rate_percent}%
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          SLA Requerido: <span className="text-slate-300">{habit.sla_target_percent}%</span> ({habit.compliance_summary.completed_last_7_days}/7 días)
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {habits.length === 0 && (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                  <Flame className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No tienes hábitos activos en este momento.</p>
                  <button 
                    onClick={() => setActiveTab('programs')} 
                    className="mt-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg"
                  >
                    Explorar e Inscribir un Programa
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Catálogo de Programas */}
        {activeTab === 'programs' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Programas Disponibles</h2>
              <p className="text-xs text-slate-400">Planes estructurados inyectados por API listos para activar</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {programs.map((program) => (
                <div key={program.id} className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 border border-indigo-800/50 px-2.5 py-0.5 rounded-full">
                        {program.category}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {program.duration_days} días
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">{program.title}</h3>
                    <p className="text-xs text-slate-400 mb-4">{program.description}</p>

                    <div className="space-y-2 border-t border-slate-800 pt-3 mb-4">
                      <span className="text-xs font-semibold text-slate-300">Hábitos incluidos ({program.items?.length || 0}):</span>
                      {program.items?.map((item) => (
                        <div key={item.id} className="text-xs bg-slate-800/50 p-2 rounded-lg flex items-center justify-between text-slate-300">
                          <span>{item.title}</span>
                          {item.unit && (
                            <span className="font-mono text-slate-400">{item.target_value} {item.unit}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => handleEnroll(program.id)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" /> Inscribirme y Activar Hábitos
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Inyector de Programas (API Simulator) */}
        {activeTab === 'inject' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Inyección Externa de Programas por API</h2>
              <p className="text-xs text-slate-400">
                Prueba enviar un JSON directo al endpoint <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300 font-mono">POST /api/programs/inject/</code>
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Payload JSON del Programa</span>
                <span className="text-[11px] text-slate-500 font-mono">drf-spectacular compatible</span>
              </label>

              <textarea 
                value={jsonPayload}
                onChange={(e) => setJsonPayload(e.target.value)}
                className="w-full h-80 bg-slate-950 font-mono text-xs text-emerald-400 p-4 rounded-xl border border-slate-800 focus:border-indigo-500 focus:outline-none"
              />

              <div className="flex items-center justify-between">
                <button 
                  onClick={handleInjectProgram}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 transition"
                >
                  <Zap className="w-4 h-4" /> Inyectar Programa al Backend
                </button>
                
                {injectStatus && (
                  <span className="text-xs font-medium text-indigo-400">
                    {injectStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
