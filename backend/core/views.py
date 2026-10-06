from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from .models import Program, ProgramItem, ProgramEnrollment, Habit, HabitLog, CoachProfile, UserCoachPreference
from .serializers import (
    UserSerializer, RegisterSerializer,
    ProgramSerializer, ProgramInjectSerializer, HabitSerializer,
    HabitLogSerializer, ProgramEnrollmentSerializer,
    CoachProfileSerializer, UserCoachPreferenceSerializer
)
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
import datetime

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })
    return Response({'error': 'Credenciales invalidas'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    user = request.user
    pref, _ = UserCoachPreference.objects.get_or_create(user=user)
    
    if request.method == 'POST':
        coach_id = request.data.get('coach_id')
        if coach_id is not None:
            coach = CoachProfile.objects.filter(id=coach_id).first()
            pref.coach = coach
        if 'notifications_enabled' in request.data:
            pref.notifications_enabled = bool(request.data['notifications_enabled'])
        if 'intensity_level' in request.data:
            pref.intensity_level = int(request.data['intensity_level'])
        pref.save()

    return Response(UserSerializer(user).data)

class CoachProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CoachProfile.objects.all().order_by('id')
    serializer_class = CoachProfileSerializer
    permission_classes = [AllowAny]

class ProgramViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Program.objects.all().order_by('-created_at')
    serializer_class = ProgramSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def inject(self, request):
        """
        Endpoint para inyectar programas por API externamente.
        Ejemplo: Inyectar plan de entrenamiento con rutinas/metas.
        """
        serializer = ProgramInjectSerializer(data=request.data)
        if serializer.is_valid():
            program = serializer.save()
            return Response(ProgramSerializer(program).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def enroll(self, request, pk=None):
        """
        Inscribir al usuario activo en el programa e instanciar sus hábitos asociados.
        """
        program = self.get_object()
        user = request.user
        start_date = request.data.get('start_date', datetime.date.today().isoformat())

        enrollment, created = ProgramEnrollment.objects.get_or_create(
            user=user,
            program=program,
            defaults={'start_date': start_date, 'active': True}
        )

        # Generar hábitos a partir de los items del programa
        created_habits = []
        for item in program.items.all():
            habit, h_created = Habit.objects.get_or_create(
                user=user,
                enrollment=enrollment,
                title=f"[{program.title}] {item.title}",
                defaults={
                    'description': item.description,
                    'habit_type': item.habit_type,
                    'target_value': item.target_value,
                    'unit': item.unit,
                    'estimated_minutes': item.estimated_minutes,
                    'day_offset': item.day_offset,
                    'frequency_type': 'daily',
                    'sla_target_percent': 85
                }
            )
            if h_created:
                created_habits.append(habit.title)

        return Response({
            "message": f"Inscrito exitosamente en '{program.title}'",
            "enrollment_id": enrollment.id,
            "created_habits_count": len(created_habits),
            "habits": created_habits
        }, status=status.HTTP_200_OK)

class HabitViewSet(viewsets.ModelViewSet):
    serializer_class = HabitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        from django.db.models import Q
        return Habit.objects.filter(
            Q(user=user) | Q(shared_with=user),
            active=True
        ).distinct().order_by('-created_at')

    def perform_create(self, serializer):
        habit = serializer.save(user=self.request.user)
        # Robustez: Si el hábito pertenece a un plan (ej. "[Supermercado] Manzanas"),
        # heredar automáticamente los colaboradores (shared_with) que ya tiene dicho plan
        import re
        match = re.match(r'^\[(.*?)\]', habit.title)
        if match:
            plan_name = match.group(1).strip()
            from django.db.models import Q
            sibling = Habit.objects.filter(
                Q(user=self.request.user) | Q(shared_with=self.request.user),
                active=True
            ).filter(
                Q(title__startswith=f"[{plan_name}]") | Q(enrollment__program__title=plan_name)
            ).exclude(id=habit.id).first()
            if sibling:
                # Si el usuario actual es el dueño o colaborador, asociar todos los usuarios compartidos
                collaborators = list(sibling.shared_with.all())
                # Si el creador del nuevo item es un colaborador y no el dueño original del plan,
                # asegurar que el dueño original también esté en shared_with (o como owner)
                if sibling.user != self.request.user and sibling.user not in collaborators:
                    collaborators.append(sibling.user)
                for colab in collaborators:
                    if colab != self.request.user:
                        habit.shared_with.add(colab)

    @action(detail=False, methods=['get'])
    def today(self, request):
        """
        Retorna EXCLUSIVAMENTE los hábitos programados para el día de hoy
        (tanto propios como compartidos).
        Regla de Oro: Si un reto secuencial de N días (ej. 21 Días Brian Tracy)
        tuvo un día anterior sin completar, se reinicia automáticamente el ciclo al día 1.
        """
        user = request.user
        today = datetime.date.today()

        # Validación de Disciplina Estricta: Reinicio de programas secuenciales si se falló un día
        enrollments = ProgramEnrollment.objects.filter(user=user, active=True)
        for enrollment in enrollments:
            prog_habits = Habit.objects.filter(enrollment=enrollment, active=True, day_offset__isnull=False)
            if not prog_habits.exists():
                continue

            current_prog_day = (today - enrollment.start_date).days
            if current_prog_day > 0:
                should_reset = False
                for day_idx in range(current_prog_day):
                    target_prog_date = enrollment.start_date + datetime.timedelta(days=day_idx)
                    day_habit = prog_habits.filter(day_offset=day_idx).first()
                    if day_habit:
                        is_done = HabitLog.objects.filter(habit=day_habit, date=target_prog_date, completed=True).exists()
                        if not is_done:
                            should_reset = True
                            break
                if should_reset:
                    enrollment.start_date = today
                    enrollment.save()

        from django.db.models import Q
        habits = Habit.objects.filter(
            Q(user=user) | Q(shared_with=user),
            active=True
        ).distinct()
        show_all = request.query_params.get('all', 'false').lower() == 'true'

        if not show_all:
            today_completed_ids = HabitLog.objects.filter(
                habit__in=habits, date=today, completed=True
            ).values_list('habit_id', flat=True)

            filtered_habits = [
                h for h in habits
                if h.is_scheduled_on(today) or h.id in today_completed_ids
            ]
        else:
            filtered_habits = list(habits)

        serializer = self.get_serializer(filtered_habits, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_today(self, request, pk=None):
        habit = self.get_object()
        # Verify ownership or shared permission
        if habit.user != request.user and not habit.shared_with.filter(id=request.user.id).exists():
            return Response({'error': 'No autorizado para modificar este hábito'}, status=status.HTTP_403_FORBIDDEN)

        today = datetime.date.today()
        target_date = request.data.get('date', str(today))
        log, created = HabitLog.objects.get_or_create(habit=habit, date=target_date)

        if 'step' in request.data:
            step_delta = float(request.data['step'])
            log.value = max(0.0, round(log.value + step_delta, 1))
            log.completed = (log.value >= habit.target_value)
        elif 'value' in request.data:
            val = float(request.data['value'])
            log.value = val
            log.completed = (val >= habit.target_value)
        else:
            log.completed = not log.completed
            log.value = habit.target_value if log.completed else 0.0

        log.save()
        return Response({
            "habit_id": habit.id,
            "habit_title": habit.title,
            "date": str(target_date),
            "completed": log.completed,
            "value": log.value,
            "is_in_sla": log.is_in_sla
        })

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """
        Comparte un hábito/lista con otro usuario por su nombre de usuario o correo.
        """
        habit = self.get_object()
        if habit.user != request.user:
            return Response({'error': 'Solo el creador puede compartir este hábito'}, status=status.HTTP_403_FORBIDDEN)

        target_identifier = request.data.get('username', '').strip()
        if not target_identifier:
            return Response({'error': 'Debes especificar el nombre de usuario a compartir'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from django.db.models import Q
            target_user = User.objects.get(Q(username__iexact=target_identifier) | Q(email__iexact=target_identifier))
        except User.DoesNotExist:
            return Response({'error': f"Usuario '{target_identifier}' no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        if target_user == request.user:
            return Response({'error': 'Ya eres el creador de este hábito'}, status=status.HTTP_400_BAD_REQUEST)

        action_type = request.data.get('action', 'add') # 'add' or 'remove'
        if action_type == 'remove':
            habit.shared_with.remove(target_user)
            msg = f"Se dejó de compartir con {target_user.username}"
        else:
            habit.shared_with.add(target_user)
            msg = f"Hábito compartido exitosamente con {target_user.username}"

        return Response({
            'message': msg,
            'shared_with': list(habit.shared_with.values_list('username', flat=True))
        })

    @action(detail=False, methods=['post'])
    def share_plan(self, request):
        """
        Comparte un plan COMPLETO (todas las tareas que lo componen) con otro usuario.
        Ejemplo: Compartir la lista completa del 'Supermercado' o 'Rutina TRX'.
        """
        plan_name = request.data.get('plan_name', '').strip()
        target_identifier = request.data.get('username', '').strip()
        action_type = request.data.get('action', 'add') # 'add' or 'remove'

        if not plan_name or not target_identifier:
            return Response({'error': 'Debes indicar plan_name y username'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from django.db.models import Q
            target_user = User.objects.get(Q(username__iexact=target_identifier) | Q(email__iexact=target_identifier))
        except User.DoesNotExist:
            return Response({'error': f"Usuario '{target_identifier}' no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        if target_user == request.user:
            return Response({'error': 'Ya eres el creador de este plan'}, status=status.HTTP_400_BAD_REQUEST)

        # Buscar todos los hábitos asociados al plan accesibles por el usuario
        # (ya sea que sea el dueño original o colaborador)
        from django.db.models import Q
        habits = Habit.objects.filter(
            Q(user=request.user) | Q(shared_with=request.user),
            active=True
        ).filter(
            Q(title__startswith=f"[{plan_name}]") | Q(enrollment__program__title=plan_name)
        ).distinct()

        if not habits.exists():
            return Response({'error': f"No se encontraron tareas bajo el plan '{plan_name}'"}, status=status.HTTP_404_NOT_FOUND)

        for habit in habits:
            if action_type == 'remove':
                habit.shared_with.remove(target_user)
            else:
                if habit.user != target_user:
                    habit.shared_with.add(target_user)

        # Calcular todos los usuarios que actualmente tienen acceso compartido a este plan
        plan_shared_users = set()
        for h in habits:
            for u in h.shared_with.all():
                plan_shared_users.add(u.username)

        action_word = "dejó de compartir" if action_type == 'remove' else "compartió"
        return Response({
            'message': f"El plan '{plan_name}' ({habits.count()} tareas) se {action_word} con {target_user.username}",
            'plan_name': plan_name,
            'target_user': target_user.username,
            'updated_tasks_count': habits.count(),
            'shared_with': sorted(list(plan_shared_users))
        })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sla_metrics_summary(request):
    """
    Calcula el SLA de cumplimiento considerando únicamente los hábitos y días
    que estaban efectivamente programados.
    """
    user = request.user
    all_habits = Habit.objects.filter(user=user, active=True)
    today = datetime.date.today()
    seven_days_ago = today - datetime.timedelta(days=6)

    # Hábitos que correspondían para HOY
    scheduled_today_habits = [h for h in all_habits if h.is_scheduled_on(today)]
    total_scheduled_today = len(scheduled_today_habits)

    completed_today = 0
    for habit in scheduled_today_habits:
        if habit.logs.filter(date=today, completed=True).exists():
            completed_today += 1

    # Medición de salud de SLA de los hábitos activos
    in_sla_count = 0
    total_evaluated_habits = 0

    for habit in all_habits:
        # Contar cuántos días de los últimos 7 estaba programado
        scheduled_in_window = sum(
            1 for i in range(7)
            if habit.is_scheduled_on(today - datetime.timedelta(days=i))
        )
        if scheduled_in_window == 0:
            # Si no estaba programado en toda la semana (ej. reto futuro), no penaliza
            continue

        total_evaluated_habits += 1
        completed_in_window = habit.logs.filter(
            date__gte=seven_days_ago, date__lte=today, completed=True
        ).count()

        rate = (completed_in_window / float(scheduled_in_window)) * 100
        if rate >= habit.sla_target_percent:
            in_sla_count += 1

    overall_sla_rate = round((in_sla_count / float(total_evaluated_habits) * 100), 1) if total_evaluated_habits > 0 else 100.0
    today_rate = round((completed_today / float(total_scheduled_today) * 100), 1) if total_scheduled_today > 0 else 100.0

    return Response({
        "current_user": UserSerializer(user).data,
        "total_active_habits": all_habits.count(),
        "scheduled_today_count": total_scheduled_today,
        "completed_today": completed_today,
        "today_compliance_percent": today_rate,
        "habits_meeting_sla_percent": overall_sla_rate,
        "healthy_habits": in_sla_count,
        "at_risk_habits": max(0, total_evaluated_habits - in_sla_count)
    })
