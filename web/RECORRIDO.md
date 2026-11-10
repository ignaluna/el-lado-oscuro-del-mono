# El recorrido de El Lado Oscuro del Mono

Cómo funciona el recorrido de nueve pisos, qué pide cada desafío y dónde se agregan las tapas de Luján y el audio del disco.

## En una línea

Los pisos 1 a 9 son el disco. Cada piso tiene su elemento de tapa en escena y un desafío. Al resolverlo, el elemento se vuelve una página y el capítulo del libro se abre completo, con el texto exacto del manuscrito. Con los nueve capítulos se completa el libro y se abren los subsuelos −1 a −9, donde vive Pequeño Primate.

## Orden definitivo

El álbum y el libro se unen por identificadores estables (`tracks[].chapter`), nunca por la posición en una lista. Por eso el libro conserva su orden de lectura (capítulos 1 a 9) aunque los pisos 5 a 8 no coincidan con el número de capítulo.

| Piso | Canción | Elemento de tapa | Capítulo |
|---|---|---|---|
| 1 | En una | Una realidad simulada por computadora | 1 |
| 2 | ¿Qué te está pasando? | El sistema | 2 |
| 3 | El lado oscuro del mono | El grito del mono | 3 |
| 4 | ¿Qué carajo? | Las dos manos | 4 |
| 5 | Explotar | El dolor heredado | 6 |
| 6 | Pato | Un pato | 5 |
| 7 | Casi Perdido | El fuego | 8 |
| 8 | No me perdones | Vacío | 7 |
| 9 | Portales | Un árbol grande | 9 |

## Cómo se juega un piso

1. El elemento está en el mundo, al costado del reproductor en pantallas anchas o arriba de él en celulares.
2. Se toca el elemento, o el botón **ACERCARTE A…** que aparece bajo «Volver al ascensor».
3. Se abre una placa al lado del reproductor (nunca encima). Muestra:
   - un fragmento textual del capítulo, que tiene la clave;
   - la escena del desafío;
   - una línea de estado que responde a cada acción.
4. **PISTA** es opcional y dice un poco más cada vez. La última pista da la solución.
5. Al resolverlo:
   - la escena se ilumina y el elemento se vuelve una página con el título del capítulo;
   - el capítulo entra al libro, que se abre en él;
   - el piso queda marcado en el tablero con un librito y con ✓ en el botón.
6. Un piso resuelto ofrece **LEER EL CAPÍTULO** y **VOLVER A HACERLO**. Jugarlo de nuevo no da nada dos veces.

**Accesibilidad.** Todo se hace con botones, también con teclado y lector de pantalla. Ningún desafío necesita sonido, pasar el mouse por encima, arrastrar con precisión ni moverse rápido.

**"Quedarse" (pisos 1, 3 y 7).** (En el piso 1 es el último paso de la sala; en el piso 2 son las tres respiraciones del final, sin cuenta; en el piso 3 es TRAGAR LA PALABRA.) Con un toque empieza una cuenta lenta, de 4 a 5 segundos, que se ve en el mismo botón. No hace falta mantener el dedo apretado. Otro toque, o cualquier otro botón, la interrumpe.

## Los nueve desafíos

### Piso 1 · En una · capítulo 1 · una realidad simulada por computadora
Este piso es una **sala que se recorre** (no una placa): la tapa del disco dibujada en el mundo, en tiza blanca sobre negro. Una computadora con dos cerebros encima y una antena con anillos y chispas; un teclado, una taza con vapor y un cable por el costado; a la izquierda, el que duerme (gorro de dormir, brillo plateado); a la derecha, el del visor dorado y gorro de cumpleaños, mirando un cono de puntos, círculos y números. Manos con mangas rotas suben desde abajo y tipean. «11:11» firma el piso. Mientras la máquina anda, todo se mueve: las manos tipean, los números caen desde la antena, la antena chispea, la taza humea, el que duerme respira. Se camina como en cualquier mundo (el reproductor oficial espera en la esquina; el escritorio y los dos personajes son sólidos). Sin la versión 3D (modo 2D de emergencia) el piso mantiene la placa de siempre.
- **Mecánica (cuatro pasos, todo con botones):**
  1. **La pantalla** muestra un asterisco de ocho rayos que pide un código. Se tocan los rayos (RAYO 1 ARRIBA, … en el sentido del reloj) y PROBAR.
  2. **El visor.** Tocar al del visor y **MIRAR POR SU VISOR**: la cámara pasa a sus ojos y los puntos sueltos del cono se ordenan, en perspectiva real, en ocho cifras sobre un círculo, desde arriba y en el sentido del reloj. Al salir (ALEJARSE o Escape) vuelven a esparcirse. Se anuncia: «Los puntos se ordenan: 1 0 1 1 0 0 1 0».
  3. **El reloj.** Con el código la pantalla se vuelve un reloj detenido (03:47). La **taza**, dada vuelta, muestra 11:11 en el fondo, igual que la firma del piso. Se ponen las cuatro cifras en 11:11 (tocar cada una) y PONER EN HORA: la máquina se detiene (no cae más data, las chispas se apagan, las manos paran, la pantalla se apaga).
  4. **El espejo.** La pantalla oscura muestra al mono. **MIRARLO DE NUEVO**: con un toque empieza una cuenta lenta de 4 s (otro toque la interrumpe) y resuelve el piso.
