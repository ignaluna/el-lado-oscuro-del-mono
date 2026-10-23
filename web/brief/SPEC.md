# SPEC — user's original request (verbatim, Spanish). Source of truth for WHAT.
# DESIGN.md (same folder) is the source of truth for HOW and overrides only where
# the hosting platform makes a requirement impossible (see DESIGN §1).

Construí un Artifact interactivo completo para la web de lanzamiento de “El Lado Oscuro del Mono”, de Monos del Ambiente.
Quiero un prototipo visual ejecutable, no una explicación, un wireframe ni solamente código. Debe representar toda la experiencia desde la etapa previa al lanzamiento hasta la navegación musical posterior.

Enlaces musicales reales para el prototipo
YouTube, álbum completo “Pequeño Primate”: https://www.youtube.com/watch?v=doxiX5RHT7Q  (Video ID: doxiX5RHT7Q)
Spotify, álbum “Pequeño Primate”: https://open.spotify.com/intl-es/album/0p8WjCX93rdndct41myh0x  (Spotify album ID: 0p8WjCX93rdndct41myh0x)
Usá estos enlaces reales para probar ambas integraciones. “Pequeño Primate” funciona como contenido de demostración y como disco para escuchar mientras se espera el nuevo lanzamiento.
La arquitectura debe permitir reemplazar después estos enlaces por las canciones individuales de “El Lado Oscuro del Mono” sin reconstruir la experiencia.

## Concepto
El ascensor es un elevador de conciencia. Cada piso representa una canción y lleva al usuario a un lugar diferente de su mente.
Toda la experiencia sucede en primera persona, como un videojuego contemplativo. El usuario puede mirar, moverse ligeramente, acercarse al ascensor, entrar, elegir una plataforma musical, presionar un piso, viajar y descender en un escenario asociado a una canción.
No quiero realismo fotorrealista. Usá una estética 2.5D artística, oscura y realizable:
- portada de disco animada;
- ilustración editorial;
- formas tridimensionales simples;
- capas 2D con profundidad;
- sombras gráficas;
- grano e imperfecciones analógicas;
- tinta, desgaste y texturas;
- negro, carbón, gris metálico y marfil;
- pequeños destellos prismáticos;
- movimientos lentos e hipnóticos;
- composición musical y cinematográfica.
El resultado debe sentirse como una obra digital y no como una demo técnica de Three.js.

## Un mismo mundo
Los estados previo y posterior al lanzamiento deben ocurrir en el mismo espacio.
El mundo consiste en:
- vacío negro infinito;
- agua oscura y casi inmóvil;
- reflejo incompleto del ascensor;
- niebla o profundidad apenas perceptible;
- ascensor cerrado emergiendo de la oscuridad;
- ausencia de cielo, luna, estrellas, edificios y horizonte;
- luz mínima que permita leer los volúmenes.
La transición del contador al ascensor abierto debe sentirse como la continuación de una misma experiencia, sin cambiar a una página diferente.

## Estado 1: antes del lanzamiento
Definí una constante configurable:
    const RELEASE_AT = "2026-12-01T21:00:00-03:00";
La fecha es temporal y debe ser fácil de reemplazar.
Antes de esa fecha:
1. El ascensor permanece cerrado al fondo.
2. El usuario aparece dentro del vacío negro.
3. Puede mover ligeramente la cámara.
4. En escritorio puede usar mouse o arrastre y movimientos suaves con WASD o flechas.
5. En celular puede mirar mediante arrastre táctil.
6. Limitá el movimiento a una zona pequeña para conservar la composición.
7. En el centro aparece una cuenta regresiva con días, horas, minutos y segundos.
8. El contador debe formar parte del mundo, como luz, reflejo o tipografía suspendida.
9. No debe estar dentro de una tarjeta o modal genérico.
10. La información debe continuar siendo legible en móvil.
Texto principal: “EL LADO OSCURO DEL MONO”
Texto secundario: “El ascensor todavía no llegó.”

## Registro previo
El usuario puede dejar sus datos para recibir el lanzamiento.
Integrá el formulario como un objeto del escenario: una placa, terminal, inscripción flotante o panel físico cercano al ascensor.
Campos:
- Nombre, opcional.
- WhatsApp con código de país, opcional.
- Email, opcional.
- Usuario de Instagram, opcional.
- Consentimiento para recibir novedades, obligatorio.
Debe completar al menos una de estas tres vías: WhatsApp; email; Instagram.
Texto de acción: “AVISAME CUANDO SE ABRAN LAS PUERTAS”
Comportamiento:
- validar los campos;
- explicar claramente si falta una vía de contacto;
- evitar envíos duplicados durante la misma sesión;
- mostrar confirmación dentro de la escena;
- conservar temporalmente el registro en localStorage para el Artifact;
- implementar una función `submitLead(data)` separada y documentada para conectar posteriormente una API real;
- no afirmar que se enviaron datos a un servidor si el Artifact solamente utiliza almacenamiento local;
- incluir un enlace de privacidad configurable.
Después del registro, una línea de luz puede recorrer las puertas y aparecer: “Tu piso quedó reservado.”

