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
import datetime

def get_request_user(request):
    """Obtiene el usuario autenticado por token o sesión, o cae al usuario demo."""
    if request.user and request.user.is_authenticated:
        return request.user
    user, _ = User.objects.get_or_create(username='demo_user', defaults={'email': 'demo@taskia.app'})
    return user

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
@permission_classes([AllowAny])
def current_user_view(request):
    user = get_request_user(request)
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

class CoachProfileViewSet(viewsets.ModelViewSet):
    queryset = CoachProfile.objects.all().order_by('id')
    serializer_class = CoachProfileSerializer
    permission_classes = [AllowAny]

class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all().order_by('-created_at')
    serializer_class = ProgramSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
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

    @action(detail=True, methods=['post'])
    def enroll(self, request, pk=None):
        """
        Inscribir al usuario activo en el programa e instanciar sus hábitos asociados.
        """
        program = self.get_object()
        user = get_request_user(request)
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
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = get_request_user(self.request)
        return Habit.objects.filter(user=user, active=True).order_by('-created_at')

    def perform_create(self, serializer):
        user = get_request_user(self.request)
        serializer.save(user=user)

    @action(detail=False, methods=['get'])
    def today(self, request):
        """
        Retorna EXCLUSIVAMENTE los hábitos programados para el día de hoy
        (o aquellos que hayan sido completados hoy).
        Si el parámetro ?all=true está presente, retorna todos los hábitos activos.
        """
        user = get_request_user(request)
        habits = Habit.objects.filter(user=user, active=True)
        today = datetime.date.today()
        show_all = request.query_params.get('all', 'false').lower() == 'true'

        if not show_all:
            # Filtrar por los que tocan hoy o ya tienen registro hoy
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
        today = datetime.date.today()
        target_date = request.data.get('date', str(today))
        log, created = HabitLog.objects.get_or_create(habit=habit, date=target_date)

        if 'step' in request.data:
            # Incrementar una serie (ej. 1 de 3)
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

@api_view(['GET'])
@permission_classes([AllowAny])
def sla_metrics_summary(request):
    """
    Calcula el SLA de cumplimiento considerando únicamente los hábitos y días
    que estaban efectivamente programados.
    """
    user = get_request_user(request)
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
