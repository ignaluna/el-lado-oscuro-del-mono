import type { SubscribeRequest } from '../shared/api-types.ts';

export type ValidSubscription = {
  email: string;
  name: string | null;
  phone: string | null;
  whatsappConsent: boolean;
};

type Fields = Partial<Record<'email' | 'name' | 'consent' | 'phone', string>>;

// Suficiente para un formulario: una @, dominio con punto, sin espacios.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateSubscription(
  body: unknown,
  opts: { whatsappEnabled: boolean },
): { ok: true; value: ValidSubscription; bot: boolean } | { ok: false; fields: Fields } {
  const b = (typeof body === 'object' && body !== null ? body : {}) as Partial<Record<keyof SubscribeRequest, unknown>>;
  const fields: Fields = {};

  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  if (!email) fields.email = 'Necesitamos tu email.';
  else if (email.length > 254 || !EMAIL_RE.test(email)) fields.email = 'Ese email no parece válido.';

  let name: string | null = null;
  if (b.name !== undefined && b.name !== null && b.name !== '') {
    if (typeof b.name !== 'string') fields.name = 'Nombre inválido.';
    else {
      name = b.name.replace(/\s+/g, ' ').trim().slice(0, 200);
      if (name.length > 80) fields.name = 'El nombre es demasiado largo (máx. 80).';
      if (!name) name = null;
    }
  }

  if (b.consent !== true) fields.consent = 'Tenés que aceptar recibir novedades para anotarte.';

  let phone: string | null = null;
  let whatsappConsent = false;
  if (opts.whatsappEnabled && typeof b.phone === 'string' && b.phone.trim()) {
    const digits = b.phone.replace(/[\s()-]/g, '');
    if (!/^\+?\d{8,15}$/.test(digits)) fields.phone = 'Teléfono inválido (usá formato +598…).';
    else {
      phone = digits;
      whatsappConsent = b.whatsappConsent === true;
      if (!whatsappConsent) fields.phone = 'Marcá el consentimiento para avisos por WhatsApp o dejá el teléfono vacío.';
    }
  }

  if (Object.keys(fields).length) return { ok: false, fields };
  const bot = typeof b.website === 'string' && b.website.trim() !== '';
  return { ok: true, value: { email, name, phone, whatsappConsent }, bot };
}