## Escuchar mientras se espera
En el estado previo al lanzamiento agregá una acción secundaria: “MIENTRAS ESPERÁS: PEQUEÑO PRIMATE”
Al activarla:
1. Preguntar dónde quiere escuchar: YouTube o Spotify.
2. Mostrar el reproductor oficial elegido.
3. Mantener el ascensor y el vacío visibles alrededor.
4. Permitir cerrar el reproductor y regresar al contador.
5. No comenzar la reproducción automáticamente.
Esto permite que la etapa previa también genere escuchas reales del primer disco.

## Prueba del momento de lanzamiento
Cuando el contador llega a cero:
1. Los números se apagan.
2. El agua produce una onda lenta.
3. El ascensor gana una línea de luz marfil.
4. Se escucha o se representa visualmente una vibración sutil.
5. Las puertas se abren lentamente.
6. Aparece el mensaje: “LAS PUERTAS ESTÁN ABIERTAS”
7. El usuario puede caminar o tocar para acercarse.
8. La cámara entra físicamente en la cabina.
9. No recargar la página durante la transición.
Agregá controles de desarrollo ocultables para forzar: estado previo; últimos diez segundos; estado publicado; abrir y cerrar puertas; exterior; interior; llegada a un piso.
Estos controles son para evaluar el Artifact y no forman parte de la experiencia pública.

## Interior del ascensor
El interior debe continuar la estética 2.5D. Debe incluir:
- cámara en primera persona;
- movimiento leve de respiración;
- mano o antebrazo estilizado;
- botonera con nueve pisos;
- indicador del piso;
- selector de plataforma;
- luz tenue;
- materiales gráficos y desgastados;
- profundidad suficiente para sentirse dentro de una cabina.
La mano puede resolverse con ilustración, sprites, capas o geometría cel-shaded. No necesita anatomía fotorrealista. Debe tener poses y timing convincentes.

## Elección de plataforma
Antes de elegir un piso, el usuario selecciona dónde escuchar: YouTube. Spotify.
Presentar la pregunta: “¿POR DÓNDE QUERÉS VIAJAR?”
El selector debe ser una pieza física del ascensor. Puede ser una palanca o dos botones iluminados. No debe parecer un selector HTML genérico.
Al seleccionar una plataforma:
1. El control se hunde.
2. Se ilumina.
3. La otra opción sigue disponible.
4. La preferencia se guarda durante la visita.
5. Se habilitan los pisos.
6. Al regresar al ascensor se conserva la selección.
El usuario puede cambiar de plataforma posteriormente.

## Botonera y canciones
Mostrar nueve pisos correspondientes a las canciones de “Pequeño Primate” para este prototipo:
1. Tan Buena  2. Amor Libre  3. Ni un WhatsApp  4. Te Necesito  5. Cebadora de Mates Internacional
6. Estás Acá  7. Coca y Fernet  8. La Frase Mágica  9. Yo No Hago Música
El video de YouTube contiene capítulos. Creá una configuración central:
    const tracks = [
      { floor: 1, title: "Tan Buena", youtubeVideoId: "doxiX5RHT7Q", youtubeStartSeconds: 0,
        spotifyTrackUri: null, spotifyAlbumId: "0p8WjCX93rdndct41myh0x", visualAccent: "#ded8c8", shortText: "" }
    ];
Completá los nueve elementos utilizando los capítulos verificados de la descripción pública de YouTube. No inventes tiempos si no podés verificarlos: dejalos señalados como configuración pendiente.
Los `spotifyTrackUri` pueden quedar configurables si el álbum embebido no permite identificar cada canción individual desde el enlace entregado. El Embed del álbum debe funcionar como respaldo.
Toda la navegación debe depender de esta configuración y no de nueve implementaciones duplicadas.

## Viaje
Cuando se selecciona un piso:
1. La mano se acerca.  2. El índice toca el botón.  3. El botón se hunde.  4. Se ilumina con el acento de la canción.
5. Las puertas se cierran.  6. La cabina vibra suavemente.  7. El indicador cambia.
8. El agua, la tinta o el grano se deforman.  9. Aparecen reflejos prismáticos muy breves.
10. Se escucha el movimiento solamente después de una interacción válida del usuario.
11. El viaje dura lo suficiente para generar expectativa.  12. Las puertas se abren al escenario de la canción.
Usá anticipación, aceleración, desaceleración y pausas. Evitá que todos los elementos se muevan a velocidad constante.

## Llegada a cada canción
Al abrirse las puertas, el usuario debe poder descender o avanzar ligeramente.
Cada piso puede reutilizar una estructura común, pero debe cambiar mediante: composición; color de acento; partículas; texto; desplazamiento; reflejos; ritmo de animación; forma del espacio.
No crees nueve escenarios realistas complejos. Creá nueve variaciones artísticas ligeras a partir de capas, shaders, geometría simple y texturas.
El título de la canción puede aparecer integrado en el mundo, nunca dentro de una tarjeta convencional.
Detrás o dentro del escenario aparece el reproductor oficial correspondiente a la plataforma elegida.

