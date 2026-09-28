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
        # 4. Crear Perfiles de Entrenadores Motivadores
        from core.models import CoachProfile, UserCoachPreference

        c1, _ = CoachProfile.objects.get_or_create(
            slug='david-goggins',
            defaults={
                'name': 'Sargento David (Cero Excusas)',
                'tone': 'drill_sergeant',
                'avatar_emoji': '🔥',
                'bio': 'Mentalidad de acero militar. No hay lugar para la pereza ni para postergar.',
                'morning_quote': '¡Levántate! El dolor de la disciplina pesa gramos, el remordimiento pesa toneladas.',
                'midday_reminder': '¿Ya estás poniendo excusas? Agarra el cuaderno o cumple la serie AHORA.',
                'evening_warning': '¡No te atrevas a tocar la almohada sin haber cumplido tu meta diaria!'
            }
        )

        c2, _ = CoachProfile.objects.get_or_create(
            slug='marco-aurelio',
            defaults={
                'name': 'Marco Aurelio (Estoico)',
                'tone': 'stoic_mentor',
                'avatar_emoji': '🏛️',
                'bio': 'Sabiduría clásica. El obstáculo es el camino, la constancia es tu único deber.',
                'morning_quote': 'Al amanecer, dite a ti mismo: Hoy debo hacer la obra de un ser humano.',
                'midday_reminder': 'Concéntrate como un romano en cumplir la tarea presente con gravedad y amor.',
                'evening_warning': 'Reflexiona sobre tu jornada: ¿Hiciste lo correcto con tus metas hoy?'
            }
        )

        c3, _ = CoachProfile.objects.get_or_create(
            slug='kobe-mamba',
            defaults={
                'name': 'Mamba Mentality (Alto Rendimiento)',
                'tone': 'high_performance',
                'avatar_emoji': '🐍',
                'bio': 'Obsesión por el detalle y el trabajo implacable para alcanzar los 100M.',
                'morning_quote': 'Los grandes no negocian consigo mismos. Despierta y ejecuta.',
                'midday_reminder': 'Cada repetición y cada meta escrita te acerca al 1% élite.',
                'evening_warning': 'Descansa solo cuando el trabajo esté terminado, no cuando estés cansado.'
            }
        )

        # Asignar sargento por defecto
        pref, _ = UserCoachPreference.objects.get_or_create(user=user)
        pref.coach = c1
        pref.notifications_enabled = True
        pref.intensity_level = 3
        pref.save()

        self.stdout.write(self.style.SUCCESS("[OK] Datos semilla y Perfiles de Entrenador cargados con exito."))
