from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Program, ProgramItem, ProgramEnrollment, Habit, HabitLog
import datetime

class Command(BaseCommand):
    help = 'Carga datos iniciales de prueba (Usuario, Programa de Entrenamiento y Hábitos con SLA)'

    def handle(self, *args, **kwargs):
        user, _ = User.objects.get_or_create(
            username='demo_user',
            defaults={'email': 'demo@taskia.app'}
        )
        user.set_password('demo1234')
        user.save()

        # 1. Crear un programa inyectable de ejemplo
        program, _ = Program.objects.get_or_create(
            title='Plan de Acondicionamiento 30 Días',
            defaults={
                'description': 'Programa progresivo de fuerza, movilidad y cardio para formar el hábito deportivo.',
                'category': 'Fitness & Salud',
                'duration_days': 30
            }
        )

        items_data = [
            {'title': 'Correr o Caminata Rápida (minutos)', 'habit_type': 'numeric', 'target_value': 30.0, 'unit': 'min', 'day_offset': 0, 'description': 'Cardio moderado continuo'},
            {'title': 'Sesión de Fuerza / Calistenia (series)', 'habit_type': 'numeric', 'target_value': 4.0, 'unit': 'series', 'day_offset': 0, 'description': 'Flexiones, sentadillas y fondos'},
            {'title': 'Estiramientos y Movilidad', 'habit_type': 'boolean', 'target_value': 1.0, 'unit': '', 'day_offset': 0, 'description': '10 min de estiramientos post entreno'},
        ]

        for item in items_data:
            ProgramItem.objects.get_or_create(program=program, title=item['title'], defaults=item)

        # 2. Inscribir al usuario
        enrollment, _ = ProgramEnrollment.objects.get_or_create(
            user=user,
            program=program,
            defaults={'start_date': datetime.date.today(), 'active': True}
        )

        # 3. Crear hábitos derivados del programa
        h1, _ = Habit.objects.get_or_create(
            user=user,
            enrollment=enrollment,
            title='[Plan 30D] Cardio Diario (30 min)',
            defaults={
                'description': 'Cumplimiento de sesión aeróbica diaria',
                'habit_type': 'numeric',
                'target_value': 30.0,
                'unit': 'min',
                'sla_target_percent': 80
            }
        )

        h2, _ = Habit.objects.get_or_create(
            user=user,
            enrollment=enrollment,
            title='[Plan 30D] Fuerza & Core',
            defaults={
                'description': 'Rutina de 4 series de fuerza',
                'habit_type': 'numeric',
                'target_value': 4.0,
                'unit': 'series',
                'sla_target_percent': 70
            }
        )

        # Hábito personal adicional
        h3, _ = Habit.objects.get_or_create(
            user=user,
            title='Beber 2.5L de Agua',
            defaults={
                'description': 'Hidratación completa durante el día',
                'habit_type': 'numeric',
                'target_value': 2.5,
                'unit': 'L',
                'sla_target_percent': 90
            }
        )

        # Generar histórico de los últimos 6 días
        today = datetime.date.today()
        for i in range(1, 7):
            past_date = today - datetime.timedelta(days=i)
            # h1 cumplido 5 de los 6 días
            if i in [1, 2, 3, 5, 6]:
                HabitLog.objects.get_or_create(habit=h1, date=past_date, defaults={'value': 30.0, 'completed': True})
            # h2 cumplido 4 de 6 días
            if i in [1, 2, 4, 6]:
                HabitLog.objects.get_or_create(habit=h2, date=past_date, defaults={'value': 4.0, 'completed': True})
            # h3 cumplido todos los días
            HabitLog.objects.get_or_create(habit=h3, date=past_date, defaults={'value': 2.5, 'completed': True})

        self.stdout.write(self.style.SUCCESS("[OK] Datos semilla cargados con exito para Taskia."))