## Reproducción en YouTube
Usá el IFrame Player oficial de YouTube con: https://www.youtube.com/embed/doxiX5RHT7Q
Para cada piso, cargar el mismo video con el parámetro de inicio correspondiente al capítulo: ?start=SEGUNDOS
Condiciones obligatorias:
- el iframe debe estar visible;
- debe tener tamaño suficiente para utilizar sus controles;
- el usuario debe pulsar el botón nativo de reproducción;
- no usar autoplay;
- no llamar programáticamente a `playVideo()` para simular una vista;
- no esconder el reproductor;
- no cubrir el botón ni los controles con capas;
- no reemplazar el audio por un archivo local;
- no silenciarlo para reproducirlo en segundo plano.
Cuando el reproductor informe el estado `playing`, el escenario puede comenzar a reaccionar visualmente.
El reproductor puede presentarse como: portal; pantalla dentro del escenario; proyección; pared de luz; ventana detrás de las puertas.
Debe seguir siendo claramente el reproductor oficial y conservar sus controles.

## Reproducción en Spotify
Usá el Embed oficial: https://open.spotify.com/embed/album/0p8WjCX93rdndct41myh0x
Condiciones:
- el reproductor debe ser visible;
- el usuario inicia la reproducción;
- conservar controles e identidad de Spotify;
- agregar `allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"`;
- si solamente se permite una vista previa, mostrar “Continuar en Spotify”;
- permitir abrir el álbum original;
- no intentar evadir login o limitaciones del navegador.
Cuando tengamos los enlaces individuales de cada canción, la configuración debe permitir cambiar el álbum embebido por un track específico.

## Regreso al ascensor
Durante o después de la escucha debe existir una acción integrada en el escenario: “VOLVER AL ASCENSOR”
Al regresar:
1. detener correctamente el reproductor;
2. eliminar listeners que ya no se utilicen;
3. evitar dos canciones reproduciéndose simultáneamente;
4. regresar a primera persona dentro de la cabina;
5. conservar la plataforma elegida;
6. marcar visualmente los pisos visitados;
7. permitir seleccionar otra canción.
El objetivo es que la persona quiera explorar varios pisos y escuchar varias canciones voluntariamente.
No implementar reproducción oculta, loops automáticos ni mecanismos artificiales para aumentar contadores.

## Calidad visual
No quiero: estética genérica de aplicación; cards flotantes; dashboard; fondos con gradientes decorativos; excesos de neón; pasillos de edificio; cielo; horizonte; botones web convencionales dominando la escena; textos explicando cómo está programado; modelos realistas deficientes; movimientos robóticos; elementos cortados en celular.
Quiero: una portada viva; una experiencia musical; oscuridad legible; composición frontal; profundidad mediante capas; materiales gráficos; agua abstracta; interacción directa; ritmo cinematográfico; una identidad que parezca creada específicamente para el disco.

## Tecnología
Elegí Canvas, SVG, CSS, WebGL, Three.js o una combinación. Priorizá el resultado visual, la carga y la estabilidad.
El Artifact debe: ocupar toda la pantalla; funcionar en escritorio y móvil; responder a mouse, teclado y tacto; respetar `prefers-reduced-motion`; limitar la densidad de píxeles; pausar animaciones costosas cuando la pestaña no está visible; descargar escenas y reproductores que ya no se utilizan; evitar bloqueos si WebGL no está disponible; tener una alternativa visual 2D; mostrar estados claros de carga y error; no depender de assets externos frágiles aparte de los embeds oficiales.

## Alcance del Artifact
Implementá completamente: 1. mundo exterior; 2. movimiento limitado; 3. contador; 4. registro previo; 5. escucha de “Pequeño Primate” durante la espera; 6. transición de lanzamiento; 7. apertura de puertas; 8. entrada en primera persona; 9. selector YouTube/Spotify; 10. nueve botones configurables; 11. viaje; 12. al menos un piso completamente terminado; 13. YouTube real funcionando; 14. Spotify real funcionando; 15. regreso al ascensor; 16. variaciones ligeras para los otros pisos.
Dedicá la mayor calidad visual al exterior, apertura, interior, pulsación y primer piso. Los demás pisos pueden compartir el sistema visual, pero deben ser navegables.

## Verificación antes de entregar
Comprobá: escritorio 16:9; teléfono vertical; contador; validación del formulario; cambio entre estados; apertura del ascensor; entrada en primera persona; selección de plataforma; pulsación de piso; viaje; apertura del escenario; reproducción manual de YouTube; carga del Embed de Spotify; regreso al ascensor; ausencia de audios superpuestos; legibilidad del negro; ausencia de elementos cortados; funcionamiento sin instrucciones técnicas visibles.