- **Si se equivoca:** un código mal dicho apaga los rayos («Ese no es el código. El algoritmo ya está escrito.»); una hora mal puesta devuelve el reloj a su hora («Esa no es la hora.»). Nada más: no hay castigo.
- **Pista en pantalla:** «La data baja desde arriba. La ilusión de elegir. / El algoritmo ya está escrito.» (al llegar). **PISTA** tiene tres niveles por paso; el último da la solución de ese paso.
- **Solución:** rayos 1, 3, 4 y 7 encendidos (código 1 0 1 1 0 0 1 0) y PROBAR; dar vuelta la taza (11:11); relojes en 11:11 y PONER EN HORA; MIRARLO DE NUEVO (4 s).
- **Recompensa:** Capítulo 1 — En una (la página vuela al libro, que se abre en el capítulo). Una vez: volver a jugar la sala (**JUGARLO DE NUEVO**, dos toques) no da nada dos veces.
- **Se guarda:** la sala recuerda su estado (rayos, reloj, taza, resuelta) en este dispositivo, y sigue resuelta tras recargar.

### Piso 2 · ¿Qué te está pasando? · capítulo 2 · el sistema
Este piso también es una **sala que se recorre**: la tapa del disco dibujada en el mundo, en tiza blanca sobre negro, como una ciudad que es un circuito. Está armada como un tablero en relieve que se inclina hacia quien llega (para que todo el dibujo se lea desde donde se está parado, con los edificios saliendo del papel): bloques con ventanas de brillo dorado, un camino que serpentea y otro del medio con carriles de rayitas y cápsulas, todo cayendo a un hueco en el centro; a la izquierda, un laberinto de cables con gotas de puntos; arriba a la izquierda, la nube con espiral, estrellas y flores; a la derecha, las torres con una columna de humo, el cohete con su ✓ y su ✗, la computadora acostada, la constelación y los circuitos; «11:11» firma el piso. Mientras la ciudad anda, todo se mueve: titilan las ventanas, las cosas corren por los caminos hacia el hueco, el humo sube, las cápsulas ruedan, la espiral gira. Se camina como en cualquier mundo (el tablero es sólido). Sin la versión 3D el piso mantiene la placa de siempre.
- **Mecánica (cortar en el orden del cable, y quedarse):**
  1. **El hueco.** Todos los caminos y los cables caen al hueco del centro. Su medidor marca «LLENO: 0 %» y no se mueve. ECHAR MÁS no cambia nada: la aguja tiembla y vuelve a cero.
  2. **El circuito.** En el laberinto de la izquierda hay un solo hilo marcado, que un pulso recorre desde un pin de entrada y va prendiendo cuatro entradas, una por una: sustancias, amor, plata, éxito. Ese es el orden de corte (no es el orden de la frase del capítulo). Al mirarlo se anuncia: «pasa por sustancias, después amor, después plata y por último éxito».
  3. **Las cuatro entradas** son lugares de la ciudad. Se las toca, se las mira de cerca y se las corta:
     - **SUSTANCIAS:** las cápsulas del camino y la chimenea con humo. APAGAR LA CHIMENEA.
     - **AMOR:** la nube con la espiral y las flores. FRENAR LA ESPIRAL.
     - **PLATA:** el edificio de ventanas doradas. APAGAR LAS LUCES.
     - **ÉXITO:** el cohete con el tilde. TACHAR EL TILDE (el ✓ se vuelve ✗).
  4. **El silencio.** Con las cuatro cortadas, la ciudad se queda quieta: el humo se detiene, los caminos se vacían, las ventanas se apagan. En el hueco, **INHALAR** y **EXHALAR** tres veces, cada toque es una mitad de la respiración, sin apuro y sin tiempo. Con la tercera exhalación, el medidor pasa a decir «SE HABITA» y se abre el capítulo.
