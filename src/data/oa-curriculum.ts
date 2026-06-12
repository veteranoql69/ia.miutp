// Bases Curriculares Mineduc — OA precargados para niveles SIMCE
// Fuente: BC 1°-6° Básico (2012), BC 7°-8° Básico (2016), BC 1°-2° Medio (2019)

export interface OAItem {
  codigo: string
  descripcion: string
  area: string
}

export interface AsignaturaData {
  label: string
  objetivos: OAItem[]
}

export const OA_CURRICULUM: Record<string, Record<string, AsignaturaData>> = {

  '4-basico': {
    lenguaje: {
      label: 'Lenguaje y Comunicación',
      objetivos: [
        { codigo: 'OA1',  area: 'Lectura',            descripcion: 'Leer en voz alta con fluidez, precisión y expresividad textos variados apropiados al nivel.' },
        { codigo: 'OA2',  area: 'Lectura',            descripcion: 'Comprender textos aplicando estrategias: inferir, visualizar, recapitular, releer.' },
        { codigo: 'OA3',  area: 'Lectura',            descripcion: 'Leer un amplio repertorio de literatura para desarrollar imaginación y vocabulario.' },
        { codigo: 'OA4',  area: 'Lectura',            descripcion: 'Analizar narraciones: tipo de narrador, personajes, ambiente y conflicto.' },
        { codigo: 'OA5',  area: 'Lectura',            descripcion: 'Analizar poemas: lenguaje figurado, versificación y musicalidad.' },
        { codigo: 'OA6',  area: 'Lectura',            descripcion: 'Leer y comprender textos no literarios para obtener información relevante.' },
        { codigo: 'OA7',  area: 'Lectura',            descripcion: 'Evaluar críticamente la información en textos de uso cotidiano.' },
        { codigo: 'OA8',  area: 'Escritura',          descripcion: 'Escribir textos creativos de diversa índole para expresar ideas y emociones.' },
        { codigo: 'OA9',  area: 'Escritura',          descripcion: 'Planificar escritos considerando propósito, destinatario y tema.' },
        { codigo: 'OA10', area: 'Escritura',          descripcion: 'Escribir, revisar y editar textos para transmitir ideas con claridad.' },
        { codigo: 'OA11', area: 'Escritura',          descripcion: 'Incorporar vocabulario nuevo de textos leídos o escuchados en producciones propias.' },
        { codigo: 'OA12', area: 'Escritura',          descripcion: 'Usar conectores que ordenan y dan coherencia al texto.' },
        { codigo: 'OA13', area: 'Escritura',          descripcion: 'Conjugar verbos en modo indicativo y subjuntivo en los tiempos estudiados.' },
        { codigo: 'OA14', area: 'Escritura',          descripcion: 'Reconocer y usar artículos en relación con género y número.' },
        { codigo: 'OA15', area: 'Comunicación Oral',  descripcion: 'Expresarse coherentemente en intervenciones orales organizadas.' },
        { codigo: 'OA16', area: 'Comunicación Oral',  descripcion: 'Interactuar en conversaciones y debates intercambiando opiniones responsablemente.' },
        { codigo: 'OA17', area: 'Comunicación Oral',  descripcion: 'Escuchar activamente para comprender y extraer información relevante.' },
      ],
    },
    matematica: {
      label: 'Matemática',
      objetivos: [
        { codigo: 'OA1',  area: 'Números y Operaciones',    descripcion: 'Contar, leer y escribir números naturales hasta 1.000.000.' },
        { codigo: 'OA2',  area: 'Números y Operaciones',    descripcion: 'Representar y comparar números naturales hasta 1.000.000 usando recta numérica.' },
        { codigo: 'OA3',  area: 'Números y Operaciones',    descripcion: 'Resolver problemas con sumas, restas, multiplicaciones y divisiones de naturales.' },
        { codigo: 'OA4',  area: 'Números y Operaciones',    descripcion: 'Calcular mentalmente sumas, diferencias, productos y cocientes simples.' },
        { codigo: 'OA5',  area: 'Números y Operaciones',    descripcion: 'Realizar sumas y restas con fracciones de igual denominador.' },
        { codigo: 'OA6',  area: 'Números y Operaciones',    descripcion: 'Leer, escribir y representar números decimales hasta centésimos.' },
        { codigo: 'OA7',  area: 'Números y Operaciones',    descripcion: 'Resolver problemas de adición y sustracción de decimales en contexto.' },
        { codigo: 'OA8',  area: 'Patrones y Álgebra',       descripcion: 'Crear y describir patrones numéricos y geométricos.' },
        { codigo: 'OA9',  area: 'Patrones y Álgebra',       descripcion: 'Determinar el valor desconocido en una igualdad simple.' },
        { codigo: 'OA10', area: 'Geometría',                descripcion: 'Clasificar triángulos y cuadriláteros según ángulos y lados.' },
        { codigo: 'OA11', area: 'Geometría',                descripcion: 'Medir ángulos usando transportador y reconocer tipos de ángulos.' },
        { codigo: 'OA12', area: 'Geometría',                descripcion: 'Calcular perímetros de figuras geométricas.' },
        { codigo: 'OA13', area: 'Medición',                 descripcion: 'Medir masas, longitudes y capacidades usando unidades de medida convencionales.' },
        { codigo: 'OA14', area: 'Medición',                 descripcion: 'Resolver problemas de tiempo usando unidades de tiempo convencionales.' },
        { codigo: 'OA15', area: 'Datos y Probabilidades',   descripcion: 'Recolectar y organizar datos para responder preguntas estadísticas.' },
        { codigo: 'OA16', area: 'Datos y Probabilidades',   descripcion: 'Leer e interpretar gráficos de barra, pictogramas y tablas de doble entrada.' },
      ],
    },
  },

  '6-basico': {
    lenguaje: {
      label: 'Lenguaje y Comunicación',
      objetivos: [
        { codigo: 'OA1',  area: 'Lectura',            descripcion: 'Leer en voz alta con fluidez, precisión y expresividad textos variados.' },
        { codigo: 'OA2',  area: 'Lectura',            descripcion: 'Comprender textos aplicando estrategias lectoras avanzadas e integración de conocimientos.' },
        { codigo: 'OA3',  area: 'Lectura',            descripcion: 'Leer habitualmente y relacionar textos con experiencias propias y otros textos.' },
        { codigo: 'OA4',  area: 'Lectura',            descripcion: 'Analizar narraciones: tipo de narrador, focalización y estructura narrativa.' },
        { codigo: 'OA5',  area: 'Lectura',            descripcion: 'Analizar poemas: hablante lírico, temple de ánimo y lenguaje figurado.' },
        { codigo: 'OA6',  area: 'Lectura',            descripcion: 'Leer y comprender textos no literarios: artículos, crónicas y cartas al director.' },
        { codigo: 'OA7',  area: 'Lectura',            descripcion: 'Evaluar confiabilidad y propósito de textos informativos y de opinión.' },
        { codigo: 'OA8',  area: 'Escritura',          descripcion: 'Escribir textos creativos con elementos estéticos y creativos propios.' },
        { codigo: 'OA9',  area: 'Escritura',          descripcion: 'Planificar textos considerando propósito, audiencia y estructura.' },
        { codigo: 'OA10', area: 'Escritura',          descripcion: 'Escribir, revisar y editar textos aplicando criterios de corrección gramatical.' },
        { codigo: 'OA11', area: 'Escritura',          descripcion: 'Emplear vocabulario variado y preciso en sus escritos.' },
        { codigo: 'OA12', area: 'Escritura',          descripcion: 'Usar conectores para dar cohesión y coherencia al texto.' },
        { codigo: 'OA13', area: 'Escritura',          descripcion: 'Aplicar reglas ortográficas en sus escritos con autonomía.' },
        { codigo: 'OA14', area: 'Comunicación Oral',  descripcion: 'Dialogar para explorar y compartir ideas con claridad y fundamento.' },
        { codigo: 'OA15', area: 'Comunicación Oral',  descripcion: 'Presentarse oralmente con claridad, organización y argumentos.' },
        { codigo: 'OA16', area: 'Comunicación Oral',  descripcion: 'Escuchar activamente para identificar información relevante y evaluar mensajes.' },
      ],
    },
    matematica: {
      label: 'Matemática',
      objetivos: [
        { codigo: 'OA1',  area: 'Números y Operaciones',    descripcion: 'Resolver y formular problemas que combinen operaciones con fracciones y decimales.' },
        { codigo: 'OA2',  area: 'Números y Operaciones',    descripcion: 'Leer, escribir y representar números enteros negativos en la recta numérica.' },
        { codigo: 'OA3',  area: 'Números y Operaciones',    descripcion: 'Calcular porcentajes en contextos cotidianos.' },
        { codigo: 'OA4',  area: 'Números y Operaciones',    descripcion: 'Resolver problemas con razones y proporciones.' },
        { codigo: 'OA5',  area: 'Números y Operaciones',    descripcion: 'Calcular potencias cuadradas y cúbicas y raíces cuadradas.' },
        { codigo: 'OA6',  area: 'Números y Operaciones',    descripcion: 'Resolver problemas que combinen operaciones usando jerarquía.' },
        { codigo: 'OA7',  area: 'Álgebra',                  descripcion: 'Crear, describir y continuar secuencias con números enteros y fracciones.' },
        { codigo: 'OA8',  area: 'Álgebra',                  descripcion: 'Representar e interpretar datos en tablas y gráficos estadísticos.' },
        { codigo: 'OA9',  area: 'Geometría',                descripcion: 'Calcular el área de triángulos y cuadriláteros.' },
        { codigo: 'OA10', area: 'Geometría',                descripcion: 'Identificar y clasificar cuerpos geométricos: prismas, pirámides, cilindros, conos.' },
        { codigo: 'OA11', area: 'Geometría',                descripcion: 'Calcular el área de figuras compuestas.' },
        { codigo: 'OA12', area: 'Medición',                 descripcion: 'Resolver problemas de velocidad, distancia y tiempo.' },
        { codigo: 'OA13', area: 'Medición',                 descripcion: 'Calcular perímetro y área en problemas contextualizados.' },
        { codigo: 'OA14', area: 'Datos y Probabilidades',   descripcion: 'Recolectar y organizar datos en tablas de frecuencia y gráficos estadísticos.' },
        { codigo: 'OA15', area: 'Datos y Probabilidades',   descripcion: 'Calcular promedio, moda y rango de conjuntos de datos.' },
        { codigo: 'OA16', area: 'Datos y Probabilidades',   descripcion: 'Calcular la probabilidad de eventos simples.' },
      ],
    },
    ciencias: {
      label: 'Ciencias Naturales',
      objetivos: [
        { codigo: 'OA1',  area: 'Biología',          descripcion: 'Explicar funciones de los sistemas del cuerpo humano y su interrelación.' },
        { codigo: 'OA2',  area: 'Biología',          descripcion: 'Reconocer la importancia de mantener hábitos saludables para el bienestar.' },
        { codigo: 'OA3',  area: 'Biología',          descripcion: 'Clasificar seres vivos usando criterios científicos: reino, filo, clase.' },
        { codigo: 'OA4',  area: 'Biología',          descripcion: 'Explicar el proceso de fotosíntesis y su importancia para los ecosistemas.' },
        { codigo: 'OA5',  area: 'Física',            descripcion: 'Describir propiedades de la materia y sus estados.' },
        { codigo: 'OA6',  area: 'Física',            descripcion: 'Explicar fenómenos físicos de electricidad y magnetismo.' },
        { codigo: 'OA7',  area: 'Química',           descripcion: 'Reconocer la tabla periódica y propiedades de elementos químicos básicos.' },
        { codigo: 'OA8',  area: 'Química',           descripcion: 'Explicar mezclas, soluciones y cambios de estado de la materia.' },
        { codigo: 'OA9',  area: 'Cs. de la Tierra',  descripcion: 'Describir características de los sistemas terrestre, lunar y solar.' },
        { codigo: 'OA10', area: 'Cs. de la Tierra',  descripcion: 'Explicar fenómenos meteorológicos y climáticos.' },
        { codigo: 'OA11', area: 'Habilidades',       descripcion: 'Observar, medir, clasificar, comunicar, inferir y predecir fenómenos naturales.' },
        { codigo: 'OA12', area: 'Habilidades',       descripcion: 'Formular preguntas e hipótesis comprobables con metodología científica.' },
      ],
    },
  },

  '8-basico': {
    lenguaje: {
      label: 'Lenguaje y Comunicación',
      objetivos: [
        { codigo: 'OA1',  area: 'Lectura',            descripcion: 'Leer habitualmente textos literarios y no literarios para aprender y recrearse.' },
        { codigo: 'OA2',  area: 'Lectura',            descripcion: 'Analizar textos literarios considerando su contexto de producción.' },
        { codigo: 'OA3',  area: 'Lectura',            descripcion: 'Analizar narraciones: relación entre estructura narrativa y sentido de la obra.' },
        { codigo: 'OA4',  area: 'Lectura',            descripcion: 'Analizar poemas: recursos literarios y múltiples sentidos del texto.' },
        { codigo: 'OA5',  area: 'Lectura',            descripcion: 'Analizar textos de no ficción: propósito, tesis, argumentos y organización.' },
        { codigo: 'OA6',  area: 'Lectura',            descripcion: 'Leer textos de medios de comunicación para evaluar su contenido y propósito.' },
        { codigo: 'OA7',  area: 'Lectura',            descripcion: 'Evaluar textos leídos según coherencia, cohesión y pertinencia de argumentos.' },
        { codigo: 'OA8',  area: 'Escritura',          descripcion: 'Escribir frecuentemente textos de diversa índole sobre temas de estudio.' },
        { codigo: 'OA9',  area: 'Escritura',          descripcion: 'Planificar textos estableciendo propósito, destinatario, género y estructura.' },
        { codigo: 'OA10', area: 'Escritura',          descripcion: 'Desarrollar escritos con ideas organizadas según criterios de coherencia y cohesión.' },
        { codigo: 'OA11', area: 'Escritura',          descripcion: 'Enriquecer escritos usando vocabulario variado y dominio de la ortografía.' },
        { codigo: 'OA12', area: 'Comunicación Oral',  descripcion: 'Dialogar para construir y desarrollar ideas, posturas y reflexiones.' },
        { codigo: 'OA13', area: 'Comunicación Oral',  descripcion: 'Realizar presentaciones orales con propósito claro y argumentos sólidos.' },
        { codigo: 'OA14', area: 'Comunicación Oral',  descripcion: 'Escuchar activamente y comprender textos orales de diversa índole.' },
      ],
    },
    matematica: {
      label: 'Matemática',
      objetivos: [
        { codigo: 'OA1',  area: 'Números y Álgebra',        descripcion: 'Resolver problemas de multiplicación y división de fracciones y decimales.' },
        { codigo: 'OA2',  area: 'Números y Álgebra',        descripcion: 'Representar e interpretar números racionales en la recta numérica.' },
        { codigo: 'OA3',  area: 'Números y Álgebra',        descripcion: 'Resolver ecuaciones de primer grado con una incógnita.' },
        { codigo: 'OA4',  area: 'Números y Álgebra',        descripcion: 'Trabajar con proporciones directas e inversas en contextos matemáticos.' },
        { codigo: 'OA5',  area: 'Números y Álgebra',        descripcion: 'Calcular porcentajes e intereses simples en problemas de contexto.' },
        { codigo: 'OA6',  area: 'Patrones y Álgebra',       descripcion: 'Representar e interpretar relaciones de proporcionalidad en tablas y gráficos.' },
        { codigo: 'OA7',  area: 'Patrones y Álgebra',       descripcion: 'Resolver problemas usando expresiones algebraicas.' },
        { codigo: 'OA8',  area: 'Geometría',                descripcion: 'Calcular el área y el perímetro de figuras geométricas planas.' },
        { codigo: 'OA9',  area: 'Geometría',                descripcion: 'Calcular el volumen de prismas y cilindros.' },
        { codigo: 'OA10', area: 'Geometría',                descripcion: 'Identificar y describir transformaciones en el plano: traslación, reflexión, rotación.' },
        { codigo: 'OA11', area: 'Datos y Probabilidades',   descripcion: 'Organizar datos en tablas de frecuencia y calcular medidas de tendencia central.' },
        { codigo: 'OA12', area: 'Datos y Probabilidades',   descripcion: 'Representar datos en gráficos estadísticos e interpretar la información.' },
        { codigo: 'OA13', area: 'Datos y Probabilidades',   descripcion: 'Calcular la probabilidad de eventos simples y compuestos.' },
      ],
    },
    ciencias: {
      label: 'Ciencias Naturales',
      objetivos: [
        { codigo: 'OA1',  area: 'Biología',   descripcion: 'Explicar la estructura y función de los sistemas nervioso y endocrino.' },
        { codigo: 'OA2',  area: 'Biología',   descripcion: 'Describir los procesos de herencia genética y variabilidad biológica.' },
        { codigo: 'OA3',  area: 'Biología',   descripcion: 'Analizar el proceso de evolución y la selección natural.' },
        { codigo: 'OA4',  area: 'Biología',   descripcion: 'Caracterizar los ecosistemas y los ciclos biogeoquímicos.' },
        { codigo: 'OA5',  area: 'Física',     descripcion: 'Describir el movimiento usando posición, velocidad y aceleración.' },
        { codigo: 'OA6',  area: 'Física',     descripcion: 'Aplicar las leyes de Newton para explicar fenómenos de movimiento.' },
        { codigo: 'OA7',  area: 'Física',     descripcion: 'Describir fenómenos de presión en fluidos y sus aplicaciones.' },
        { codigo: 'OA8',  area: 'Química',    descripcion: 'Explicar la estructura del átomo y los enlaces químicos básicos.' },
        { codigo: 'OA9',  area: 'Química',    descripcion: 'Describir reacciones químicas simples con reactivos y productos.' },
        { codigo: 'OA10', area: 'Química',    descripcion: 'Reconocer el impacto de las reacciones químicas en el medioambiente.' },
      ],
    },
    historia: {
      label: 'Historia, Geografía y Cs. Sociales',
      objetivos: [
        { codigo: 'OA1',  area: 'Historia Universal',      descripcion: 'Analizar el proceso de transición del mundo antiguo al medieval.' },
        { codigo: 'OA2',  area: 'Historia Universal',      descripcion: 'Describir aspectos principales del mundo medieval: feudalismo e Iglesia.' },
        { codigo: 'OA3',  area: 'Historia Universal',      descripcion: 'Explicar la formación del mundo moderno: Renacimiento, Reforma e Ilustración.' },
        { codigo: 'OA4',  area: 'Historia de Chile',       descripcion: 'Analizar el proceso de independencia de Chile y Latinoamérica.' },
        { codigo: 'OA5',  area: 'Historia de Chile',       descripcion: 'Caracterizar la organización del Estado chileno en el siglo XIX.' },
        { codigo: 'OA6',  area: 'Geografía',               descripcion: 'Describir la distribución de la población mundial y procesos migratorios.' },
        { codigo: 'OA7',  area: 'Geografía',               descripcion: 'Analizar los principales desafíos medioambientales del mundo contemporáneo.' },
        { codigo: 'OA8',  area: 'Formación Ciudadana',     descripcion: 'Analizar conceptos de ciudadanía, derechos y deberes en democracia.' },
        { codigo: 'OA9',  area: 'Formación Ciudadana',     descripcion: 'Explicar el funcionamiento de las instituciones del Estado democrático.' },
      ],
    },
  },

  '2-medio': {
    lenguaje: {
      label: 'Lenguaje y Comunicación',
      objetivos: [
        { codigo: 'OA1',  area: 'Lectura',            descripcion: 'Leer habitualmente textos literarios y no literarios para ampliar conocimientos.' },
        { codigo: 'OA2',  area: 'Lectura',            descripcion: 'Analizar textos literarios como producto de las sociedades que los generan.' },
        { codigo: 'OA3',  area: 'Lectura',            descripcion: 'Analizar cuentos y novelas relacionando la obra con su contexto histórico.' },
        { codigo: 'OA4',  area: 'Lectura',            descripcion: 'Analizar obras de teatro en sus dimensiones literaria y espectacular.' },
        { codigo: 'OA5',  area: 'Lectura',            descripcion: 'Analizar poemas considerando recursos expresivos y contexto histórico.' },
        { codigo: 'OA6',  area: 'Lectura',            descripcion: 'Evaluar textos de no ficción: propósito, audiencia y calidad de argumentos.' },
        { codigo: 'OA7',  area: 'Escritura',          descripcion: 'Escribir textos variados coherentes con el propósito comunicativo.' },
        { codigo: 'OA8',  area: 'Escritura',          descripcion: 'Desarrollar argumentos con evidencias pertinentes y bien articuladas.' },
        { codigo: 'OA9',  area: 'Escritura',          descripcion: 'Revisar y editar textos para lograr precisión y eficacia comunicativa.' },
        { codigo: 'OA10', area: 'Comunicación Oral',  descripcion: 'Dialogar constructivamente para explorar y desarrollar ideas con otros.' },
        { codigo: 'OA11', area: 'Comunicación Oral',  descripcion: 'Presentar oralmente temas con argumentos, evidencias y uso adecuado del lenguaje.' },
      ],
    },
    matematica: {
      label: 'Matemática',
      objetivos: [
        { codigo: 'OA1',  area: 'Álgebra y Funciones',      descripcion: 'Resolver ecuaciones e inecuaciones de primer grado en contextos variados.' },
        { codigo: 'OA2',  area: 'Álgebra y Funciones',      descripcion: 'Trabajar con sistemas de ecuaciones de primer grado con dos incógnitas.' },
        { codigo: 'OA3',  area: 'Álgebra y Funciones',      descripcion: 'Representar e interpretar funciones lineales y cuadráticas.' },
        { codigo: 'OA4',  area: 'Álgebra y Funciones',      descripcion: 'Aplicar funciones lineales en contextos de proporcionalidad directa.' },
        { codigo: 'OA5',  area: 'Geometría',                descripcion: 'Aplicar el Teorema de Pitágoras en la resolución de problemas.' },
        { codigo: 'OA6',  area: 'Geometría',                descripcion: 'Calcular razones trigonométricas en triángulos rectángulos.' },
        { codigo: 'OA7',  area: 'Geometría',                descripcion: 'Calcular áreas y volúmenes de figuras y cuerpos geométricos.' },
        { codigo: 'OA8',  area: 'Probabilidad y Estadística', descripcion: 'Calcular medidas de dispersión: varianza y desviación estándar.' },
        { codigo: 'OA9',  area: 'Probabilidad y Estadística', descripcion: 'Interpretar e inferir información a partir de representaciones estadísticas.' },
        { codigo: 'OA10', area: 'Probabilidad y Estadística', descripcion: 'Calcular probabilidad de eventos usando reglas de adición y multiplicación.' },
      ],
    },
  },
}

export function getAsignaturas(nivel: string): { key: string; label: string }[] {
  return Object.entries(OA_CURRICULUM[nivel] ?? {}).map(([key, val]) => ({
    key,
    label: val.label,
  }))
}

export function getOA(nivel: string, asignatura: string): OAItem[] {
  return OA_CURRICULUM[nivel]?.[asignatura]?.objetivos ?? []
}

export function getAsignaturaLabel(nivel: string, asignatura: string): string {
  return OA_CURRICULUM[nivel]?.[asignatura]?.label ?? asignatura
}

export function buildOaResult(nivel: string, asignatura: string, codigosFiltrados?: string[]) {
  const allOA = getOA(nivel, asignatura)
  const objetivos = codigosFiltrados
    ? allOA.filter(o => codigosFiltrados.includes(o.codigo))
    : allOA
  return {
    asignatura: getAsignaturaLabel(nivel, asignatura),
    objetivos: objetivos.map(o => ({ codigo: o.codigo, descripcion: o.descripcion })),
  }
}
