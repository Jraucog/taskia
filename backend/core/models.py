from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import datetime

class Program(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, default="Fitness")
    duration_days = models.IntegerField(default=30)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class ProgramItem(models.Model):
    HABIT_TYPE_CHOICES = [
        ('boolean', 'Cumplimiento Sí/No'),
        ('numeric', 'Cuantitativo / Numérico'),
    ]
    program = models.ForeignKey(Program, related_name='items', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    day_offset = models.IntegerField(default=0, help_text="Día relativo del programa (0 es día 1, etc.)")
    habit_type = models.CharField(max_length=20, choices=HABIT_TYPE_CHOICES, default='boolean')
    target_value = models.FloatField(default=1.0)
    unit = models.CharField(max_length=50, blank=True, default='')
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.program.title} - Día {self.day_offset}: {self.title}"

class ProgramEnrollment(models.Model):
    user = models.ForeignKey(User, related_name='enrollments', on_delete=models.CASCADE)
    program = models.ForeignKey(Program, related_name='enrollments', on_delete=models.CASCADE)
    start_date = models.DateField(default=datetime.date.today)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} enrolled in {self.program.title}"

class Habit(models.Model):
    HABIT_TYPE_CHOICES = [
        ('boolean', 'Cumplimiento Sí/No'),
        ('numeric', 'Cuantitativo / Numérico'),
    ]
    FREQUENCY_CHOICES = [
        ('daily', 'Todos los días'),
        ('specific_days', 'Días específicos'),
        ('weekly_quota', 'Cuota semanal'),
    ]
    user = models.ForeignKey(User, related_name='habits', on_delete=models.CASCADE)
    enrollment = models.ForeignKey(ProgramEnrollment, related_name='habits', on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    habit_type = models.CharField(max_length=20, choices=HABIT_TYPE_CHOICES, default='boolean')
    target_value = models.FloatField(default=1.0)
    unit = models.CharField(max_length=50, blank=True, default='')
    frequency_type = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='daily')
    days_of_week = models.CharField(max_length=50, default='0,1,2,3,4,5,6', help_text="0=Lunes, 6=Domingo")
    day_offset = models.IntegerField(null=True, blank=True, help_text="Día relativo del programa (0 es día 1, etc.)")
    weekly_target = models.IntegerField(default=7)
    sla_target_percent = models.IntegerField(default=80, help_text="Meta de cumplimiento porcentual para estar en SLA")
    created_at = models.DateTimeField(auto_now_add=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} ({self.user.username})"

    def is_scheduled_on(self, target_date=None):
        """
        Determina si este hábito está programado para una fecha específica.
        - Si pertenece a un programa con day_offset secuencial (retos de N días como Brian Tracy):
          solo está programado si el offset respecto a start_date coincide.
        - Si es 'specific_days': verifica si el día de la semana (0=Lunes...6=Domingo) está en days_of_week.
        - Si es 'daily': programado todos los días.
        - Si es 'weekly_quota': programado por cuota semanal.
        """
        if target_date is None:
            target_date = datetime.date.today()

        # 1. Hábitos secuenciales vinculados a un programa (ej. Desafío 21 Días)
        if self.enrollment and self.day_offset is not None:
            # Calcular qué día del programa corresponde a target_date
            prog_day = (target_date - self.enrollment.start_date).days
            return self.day_offset == prog_day

        # 2. Días específicos de la semana (ej. TRX lunes, miércoles y viernes: '0,2,4')
        if self.frequency_type == 'specific_days':
            allowed_days = [d.strip() for d in self.days_of_week.split(',') if d.strip()]
            return str(target_date.weekday()) in allowed_days

        # 3. Diario o cuota semanal
        return True

class HabitLog(models.Model):
    habit = models.ForeignKey(Habit, related_name='logs', on_delete=models.CASCADE)
    date = models.DateField(default=datetime.date.today)
    value = models.FloatField(default=0.0)
    completed = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('habit', 'date')

    def save(self, *args, **kwargs):
        if self.habit.habit_type == 'boolean':
            self.completed = bool(self.completed or self.value >= 1.0)
        else:
            self.completed = bool(self.value >= self.habit.target_value)
        super().save(*args, **kwargs)

    @property
    def is_in_sla(self):
        return self.completed

class CoachProfile(models.Model):
    TONE_CHOICES = [
        ('drill_sergeant', 'Sargento Estricto (Sin Excusas / Militar)'),
        ('stoic_mentor', 'Mentor Estoico (Filosófico / Firme y Sabio)'),
        ('high_performance', 'Entrenador Élite (Enfoque Resultados / Atleta)'),
        ('empathetic_coach', 'Coach Comprensivo (Positivo / Hábito Sostenible)'),
    ]
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    tone = models.CharField(max_length=50, choices=TONE_CHOICES, default='drill_sergeant')
    avatar_emoji = models.CharField(max_length=10, default='🔥')
    bio = models.TextField(blank=True)
    morning_quote = models.CharField(max_length=255, default='¡Despierta! Hoy es el día para mover la aguja.')
    midday_reminder = models.CharField(max_length=255, default='¿Ya avanzaste en tu acción prioritaria?')
    evening_warning = models.CharField(max_length=255, default='El día casi termina. No te vayas a dormir debiendo tu hábito.')

    def __str__(self):
        return f"{self.avatar_emoji} {self.name} ({self.get_tone_display()})"

class UserCoachPreference(models.Model):
    user = models.OneToOneField(User, related_name='coach_preference', on_delete=models.CASCADE)
    coach = models.ForeignKey(CoachProfile, related_name='users', on_delete=models.SET_NULL, null=True, blank=True)
    notifications_enabled = models.BooleanField(default=False)
    push_subscription = models.JSONField(default=dict, blank=True)
    intensity_level = models.IntegerField(default=3, help_text="1: Suave, 2: Medio, 3: Implacable")

    def __str__(self):
        return f"Preferencia de {self.user.username}: {self.coach.name if self.coach else 'Por Defecto'}"
