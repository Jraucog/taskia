# TASKIA — SLA & Program Engine

Plataforma inteligente para seguimiento de hábitos con **SLAs configurables** (diario, días específicos o cuota semanal) e **inyección automatizada de programas estructurados vía API** (planes de entrenamiento deportivo, cursos, salud).

---

## Características Principales

1. **Gestión de Hábitos y SLA Personalizable:**
   - Tipos de hábito: Binario (Sí/No) o Cuantitativo (ej. 30 min, 5 km, 2.5 L).
   - Metas de SLA configurables: Umbrales porcentuales de éxito semanal (ej. $\ge 80\%$).
   - Marcado de cumplimiento en **1-Click** desde la vista *"Mi Día"*.

2. **Inyección de Programas por API:**
   - Permite a sistemas externos o administradores cargar un plan completo en formato JSON (`POST /api/programs/inject/`).
   - Los usuarios se inscriben a un programa y el sistema genera automáticamente sus hábitos e instancias correspondientes.

3. **Autenticación Completa (JWT):**
   - Endpoints de Registro (`/api/auth/register/`), Login (`/api/auth/login/`) y obtención del perfil activo (`/api/auth/me/`).
   - Soporte para autenticación por token `Bearer` o sesión demo integrada.

4. **Frontend Moderno e Interactivo:**
   - Desarrollado en **React + Vite + TypeScript + Tailwind CSS**.
   - Tarjetas de métricas en tiempo real: Cumplimiento de hoy, porcentaje de salud global de SLA, hábitos en riesgo y programas activos.
   - Simulador visual de inyección de programas por API.

5. **Documentación Swagger / OpenAPI viva:**
   - `http://<host>:8000/api/docs/` generada automáticamente vía `drf-spectacular`.

---

## Arquitectura del Proyecto

```
taskia/
├── backend/                  # Backend Django 6 + Django REST Framework
│   ├── core/                 # Modelos, Vistas, Serializadores y Seed Data
│   │   ├── models.py         # Program, ProgramItem, ProgramEnrollment, Habit, HabitLog
│   │   ├── views.py          # ViewSets y endpoints con lógica SLA y Auth
│   │   ├── serializers.py    # Serializadores DRF
│   │   └── management/       # Comando python manage.py seed_data
│   ├── taskia_core/          # Configuración del proyecto Django
│   ├── requirements.txt      # Dependencias Python
│   └── manage.py
├── frontend/                 # Frontend React 19 + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── App.tsx           # Componente principal interactivo
│   │   └── index.css         # Tailwind styles
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## Puesta en Marcha Local

### 1. Backend (Django)
```bash
cd backend
python -m venv venv
# Activar entorno virtual:
# Windows: .\venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data  # Carga usuario demo y plan de entrenamiento inicial
python manage.py runserver 0.0.0.0:8000
```

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

- **App:** `http://localhost:5173/` (o la IP de tu red local)
- **Swagger Docs:** `http://localhost:8000/api/docs/`
