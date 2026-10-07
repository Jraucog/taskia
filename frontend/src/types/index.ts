export interface DayHistory {
  date: string;
  day_name: string;
  completed: boolean;
  value: number;
}

export interface Habit {
  id: number;
  title: string;
  description: string;
  habit_type: 'boolean' | 'numeric';
  target_value: number;
  unit: string;
  estimated_minutes?: number;
  reminder_time?: string | null; // Formato HH:mm (ej. "18:00")
  frequency_type?: string;
  days_of_week?: string;
  day_offset?: number | null;
  sla_target_percent: number;
  reset_on_miss?: boolean;
  enrollment?: number | null;
  owner_username?: string;
  is_shared?: boolean;
  shared_with_usernames?: string[];
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

export interface ProgramItem {
  id: number;
  title: string;
  day_offset: number;
  habit_type: string;
  target_value: number;
  unit: string;
  description: string;
  estimated_minutes?: number;
}

export interface CoachProfile {
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

export interface Program {
  id: number;
  title: string;
  description: string;
  category: string;
  duration_days: number;
  items: ProgramItem[];
}

export interface MetricsSummary {
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

export interface ProgramGroup {
  name: string;
  habits: Habit[];
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  sharedWith?: string[];
  isShared?: boolean;
}

export type AppTheme = 'dark' | 'light' | 'cyberpunk' | 'emerald' | 'dracula' | 'saiyan' | 'saiyan-light';

export interface ThemeOption {
  id: AppTheme;
  name: string;
  desc: string;
  icon: string;
  bgBadge: string;
  border: string;
  preview: string;
}

export interface Badge {
  id: string;
  icon: string;
  title: string;
  description: string;
  earned: boolean;
  earnedDate?: string;
}

export interface VisionCard {
  id: string;
  category: string;
  emoji: string;
  title: string;
  why: string;
  deadline: string;
  progress: number;
  color: string;
}

export interface BrianTracyGoal {
  id: number;
  cat: string;
  text: string;
  date: string;
}

