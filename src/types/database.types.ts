export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      miutp_colegios: {
        Row: {
          id: string
          nombre: string
          rbd: string
          tipo: 'TP' | 'HC'
          dependencia: string | null
          comuna: string | null
          configuracion_ia: Json
          creado_en: string
          actualizado_en: string
        }
        Insert: {
          id?: string
          nombre: string
          rbd: string
          tipo: 'TP' | 'HC'
          dependencia?: string | null
          comuna?: string | null
          configuracion_ia?: Json
          creado_en?: string
          actualizado_en?: string
        }
        Update: {
          id?: string
          nombre?: string
          rbd?: string
          tipo?: 'TP' | 'HC'
          dependencia?: string | null
          comuna?: string | null
          configuracion_ia?: Json
          creado_en?: string
          actualizado_en?: string
        }
      }
      miutp_perfiles: {
        Row: {
          id: string
          nombre: string
          rol: 'admin' | 'utp' | 'profesor'
          colegio_id: string | null
          creado_en: string
          actualizado_en: string
        }
        Insert: {
          id: string
          nombre: string
          rol: 'admin' | 'utp' | 'profesor'
          colegio_id?: string | null
          creado_en?: string
          actualizado_en?: string
        }
        Update: {
          id?: string
          nombre?: string
          rol?: 'admin' | 'utp' | 'profesor'
          colegio_id?: string | null
          creado_en?: string
          actualizado_en?: string
        }
      }
      miutp_cursos: {
        Row: {
          id: string
          colegio_id: string
          nivel: string
          letra: string
          ano_academico: number
          creado_en: string
        }
        Insert: {
          id?: string
          colegio_id: string
          nivel: string
          letra: string
          ano_academico: number
          creado_en?: string
        }
        Update: {
          id?: string
          colegio_id?: string
          nivel?: string
          letra?: string
          ano_academico?: number
          creado_en?: string
        }
      }
      miutp_estudiantes: {
        Row: {
          id: string
          rut: string
          nombre: string
          apellido: string
          genero: 'M' | 'F' | 'O' | null
          creado_en: string
        }
        Insert: {
          id?: string
          rut: string
          nombre: string
          apellido: string
          genero?: 'M' | 'F' | 'O' | null
          creado_en?: string
        }
        Update: {
          id?: string
          rut?: string
          nombre?: string
          apellido?: string
          genero?: 'M' | 'F' | 'O' | null
          creado_en?: string
        }
      }
      miutp_matriculas: {
        Row: {
          id: string
          estudiante_id: string
          author_id: string | null
          curso_id: string
          ano_academico: number
          activo: boolean
          creado_en: string
        }
        Insert: {
          id?: string
          estudiante_id: string
          curso_id: string
          ano_academico: number
          activo?: boolean
          creado_en?: string
        }
        Update: {
          id?: string
          estudiante_id?: string
          curso_id?: string
          ano_academico?: number
          activo?: boolean
          creado_en?: string
        }
      }
      miutp_profesores_cursos: {
        Row: {
          id: string
          perfil_id: string
          curso_id: string
          asignatura: string
          creado_en: string
        }
        Insert: {
          id?: string
          perfil_id: string
          curso_id: string
          asignatura: string
          creado_en?: string
        }
        Update: {
          id?: string
          perfil_id?: string
          curso_id?: string
          asignatura?: string
          creado_en?: string
        }
      }
      miutp_pruebas: {
        Row: {
          id: string
          nombre: string
          asignado_por: string | null
          fecha_creacion: string
          meta_datos: Json
        }
        Insert: {
          id?: string
          nombre: string
          asignado_por?: string | null
          fecha_creacion?: string
          meta_datos?: Json
        }
        Update: {
          id?: string
          nombre?: string
          asignado_por?: string | null
          fecha_creacion?: string
          meta_datos?: Json
        }
      }
      miutp_preguntas: {
        Row: {
          id: string
          prueba_id: string
          numero_pregunta: number
          tipo: 'alternativa' | 'desarrollo'
          alternativa_correcta: 'A' | 'B' | 'C' | 'D' | 'E' | null
          oa_id: string | null
          habilidad_id: string | null
          texto_pregunta: string | null
          puntaje: number
          creado_en: string
        }
        Insert: {
          id?: string
          prueba_id: string
          numero_pregunta: number
          tipo: 'alternativa' | 'desarrollo'
          alternativa_correcta?: 'A' | 'B' | 'C' | 'D' | 'E' | null
          oa_id?: string | null
          habilidad_id?: string | null
          texto_pregunta?: string | null
          puntaje?: number
          creado_en?: string
        }
        Update: {
          id?: string
          prueba_id?: string
          numero_pregunta?: number
          tipo?: 'alternativa' | 'desarrollo'
          alternativa_correcta?: 'A' | 'B' | 'C' | 'D' | 'E' | null
          oa_id?: string | null
          habilidad_id?: string | null
          texto_pregunta?: string | null
          puntaje?: number
          creado_en?: string
        }
      }
      miutp_pruebas_aplicadas: {
        Row: {
          id: string
          prueba_id: string
          curso_id: string
          fecha_aplicacion: string
          estado: 'creada' | 'procesando' | 'finalizada'
          puntaje_promedio: number | null
          nivel_logro_promedio: 'Adecuado' | 'Elemental' | 'Insuficiente' | null
          creado_en: string
        }
        Insert: {
          id?: string
          prueba_id: string
          curso_id: string
          fecha_aplicacion?: string
          estado?: 'creada' | 'procesando' | 'finalizada'
          puntaje_promedio?: number | null
          nivel_logro_promedio?: 'Adecuado' | 'Elemental' | 'Insuficiente' | null
          creado_en?: string
        }
        Update: {
          id?: string
          prueba_id?: string
          curso_id?: string
          fecha_aplicacion?: string
          estado?: 'creada' | 'procesando' | 'finalizada'
          puntaje_promedio?: number | null
          nivel_logro_promedio?: 'Adecuado' | 'Elemental' | 'Insuficiente' | null
          creado_en?: string
        }
      }
      miutp_respuestas_estudiantes: {
        Row: {
          id: string
          prueba_aplicada_id: string
          matricula_id: string
          pregunta_id: string
          respuesta_marcada: 'A' | 'B' | 'C' | 'D' | 'E' | ''
          es_correcta: boolean
          puntaje_obtenido: number
          creado_en: string
        }
        Insert: {
          id?: string
          prueba_aplicada_id: string
          matricula_id: string
          pregunta_id: string
          respuesta_marcada: 'A' | 'B' | 'C' | 'D' | 'E' | ''
          es_correcta: boolean
          puntaje_obtenido?: number
          creado_en?: string
        }
        Update: {
          id?: string
          prueba_aplicada_id?: string
          matricula_id?: string
          pregunta_id?: string
          respuesta_marcada?: 'A' | 'B' | 'C' | 'D' | 'E' | ''
          es_correcta?: boolean
          puntaje_obtenido?: number
          creado_en?: string
        }
      }
      miutp_recomendaciones_ia: {
        Row: {
          id: string
          prueba_aplicada_id: string
          curso_id: string
          estudiante_id: string | null
          tipo: 'reforzamiento' | 'propuesta_pregunta'
          contenido: Json
          creado_en: string
        }
        Insert: {
          id?: string
          prueba_aplicada_id: string
          curso_id: string
          estudiante_id?: string | null
          tipo: 'reforzamiento' | 'propuesta_pregunta'
          contenido: Json
          creado_en?: string
        }
        Update: {
          id?: string
          prueba_aplicada_id?: string
          curso_id?: string
          estudiante_id?: string | null
          tipo?: 'reforzamiento' | 'propuesta_pregunta'
          contenido?: Json
          creado_en?: string
        }
      }
    }
  }
}
export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
      ? PublicTableNameOrOptions
      : never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never
