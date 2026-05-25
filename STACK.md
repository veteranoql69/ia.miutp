# Stack Tecnológico: miUTP

Este documento detalla las tecnologías seleccionadas para el desarrollo y despliegue del proyecto **miUTP**, enfocado en la automatización y analítica del SIMCE en colegios chilenos. Todo el stack está diseñado para ser autohospedado (*on-premise*) a través de contenedores Docker en la misma red **DesaNet** que comparte con Urbamed / Mi-Paciente.

---

## 1. Frontend & Backend API (Node.js)

### [Next.js (v14.2+ App Router / React 18)](https://nextjs.org/)
- **Por qué:** Mantiene total consistencia con el "Golden Stack" de **Mi-Paciente** (el cual usa React 18 y Next.js 14, evitando así la incompatibilidad de librerías como `@dnd-kit/core` o interfaces heredadas con React 19).
- **Configuración de Producción:** Compilado en modo **Standalone** (`output: 'standalone'` en `next.config.js`). Genera una compilación ligera de Node.js pura ideal para el contenedor Docker de producción en la red `DesaNet`.

### [TypeScript](https://www.typescriptlang.org/)
- **Por qué:** Tipado estricto para reducir errores en tiempo de ejecución, facilitar el mantenimiento a largo plazo y asegurar la coherencia de las estructuras de datos que viajan entre la base de datos, la IA y el cliente.

### [Zod](https://zod.dev/)
- **Por qué:** Validación en tiempo de ejecución de esquemas de datos. Se utilizará para sanitizar las entradas de las APIs de subida de archivos y para estructurar y validar los JSON devueltos por los modelos de lenguaje de la IA (Gemini), asegurando que cumplan estrictamente con el esquema esperado antes de guardarse en la BD.

### [Tailwind CSS v4](https://tailwindcss.com/)
- **Por qué:** Permite crear una UI premium y fluida, con soporte nativo de variables de diseño (*CSS Variables*), transiciones fluidas, diseño adaptativo a múltiples resoluciones y compatibilidad excelente con un modo oscuro por defecto.

---

## 2. Base de Datos, Autenticación y Seguridad

### [Supabase (Instancia local en Docker / Portainer)](https://supabase.com/)
- **PostgreSQL:** Base de datos relacional para estructurar las relaciones entre colegios, alumnos, pruebas, objetivos de aprendizaje (OA) e historial de respuestas.
- **Row Level Security (RLS):** Mecanismo clave para aislar la información. Garantiza a nivel de base de datos que un profesor de asignatura solo pueda acceder a los alumnos de sus cursos asignados, y que el Jefe de UTP tenga visibilidad completa del establecimiento, bloqueando filtraciones.
- **Supabase Auth:** Autenticación local integrada con soporte para **Google OAuth** y login tradicional por correo/contraseña.
- **Supabase Storage:** Para almacenar los archivos físicos PDF de ensayos, fotos de hojas de respuestas subidas y reportes exportados de forma segura.
- **Supabase Realtime:** Para notificaciones instantáneas de carga de archivos (e.g. "Procesando hoja 15 de 30", "Análisis finalizado").

---

## 3. Inteligencia Artificial y Visión Computacional

### [Google Gemini 1.5 API (Flash & Pro)](https://ai.google.dev/)
- **Gemini 1.5 Flash:** Modelo optimizado para procesamiento de visión de alta velocidad y bajo costo. Se utilizará para analizar las hojas de respuesta físicas escaneadas, identificar al alumno y extraer la lista de alternativas marcadas (detección de óvalos pintados).
- **Gemini 1.5 Pro:** Modelo avanzado de razonamiento que procesará los textos de comprensión lectora, alineará las preguntas con los estándares del Mineduc, diagnosticará las brechas del curso y generará planes remediales y preguntas SIMCE inéditas de reforzamiento.

---

## 4. Observabilidad y Monitoreo de IA

### [Langfuse (Instancia local en Docker / Portainer)](https://langfuse.com/)
- **Por qué:** Consola de monitoreo de IA. Registra cada llamada a la API de Gemini (prompts del sistema, variables enviadas, outputs devueltos por la IA, tokens consumidos, tiempos de respuesta y latencia). Esto permite depurar el comportamiento de los prompts en tiempo real, evaluar costos de inferencia y hacer seguimiento a las retroalimentaciones del usuario.

---

## 5. Procesamiento de Archivos y Documentación

### [Stirling-PDF (Instancia local en Docker)](https://github.com/Stirling-Tools/Stirling-PDF)
- **Por qué:** Se consumirá su API REST para:
  1. **Preprocesamiento:** Convertir PDFs multipáginas de hojas de respuestas escaneadas en imágenes individuales (JPEG/PNG) de alta definición y optimizar el contraste de las burbujas antes de enviarlas a la IA de visión.
  2. **Renderizado de Reportes:** Generar PDFs finales premium de los informes individuales por alumno e informes de curso a partir de plantillas HTML/CSS pre-diseñadas.

### [ExcelJS](https://github.com/exceljs/exceljs)
- **Por qué:** Biblioteca en Node.js para generar planillas Excel (.xlsx) interactivas con formatos personalizados, colores corporativos y fórmulas estadísticas automáticas para que los docentes exporten los resultados de sus cursos.
