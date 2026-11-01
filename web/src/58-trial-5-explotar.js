// Floor 5 · «Explotar» · chapter 6 · inherited pain.
// A letter to the grandmother, under pressure: the needle climbs with every silence that was inherited. Two blanks
// hold the same words that were never said in time. Writing them — any capitals, accents or spaces — lets the
// pressure out, and the threads that wrapped the letter turn into steam.
TRIALS['explotar'] = {
  approach: 'ACERCARTE A LA CARTA',
  title: 'Una carta que no se mandó',
  clue: 'Pero te juro que estoy tratando de ser mejor. De no callar lo que siento.',
  hints: [
    'La presión es lo que no se dijo. La carta tiene dos huecos con las mismas palabras.',
    'Es lo que se le dice a quien se quiere, y que acá llegó tarde.',
    'Escribí «te amo».',
  ],
  done: 'Lo dijiste. La presión se va por donde entró la palabra.',
  walkthrough: [{ type: 'te amo', act: 'escribir' }],
  build(T) {
    const IV = '#ebe5d5', AC = T.track.visualAccent;
    const svg = T.svg(320, 178, 'Una carta envuelta en hilos oscuros y un manómetro con la aguja cerca del rojo.');
    // the letter
    T.el('rect', { x: 14, y: 8, width: 200, height: 164, fill: 'none', stroke: IV, 'stroke-width': 1.3 }, svg);
    const lines = [
      ['Me arrepiento de no haberte', 0], ['abrazado más, de no haberte', 0], ['dicho', 1], ['cuando todavía podía hacerlo.', 0],
      ['', 0], ['Te escribo porque todavía', 0], ['', 2], ['aunque no haya sabido', 0], ['cómo demostrarlo.', 0],
    ];
    const blanks = [];
    lines.forEach(([str, blank], i) => {
      const y = 26 + i * 16;
      if (blank === 1) { T.text(svg, 22, y, str, { 'text-anchor': 'start', 'font-size': 11.5 }); blanks.push(T.text(svg, 66, y, '__________', { 'text-anchor': 'start', 'font-size': 11.5, fill: AC })); }
      else if (blank === 2) { blanks.push(T.text(svg, 22, y, '__________,', { 'text-anchor': 'start', 'font-size': 11.5, fill: AC })); }
      else T.text(svg, 22, y, str, { 'text-anchor': 'start', 'font-size': 11.5 });
    });
    const threads = T.el('path', { d: 'M 8 40 C 80 0 150 90 220 30 M 6 120 C 70 170 160 60 222 150 M 30 4 C 10 90 120 120 60 176', fill: 'none', stroke: AC, 'stroke-width': 2, 'stroke-opacity': 0.55 }, svg);
    // the gauge
    T.el('path', { d: 'M 238 120 A 36 36 0 0 1 310 120', fill: 'none', stroke: IV, 'stroke-width': 1.4 }, svg);
    T.el('path', { d: 'M 296 96 A 36 36 0 0 1 310 120', fill: 'none', stroke: '#d0675a', 'stroke-width': 3 }, svg);
    const needle = T.el('line', { x1: 274, y1: 120, x2: 274, y2: 88, stroke: IV, 'stroke-width': 2, transform: 'rotate(62 274 120)' }, svg);
    if (!T.reduced) T.el('animateTransform', { attributeName: 'transform', type: 'rotate', values: '58 274 120;66 274 120;58 274 120', dur: '1.3s', repeatCount: 'indefinite' }, needle);
    T.text(svg, 274, 140, 'PRESIÓN', { 'font-size': 9, 'letter-spacing': 2, opacity: 0.7 });
    const steam = T.el('g', { opacity: 0 }, svg);
    for (let i = 0; i < 4; i++) T.el('path', { d: `M ${250 + i * 14} 70 q -8 -14 0 -26 q 8 -12 0 -24`, fill: 'none', stroke: IV, 'stroke-width': 1.2 }, steam);
    T.progress(0.2);
    let tries = 0;
    T.field('Lo que no se dijo', 'escribir', (value, input) => {
      const v = T.norm(value);
      if (!v) { T.say('Todavía no escribiste nada. No hay apuro.'); return; }
      if (v === 'teamo' || v === 'teamoabuela' || v === 'abuelateamo') {
        for (const b of blanks) b.textContent = b.textContent.endsWith(',') ? 'te amo,' : 'te amo';
        threads.style.display = 'none'; steam.setAttribute('opacity', 1);
        needle.replaceChildren(); needle.setAttribute('transform', 'rotate(-62 274 120)');
        T.solve();
        return;
      }
      tries++;
      T.progress(0.2 + Math.min(0.3, tries * 0.05));
      T.say(tries < 2 ? 'Eso no es lo que quedó sin decir. La aguja sube un poco.' : 'Leé las dos frases con el hueco: es lo mismo en las dos.');
      input.select();
    });
  },
};
