import { useId, useState, type FormEvent } from 'react';
import type { SubscribeResponse } from '../../../shared/api-types.ts';
import { site } from '../../../shared/site.config.ts';
import { subscribe } from '../core/api.ts';

type FieldErrors = Partial<Record<'email' | 'name' | 'consent' | 'phone', string>>;
type Result = { kind: 'success' | 'duplicate' | 'error'; msg: string } | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function SubscribeForm({ released }: { released: boolean }) {
  const id = useId();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(false);
  const [phone, setPhone] = useState('');
  const [waConsent, setWaConsent] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result>(null);

  const t = site.texts;
  const title = released ? 'Novedades del lanzamiento' : t.formTitle;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (sending) return;
    const local: FieldErrors = {};
    if (!email.trim()) local.email = 'Necesitamos tu email.';
    else if (!EMAIL_RE.test(email.trim())) local.email = 'Ese email no parece válido.';
    if (!consent) local.consent = 'Tenés que aceptar recibir novedades para anotarte.';
    if (name.trim().length > 80) local.name = 'El nombre es demasiado largo (máx. 80).';
    setErrors(local);
    setResult(null);
    if (Object.keys(local).length) {
      document.getElementById(`${id}-${Object.keys(local)[0]}`)?.focus();
      return;
    }
    setSending(true);
    const res: SubscribeResponse = await subscribe({
      email: email.trim(),
      name: name.trim() || undefined,
      consent,
      phone: site.features.whatsappOptIn ? phone.trim() || undefined : undefined,
      whatsappConsent: site.features.whatsappOptIn ? waConsent : undefined,
      website,
    });
    setSending(false);
    if (res.ok) {
      setResult({ kind: res.status === 'created' ? 'success' : 'duplicate', msg: res.status === 'created' ? t.formSuccess : t.formDuplicate });
      setErrors({});
      return;
    }
    if (res.error === 'validation') {
      setErrors(res.fields);
      return;
    }
    setResult({
      kind: 'error',
      msg:
        res.error === 'rate_limited'
          ? 'Demasiados intentos seguidos. Esperá unos minutos y probá de nuevo.'
          : 'No pudimos guardar tu inscripción. No quedaste anotado: probá de nuevo en un rato.',
    });
  }

  if (result && result.kind !== 'error') {
    return (
      <section className="card form-done" aria-labelledby={`${id}-t`}>
        <h2 id={`${id}-t`} className="card__title">
          {title}
        </h2>
        <p role="status" className={`form-msg form-msg--${result.kind}`}>
          {result.msg}
        </p>
      </section>
    );
  }

  const err = (k: keyof FieldErrors) =>
    errors[k] ? (
      <p className="field__error" id={`${id}-${k}-err`}>
        {errors[k]}
      </p>
    ) : null;

  return (
    <section className="card" aria-labelledby={`${id}-t`}>
      <h2 id={`${id}-t`} className="card__title">
        {title}
      </h2>
      {!released && <p className="card__sub">{t.formSubtitle}</p>}
      <form className="form" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor={`${id}-email`}>
            Email <span aria-hidden="true">*</span>
            <span className="sr-only">(obligatorio)</span>
          </label>
          <input
            id={`${id}-email`}
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? `${id}-email-err` : undefined}
          />
          {err('email')}
        </div>
        <div className="field">
          <label htmlFor={`${id}-name`}>
            Nombre <span className="muted">(opcional)</span>
          </label>
          <input
            id={`${id}-name`}
            type="text"
            autoComplete="given-name"
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? `${id}-name-err` : undefined}
          />
          {err('name')}
        </div>

        {site.features.whatsappOptIn && (
          <div className="field">
            <label htmlFor={`${id}-phone`}>
              WhatsApp <span className="muted">(opcional)</span>
            </label>
            <input
              id={`${id}-phone`}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+598…"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={!!errors.phone}
            />
            {phone.trim() && (
              <label className="check">
                <input type="checkbox" checked={waConsent} onChange={(e) => setWaConsent(e.target.checked)} />
                <span>Acepto recibir avisos por WhatsApp.</span>
              </label>
            )}
            {err('phone')}
          </div>
        )}

        <div className="field">
          <label className="check" htmlFor={`${id}-consent`}>
            <input
              id={`${id}-consent`}
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              aria-invalid={!!errors.consent}
              aria-describedby={errors.consent ? `${id}-consent-err` : undefined}
            />
            <span>{t.consentLabel}</span>
          </label>
          {err('consent')}
        </div>

        {/* Honeypot: invisible para personas, tentador para bots */}
        <div className="hp" aria-hidden="true">
          <label>
            Web
            <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </label>
        </div>

        <button className="btn btn--primary" type="submit" disabled={sending} aria-busy={sending}>
          {sending ? 'Guardando…' : released ? 'Anotarme' : t.formTitle}
        </button>
        {result?.kind === 'error' && (
          <p role="alert" className="form-msg form-msg--error">
            {result.msg}
          </p>
        )}
      </form>
    </section>
  );
}
