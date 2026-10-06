from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from core.models import Habit, HabitLog
import datetime

class PlanAndHabitSharingTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='joshua', email='joshua@example.com', password='password123')
        self.user2 = User.objects.create_user(username='maria', email='maria@example.com', password='password123')
        self.user3 = User.objects.create_user(username='carlos', email='carlos@example.com', password='password123')

        self.client1 = APIClient()
        self.client1.force_authenticate(user=self.user1)

        self.client2 = APIClient()
        self.client2.force_authenticate(user=self.user2)

    def test_share_single_habit(self):
        habit = Habit.objects.create(
            user=self.user1,
            title='Leche sin lactosa',
            target_value=1,
            frequency_type='daily'
        )

        # Joshua comparte con Maria
        res = self.client1.post(f'/api/habits/{habit.id}/share/', {'username': 'maria', 'action': 'add'})
        self.assertEqual(res.status_code, 200)
        self.assertIn('maria', res.data['shared_with'])

        # Maria ve el hábito en su endpoint /today/
        today_res = self.client2.get('/api/habits/today/')
        self.assertEqual(today_res.status_code, 200)
        habit_ids = [h['id'] for h in today_res.data]
        self.assertIn(habit.id, habit_ids)

        # Maria puede marcarlo como comprado
        toggle_res = self.client2.post(f'/api/habits/{habit.id}/toggle_today/', {})
        self.assertEqual(toggle_res.status_code, 200)
        self.assertTrue(toggle_res.data['completed'])

        # Joshua ve que está completado
        joshua_res = self.client1.get('/api/habits/today/')
        item = next(h for h in joshua_res.data if h['id'] == habit.id)
        self.assertTrue(item['today_log']['completed'])

    def test_share_entire_plan(self):
        # Joshua crea varias tareas bajo el plan "[Supermercado]"
        h1 = Habit.objects.create(user=self.user1, title='[Supermercado] Manzanas', target_value=1)
        h2 = Habit.objects.create(user=self.user1, title='[Supermercado] Pan integral', target_value=1)

        # Compartir plan completo
        res = self.client1.post('/api/habits/share_plan/', {'plan_name': 'Supermercado', 'username': 'maria', 'action': 'add'})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['updated_tasks_count'], 2)
        self.assertIn('maria', res.data['shared_with'])

        # Comprobar que ambas tareas tienen a maria en shared_with
        h1.refresh_from_db()
        h2.refresh_from_db()
        self.assertTrue(h1.shared_with.filter(username='maria').exists())
        self.assertTrue(h2.shared_with.filter(username='maria').exists())

    def test_auto_inheritance_of_plan_collaborators_on_new_habit(self):
        # 1. Crear tarea y compartir plan con maria
        Habit.objects.create(user=self.user1, title='[Supermercado] Huevos', target_value=1)
        self.client1.post('/api/habits/share_plan/', {'plan_name': 'Supermercado', 'username': 'maria', 'action': 'add'})

        # 2. Joshua agrega una nueva tarea al plan "[Supermercado] Café"
        create_res = self.client1.post('/api/habits/', {
            'title': '[Supermercado] Café',
            'target_value': 1,
            'habit_type': 'boolean',
            'frequency_type': 'daily',
            'sla_target_percent': 85
        })
        self.assertEqual(create_res.status_code, 201)
        new_habit_id = create_res.data['id']
        new_habit = Habit.objects.get(id=new_habit_id)

        # Debe haber heredado automáticamente a 'maria' como colaboradora
        self.assertTrue(new_habit.shared_with.filter(username='maria').exists())

        # Y Maria debe verla inmediatamente en su endpoint de hoy
        maria_today = self.client2.get('/api/habits/today/')
        m_ids = [h['id'] for h in maria_today.data]
        self.assertIn(new_habit_id, m_ids)

    def test_sequential_program_auto_reset_on_miss(self):
        from core.models import Program, ProgramItem, ProgramEnrollment
        # Crear programa secuencial de 21 días
        program = Program.objects.create(title='Reto 21 Días Test', duration_days=21)
        for d in range(21):
            ProgramItem.objects.create(
                program=program,
                title=f'Dia {d + 1}',
                day_offset=d,
                habit_type='boolean'
            )

        # Inscribir usuario con start_date hace 3 días (debió haber completado Día 1, 2 y 3)
        past_start = datetime.date.today() - datetime.timedelta(days=3)
        enrollment = ProgramEnrollment.objects.create(
            user=self.user1,
            program=program,
            start_date=past_start,
            active=True
        )
        for item in program.items.all():
            Habit.objects.create(
                user=self.user1,
                enrollment=enrollment,
                title=f'[{program.title}] {item.title}',
                day_offset=item.day_offset,
                target_value=1.0,
                habit_type='boolean'
            )

        # Como NO completó el Día 1 ni el Día 2, al consultar /today/, el programa DEBE reiniciarse automáticamente a hoy
        res = self.client1.get('/api/habits/today/')
        self.assertEqual(res.status_code, 200)

        enrollment.refresh_from_db()
        self.assertEqual(enrollment.start_date, datetime.date.today())

        # Debe estar programado el Día 1 hoy
        today_titles = [h['title'] for h in res.data]
        self.assertIn(f'[{program.title}] Dia 1', today_titles)
