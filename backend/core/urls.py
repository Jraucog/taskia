from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    ProgramViewSet, HabitViewSet, CoachProfileViewSet, sla_metrics_summary,
    register_view, login_view, current_user_view
)

router = DefaultRouter()
router.register(r'programs', ProgramViewSet, basename='program')
router.register(r'habits', HabitViewSet, basename='habit')
router.register(r'coaches', CoachProfileViewSet, basename='coach')

urlpatterns = [
    # Auth endpoints
    path('auth/register/', register_view, name='auth-register'),
    path('auth/login/', login_view, name='auth-login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/me/', current_user_view, name='auth-me'),
    
    # Core app endpoints
    path('', include(router.urls)),
    path('metrics/summary/', sla_metrics_summary, name='sla-metrics-summary'),
]
