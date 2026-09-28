from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Program, ProgramItem, ProgramEnrollment, Habit, HabitLog, CoachProfile, UserCoachPreference
import datetime

class CoachProfileSerializer(serializers.ModelSerializer):
    tone_display = serializers.CharField(source='get_tone_display', read_only=True)

    class Meta:
        model = CoachProfile
        fields = ['id', 'name', 'slug', 'tone', 'tone_display', 'avatar_emoji', 'bio', 'morning_quote', 'midday_reminder', 'evening_warning']

class UserCoachPreferenceSerializer(serializers.ModelSerializer):
    coach_details = CoachProfileSerializer(source='coach', read_only=True)

    class Meta:
        model = UserCoachPreference
        fields = ['id', 'user', 'coach', 'coach_details', 'notifications_enabled', 'intensity_level']
        read_only_fields = ['user']

class UserSerializer(serializers.ModelSerializer):
    coach_preference = UserCoachPreferenceSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'coach_preference']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=6)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

class ProgramItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgramItem
        fields = ['id', 'title', 'day_offset', 'habit_type', 'target_value', 'unit', 'description']

class ProgramSerializer(serializers.ModelSerializer):
    items = ProgramItemSerializer(many=True, required=False)

    class Meta:
        model = Program
        fields = ['id', 'title', 'description', 'category', 'duration_days', 'created_at', 'items']

class ProgramInjectSerializer(serializers.Serializer):
    """
    Serializer para inyectar programas por API externamente.
    """
    title = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True, default='')
    category = serializers.CharField(required=False, default='Training')
    duration_days = serializers.IntegerField(default=30)
    items = ProgramItemSerializer(many=True)

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        program = Program.objects.create(**validated_data)
        for item_data in items_data:
            ProgramItem.objects.create(program=program, **item_data)
        return program

class HabitLogSerializer(serializers.ModelSerializer):
    is_in_sla = serializers.ReadOnlyField()

    class Meta:
        model = HabitLog
        fields = ['id', 'habit', 'date', 'value', 'completed', 'is_in_sla', 'notes']

class HabitSerializer(serializers.ModelSerializer):
    today_log = serializers.SerializerMethodField()
    compliance_summary = serializers.SerializerMethodField()

    class Meta:
        model = Habit
        fields = [
            'id', 'user', 'enrollment', 'title', 'description', 'habit_type',
            'target_value', 'unit', 'frequency_type', 'days_of_week',
            'weekly_target', 'sla_target_percent', 'active', 'created_at',
            'today_log', 'compliance_summary'
        ]
        read_only_fields = ['user', 'enrollment', 'created_at']

    def get_today_log(self, obj):
        today = datetime.date.today()
        log = obj.logs.filter(date=today).first()
        if log:
            return HabitLogSerializer(log).data
        return None

    def get_compliance_summary(self, obj):
        today = datetime.date.today()
        seven_days_ago = today - datetime.timedelta(days=6)
        logs = {log.date: log for log in obj.logs.filter(date__gte=seven_days_ago, date__lte=today)}
        
        history = []
        completed_count = 0
        for i in range(6, -1, -1):
            d = today - datetime.timedelta(days=i)
            log = logs.get(d)
            is_comp = bool(log and log.completed)
            if is_comp:
                completed_count += 1
            history.append({
                "date": str(d),
                "day_name": d.strftime("%a"),
                "completed": is_comp,
                "value": log.value if log else 0.0
            })

        rate = round((completed_count / 7.0) * 100, 1)
        return {
            "completed_last_7_days": completed_count,
            "rate_percent": rate,
            "meets_sla": rate >= obj.sla_target_percent,
            "history": history
        }

class ProgramEnrollmentSerializer(serializers.ModelSerializer):
    program_details = ProgramSerializer(source='program', read_only=True)

    class Meta:
        model = ProgramEnrollment
        fields = ['id', 'user', 'program', 'start_date', 'active', 'created_at', 'program_details']
        read_only_fields = ['user', 'created_at']
