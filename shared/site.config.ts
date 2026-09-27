/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CONFIGURACIÓN CENTRAL — "El Lado Oscuro del Mono" · Monos del Ambiente
 * ─────────────────────────────────────────────────────────────────────────────
 *  Este archivo lo leen el navegador Y el servidor. Todo lo que pongas acá es
 *  PÚBLICO (queda en el bundle). Por eso los nombres de los archivos de audio
 *  NO van acá: están en `server/audio.config.ts`, que solo lee el servidor.
 *
 *  Después de editar: en desarrollo se recarga solo; en producción, `npm run build`
 *  y reiniciar el servidor.
 */

export type Mood = {
  /** Color principal de la luz de la cabina en ese piso (hex). */
  color: string;
  /** Color secundario para el degradé del techo (hex). */
  glow: string;
  /** "prisma" = luz arcoíris (como el haz de la portada). */
  special?: 'prisma';
};

export type Track = {
  /** Identificador estable (se usa en la URL del audio). No lo cambies una vez publicado. */
  id: string;
  title: string;
  mood: Mood;
  /** Pensado para próximas versiones: letras, créditos, videoclip, mundo visual propio. */
  extras?: {
    lyrics?: string;
    credits?: string;
    videoUrl?: string;
  };
};

export const site = {
  band: 'Monos del Ambiente',
  album: 'El Lado Oscuro del Mono',

  /**
   * ESTRENO — hora de Uruguay (America/Montevideo, UTC-3).
   * Mientras `date` sea null se muestra "Próximamente" y el ascensor queda cerrado.
   * Ejemplo: date: '2026-11-20', time: '21:00'
   */
  release: {
    date: null as string | null, // 'AAAA-MM-DD'
    time: '21:00', // 'HH:MM', 24 h
    timeZone: 'America/Montevideo',
  },

  texts: {
    /** Mensaje de intriga en la puerta cerrada. */
    teaser: 'Algo se mueve entre pisos. Todavía no abre.',
    teaserSecondary: 'Nueve paradas. Un solo viaje. Subís cuando abra la puerta.',
    comingSoon: 'Próximamente',
    releasedHeadline: 'La puerta está abierta.',
    enterCta: 'Entrar al ascensor',
    formTitle: 'Avisame cuando se abra',
    formSubtitle: 'Te escribimos cuando se abra la puerta.',
    consentLabel:
      'Acepto recibir novedades de Monos del Ambiente sobre el disco y el show de lanzamiento. Me puedo dar de baja cuando quiera.',
    /** Versión del texto de consentimiento: se guarda junto a cada inscripción. Subila si cambiás el texto. */
    consentVersion: 'v1-2026-09',
    formSuccess: 'Listo. Estás en la lista del ascensor.',
    formDuplicate: 'Ya estabas en la lista. No hace falta tocar el botón dos veces (aunque todos lo hacemos).',
    callButtonClosed: 'Llamaste al ascensor. Está afinando en el subsuelo. Volvé en el estreno.',
    insideHint: 'Elegí un piso. Cada piso es una canción.',
    endOfAlbum: 'Fin del recorrido. Podés volver a subir cuando quieras.',
    demoAudioNotice: 'AUDIO DE PRUEBA — no es el disco real',
    alarm: 'Tocaste la alarma. Nadie viene. Seguí escuchando.',
    about:
      'El Lado Oscuro del Mono es el nuevo disco de Monos del Ambiente. Nueve canciones, nueve pisos. Entrá, apretá un botón y dejate llevar.',
    credits: 'Créditos completos: próximamente.',
    /** Carteles con humor dentro de la cabina. */
    cabinSigns: [
      'CAPACIDAD MÁX.: 5 MONOS',
      'Prohibido dar de comer a los músicos',
      'Última inspección: nunca',
    ],
  },

  /**
   * Enlaces. Los que tengan url vacía no se muestran.
   * Completá con las URLs reales de la banda.
   */
  links: [
    { label: 'Instagram', url: '' },
    { label: 'Spotify', url: '' },
    { label: 'YouTube', url: '' },
    { label: 'Bandcamp', url: '' },
  ] as { label: string; url: string }[],

  /** Imágenes (rutas dentro de client/public). */
  images: {
    cover: '/assets/portada.jpg',
    coverSmall: '/assets/portada-512.jpg',
    ogImage: '/assets/og.jpg',
    /** Dedos/huellas que sostienen el disco (parte del concepto; apagadas por ahora). */
    fingerprintLeft: '/assets/huella-izq.webp',
    fingerprintRight: '/assets/huella-der.webp',
  },

  /** Escena del ascensor. */
  scene: {
    /**
     * Modelo GLB exportado desde Blender (ej: '/models/ascensor.glb'). Mientras sea null se usa el
     * ascensor provisional de geometrías simples. Ver docs/MODELO-3D.md para los nombres requeridos.
     */
    modelUrl: null as string | null,
    /** Intentar 3D cuando el dispositivo lo permite (si no, se usa la escena 2D). */
    prefer3D: true,
    /** Tope de densidad de píxeles del render 3D (1 = más liviano). */
    maxPixelRatio: 1.5,
  },

  features: {
    /** Muestra las huellas a los costados del ascensor. */
    fingerprints: false,
    /** Campo opcional de teléfono para avisos por WhatsApp (los envíos quedan fuera del MVP). */
    whatsappOptIn: false,
  },

  /**
   * CANCIONES — el orden de este listado ES el orden de los pisos (1, 2, 3…).
   * Para reordenar, mové las líneas. Los audios se asignan por `id` en server/audio.config.ts.
   * Los colores recorren el espectro del prisma de la portada: rojo → violeta.
   */
  tracks: [
    { id: 'en-una', title: 'En una', mood: { color: '#ff5a4e', glow: '#7a1d17' } },
    { id: 'que-te-esta-pasando', title: 'Qué te está pasando', mood: { color: '#ff9442', glow: '#7a3a0c' } },
    { id: 'pato', title: 'Pato', mood: { color: '#ffd24a', glow: '#735a0a' } },
    { id: 'explotar', title: 'Explotar', mood: { color: '#c9ec4c', glow: '#4d600e' } },
    { id: 'que-carajo', title: 'Qué carajo?', mood: { color: '#5fe07a', glow: '#165c28' } },
    { id: 'portales', title: 'Portales', mood: { color: '#45d9cf', glow: '#0e5753' } },
    { id: 'casi-perdido', title: 'Casi Perdido', mood: { color: '#5aa8ff', glow: '#12386b' } },
    { id: 'no-me-perdones', title: 'No me perdones', mood: { color: '#8c82ff', glow: '#2c2470' } },
    {
      id: 'el-lado-oscuro-del-mono',
      title: 'El Lado Oscuro del Mono',
      mood: { color: '#d59bff', glow: '#4a1f6e', special: 'prisma' },
    },
  ] as Track[],
};

export type SiteConfig = typeof site;