- **Si se equivoca:** una entrada cortada fuera de turno hace que «El sistema vuelve a abrir todo»: se reabren todas las que ya estaban cortadas (el humo vuelve, las luces se prenden). Nada más: no hay castigo.
- **Pista en pantalla:** «Nos obligan a llenarlo. Con plata, con éxito, con amor, con sustancias. / Pero no se llena. / Se habita.» (la sala dice al llegar: «Todos los caminos van al mismo hueco. Nos obligan a llenarlo.»). **PISTA** tiene tres niveles por paso (sin saber el orden, cortando, en el silencio); el último da la solución de ese paso.
- **Solución:** mirar el circuito (laberinto de la izquierda) para ver el orden; cortar SUSTANCIAS (chimenea), AMOR (espiral), PLATA (luces) y ÉXITO (el tilde), en ese orden; en el hueco, INHALAR, EXHALAR, tres veces.
- **Recompensa:** Capítulo 2 — ¿Qué te está pasando? (la página vuela al libro, que se abre en el capítulo). Una vez: volver a jugar la sala (**JUGARLO DE NUEVO**, dos toques) no da nada dos veces.
- **Se guarda:** la sala recuerda lo que se cortó, las respiraciones y si está resuelta en este dispositivo, y sigue así tras recargar.

### Piso 3 · El lado oscuro del mono · capítulo 3 · el grito del mono
Este piso también es una **sala que se recorre**: la tapa del disco dibujada en el mundo, en tiza blanca sobre negro. Es un tablero en relieve que se inclina hacia quien llega (así todo el dibujo se lee desde donde se está parado, con los dientes saliendo del papel): una boca de mono enorme, a los gritos, enmarcada por pelo de puntas y dos ojos furiosos; dientes de oro y de plata (el brillo dorado y plateado de la tapa), varios de abajo tachados con una ✗; una firma de graffiti (un tubo pálido y un garabato de lazos y letras) que sale de la boca; dos estrellas en forma de asterisco, tinta salpicada arriba a la izquierda, una gota que cae del labio y «11:11» en la esquina. Mientras la boca grita, todo se mueve: tiembla la boca, se eriza el pelo, la firma crece y se encoge, la tinta salpicada se calienta, brillan los dientes de oro y cae la gota. Se camina como en cualquier mundo (el tablero es sólido). Sobre el agua, alrededor, flotan pedazos de diente. Sin la versión 3D el piso mantiene la placa de siempre.
- **Mecánica (el cuerpo avisa, tragar la palabra, reparar lo roto):**
  1. **El cuerpo avisa.** Tres señales están escondidas en el dibujo y hay que notarlas en el orden en que las nombra el capítulo: **calor** (las salpicaduras de tinta: ACERCAR LA MANO), **tensión** (el pelo erizado: PASAR LA MANO) y **la palabra empujando** (la firma que sale de la boca: ESCUCHAR LA FIRMA). Con las tres, la firma se frena a medias, medio afuera de la boca.
  2. **Tragar la palabra.** En la firma, **TRAGAR LA PALABRA** empieza una cuenta lenta de 5 segundos (un toque; otro toque, o cualquier otro botón, la interrumpe) y la firma vuelve a la boca. En cambio **TOCAR LA FIRMA** deja salir «Callate.»: se rompe otro diente (otra ✗) y cae otro pedazo al agua.
  3. **Juntar los pedazos.** Flotan sobre el agua, a los costados y lejos del lugar de llegada, tantos pedazos de diente como dientes con ✗ (3, más uno por cada vez que se dejó salir la palabra). Hay que girar, caminar y mirar para encontrarlos, y tocar cada uno. En la boca, **ENCASTRAR UN PEDAZO** repara un diente: queda dorado, con la raja a la vista (como el kintsugi: el perdón no borra la rotura, la repara a la vista).
  4. **«perdón.»** Con el último diente remendado la boca se calma y aparece la palabra «perdón.»: se abre el capítulo.
- **Si se equivoca:** una señal fuera de orden borra lo que se había notado («No siempre llego.»). Encastrar sin pedazos encima avisa dónde están. Nada más: no hay castigo.
- **Pista en pantalla:** «A veces el cuerpo avisa. / Calor. Tensión. La palabra empujando. / “Callate.”» (la sala dice al llegar: «Una boca enorme grita. A veces el cuerpo avisa.»). **PISTA** tiene tres niveles por paso (las señales, la firma, los pedazos y los dientes); el último da la solución de ese paso.
- **Solución:** notar el calor (la tinta), la tensión (el pelo) y la palabra (la firma), en ese orden; TRAGAR LA PALABRA y esperar la cuenta; juntar todos los pedazos del agua; en la boca, ENCASTRAR UN PEDAZO por cada diente con ✗.
- **Recompensa:** Capítulo 3 — El lado oscuro del mono (la página vuela al libro, que se abre en el capítulo). Una vez: volver a jugar la sala (**JUGARLO DE NUEVO**, dos toques) no da nada dos veces.
- **Se guarda:** la sala recuerda las señales notadas, si la palabra se tragó, cuántos dientes se rompieron, los pedazos juntados, los dientes remendados y si está resuelta en este dispositivo, y sigue así tras recargar. Si lo guardado no tiene sentido (señales fuera de orden o repetidas, pedazos que no existen, «resuelta» sin todos los dientes remendados) se descarta y solo se conserva lo válido, desde el principio.

