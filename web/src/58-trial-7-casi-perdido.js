// Floor 7 · «Casi Perdido» · chapter 8 · fire.
// A hearth with weak embers and a pile of cards: what the system asks for and what the chapter wants to live.
// Deciding what deserves attention — the first ones to the fire, the others by your side — lights the hearth.
// Then comes what the chapter asks for: sitting in front of it and watching the embers go out (a slow count).
TRIALS['casi-perdido'] = {
  approach: 'ACERCARTE AL FUEGO',
  title: 'El fuego del hogar',
  clue: 'Yo quiero vivir de verdad. Tomar unos mates. Sentarme frente al fuego del hogar y mirar cómo se apagan las brasas.\n… decidir qué merece nuestra atención.',
  hints: [
    'Hay cosas que piden atención y cosas que la merecen.',
    'Al fuego va lo que te hace correr; a tu lado, lo que el capítulo quiere vivir.',
    'Producir, el rendimiento, la culpa, el objetivo y la distracción van al fuego. Al final, quedate mirando las brasas.',
  ],
  done: 'Hoy estás triste. Y no está mal.',
  walkthrough: ['fuego', 'lado', 'fuego', 'lado', 'fuego', 'lado', 'fuego', 'lado', 'fuego', 'lado', { hold: 'brasas' }],
  build(T) {
    const IV = '#ebe5d5', AC = T.track.visualAccent;
    const deck = [
      ['Producir', 'fuego'], ['Unos mates', 'lado'], ['La culpa de no estar produciendo', 'fuego'], ['Pasear con Rita', 'lado'], ['El rendimiento', 'fuego'],
      ['Hacer música con amigos', 'lado'], ['Correr detrás del objetivo', 'fuego'], ['Abrazar a mi novia', 'lado'], ['Estar distraído', 'fuego'], ['Volver a la naturaleza de las cosas', 'lado'],
    ];
    const svg = T.svg(320, 160, 'Un hogar a leña con brasas débiles.');
    T.el('path', { d: 'M 90 150 V 70 Q 160 20 230 70 V 150', fill: 'none', stroke: IV, 'stroke-width': 1.5 }, svg);
    T.el('path', { d: 'M 112 146 H 208', stroke: '#9a6a48', 'stroke-width': 3 }, svg);
    const flame = T.el('path', { d: 'M 160 144 q -22 -16 -6 -40 q 2 14 10 10 q -4 -18 8 -30 q 0 22 12 30 q 4 -10 0 -16 q 18 20 -4 46 z', fill: '#ff8a3d', 'fill-opacity': 0.35, stroke: '#ffb070', 'stroke-width': 1 }, svg);
    flame.setAttribute('transform', 'translate(160 144) scale(0.45) translate(-160 -144)');
    const side = T.el('g', {}, svg);
    const left = T.text(svg, 160, 14, '', { 'font-size': 10, opacity: 0.75 });
    const card = h('p', { class: 'tr-clue', style: 'border-left:0;padding:0;text-align:center;font-size:19px;margin:0 0 8px' });
    T.stage.append(card);
    const acts = T.acts();
    let at = 0, burned = 0, kept = 0;
    const grow = () => {
      const k = 0.45 + 0.55 * (burned / 5);
      flame.setAttribute('transform', `translate(160 144) scale(${k.toFixed(2)}) translate(-160 -144)`);
      flame.setAttribute('fill-opacity', (0.35 + 0.5 * (burned / 5)).toFixed(2));
      T.progress((burned + kept) / deck.length * 0.8);
    };
    const show = () => {
      if (at >= deck.length) { card.textContent = ''; left.textContent = ''; return; }
      card.textContent = `«${deck[at][0]}»`;
      left.textContent = `QUEDAN ${deck.length - at}`;
    };
    const decide = (where) => {
      if (at >= deck.length) return;
      const [name, want] = deck[at];
      if (where !== want) {
        T.say(want === 'lado' ? `${name}: eso no se quema. Es lo que querés vivir.` : `${name}: se sienta al lado, pero no da calor.`);
        deck.push(deck.splice(at, 1)[0]); show(); // it comes back later
        return;
      }
      if (want === 'fuego') burned++;
      else { T.text(side, 40 + (kept % 2) * 240, 60 + Math.floor(kept / 2) * 18, name.split(' ').slice(0, 2).join(' '), { 'font-size': 9, opacity: 0.85 }); kept++; }
      at++; grow(); show();
      if (at < deck.length) { T.say(want === 'fuego' ? `${name}: al fuego.` : `${name}: a tu lado.`); return; }
      fire.hidden = true; lado.hidden = true; watch.hidden = false; watch.focus({ preventScroll: true });
      T.say('El fuego del hogar está encendido. Ahora sentate a mirar cómo se apagan las brasas.');
    };
    const fire = T.btn(acts, 'AL FUEGO', 'fuego', () => decide('fuego'));
    const lado = T.btn(acts, 'A MI LADO', 'lado', () => decide('lado'));
    const watch = T.btn(acts, 'MIRAR LAS BRASAS', 'brasas', (b) => {
      T.say('Las brasas se apagan despacio.');
      T.hold(b, 5000, 'MIRANDO', () => { flame.setAttribute('fill-opacity', 0.25); T.progress(1); T.solve(); }, () => T.say('Te levantaste. Las brasas siguen ahí.'));
    }, { wide: true, keepHold: true });
    watch.hidden = true;
    show(); grow();
    T.say('Diez cosas. Decidí qué merece tu atención.');
  },
};
