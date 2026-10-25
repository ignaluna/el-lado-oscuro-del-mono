# Registros de la web → una planilla de Google

Cada persona que se anota en la web («AVISAME CUANDO SE ABRAN LAS PUERTAS») queda como una fila en una planilla de
Google de la banda. Es gratis y entran de sobra 10.000 personas. La planilla se puede bajar como Excel cuando quieras.

Se arma una sola vez, con la cuenta de Google de la banda (unos 5 minutos):

## 1. Crear la planilla

1. Entrá a <https://sheets.new> con la cuenta de Google de la banda.
2. Ponele un nombre arriba a la izquierda, por ejemplo «Inscriptos — El Lado Oscuro del Mono».

## 2. Pegar el programa que recibe los registros

1. En la planilla: menú **Extensiones → Apps Script**. Se abre otra pestaña con un editor.
2. Borrá todo lo que aparece y pegá el contenido completo de [`Code.gs`](Code.gs). En GitHub, botón «Copy raw file».
3. Arriba, donde dice «Proyecto sin título», ponele «Registros».
4. Guardá con el ícono del disquete.

## 3. Publicarlo

1. Botón azul **Implementar → Nueva implementación** (en inglés: *Deploy → New deployment*).
2. En el engranaje de «Seleccionar tipo», elegí **Aplicación web** (*Web app*).
3. Completá así:
   - **Descripción:** Registros de la web.
   - **Ejecutar como:** **Yo** (tu email). En inglés, *Execute as: Me*.
   - **Quién tiene acceso:** **Cualquier usuario**. En inglés, *Who has access: Anyone*. Sin esto, la web no puede escribir.
4. **Implementar.** Google pide permiso:
   1. Tocá **Autorizar acceso** y elegí la cuenta de la banda.
   2. Si aparece «Google no verificó esta app», es normal: es tu propio programa. Tocá **Configuración avanzada → Ir a Registros (no seguro) → Permitir**.
   3. El programa solo puede tocar esta planilla.
5. Copiá la **URL de la aplicación web**: termina en `/exec`. Esa dirección es la que va en la web (`LEAD_ENDPOINT`).

Para comprobar que funciona, abrí esa dirección en el navegador. Tiene que mostrar `{"ok":true,"service":"eldom-leads"}`.

## Cómo se ve la planilla

- La hoja **Inscriptos** se crea sola con el primer registro.
- Columnas: Fecha · Nombre · WhatsApp · Email · Instagram · Consentimiento · Versión del consentimiento · Texto del consentimiento · Origen · Idioma · Zona horaria · ID.
- **Origen** dice desde dónde se anotó la persona: `prelaunch:monosdelambiente.netlify.app` es la web real. Si dice `deploy-preview-…`, es una vista previa de prueba.
- Si alguien se anota dos veces con el mismo WhatsApp, email o Instagram, queda una sola fila.
- **No borres ni muevas las columnas C, D y E** (WhatsApp, Email, Instagram): el programa las usa para detectar repetidos. Agregar columnas a la derecha no rompe nada.
- Para bajarla como Excel: **Archivo → Descargar → Microsoft Excel (.xlsx)**.
- Compartila solo con quienes tengan que ver los datos: son datos personales.

## Probar que funciona, con tus datos

1. Abrí <https://monosdelambiente.netlify.app> y tocá **AVISAME CUANDO SE ABRAN LAS PUERTAS**.
2. Completá el formulario con tus datos, aceptá el consentimiento y enviá.
3. La web dice «Tu piso quedó reservado» solo cuando la planilla confirmó el registro. Si dice «Ya estabas en la lista», esos datos ya estaban en la planilla.
4. En la planilla, pestaña **Inscriptos**, aparece una fila nueva con la fecha y la hora. En **Origen** dice `prelaunch:monosdelambiente.netlify.app`.

Si te anotaste antes de que la web estuviera conectada a la planilla, ese registro quedó solo en tu navegador. La web ya no lo tiene en cuenta: te vuelve a mostrar el formulario y, al enviarlo, llega a la planilla.

## Si alguna vez cambia el programa

Pegá el `Code.gs` nuevo y guardá. Después entrá a **Implementar → Administrar implementaciones**, tocá el lápiz y en **Versión** elegí **Nueva versión** → **Implementar**. La dirección `/exec` sigue siendo la misma.

## Para quien mantenga la web

- `Code.gs` revalida todo del lado de Google, porque la dirección es pública:
  - un contacto válido como mínimo y el consentimiento;
  - el campo trampa para bots;
  - los repetidos, bajo un candado;
  - todos los valores como texto: nada se vuelve fórmula y el WhatsApp conserva el «+».
- Apps Script corre hasta 30 registros a la vez; la web reintenta dos veces si la planilla está ocupada.
- Con la planilla conectada, la web siempre envía. Nada guardado en el navegador (por ejemplo, de cuando los registros quedaban solo ahí) frena el envío ni marca a la persona como anotada: los repetidos los decide la planilla.
- Pruebas: `node --test web/tools/leads/Code.test.cjs` (el programa contra una planilla en memoria) y `node web/tools/check.cjs --scenario leads` (la web contra esa misma planilla simulada, incluido alguien que se había anotado solo en su navegador).
- Las pruebas nunca escriben en la planilla real: las direcciones de Google las contesta la planilla simulada. La única excepción escribe una fila a propósito y verifica que la planilla real la reconozca:

  ```bash
  node web/tools/check.cjs --scenario leadslive --url https://monosdelambiente.netlify.app --real-leads --viewport desktop --lead-name "PRUEBA TECNICA - ignorar" --lead-email prueba-tecnica-AAAAMMDD@example.com
  ```
- `node web/tools/preflight.cjs` avisa si `LEAD_ENDPOINT` está vacío. Con `--site`, además comprueba que la planilla responda y que los encabezados del sitio la permitan.