### Piso 4 · ¿Qué carajo? · capítulo 4 · las dos manos
Este piso también es una **sala que se recorre**: la tapa del disco dibujada en el mundo, en tiza blanca sobre negro. Es un tablero en relieve que se inclina hacia quien llega (así todo el dibujo se lee desde donde se está parado): dos manos levantadas, con las palmas al frente, los dedos, las rayas de las palmas, el pelo de las muñecas y el contorno de cada mano, calcados del propio dibujo de la tapa (no a ojo), y las tres gotas que caen: una de cada muñeca y una entre las dos. «11:11» firma la esquina. Mientras la sala está sin resolver, todo se mueve: las manos respiran, el pelo se eriza apenas y de cada gota cae una copia. Se camina como en cualquier mundo (el tablero es sólido). Delante del tablero, sobre el agua, las marcas de algo arrastrado (una mochila) cruzan el piso y se bifurcan cinco veces; cada bifurcación son dos flechas de tiza sobre postes. Sin la versión 3D el piso mantiene la placa de siempre.
- **Mecánica (seguir la línea de la vida, sostener en vez de arrastrar, quedarse):**
  1. **El mapa.** En la palma izquierda hay una línea de la vida que baja doblando cinco veces: **izquierda, derecha, derecha, izquierda, derecha**. Al mirarla de cerca, cinco brillos la recorren, cada uno a un lado de la línea, y se anuncia el recorrido (SEGUIR LA LÍNEA lo repite numerado). Se dobla como quien camina hacia las manos.
  2. **Las cinco bifurcaciones.** En cada una, un toque en la flecha de un lado. El giro correcto deja que las marcas sigan, hasta algo heredado tirado en el camino; el equivocado hace que las marcas den vueltas sobre sí mismas («te arrastrás en círculos») y no cambia nada. Se sigue una bifurcación por vez: la siguiente aparece cuando lo anterior ya está sostenido.
  3. **Las cinco cosas**, en el orden del capítulo: las bolsitas de residuo que vendía papá, las zapatillas que compartían la vieja y la tía, la espada de Pepe, los ñoquis de Eva y los vinos de Rolando. Se toma cada una del agua.
  4. **Las dos manos.** En las manos, la cosa se sostiene con **MANO IZQUIERDA** y **MANO DERECHA**: las dos hacen falta (con una sola «se sigue arrastrando»; ARRASTRARLA no sirve de nada). Cada cosa sostenida enciende un par de yemas, acerca un poco las manos y hace caer las gotas más despacio. Son cinco.
  5. **Quedarse.** Con las cinco sostenidas, en las gotas, **QUEDARTE** empieza una cuenta lenta de 6 segundos (un toque; otro toque, o cualquier otro botón, la interrumpe): «Y sin embargo, los pájaros cantan. El agua del mate se enfría.» Al terminar se abre el capítulo.
- **Si se equivoca:** un giro equivocado, una sola mano o arrastrar no cambian nada de lo ya hecho: solo lo avisan. No hay castigo.
- **Pista en pantalla:** «Pero pesa distinto cuando lo miro de cerca, cuando lo sostengo con las dos manos en vez de arrastrarlo por la vida.» (la sala dice al llegar: «Dos manos levantadas y tres gotas. En el piso, marcas de algo arrastrado.»). **PISTA** tiene tres niveles por paso (el mapa, el camino y las manos, el quedarse); el último da la solución de ese paso.
- **Solución:** mirar la palma izquierda; seguir las marcas girando izquierda, derecha, derecha, izquierda, derecha; en cada tramo tomar la cosa del camino y, en las dos manos, tocar MANO IZQUIERDA y MANO DERECHA (cinco veces); en las gotas, QUEDARTE y esperar la cuenta.
- **Recompensa:** Capítulo 4 — ¿Qué carajo? (la página vuela al libro, que se abre en el capítulo). Una vez: volver a jugar la sala (**JUGARLO DE NUEVO**, dos toques) no da nada dos veces.
- **Se guarda:** la sala recuerda si se miró la línea, cuántas bifurcaciones se tomaron, cuántas cosas se tomaron y se sostienen y si está resuelta en este dispositivo, y sigue así tras recargar. Si lo guardado no tiene sentido (más cosas sostenidas que las cinco, una bifurcación sin la cosa anterior, «resuelta» sin las cinco sostenidas) se descarta y solo se conserva lo válido.

