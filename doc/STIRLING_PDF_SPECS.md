# Especificaciones Técnicas — Generación de PDFs con Stirling PDF

Instancia: `https://sdipdf.sditecnologia.cl`

---

## Variables de Entorno

```env
STIRLING_PDF_URL=https://sdipdf.sditecnologia.cl
STIRLING_PDF_API_KEY=<api_key>
```

Autenticación: header `X-API-KEY: <api_key>` en cada request.

---

## Pipeline A4 — 2 pasos

```
1. POST /api/v1/convert/html/pdf   →  PDF A4 base (sin logo)
2. POST /api/v1/misc/add-image     →  PDF A4 final (logo superpuesto)
```

### Paso 1 — HTML a PDF

```js
const formData = new FormData();
formData.append('fileInput', new Blob([htmlString], { type: 'text/html' }), 'document.html');
formData.append('zoom', '1');

const response = await fetch(`${STIRLING_PDF_URL}/api/v1/convert/html/pdf`, {
  method: 'POST',
  headers: { 'X-API-KEY': API_KEY },
  body: formData
});

const pdfBuffer = await response.arrayBuffer();
```

### Paso 2 — Superponer logo (A4)

```js
const logoBuffer = fs.readFileSync('clinic_logo_small.png'); // PNG 55×55px

const formData = new FormData();
formData.append('fileInput', new Blob([pdfBuffer]), 'base.pdf');
formData.append('imageFile', new Blob([logoBuffer]), 'logo.png');
formData.append('x', '57');      // puntos PDF desde borde izquierdo de la página
formData.append('y', '744');     // puntos PDF desde borde inferior de la página
formData.append('everyPage', 'false');

const response = await fetch(`${STIRLING_PDF_URL}/api/v1/misc/add-image`, {
  method: 'POST',
  headers: { 'X-API-KEY': API_KEY },
  body: formData
});

const finalPdf = await response.arrayBuffer();
```

---

## Pipeline A5 — 3 pasos

WeasyPrint **siempre genera páginas A4** independiente del CSS `@page { size: A5 }` (el parámetro es ignorado por el renderer). Para obtener A5 real se usa un paso adicional de escalado.

```
1. POST /api/v1/convert/html/pdf      →  PDF A4 base (sin logo)
2. POST /api/v1/misc/add-image        →  PDF A4 con logo (coords A4)
3. POST /api/v1/general/scale-pages   →  PDF A5 final (contenido escalado al 70.7%)
```

**Paso 3 — Escalar A4 → A5:**

```js
const formData = new FormData();
formData.append('fileInput', new Blob([a4WithLogoPdf]), 'with_logo.pdf');
formData.append('pageSize', 'A5');
formData.append('orientation', 'PORTRAIT');
formData.append('scaleFactor', '1');

const response = await fetch(`${STIRLING_PDF_URL}/api/v1/general/scale-pages`, {
  method: 'POST',
  headers: { 'X-API-KEY': API_KEY },
  body: formData
});

const a5Pdf = await response.arrayBuffer();
```

**Parámetros de `scale-pages`:**

| Parámetro | Valores | Notas |
|---|---|---|
| `pageSize` | A0–A6, LETTER, LEGAL, KEEP | Tamaño objetivo |
| `orientation` | PORTRAIT, LANDSCAPE | Ignorado si `pageSize=KEEP` |
| `scaleFactor` | float (ej. `1`) | Multiplicador adicional sobre el escalado automático |

**Coordenadas del logo en el pipeline A5:**
Usar las mismas coordenadas A4 (`x=57, y=744`) en el paso 2. El escalado del paso 3 reposiciona el logo correctamente junto con todo el contenido.

> **Nota:** El contenido se escala al ~70.7% (A4→A5 = 1/√2). Los tamaños de fuente se reducen en la misma proporción. Si se necesitan fuentes más grandes en A5, aumentar los tamaños base en el HTML antes del renderizado.

---

## Sistema de coordenadas — `add-image`

La API usa el sistema de coordenadas **PDF estándar**:
- Origen `(0, 0)` en la esquina **inferior izquierda** de la página física
- Unidades: **puntos PDF** (1 pt = 1/72 pulgada)
- A4: 595 × 842 pt

Para un logo en la **esquina superior izquierda** del área de contenido:

```
x = 57   →  margen izquierdo 20mm  (20mm × 72/25.4 ≈ 56.7 pt ≈ 57)
y = 744  →  842 - margen_top(43pt) - alto_logo(55pt) = 744
```

Cálculo de `y` para cualquier logo:
```
y = 842 - (margen_top_mm × 72 / 25.4) - alto_logo_pt
```

Con márgenes `@page { margin: 15mm 20mm 20mm 20mm }`:
- margen superior = 15mm = 42.5 pt ≈ 43 pt
- margen izquierdo = 20mm = 56.7 pt ≈ 57 pt

---

## Preparación del logo

El logo debe pre-procesarse a **55×55 px** antes de enviarlo al overlay.

Script Python (`resize_logo_55.py`):

```python
from PIL import Image

img = Image.open('clinic_logo.png')
img_resized = img.resize((55, 55), Image.Resampling.LANCZOS)
img_resized.save('clinic_logo_small.png', 'PNG')
```

Ejecutar antes de generar PDFs si el logo fuente cambia:
```bash
python resize_logo_55.py
```

---

## Restricciones críticas del renderer

El renderer de Stirling **NO soporta** las siguientes técnicas — no las uses:

| Técnica | Estado | Motivo |
|---|---|---|
| `<img src="data:image/png;base64,...">` | ❌ No renderiza | Renderer bloquea data URIs en `<img>` |
| `background-image: url('data:...')` | ❌ No renderiza | Renderer suprime backgrounds con data URIs |
| `position: absolute` + `z-index` para logo | ❌ No renderiza | Elemento ignorado |
| `display: flex` + `justify-content: space-between` | ⚠️ Parcial | El hijo no se expande al lado derecho |
| `flex: 1` en hijo de flex container | ⚠️ Poco confiable | No siempre ocupa el espacio disponible |
| CSS externo / `@import` de Google Fonts | ⚠️ Opcional | Requiere acceso a internet desde el servidor |

**En su lugar, usar:**
- `<table width="100%">` para layouts de dos columnas (logo izquierda / info derecha)
- Estilos **inline** para propiedades críticas de layout (`text-align`, `vertical-align`, `width`)
- La imagen del logo SOLO vía el endpoint `add-image` (Paso 2 del pipeline)

---

## Estructura HTML del header

El header tiene **dos filas**:
1. Fila superior: celda vacía (espacio para logo overlay) + info de la clínica (derecha)
2. Fila inferior: nombre de la clínica + slogan

```html
<div class="header">
  <!-- Fila 1: layout con tabla para garantizar renderizado correcto -->
  <table style="width:100%; border:none; border-collapse:collapse;">
    <tr>
      <!-- Celda izquierda: espacio reservado para el logo overlay (55×55px + margen) -->
      <td style="width:70px; height:55px; padding:0; border:none;"></td>
      <!-- Celda derecha: info de clínica, alineada a la derecha con estilos inline -->
      <td style="padding:0; border:none; text-align:right; vertical-align:middle;
                 font-size:8pt; color:#64748b; line-height:1.3;">
        <strong>Nombre Clínica S.A.</strong><br>
        Dirección<br>
        Ciudad, País<br>
        Fono: +56 X XXXX XXXX<br>
        email@clinica.cl
      </td>
    </tr>
  </table>
  <!-- Fila 2: nombre visible de la clínica, DEBAJO del logo para evitar solapamiento -->
  <div style="margin-top: 3mm;">
    <h2 style="font-size:14pt; font-weight:700; color:#1e3a8a; margin:0;">
      Nombre del Centro Médico
    </h2>
    <span style="font-size:8pt; color:#64748b;">Slogan</span>
  </div>
</div>
```

> **Por qué tabla y no flexbox:** El renderer ignora `flex: 1` para expansión lateral. Las tablas con `width:100%` y `width` en celdas son el único método confiable para layout de dos columnas.

> **Por qué el nombre va debajo del logo:** El overlay `add-image` siempre se renderiza encima del contenido PDF. Si el nombre estuviera en la misma fila horizontal que el logo, el overlay lo taparía. Colocándolo en la fila inferior se evita cualquier solapamiento.

---

## CSS compartido

Márgenes (usar exactamente estos valores para que las coordenadas del logo sean correctas):

```css
@page {
  size: A4;                      /* A4 siempre — el renderer ignora A5 */
  margin: 15mm 20mm 20mm 20mm;  /* top right bottom left */
}
```

> **Importante:** Siempre usar `size: A4` en el CSS. El tamaño A5 se obtiene mediante el endpoint `scale-pages` en el paso 3, no mediante CSS. Si se pone `size: A5`, el renderer lo ignora y la página queda A4 con las mismas dimensiones internas.

Si cambias los márgenes, debes recalcular `x` e `y` del overlay.

---

## Clases CSS disponibles

| Clase | Uso |
|---|---|
| `.header` | Contenedor del header, `display: block` |
| `.clinic-name` | Nombre del centro, 14pt bold azul |
| `.document-title` | Título del documento, 16pt centrado mayúsculas |
| `.metadata-grid` | Grid 2 columnas para datos del paciente |
| `.metadata-label` / `.metadata-value` | Etiqueta y valor dentro del grid |
| `.content-section` | Sección principal del cuerpo |
| `.section-title` | Título de sección, 11pt azul con borde inferior |
| `.recipe-item` | Item de receta con borde izquierdo azul |
| `.data-table` | Tabla de datos con estilos |
| `.footer-signature` | Pie de firma (flex: left disclaimer + right signature) |
| `.footer-disclaimer` | Texto legal inferior centrado |

---

## Tipos de documentos implementados

| Template | Endpoint de salida | Descripción |
|---|---|---|
| `receta` | `receta_medica.pdf` | Receta médica con prescripciones |
| `procedimiento` | `registro_procedimiento.pdf` | Registro de procedimiento clínico |
| `orden_examen` | `orden_examen.pdf` | Orden de exámenes con tabla |

Todos comparten el mismo header, CSS y pipeline de 2 pasos.

---

## Checklist para adaptar a la app

- [ ] Leer `STIRLING_PDF_URL` y `STIRLING_PDF_API_KEY` desde variables de entorno
- [ ] Cargar `clinic_logo_small.png` como `Buffer` al iniciar el módulo
- [ ] Asegurarse de que `clinic_logo_small.png` existe (ejecutar `resize_logo_55.py` si cambió el logo fuente)
- [ ] Paso 1: enviar HTML como `Blob` con `type: 'text/html'`
- [ ] Paso 2: enviar PDF del paso 1 + logo Buffer con coordenadas `x=57, y=744`
- [ ] Usar `<table>` para layouts de dos columnas en el HTML — **no flexbox**
- [ ] Usar **estilos inline** para propiedades de layout críticas
- [ ] NO usar `data:` URIs para imágenes en el HTML
- [ ] El nombre de la clínica debe ir en una fila **debajo** del área del logo
- [ ] Si cambian los márgenes `@page`, recalcular `x` e `y` del overlay
