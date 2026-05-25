# Planificación de Sprints y Plazos: miUTP

Este documento detalla el plan de desarrollo ágil sugerido para el MVP de la aplicación **miUTP**, organizado en **5 Sprints** con sus respectivos plazos, estimaciones de tiempo y entregables clave.

---

## Resumen del Cronograma de Desarrollo

| Sprint | Enfoque Principal | Plazo Sugerido | Estimación (Horas) |
|---|---|---|---|
| **Sprint 1** | Base de Datos, Onboarding e Importación SIGE | 1 Semana (5 días hábiles) | ~30 hrs |
| **Sprint 2** | Gestión de Ensayos SIMCE y Pautas de OA | 1 Semana (5 días hábiles) | ~25 hrs |
| **Sprint 3** | Procesamiento de Hojas con Burbujas (IA Visión) | 2 Semanas (10 días hábiles) | ~50 hrs |
| **Sprint 4** | Dashboard Analítico, Matriz de Logros y Exportación | 1.5 Semanas (8 días hábiles) | ~40 hrs |
| **Sprint 5** | Motor Remedial (IA) y Trazabilidad (Langfuse) | 1 Semana (5 días hábiles) | ~25 hrs |
| **Total** | **Desarrollo completo del MVP de miUTP** | **6.5 Semanas** | **~170 hrs** |

---

## Detalle de Sprints

### 🚀 Sprint 1: Infraestructura Base, Onboarding e Importación de Alumnos (SIGE)
* **Objetivo:** Establecer la base del sistema, el flujo de seguridad RLS y el registro de la nómina de estudiantes.
* **Plazo:** 1 Semana (Días 1 a 5).
* **Entregables Clave:**
  - Estructura base de Next.js compilable en modo Standalone.
  - Base de datos local Supabase inicializada con prefijo `miutp_` y RLS configurado.
  - Autenticación segura mediante Google OAuth y tradicional.
  - Vista de Onboarding: Registro del Colegio (RBD, modalidad TP/HC), Cursos y Perfiles.
  - Módulo de subida de nómina SIGE (arrastrar archivo Excel `.xls` / `.xlsx`), procesado por backend e insertado en `miutp_estudiantes` y `miutp_matriculas`.
* **Criterio de Aceptación:** El Jefe de UTP puede loguearse con Google, crear un curso (ej: "2 Medio A") y subir el listado de alumnos desde un archivo Excel, verificando que los alumnos se visualicen en base de datos.

---

### 📝 Sprint 2: Gestión de Ensayos SIMCE y Pautas de OA
* **Objetivo:** Permitir al Jefe de UTP cargar las pruebas y establecer la pauta de corrección asociada a los Objetivos de Aprendizaje (OA) y Habilidades del Mineduc.
* **Plazo:** 1 Semana (Días 6 a 10).
* **Entregables Clave:**
  - Módulo de creación de pruebas: Subida del PDF del Ensayo SIMCE y el archivo de Claves/Pautas (`.docx` / `.pdf`).
  - Integración de **Stirling-PDF API** para procesar los PDFs de las pruebas en el servidor.
  - Pipeline de IA (Gemini API) con validación **Zod** para estructurar la clave de respuestas, correlacionando el número de pregunta con la alternativa correcta, su OA y Habilidad evaluada.
  - Panel de visualización interactivo de la pauta cargada en el frontend.
* **Criterio de Aceptación:** Se sube el archivo de clave de respuestas de Lectura II Medio y el sistema genera automáticamente el listado de 35 preguntas con sus respectivas alternativas correctas, OAs y habilidades mapeadas, guardándolas en `miutp_preguntas`.

---

### 👁️ Sprint 3: Procesamiento de Hojas de Burbujas mediante IA Visión
* **Objetivo:** Desarrollar el núcleo de usabilidad: procesar masivamente hojas de respuestas físicas digitalizadas (PDFs y fotos) e identificar las alternativas de los alumnos mediante inteligencia artificial.
* **Plazo:** 2 Semanas (Días 11 a 20).
* **Entregables Clave:**
  - Zona de arrastre (*drag-and-drop*) para subir scans de hojas físicas (PDF multipágina o fotos PNG/JPEG).
  - Integración de **Stirling-PDF** para segmentar PDFs multipáginas y optimizar el contraste/rotación de las hojas escaneadas.
  - Pipeline de Visión de IA (Gemini 1.5 Flash) que procesa cada hoja de forma asíncrona, lee el RUT o nombre del alumno, identifica las alternativas marcadas (incluyendo omisiones) y las califica automáticamente.
  - Integración con **Supabase Realtime** para notificar al docente el avance hoja por hoja en la interfaz gráfica.
  - Panel de resolución de conflictos en caliente (ej: si un RUT está ilegible o una marca es ambigua).
* **Criterio de Aceptación:** Se sube el PDF `Hojas de Respuesta - 2 Ensayo SIMCE Lectura 2 Medio.pdf` de 30 páginas y el sistema las procesa secuencialmente, registrando los resultados individuales en `miutp_respuestas_estudiantes` en vivo sin bloquear la UI.

---

### 📊 Sprint 4: Dashboard Analítico, Matriz de Logros y Exportación
* **Objetivo:** Proveer visualización estadística premium y herramientas para descargar los reportes de resultados individuales y por curso.
* **Plazo:** 1.5 Semanas (Días 21 a 28).
* **Entregables Clave:**
  - Dashboard principal UTP/Profesor (Bento Grid) con el puntaje proyectado SIMCE y distribución por Niveles de Logro (Adecuado, Elemental, Insuficiente).
  - Matriz de Respuestas Interactiva: Vista térmica (rojo/verde) para detectar de un vistazo las preguntas más falladas del curso.
  - Exportación a Excel (.xlsx) interactivo detallando rendimiento por alumno y por habilidad utilizando `exceljs`.
  - Generación de reportes ejecutivos en PDF (por alumno para apoderados, y por curso para la dirección) delegando el renderizado HTML a la API de **Stirling-PDF**.
* **Criterio de Aceptación:** El docente puede hacer clic en "Exportar a Excel" o "Exportar a PDF" y descargar de inmediato documentos con el formato e identidad visual de la aplicación.

---

### 🧠 Sprint 5: Motor Remedial IA y Trazabilidad (Langfuse)
* **Objetivo:** Habilitar recomendaciones de reforzamiento por IA basadas en los resultados y establecer el monitoreo y trazabilidad de los prompts en producción.
* **Plazo:** 1 Semana (Días 29 a 33).
* **Entregables Clave:**
  - Motor de recomendaciones de IA: Analiza las brechas pedagógicas del curso (OAs más débiles) y sugiere estrategias y actividades de reforzamiento.
  - Generador de Ensayos Focalizados: La IA redacta 5 preguntas SIMCE inéditas para los OA que requieren reforzamiento, exportándolas en un PDF listo para imprimir mediante Stirling-PDF.
  - Integración de telemetría de IA con **Langfuse** utilizando `observeNext` en los Server Actions de `src/modules/ai-agent`.
* **Criterio de Aceptación:** El sistema propone preguntas personalizadas para el 2° Medio A basados en su bajo rendimiento en el "OA 8" y registra con éxito las trazas de estas llamadas en el panel local de Langfuse.