### Piso 5 · Explotar · capítulo 6 · el dolor heredado
- **Escena:** la carta a la abuela Eva, envuelta en hilos oscuros, junto a un manómetro con la aguja cerca del rojo.
- **Mecánica (escribir lo que no se dijo):**
  - La carta tiene dos huecos con las mismas palabras, en dos frases textuales del capítulo.
  - Escribirlas libera la presión: los hilos se vuelven vapor.
  - Mayúsculas, tildes, espacios y signos no importan.
- **Pista en pantalla:** «Pero te juro que estoy tratando de ser mejor. De no callar lo que siento.»
- **Frases con hueco en la escena:**
  - «…de no haberte dicho ____ cuando todavía podía hacerlo.»
  - «Te escribo porque todavía ____, aunque no haya sabido cómo demostrarlo.»
- **Solución:** escribir «te amo» (también vale «te amo abuela»).
- **Recompensa:** Capítulo 6 — Explotar.

### Piso 6 · Pato · capítulo 5 · un pato
- **Escena:** el Pato junto a una casa de siete ladrillos sin construir.
- **Mecánica (observar y construir de a dos):**
  - Antes de cada ladrillo el Pato muestra cómo está: de espaldas (cerrado) o mirándote (abierto). La escena lo dice también en palabras.
  - Hay que CEDER cuando se cierra y PEDIR cuando se abre.
  - Al revés, el ladrillo no asienta y no se pierde nada.
- **Pista en pantalla:** «Me interesa la paz, esa que se construye de a dos, en silencio, cediendo, y pidiendo. / Un poco más cediendo»
- **Solución:** CEDER, PEDIR, CEDER, CEDER, PEDIR, CEDER, CEDER (siempre leyendo al Pato).
- **Recompensa:** Capítulo 5 — Pato.

### Piso 7 · Casi Perdido · capítulo 8 · el fuego
- **Escena:** un hogar con brasas débiles y un mazo de diez cartas.
- **Mecánica (decidir qué merece atención):**
  - Lo que hace correr va AL FUEGO: producir, la culpa de no estar produciendo, el rendimiento, correr detrás del objetivo, estar distraído.
  - Lo que el capítulo quiere vivir va A MI LADO: unos mates, pasear con Rita, hacer música con amigos, abrazar a mi novia, volver a la naturaleza de las cosas.
  - Una carta mal ubicada vuelve al final del mazo.
  - Con el hogar encendido, MIRAR LAS BRASAS (5 s).
- **Pista en pantalla:** «Yo quiero vivir de verdad. Tomar unos mates. Sentarme frente al fuego del hogar y mirar cómo se apagan las brasas. / … decidir qué merece nuestra atención.»
- **Solución:** ubicar las diez cartas y mirar las brasas.
- **Recompensa:** Capítulo 8 — Casi Perdido.

