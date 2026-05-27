'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

// 1. Obtener el contexto inicial del Dashboard
export async function getDashboardContext(userId: string) {
  try {
    // 1.1 Obtener perfil del usuario (usando maybeSingle para evitar excepciones en caso de que no exista el registro)
    let { data: perfil, error: perfilError } = await supabaseAdmin
      .from('miutp_perfiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    // Si no existe, creamos el perfil dinámicamente
    if (!perfil) {
      const { data: userAuth } = await supabaseAdmin.auth.admin.getUserById(userId)
      const nombre = userAuth?.user?.user_metadata?.nombre || userAuth?.user?.user_metadata?.full_name || userAuth?.user?.email || 'Usuario'
      
      const { data: nuevoPerfil, error: insertError } = await supabaseAdmin
        .from('miutp_perfiles')
        .insert({
          id: userId,
          nombre,
          rol: 'profesor', // Rol inicial por defecto
          colegio_id: null
        })
        .select()
        .single()

      if (insertError || !nuevoPerfil) {
        throw new Error(`No se pudo crear el perfil automático del usuario: ${insertError?.message || perfilError?.message}`)
      }
      perfil = nuevoPerfil
    }

    if (!perfil.colegio_id) {
      return { success: true, onboardingRequired: true }
    }

    // 1.2 Obtener colegio del perfil
    const { data: colegio, error: colError } = await supabaseAdmin
      .from('miutp_colegios')
      .select('*')
      .eq('id', perfil.colegio_id)
      .single()

    if (colError) {
      throw new Error(`Error al obtener datos del colegio: ${colError.message}`)
    }

    // 1.3 Obtener cursos vinculados según el rol
    let cursos: any[] = []

    if (perfil.rol === 'utp' || perfil.rol === 'admin') {
      // Jefe de UTP ve todos los cursos del colegio
      const { data: colCursos, error: curError } = await supabaseAdmin
        .from('miutp_cursos')
        .select('*')
        .eq('colegio_id', perfil.colegio_id)
        .order('nivel', { ascending: true })
        .order('letra', { ascending: true })

      if (curError) throw curError
      cursos = colCursos || []
    } else {
      // Profesor ve solo los cursos que tiene asignados
      const { data: profCursos, error: pcError } = await supabaseAdmin
        .from('miutp_profesores_cursos')
        .select(`
          curso_id,
          asignatura,
          miutp_cursos (
            id,
            colegio_id,
            nivel,
            letra,
            ano_academico
          )
        `)
        .eq('perfil_id', userId)

      if (pcError) throw pcError

      // Aplanar resultados de cursos asignados
      cursos = (profCursos || [])
        .map((pc: any) => ({
          ...pc.miutp_cursos,
          asignatura: pc.asignatura, // Incluir la asignatura asignada
          profesores_cursos_id: pc.id
        }))
        .filter((c: any) => c !== null)
    }

    return {
      success: true,
      onboardingRequired: false,
      profile: perfil,
      colegio,
      cursos
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 2. Obtener los ensayos / pruebas aplicadas a un curso específico
export async function getAppliedTests(cursoId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('miutp_pruebas_aplicadas')
      .select(`
        id,
        prueba_id,
        curso_id,
        fecha_aplicacion,
        estado,
        puntaje_promedio,
        nivel_logro_promedio,
        miutp_pruebas (
          id,
          nombre,
          meta_datos
        )
      `)
      .eq('curso_id', cursoId)
      .order('fecha_aplicacion', { ascending: false })

    if (error) throw error

    return {
      success: true,
      data: (data || []).map((pa: any) => ({
        id: pa.id,
        prueba_id: pa.prueba_id,
        curso_id: pa.curso_id,
        fecha_aplicacion: pa.fecha_aplicacion,
        estado: pa.estado,
        puntaje_promedio: pa.puntaje_promedio,
        nivel_logro_promedio: pa.nivel_logro_promedio,
        nombre: pa.miutp_pruebas?.nombre || 'Ensayo Sin Nombre',
        meta_datos: pa.miutp_pruebas?.meta_datos || {}
      }))
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 3. Obtener estadísticas generales de un ensayo aplicado (KPIs)
export async function getCursoStats(pruebaAplicadaId: string) {
  try {
    // 3.1 Obtener la prueba aplicada
    const { data: pa, error: paError } = await supabaseAdmin
      .from('miutp_pruebas_aplicadas')
      .select('id, curso_id, puntaje_promedio, nivel_logro_promedio')
      .eq('id', pruebaAplicadaId)
      .single()

    if (paError || !pa) throw new Error('No se encontró el ensayo aplicado.')

    // 3.2 Contar total de alumnos matriculados en ese curso
    const { count: totalMatriculas, error: countError } = await supabaseAdmin
      .from('miutp_matriculas')
      .select('*', { count: 'exact', head: true })
      .eq('curso_id', pa.curso_id)
      .eq('activo', true)

    // 3.3 Obtener distribución de niveles de logro individuales
    // Nota: Como no tenemos nivel de logro individual calculado en tabla física (se calcula dinámicamente o por IA),
    // calculamos los niveles en base al % de respuestas correctas por alumno.
    // Escala SIMCE común:
    // - Adecuado: >= 67% correctas
    // - Elemental: >= 33% y < 67% correctas
    // - Insuficiente: < 33% correctas
    
    // Buscar respuestas agrupadas por matrícula
    const { data: respuestas, error: respError } = await supabaseAdmin
      .from('miutp_respuestas_estudiantes')
      .select('matricula_id, es_correcta')
      .eq('prueba_aplicada_id', pruebaAplicadaId)

    if (respError) throw respError

    const alumnosPuntaje: Record<string, { correctas: number; total: number }> = {}
    ;(respuestas || []).forEach((r: any) => {
      if (!alumnosPuntaje[r.matricula_id]) {
        alumnosPuntaje[r.matricula_id] = { correctas: 0, total: 0 }
      }
      alumnosPuntaje[r.matricula_id].total += 1
      if (r.es_correcta) {
        alumnosPuntaje[r.matricula_id].correctas += 1
      }
    })

    let adecuado = 0
    let elemental = 0
    let insuficiente = 0
    let evaluadosCount = 0

    Object.values(alumnosPuntaje).forEach(a => {
      if (a.total === 0) return
      evaluadosCount++
      const pct = (a.correctas / a.total) * 100
      if (pct >= 67) adecuado++
      else if (pct >= 33) elemental++
      else insuficiente++
    })

    // Calcular omitidas (respuestas en blanco)
    const { count: totalOmitidas, error: omitError } = await supabaseAdmin
      .from('miutp_respuestas_estudiantes')
      .select('*', { count: 'exact', head: true })
      .eq('prueba_aplicada_id', pruebaAplicadaId)
      .eq('respuesta_marcada', '')

    return {
      success: true,
      stats: {
        totalAlumnos: totalMatriculas || 0,
        evaluados: evaluadosCount,
        noEvaluados: Math.max(0, (totalMatriculas || 0) - evaluadosCount),
        puntajePromedio: pa.puntaje_promedio || 0,
        nivelLogroPromedio: pa.nivel_logro_promedio || 'Elemental',
        distribucion: {
          adecuado,
          elemental,
          insuficiente
        },
        totalOmitidas: totalOmitidas || 0
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 4. Obtener matriz de respuestas térmicas (Matriz de Logros)
export async function getMatrixData(pruebaAplicadaId: string) {
  try {
    // 4.1 Obtener la prueba aplicada para saber el curso_id y prueba_id
    const { data: pa, error: paError } = await supabaseAdmin
      .from('miutp_pruebas_aplicadas')
      .select('prueba_id, curso_id')
      .eq('id', pruebaAplicadaId)
      .single()

    if (paError || !pa) throw new Error('No se encontró el ensayo aplicado')

    // 4.2 Obtener todas las preguntas del ensayo ordenadas por número
    const { data: preguntas, error: pregError } = await supabaseAdmin
      .from('miutp_preguntas')
      .select(`
        id,
        numero_pregunta,
        tipo,
        alternativa_correcta,
        texto_pregunta,
        oa_id,
        habilidad_id,
        miutp_objetivos_aprendizaje(codigo),
        miutp_habilidades(nombre)
      `)
      .eq('prueba_id', pa.prueba_id)
      .order('numero_pregunta', { ascending: true })

    if (pregError) throw pregError

    // 4.3 Obtener todos los alumnos matriculados y sus perfiles
    const { data: matriculas, error: matError } = await supabaseAdmin
      .from('miutp_matriculas')
      .select(`
        id,
        estudiante_id,
        miutp_estudiantes (
          id,
          nombre,
          apellido,
          rut
        )
      `)
      .eq('curso_id', pa.curso_id)
      .eq('activo', true)

    if (matError) throw matError

    // 4.4 Obtener las respuestas registradas para este ensayo
    const { data: respuestas, error: respError } = await supabaseAdmin
      .from('miutp_respuestas_estudiantes')
      .select('*')
      .eq('prueba_aplicada_id', pruebaAplicadaId)

    if (respError) throw respError

    // Map de respuestas indexado por matricula_id y pregunta_id
    const respuestasMap: Record<string, Record<string, any>> = {}
    ;(respuestas || []).forEach((r: any) => {
      if (!respuestasMap[r.matricula_id]) {
        respuestasMap[r.matricula_id] = {}
      }
      respuestasMap[r.matricula_id][r.pregunta_id] = {
        respuesta_marcada: r.respuesta_marcada,
        es_correcta: r.es_correcta,
        puntaje_obtenido: r.puntaje_obtenido
      }
    })

    // Construir listado de estudiantes con sus respuestas mapeadas
    const estudiantesMatrix = (matriculas || []).map((m: any) => {
      const estudiante = m.miutp_estudiantes
      let correctas = 0
      let total = 0

      const respuestasAlumno = (preguntas || []).map((p: any) => {
        const resp = respuestasMap[m.id]?.[p.id] || {
          respuesta_marcada: '', // Omitida si no hay registro
          es_correcta: false,
          puntaje_obtenido: 0
        }

        if (respuestasMap[m.id]?.[p.id]) {
          total++
          if (resp.es_correcta) correctas++
        }

        return {
          pregunta_id: p.id,
          numero_pregunta: p.numero_pregunta,
          respuesta_marcada: resp.respuesta_marcada,
          es_correcta: resp.es_correcta
        }
      })

      const porcentajeLogro = total > 0 ? Math.round((correctas / total) * 100) : 0

      return {
        matricula_id: m.id,
        estudiante_id: estudiante.id,
        nombre: `${estudiante.nombre} ${estudiante.apellido}`,
        rut: estudiante.rut,
        respuestas: respuestasAlumno,
        correctas,
        total,
        porcentajeLogro
      }
    })

    // Calcular estadísticas por pregunta (logro de la pregunta a nivel curso)
    const preguntasStats = (preguntas || []).map((p: any) => {
      let correctasCount = 0
      let totalCount = 0

      estudiantesMatrix.forEach((e: any) => {
        const resp = e.respuestas.find((r: any) => r.pregunta_id === p.id)
        if (resp && resp.respuesta_marcada !== undefined) {
          totalCount++
          if (resp.es_correcta) correctasCount++
        }
      })

      const porcentajeLogro = totalCount > 0 ? Math.round((correctasCount / totalCount) * 100) : 0

      return {
        id: p.id,
        numero_pregunta: p.numero_pregunta,
        alternativa_correcta: p.alternativa_correcta,
        oa_codigo: p.miutp_objetivos_aprendizaje?.codigo || 'S/N',
        habilidad_nombre: p.miutp_habilidades?.nombre || 'S/H',
        correctas: correctasCount,
        total: totalCount,
        porcentajeLogro
      }
    })

    return {
      success: true,
      preguntas: preguntasStats,
      estudiantes: estudiantesMatrix
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 5. Obtener datos de brechas pedagógicas agrupados por Habilidad y OA
export async function getGapsData(pruebaAplicadaId: string) {
  try {
    // 5.1 Obtener respuestas y las preguntas correspondientes
    const { data: respuestas, error: respError } = await supabaseAdmin
      .from('miutp_respuestas_estudiantes')
      .select(`
        es_correcta,
        pregunta_id,
        miutp_preguntas (
          id,
          oa_id,
          habilidad_id,
          miutp_objetivos_aprendizaje (
            codigo,
            descripcion
          ),
          miutp_habilidades (
            nombre,
            descripcion
          )
        )
      `)
      .eq('prueba_aplicada_id', pruebaAplicadaId)

    if (respError) throw respError

    const oaMap: Record<string, { codigo: string; descripcion: string; correctas: number; total: number }> = {}
    const habMap: Record<string, { nombre: string; descripcion: string; correctas: number; total: number }> = {}

    ;(respuestas || []).forEach((r: any) => {
      const preg = r.miutp_preguntas
      if (!preg) return

      // Agrupar por Objetivo de Aprendizaje (OA)
      if (preg.miutp_objetivos_aprendizaje) {
        const oa = preg.miutp_objetivos_aprendizaje
        if (!oaMap[oa.codigo]) {
          oaMap[oa.codigo] = {
            codigo: oa.codigo,
            descripcion: oa.descripcion,
            correctas: 0,
            total: 0
          }
        }
        oaMap[oa.codigo].total += 1
        if (r.es_correcta) {
          oaMap[oa.codigo].correctas += 1
        }
      }

      // Agrupar por Habilidad
      if (preg.miutp_habilidades) {
        const hab = preg.miutp_habilidades
        if (!habMap[hab.nombre]) {
          habMap[hab.nombre] = {
            nombre: hab.nombre,
            descripcion: hab.descripcion || '',
            correctas: 0,
            total: 0
          }
        }
        habMap[hab.nombre].total += 1
        if (r.es_correcta) {
          habMap[hab.nombre].correctas += 1
        }
      }
    })

    // Convertir mapas a listas ordenadas
    const oas = Object.values(oaMap).map(oa => ({
      ...oa,
      porcentaje: oa.total > 0 ? Math.round((oa.correctas / oa.total) * 100) : 0
    })).sort((a, b) => a.porcentaje - b.porcentaje)

    const habilidades = Object.values(habMap).map(hab => ({
      ...hab,
      porcentaje: hab.total > 0 ? Math.round((hab.correctas / hab.total) * 100) : 0
    })).sort((a, b) => a.porcentaje - b.porcentaje)

    return {
      success: true,
      oas,
      habilidades
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 6. Obtener listado de alumnos matriculados en un curso
export async function getAlumnosCurso(cursoId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('miutp_matriculas')
      .select(`
        id,
        estudiante_id,
        miutp_estudiantes (
          id,
          nombre,
          apellido,
          rut,
          genero
        )
      `)
      .eq('curso_id', cursoId)
      .eq('activo', true)

    if (error) throw error

    return {
      success: true,
      data: (data || []).map((m: any) => ({
        matricula_id: m.id,
        estudiante_id: m.estudiante_id,
        nombre: m.miutp_estudiantes?.nombre,
        apellido: m.miutp_estudiantes?.apellido,
        rut: m.miutp_estudiantes?.rut,
        genero: m.miutp_estudiantes?.genero
      }))
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

