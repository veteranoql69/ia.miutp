# Arquitectura de Monolito Modular (DDD)

Este directorio contiene toda la lógica de negocio y presentación de la aplicación **miUTP**, dividida en módulos de dominio con fronteras claras. La carpeta `src/app` se limita exclusivamente a la declaración de rutas y configuración de Next.js, delegando toda lógica a los módulos correspondientes.

## Módulos y Responsabilidades

- **`colegio/`**:
  - Registro de colegios (`miutp_colegios`), niveles y cursos (`miutp_cursos`).
  - Cuentas de usuarios y carga académica de profesores (`miutp_profesores_cursos`).
  - Importación y matriculación de estudiantes a partir de nóminas SIGE (XLS/XLSX).

- **`evaluacion/`**:
  - Definición y carga de instrumentos de evaluación (SIMCE, ensayos, pautas).
  - Almacenamiento estructurado de preguntas asociadas a los Objetivos de Aprendizaje (OA) del Mineduc y habilidades correspondientes.

- **`procesamiento/`**:
  - Carga masiva de PDFs/imágenes de hojas de respuestas con burbujas.
  - Integración con Stirling-PDF API para limpieza y segmentación.
  - Procesador visual de IA (Gemini API) para detectar marcas de lápiz e identificar a los estudiantes.
  - Notificaciones en tiempo real vía Supabase Realtime durante el flujo de procesamiento.

- **`analitica/`**:
  - Dashboards diferenciados por rol (UTP visibilidad total, Profesores restringido a sus cursos).
  - Matriz de respuestas del curso, análisis de brechas pedagógicas globales y por alumno.
  - Exportaciones de reportes analíticos a Excel (`exceljs`) y PDF (`Stirling-PDF API`).

- **`ai-agent/`**:
  - Asistente de IA para sugerir planes de reforzamiento por curso.
  - Generador automatizado de nuevos instrumentos/ensayos evaluativos focalizados.
  - Integración de observabilidad de IA con Langfuse (`observeNext`).