### Piso 8 · No me perdones · capítulo 7 · vacío
Este piso también es una **sala que se recorre**: la tapa del disco dibujada en el mundo, en tiza blanca sobre negro. La tapa es casi toda negra: unas ondas concéntricas sobre agua oscura, una forma chica que se hunde en el medio, dos salpicaduras a los costados, un reflejo en zigzag que baja hacia quien mira con una gota abajo, una estrella diminuta arriba y «11:11». Los trazos son los del propio dibujo (calcados de la foto, no a ojo) y están puestos como los vería un ojo a 1,6 m de altura sobre el agua: desde donde se llega, la sala **es** la tapa; al caminar, las ondas se abren alrededor (el agua es el piso: no hay tablero). Mientras la sala está sin resolver, todo se mueve: las ondas respiran una tras otra, la forma del medio flota, las salpicaduras se mecen, el reflejo brilla y la estrella titila. En el agua del mundo, de vez en cuando, sale una onda real del centro. Se camina como en cualquier mundo; lo único sólido es el vaso del centro. Sin la versión 3D el piso mantiene la placa de siempre.
- **Mecánica (la estrella que se aleja, los castillos, el vaso, la última palabra):**
  1. **La estrella.** Es lo único que brilla. Tocarla (cada toque es un paso: el visitante camina 1,2 m hacia ella) o caminar hacia ella la aleja exactamente lo mismo: al tercer paso se anuncia «No hay meta.» y la estrella queda como una luz lejana. Todo se puede hacer con botones.
  2. **Los castillos.** Tres castillos de papel flotan en la oscuridad y **solo se ven de cerca**: hay que caminar para encontrarlos (uno a la izquierda del reflejo, uno a la derecha del otro lado del agua y uno bien al fondo a la izquierda; al aparecer cerca se avisa en pantalla y a los lectores de pantalla). Tocar uno lo desarma: se acuesta sobre el agua como un tramo de camino a lo largo del reflejo, hacia el centro.
  3. **El vaso.** Con el camino completo aparece, en el centro, un vaso de agua que tiembla con las olas. Cada ola rompe 1,6 s y se retira 2,4 s; en el vaso, **APOYAR EL VASO** lo apoya solo mientras la ola se retira (el botón dice en palabras «LA OLA ROMPE» o «LA OLA SE RETIRA»), y **ESPERAR A QUE SE RETIRE** lo hace sin apuro: la sala espera la ola y lo apoya sola.
  4. **La última palabra.** Con el vaso quieto hay dos frases: **PERDONAME** agita el agua otra vez (las ondas crecen y se apaciguan solas); **NO ME PERDONES** calma el agua, el reflejo en zigzag se endereza y se abre el capítulo: «Pedirte que no me perdones es un gesto de amor.»
- **Si se equivoca:** apoyar el vaso con la ola rompiendo («Las olas rompen, pero no calman») o decir PERDONAME solo se avisan; un castillo lejano pide acercarse. No hay castigo.
- **Pista en pantalla:** «esos castillos de papel que llamé felicidad eran excusas para no detenerme, para no sentir. / Y vos llegaste a decirme, sin palabras, que no hay meta, que solo hay camino.» (la sala dice al llegar: «Un vacío negro. Ondas en el agua, una estrella chiquita y un reflejo que baja hacia vos.»). **PISTA** tiene tres niveles por paso (la estrella, los castillos, el vaso, la última palabra); el último da la solución de ese paso.
- **Solución:** acercarse tres veces a la estrella; caminar hasta cada uno de los tres castillos (izquierda cerca, derecha del otro lado del agua, fondo a la izquierda) y desarmarlo; mirar el vaso y apoyarlo cuando dice «LA OLA SE RETIRA» (o con ESPERAR A QUE SE RETIRE); tocar NO ME PERDONES.
- **Recompensa:** Capítulo 7 — No me perdones (la página vuela al libro, que se abre en el capítulo). Una vez: volver a jugar la sala (**JUGARLO DE NUEVO**, dos toques) no da nada dos veces.
- **Se guarda:** la sala recuerda cuántos pasos se dieron hacia la estrella, qué castillos se desarmaron y en qué orden, si el vaso está apoyado y si está resuelta en este dispositivo, y sigue así tras recargar. Si lo guardado no tiene sentido (más de tres pasos, castillos desarmados antes de dejar atrás la estrella, repetidos o que no existen, el vaso apoyado sin los tres castillos, «resuelta» sin el vaso apoyado) se descarta y solo se conserva lo válido, desde el principio.

