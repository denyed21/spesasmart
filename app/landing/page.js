'use client';
import { useState } from 'react';

export default function Landing() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  }

  const s = {
    wrap: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#1a1a1a', background: '#fff' },
    nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', maxWidth: 680, margin: '0 auto' },
    logo: { fontSize: 20, fontWeight: 700, color: '#0F6E56' },
    navBtn: { background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' },
    hero: { textAlign: 'center', padding: '60px 24px 48px', maxWidth: 560, margin: '0 auto' },
    badge: { display: 'inline-block', background: '#E1F5EE', color: '#0F6E56', fontSize: 12, fontWeight: 600, padding: '4px 14px', borderRadius: 99, marginBottom: 20 },
    h1: { fontSize: 38, fontWeight: 800, lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.02em' },
    h1green: { color: '#1D9E75' },
    sub: { fontSize: 17, color: '#666', lineHeight: 1.7, marginBottom: 36 },
    ctaRow: { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 },
    ctaBtn: { background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 14, padding: '15px 28px', fontSize: 16, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' },
    ctaSecondary: { background: 'transparent', color: '#777', border: '1.5px solid #e0e0d8', borderRadius: 14, padding: '15px 28px', fontSize: 16, fontWeight: 500, cursor: 'pointer' },
    ctaNote: { fontSize: 12, color: '#bbb' },
    stats: { background: '#f8f8f5', padding: '40px 24px', margin: '0' },
    statsInner: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 560, margin: '0 auto' },
    stat: { textAlign: 'center' },
    statNum: { fontSize: 32, fontWeight: 800, color: '#0F6E56', display: 'block' },
    statLabel: { fontSize: 13, color: '#888', marginTop: 4 },
    section: { padding: '56px 24px', maxWidth: 560, margin: '0 auto' },
    sectionTitle: { fontSize: 26, fontWeight: 700, textAlign: 'center', marginBottom: 36, letterSpacing: '-0.01em' },
    steps: { display: 'flex', flexDirection: 'column', gap: 20 },
    step: { display: 'flex', gap: 16, alignItems: 'flex-start' },
    stepIcon: { width: 52, height: 52, background: '#E1F5EE', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 },
    stepTitle: { fontSize: 16, fontWeight: 600, marginBottom: 4 },
    stepDesc: { fontSize: 14, color: '#888', lineHeight: 1.6 },
    divider: { height: 1, background: '#f0f0ec', margin: '0 24px' },
    freeVsPro: { padding: '56px 24px', background: '#f8f8f5' },
    freeVsProInner: { maxWidth: 560, margin: '0 auto' },
    plans: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 32 },
    plan: (pro) => ({ background: pro ? '#1a1a2e' : '#fff', borderRadius: 18, padding: '24px', border: pro ? 'none' : '1px solid #efefeb' }),
    planTitle: (pro) => ({ fontSize: 14, fontWeight: 700, color: pro ? '#FFD700' : '#1a1a1a', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }),
    planPrice: (pro) => ({ fontSize: 28, fontWeight: 800, color: pro ? '#fff' : '#1a1a1a', marginBottom: 16 }),
    planFeature: (pro) => ({ fontSize: 13, color: pro ? 'rgba(255,255,255,0.75)' : '#666', marginBottom: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }),
    waitlist: { padding: '56px 24px', maxWidth: 480, margin: '0 auto', textAlign: 'center' },
    input: { width: '100%', padding: '14px 16px', border: '1.5px solid #e0e0d8', borderRadius: 12, fontSize: 15, marginBottom: 10, outline: 'none' },
    submitBtn: { width: '100%', padding: '14px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer' },
    footer: { textAlign: 'center', padding: '32px 24px', color: '#bbb', fontSize: 13, borderTop: '1px solid #f0f0ec' },
  };

  return (
    <div style={s.wrap}>

      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.logo}>SpesaSmart 🛒</div>
        <a href="/" style={s.navBtn}>Prova gratis</a>
      </nav>

      {/* Hero */}
      <div style={s.hero}>
        <div style={s.badge}>🇮🇹 Fatto per le famiglie italiane</div>
        <h1 style={s.h1}>
          Smetti di pagare<br />
          <span style={s.h1green}>troppo al supermercato</span>
        </h1>
        <p style={s.sub}>
          Fotografi lo scontrino, l'AI legge i prodotti e ti dice subito dove avresti speso meno. In media le famiglie risparmiano <strong>€847 all'anno</strong>.
        </p>
        <div style={s.ctaRow}>
          <a href="/" style={s.ctaBtn}>📷 Prova subito — è gratis</a>
        </div>
        <div style={s.ctaNote}>Nessuna registrazione · Funziona da browser</div>
      </div>

      {/* Stats */}
      <div style={s.stats}>
        <div style={s.statsInner}>
          <div style={s.stat}>
            <span style={s.statNum}>€847</span>
            <span style={s.statLabel}>risparmio medio annuo</span>
          </div>
          <div style={s.stat}>
            <span style={s.statNum}>6</span>
            <span style={s.statLabel}>supermercati confrontati</span>
          </div>
          <div style={s.stat}>
            <span style={s.statNum}>3s</span>
            <span style={s.statLabel}>per leggere lo scontrino</span>
          </div>
        </div>
      </div>

      {/* Come funziona */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Come funziona</h2>
        <div style={s.steps}>
          {[
            ['📷', 'Fotografi lo scontrino', "Scatti una foto allo scontrino della tua ultima spesa. L'AI riconosce tutti i prodotti e i prezzi automaticamente."],
            ['🔍', 'Confrontiamo i prezzi', 'Il nostro sistema confronta ogni prodotto su Esselunga, Conad, Carrefour, Eurospin, Lidl e Coop.'],
            ['💰', 'Vai al supermercato più conveniente', "Ti mostriamo dove avresti speso meno. Con un tap vai direttamente al carrello del supermercato scelto."],
          ].map(([icon, title, desc]) => (
            <div key={title} style={s.step}>
              <div style={s.stepIcon}>{icon}</div>
              <div>
                <div style={s.stepTitle}>{title}</div>
                <div style={s.stepDesc}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={s.divider} />

      {/* Free vs Pro */}
      <div style={s.freeVsPro}>
        <div style={s.freeVsProInner}>
          <h2 style={{ ...s.sectionTitle, textAlign: 'center' }}>Gratis o Pro</h2>
          <div style={s.plans}>
            <div style={s.plan(false)}>
              <div style={s.planTitle(false)}>Free</div>
              <div style={s.planPrice(false)}>€0</div>
              {[
                '✓ Lettura scontrino AI',
                '✓ Confronto supermercati',
                '✓ Miglior offerta in evidenza',
                '✓ Storico scansioni',
              ].map(f => <div key={f} style={s.planFeature(false)}>{f}</div>)}
            </div>
            <div style={s.plan(true)}>
              <div style={s.planTitle(true)}>Pro ⭐</div>
              <div style={s.planPrice(true)}>€2.99<span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>/mese</span></div>
              {[
                '✓ Tutto il piano Free',
                '✓ Carrelli multipli ottimizzati',
                '✓ Lista spesa ricorrente',
                '✓ Alert offerte',
              ].map(f => <div key={f} style={s.planFeature(true)}>{f}</div>)}
            </div>
          </div>
        </div>
      </div>

      {/* Waitlist */}
      <div style={s.waitlist}>
        <h2 style={{ ...s.sectionTitle, marginBottom: 12 }}>Ricevi gli aggiornamenti</h2>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 28 }}>Lascia la tua email per sapere quando aggiungiamo nuovi supermercati e funzionalità.</p>
        {submitted ? (
          <div style={{ background: '#E1F5EE', borderRadius: 14, padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#0F6E56' }}>Sei nella lista!</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Ti avviseremo presto.</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input style={s.input} type="email" placeholder="la-tua@email.it" value={email} onChange={e => setEmail(e.target.value)} required />
            <button style={s.submitBtn} type="submit">Iscriviti alla waitlist →</button>
          </form>
        )}
      </div>

      {/* Footer */}
      <div style={s.footer}>
        SpesaSmart © 2026 · <a href="/" style={{ color: '#bbb' }}>Apri l'app</a>
      </div>

    </div>
  );
}
