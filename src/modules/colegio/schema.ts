import { z } from 'zod'

// Esquema para la validación de Colegios
export const colegioSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  rbd: z.string().min(1, 'El RBD es obligatorio'),
  tipo: z.enum(['TP', 'HC'], {
    message: 'Debes seleccionar la modalidad del establecimiento (Técnico Profesional o Científico Humanista)',
  }),
  dependencia: z.string().min(2, 'La dependencia administrativa es obligatoria'),
  comuna: z.string().min(2, 'La comuna es obligatoria'),
  configuracion_ia: z.record(z.string(), z.any()).optional().default({}),
})

export type ColegioInput = z.infer<typeof colegioSchema>

// Esquema para la validación de Cursos
export const cursoSchema = z.object({
  nivel: z.string().min(1, 'El nivel es obligatorio (ej. 2 Medio)'),
  letra: z.string().length(1, 'La letra del curso debe ser un único carácter (ej. A, B)').toUpperCase(),
  ano_academico: z.number().int().min(2020, 'El año académico debe ser válido'),
})

export type CursoInput = z.infer<typeof cursoSchema>

// Esquema para la validación de estudiantes individuales
export const estudianteSchema = z.object({
  rut: z.string().min(1, 'El RUT es obligatorio'),
  nombre: z.string().min(2, 'El nombre es obligatorio'),
  apellido: z.string().min(2, 'El apellido es obligatorio'),
  genero: z.enum(['M', 'F', 'O']).nullable().optional(),
})

export type EstudianteInput = z.infer<typeof estudianteSchema>