### Piso 9 · Portales · capítulo 9 · un árbol grande
Este piso también es una **sala que se recorre**: la tapa del disco dibujada en el mundo. La tapa es un árbol enorme cuyos dos troncos se arquean alrededor de un vórtice en espiral; arriba, una copa de nubes enruladas con una casa del árbol de ventana redonda y, a la derecha, una escalera que sube a otra espiral con dos estrellitas; una espiral en cada tronco y una más chica a la izquierda; raíces talladas con laberintos y una columna en zigzag en el tronco derecho; una chispa dorada (arriba a la derecha del vórtice) y una plateada (a su izquierda); «11:11»; y abajo, un chico parado en un resplandor. A diferencia de las salas de trazos de tiza, esta tapa es de **masas** (las nubes de la copa, los troncos sombreados) y de bandas lisas y gruesas, así que sus tonos se dibujan como **rellenos** calcados de la foto (la luminosidad de la foto cortada en cinco niveles, no a ojo) y la tiza es lo que se mueve y lo que se cuenta: las espirales, las chispas, los dibujos de lo que se deja en cada raíz, el portal. Está puesta como la vería un ojo a 1,6 m de altura: desde donde se llega, la sala **es** la tapa; al caminar se abre en relieve (la copa abombada, el vórtice hundido en los troncos, las raíces tendidas en el suelo hacia quien mira, el chico parado delante con su resplandor). Mientras la sala está sin resolver, todo se mueve: la copa respira, las espirales se mecen, las chispas titilan, el resplandor late y las raíces esperan con un pulso. Se camina como en cualquier mundo; el frente del árbol es sólido (se recorren las raíces, no los troncos). Sin la versión 3D el piso mantiene la placa de siempre.
- **Mecánica (las cuatro raíces, la casa del árbol, las espirales, el resplandor):**
  1. **Las cuatro raíces.** Cada raíz es un lugar para tocar (dos a la izquierda, dos a la derecha). En cada una se elige qué dejar: **PERRO**, **GUITARRA**, **VECINOS** o **RISA**, lo que el capítulo dice que queda (una cosa en cada raíz; la raíz muestra un dibujo de lo que se dejó). **ESCENARIO**, **LUCES** y **PÚBLICO** son lo que ya no hace falta: la raíz vuelve atrás («Hoy no necesito escenarios, ni luces, ni público.»).
  2. **La casa del árbol.** Con las cuatro raíces, entre las hojas se ve una casa del árbol con una ventana redonda y una escalera. Tocar la escalera sube hasta la casa; en la casa, **ASOMARSE POR LA VENTANA** muestra tres espirales con una chispa cada una: plateada en la del tronco izquierdo (gira hacia la izquierda), dorada en la del centro (hacia la derecha) y plateada en la del tronco derecho (hacia la izquierda). Dorado es como el reloj; plateado, al revés. La respuesta también se dice en pantalla y a los lectores de pantalla.
  3. **Las espirales.** Cada espiral (tronco izquierdo, centro, tronco derecho) tiene **GIRAR A LA DERECHA** y **GIRAR A LA IZQUIERDA**; la espiral gira de verdad para el lado elegido. Con las tres del lado que dijo la ventana, el vórtice se abre y sale luz; si las tres están puestas pero alguna va para el otro lado, se avisa y no se abre.
  4. **El resplandor.** Con el vórtice abierto, el chico de abajo llama con rayos de luz. Tocar su resplandor es entrar: la cámara cruza el portal (el mundo se vuelve blanco) y vuelve al mismo lugar donde estaba el visitante, mirando al chico. «Siempre te llevan de vuelta a vos.»
- **Si se equivoca:** dejar algo que no va hace que la raíz vuelva; dejar la misma cosa dos veces o girar una espiral al revés solo se avisa. No hay castigo.
- **Pista en pantalla:** «quiero creer que algo mío va a quedar acá: en la raíz de un árbol, en el ladrido de un perro, en el eco suave de una guitarra que todavía suena. / Acá lo invisible se nota: en cómo los vecinos se saludan, en la risa compartida sin motivo.» (la sala dice al llegar: «Un árbol enorme alrededor de un vórtice. Sus raíces bajan hacia vos y, entre ellas, un chico parado en un resplandor.»). **PISTA** tiene tres niveles por paso (las raíces, la casa del árbol, las espirales, el resplandor); el último da la solución de ese paso.
- **Solución:** dejar PERRO, GUITARRA, VECINOS y RISA (una en cada raíz); subir por la escalera y asomarse por la ventana; girar la espiral del tronco izquierdo a la izquierda, la del centro a la derecha y la del tronco derecho a la izquierda; tocar el resplandor del chico.
- **Recompensa:** Capítulo 9 — Portales (la página vuela al libro, que se abre en el capítulo). Si es el noveno capítulo, se revelan los subsuelos. Una vez: volver a jugar la sala (**JUGARLO DE NUEVO**, dos toques) no da nada dos veces.
- **Se guarda:** la sala recuerda qué se dejó en cada raíz, si se miró por la ventana, para dónde gira cada espiral y si está resuelta en este dispositivo, y sigue así tras recargar. Si lo guardado no tiene sentido (un señuelo o una cosa repetida o desconocida en una raíz, espirales movidas o «resuelta» sin haber mirado por la ventana, un giro que no es izquierda ni derecha, «resuelta» con una espiral al revés) se descarta y solo se conserva lo válido.

## El libro

- **Orden de lectura** (el del manuscrito):
  1. tapa;
  2. Dedicatoria, Agradecimientos y «[Pensamientos intrusivos : Masticar el tiempo]» (vienen con el libro desde el principio);
  3. capítulos 1 a 9;
  4. las últimas líneas («No hay un sentido en esta vida. / Solo pausas. / Como al principio»), que se abren con los nueve capítulos;
  5. la Contraportada como contratapa, siempre legible;
  6. el colofón (compra del ebook o del papel, si se cargan los enlaces).
