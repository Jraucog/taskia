import React from 'react';
import { User, Palette, Flame, Award, Bell, LogOut, Check } from 'lucide-react';
import type { CoachProfile, AppTheme, ThemeOption, Badge, MetricsSummary } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  authToken: string | null;
  metrics: MetricsSummary | null;
  badges: Badge[];
  coaches: CoachProfile[];
  selectedCoachId: number | null;
  currentTheme: AppTheme;
  themesCatalog: ThemeOption[];
  profileActiveTab: 'profile' | 'theme' | 'coach' | 'badges';
  setProfileActiveTab: (tab: 'profile' | 'theme' | 'coach' | 'badges') => void;
  setCurrentTheme: (theme: AppTheme) => void;
  handleSelectCoach: (coachId: number) => void;
  sendCoachNotification: (title: string, body: string, emoji?: string) => void;
  requestNotificationPermission: () => void;
  notificationPermission: NotificationPermission;
  handleLogout: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  authToken,
  metrics,
  badges,
  coaches,
  selectedCoachId,
  currentTheme,
  themesCatalog,
  profileActiveTab,
  setProfileActiveTab,
  setCurrentTheme,
  handleSelectCoach,
  sendCoachNotification,
  requestNotificationPermission,
  notificationPermission,
  handleLogout
}) => {
  if (!isOpen) return null;

  const earnedBadgesCount = badges.filter(b => b.earned).length;

  return (
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
            onClick={onClose} 
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
                  onClick={() => {
                    if (notificationPermission !== 'granted') {
                      requestNotificationPermission();
                    } else {
                      const activeCoach = coaches.find(c => c.id === selectedCoachId) || coaches[0];
                      sendCoachNotification(
                        `🔔 Notificaciones Operativas`,
                        `¡Tu canal de disciplina con ${activeCoach?.name || 'Taskia'} está 100% activo!`,
                        activeCoach?.avatar_emoji || '🔥'
                      );
                    }
                  }}
                  className={`flex-1 border text-xs font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                    notificationPermission === 'granted'
                      ? 'bg-emerald-950/50 hover:bg-emerald-950 border-emerald-800/60 text-emerald-300'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/20'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{notificationPermission === 'granted' ? 'Probar Push' : 'Activar Notificaciones'}</span>
                </button>

                {authToken && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
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
            onClick={onClose}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
