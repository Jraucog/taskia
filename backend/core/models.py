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
    weekly_target = models.IntegerField(default=7)
    sla_target_percent = models.IntegerField(default=80, help_text="Meta de cumplimiento porcentual para estar en SLA")
    created_at = models.DateTimeField(auto_now_add=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} ({self.user.username})"

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