- **Capítulo cerrado:** muestra solo su título y dónde espera («Te espera en el piso 6, «Pato».»). Nunca muestra su texto ni dice «pendiente».
- **Texto exacto:** sale de `web/src/05-book-text.js`, generado desde el manuscrito con `web/tools/book-text.cjs`. Se conservan palabras, párrafos, espacios dobles y negritas.
- **Líneas «(QR → …)»:** en la edición impresa marcan el código QR de cada canción. En la web se muestran como «♪ «canción» · Piso N», porque ahí está la canción.
- **Persistencia:** el libro se puede releer siempre. El progreso queda guardado en el dispositivo entre visitas.

## Pequeño Primate en los subsuelos

- **Ubicación:** sus nueve canciones viven en los subsuelos −1 a −9, en su orden. Conservan sus ids y enlaces (`#tan-buena`, `#amor-libre`, …), sus mundos, sus reproductores oficiales y el nivel de «Tan Buena» (−1).
- **Apertura:** solo con los nueve capítulos resueltos. Visitar pisos, abrir el libro o escuchar no cuenta.
- **Revelación:** después del noveno capítulo aparece una revelación, una sola vez, con **BAJAR A LOS SUBSUELOS**. Desde ahí el tablero tiene un selector **▲ PISOS / SUBSUELOS ▼**. La tecla «-» también cambia de sección.
- **Enlace a un subsuelo cerrado:** dice dónde está y cómo se abre, y ofrece volver al ascensor.
- **Progreso anterior:** el nivel viejo, los pisos visitados y el libro de sesión anterior no resuelven nada ni abren los subsuelos. Los pisos visitados de antes se cuentan como subsuelos.

## Lo que falta (recursos reales)

- **Audio de El Lado Oscuro del Mono.** No hay ids de YouTube ni de Spotify publicados, y no se inventó ninguno. Cada piso muestra en el lugar del reproductor: «El audio llega con el disco. Mientras tanto, este piso ya se puede recorrer.» Los WAV masters no se subieron al repositorio ni al sitio porque el disco no salió.
- **Tapas de Luján.** Mientras tanto cada elemento se dibuja con líneas, en el mundo y en la placa.
- **Enlaces de compra del libro** (`BOOK.buy`), si se quieren.

## Dónde agregar las tapas y el audio

**Tapas.**
1. Guardar cada ilustración en `web/assets/portadas/`, por ejemplo `web/assets/portadas/manos.jpg`.
2. En `web/src/00-base.html`, en `COVER_ELEMENTS`, completar `art: "portadas/manos.jpg"` en el elemento que corresponde.

El build la publica junto a la página, y frena si falta el archivo. La placa del desafío la muestra arriba de la escena. Este es el único lugar que une canción, elemento e ilustración.

**Audio.** En `web/src/00-base.html`, en `tracks`, en la canción del disco, completar:
- `youtubeVideoId` y `youtubeStartSeconds`, si es un solo video del disco con capítulos, como el de Pequeño Primate;
- `spotifyTrackUri` y `spotifyAlbumId`;
- `durationSeconds`.

También se puede completar `ALBUMS.elodm`. Con eso el cartel de «audio pendiente» se vuelve el reproductor oficial y el piso reproduce su canción al llegar, como los demás.

## Erratas posibles del manuscrito

Se respetaron tal cual; quedan anotadas para revisar con el autor.

| Dónde | Texto |
|---|---|
| Prólogo | «¿que hay? mi vida» |
| Cap. 2 | «apagarte,probá» |
| Cap. 3 | «bar.Por miedo.Por la vida que no alcanza.Por no llegar fin de mes Por las deudas.» |
| Cap. 3 | «lagrimas» · «Dónde duele.» |
| Cap. 3 | «No como me gustaría.7» |
| Cap. 4 | «ridícula nada tiene lógica» · «existe Apurados» · «. unas pocas» · «habitandome, Incluso» |
| Cap. 5 | «mañana.Todavía» · «ciego,que» · «detrás,que» · «cosas,pero» · «otra vez,aunque» · «amar,a pesar» |
| Cap. 7 | «construí  esos castillos de papel» (doble espacio) |
| Cap. 8 | «los mios» · «Rita..» · «algun día» |
| Cap. 9 | «permiso Los árboles» · «todo lo anterior  el dolor» (doble espacio) |

## Cómo probarlo

```bash
node web/tools/build.cjs
node web/tools/check.cjs --scenario trials,book,basements --viewport both
node web/tools/check.cjs --scenario smoke,cabin,mini --viewport both
```

En el sitio, el panel DEV (`#dev`) tiene:
- **Desafíos:** resolver este, resolver 8, resolver 9, reiniciar progreso;
- **Subsuelos (sin candado):** para revisar sin jugar.
