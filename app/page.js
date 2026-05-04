'use client';
import { useState, useRef, useEffect } from 'react';

const MARKETS = [
  { id: 'esselunga', name: 'Esselunga', emoji: '🟢', mult: 1.00, url: 'https://www.esselunga.it/commerce/cart' },
  { id: 'conad',     name: 'Conad',     emoji: '🔵', mult: 0.95, url: 'https://www.conad.it/carrello' },
  { id: 'carrefour', name: 'Carrefour', emoji: '🔴', mult: 0.98, url: 'https://www.carrefour.it/spesa-online/carrello' },
  { id: 'eurospin',  name: 'Eurospin',  emoji: '🟡', mult: 0.82, url: 'https://www.eurospin.it' },
  { id: 'lidl',      name: 'Lidl',      emoji: '⚪', mult: 0.85, url: 'https://www.lidl.it/spesa-online' },
  { id: 'coop',      name: 'Coop',      emoji: '🟣', mult: 0.97, url: 'https://www.lacoop.it' },
];

const DEMO = [
  { name: 'Latte intero 1L', price: 1.49 },
  { name: 'Pane integrale 500g', price: 2.20 },
  { name: 'Pasta Barilla 500g', price: 1.89 },
  { name: 'Pomodori pelati 400g', price: 0.99 },
  { name: 'Olio EVO 750ml', price: 8.50 },
  { name: 'Prosciutto cotto 100g', price: 2.30 },
  { name: 'Yogurt greco 150g', price: 1.10 },
  { name: 'Acqua minerale 1.5L', price: 0.35 },
];

const ONBOARDING = [
  {
    emoji: '🛒',
    title: 'Benvenuto in SpesaSmart',
    desc: 'Fotografa lo scontrino della tua spesa e scopri subito dove potresti spendere meno — supermercato per supermercato.',
    highlight: null,
  },
  {
    emoji: '📸',
    title: 'Come funziona',
    desc: null,
    steps: [
      { icon: '📷', text: 'Fotografi lo scontrino' },
      { icon: '🤖', text: "L'AI legge tutti i prodotti" },
      { icon: '💰', text: 'Trovi il supermercato più conveniente' },
      { icon: '🛒', text: 'Vai al carrello e risparmi' },
    ],
  },
  {
    emoji: '🏪',
    title: 'I tuoi supermercati',
    desc: 'Scegli quelli vicino a te. Potrai cambiarli in qualsiasi momento.',
    isMarkets: true,
  },
];

export default function Home() {
  const [onboarded, setOnboarded] = useState(null);
  const [onboardStep, setOnboardStep] = useState(0);
  const [onboardMarkets, setOnboardMarkets] = useState(new Set(['esselunga', 'conad', 'eurospin']));

  const [step, setStep] = useState('upload');
  const [products, setProducts] = useState([]);
  const [selectedMarkets, setSelectedMarkets] = useState(new Set(['esselunga', 'conad', 'eurospin']));
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [showProModal, setShowProModal] = useState(false);
  const [expandedMarket, setExpandedMarket] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    const done = localStorage.getItem('spesasmart_onboarded');
    setOnboarded(!!done);
    const h = localStorage.getItem('spesasmart_history');
    if (h) setHistory(JSON.parse(h));
  }, []);

  function finishOnboarding() {
    localStorage.setItem('spesasmart_onboarded', '1');
    setSelectedMarkets(new Set(onboardMarkets));
    setOnboarded(true);
  }

  function toggleOnboardMarket(id) {
    setOnboardMarkets(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setLoading('Lettura scontrino in corso...');
    setStep('loading');
    const base64 = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(',')[1]);
      r.onerror = () => rej(new Error('Errore lettura file'));
      r.readAsDataURL(file);
    });
    try {
      const resp = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mediaType: file.type }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setProducts(data.products.map(p => ({ ...p, checked: true })));
      setStep('products');
    } catch (err) {
      setError(err.message || 'Errore nella lettura.');
      setStep('upload');
    }
    setLoading('');
  }

  function loadDemo() {
    setProducts(DEMO.map(p => ({ ...p, checked: true })));
    setStep('products');
  }

  function toggleMarket(id) {
    setSelectedMarkets(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleProduct(i) {
    setProducts(prev => prev.map((p, idx) => idx === i ? { ...p, checked: !p.checked } : p));
  }

  function doCompare() {
    const sel = products.filter(p => p.checked);
    if (sel.length === 0) { alert('Seleziona almeno un prodotto'); return; }
    if (selectedMarkets.size < 2) { alert('Seleziona almeno 2 supermercati'); return; }
    const markets = MARKETS.filter(m => selectedMarkets.has(m.id));
    const currentTotal = sel.reduce((s, p) => s + p.price, 0);
    const rows = sel.map(p => {
      const prices = markets.map(m => ({
        market: m.name, marketId: m.id, marketEmoji: m.emoji, marketUrl: m.url,
        price: parseFloat((p.price * m.mult * (0.93 + Math.random() * 0.14)).toFixed(2))
      }));
      const best = prices.reduce((a, b) => a.price < b.price ? a : b);
      return { product: p, prices, best };
    });
    const marketTotals = markets.map(m => {
      const total = rows.reduce((s, r) => {
        const p = r.prices.find(x => x.marketId === m.id);
        return s + (p ? p.price : 0);
      }, 0);
      return { ...m, total: parseFloat(total.toFixed(2)), saving: parseFloat((currentTotal - total).toFixed(2)) };
    }).sort((a, b) => a.total - b.total);
    const proCartMap = {};
    markets.forEach(m => { proCartMap[m.id] = []; });
    rows.forEach(r => { proCartMap[r.best.marketId].push({ name: r.product.name, price: r.best.price }); });
    const proCarts = markets.map(m => ({ ...m, items: proCartMap[m.id], total: parseFloat(proCartMap[m.id].reduce((s, p) => s + p.price, 0).toFixed(2)) })).filter(m => m.items.length > 0).sort((a, b) => b.items.length - a.items.length);
    const proTotal = parseFloat(rows.reduce((s, r) => s + r.best.price, 0).toFixed(2));
    const proSaving = parseFloat((currentTotal - proTotal).toFixed(2));
    const extraSaving = parseFloat((proSaving - marketTotals[0].saving).toFixed(2));
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }),
      products: sel.length,
      spentTotal: parseFloat(currentTotal.toFixed(2)),
      bestMarket: marketTotals[0].name,
      bestTotal: marketTotals[0].total,
      saving: marketTotals[0].saving,
    };
    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, 50);
      localStorage.setItem('spesasmart_history', JSON.stringify(updated));
      return updated;
    });
    setResults({ rows, currentTotal, markets, marketTotals, proCarts, proTotal, proSaving, extraSaving });
    setExpandedMarket(null);
    setStep('results');
  }

  const g = {
    wrap: { maxWidth: 560, margin: '0 auto', padding: '0 0 40px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#1a1a1a', background: '#f7f7f3', minHeight: '100vh' },
    inner: { padding: '20px 16px' },
    logo: { fontSize: 24, fontWeight: 700, color: '#0F6E56', marginBottom: 2 },
    tagline: { fontSize: 13, color: '#999', marginBottom: 24 },
    card: { background: '#fff', borderRadius: 18, padding: '18px', marginBottom: 12, border: '1px solid #efefeb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
    uploadZone: { border: '2px dashed #ddd', borderRadius: 14, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: '#fafaf8' },
    demoBtn: { marginTop: 12, width: '100%', padding: '13px', border: '1px solid #e0e0d8', borderRadius: 12, background: 'transparent', fontSize: 13, color: '#777', cursor: 'pointer' },
    lbl: { fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'block' },
    productRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: '1px solid #f5f5f2' },
    marketsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 },
    mCard: (sel) => ({ padding: '13px 8px', border: sel ? '2px solid #1D9E75' : '1px solid #e8e8e4', borderRadius: 12, cursor: 'pointer', textAlign: 'center', background: sel ? '#E1F5EE' : '#fff', transition: 'all 0.1s' }),
    btn: { width: '100%', padding: 15, background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 600, cursor: 'pointer' },
    back: { background: 'none', border: 'none', color: '#aaa', fontSize: 13, cursor: 'pointer', marginBottom: 14, padding: 0 },
    metrics: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 },
    metric: { background: '#f8f8f5', borderRadius: 12, padding: '12px 10px' },
    mLabel: { fontSize: 11, color: '#aaa', marginBottom: 4 },
    mVal: (gr) => ({ fontSize: 20, fontWeight: 700, color: gr ? '#0F6E56' : '#1a1a1a' }),
    spinner: { width: 36, height: 36, border: '3px solid #eee', borderTopColor: '#1D9E75', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' },
    err: { background: '#FEF2F2', color: '#991B1B', borderRadius: 10, padding: '12px 14px', marginBottom: 12, fontSize: 13 },
    cartCard: (best) => ({ background: best ? '#E1F5EE' : '#fff', border: best ? '2px solid #1D9E75' : '1px solid #e8e8e4', borderRadius: 16, padding: '16px', marginBottom: 10, position: 'relative' }),
    bestBadge: { position: 'absolute', top: -10, right: 14, background: '#0F6E56', color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 99 },
    cartBtn: (best) => ({ width: '100%', padding: '12px', background: best ? '#1D9E75' : 'transparent', color: best ? '#fff' : '#1D9E75', border: best ? 'none' : '1.5px solid #1D9E75', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 12 }),
    proBox: { background: '#1a1a2e', borderRadius: 18, padding: '20px', marginBottom: 12, position: 'relative', overflow: 'hidden' },
    proBtn: { width: '100%', padding: '13px', background: '#FFD700', color: '#1a1a1a', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
    proBadge: { display: 'inline-block', background: '#FFD700', color: '#1a1a1a', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, marginBottom: 10 },
    extraSaving: { background: '#1a1a2e', borderRadius: 12, padding: '14px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 },
  };

  // Loading iniziale
  if (onboarded === null) return null;

  // ONBOARDING
  if (!onboarded) {
    const current = ONBOARDING[onboardStep];
    const isLast = onboardStep === ONBOARDING.length - 1;
    return (
      <div style={{ ...g.wrap, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, paddingTop: 20 }}>
          {ONBOARDING.map((_, i) => (
            <div key={i} style={{ width: i === onboardStep ? 24 : 8, height: 8, borderRadius: 4, background: i === onboardStep ? '#1D9E75' : '#ddd', transition: 'all 0.3s' }} />
          ))}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px 24px', animation: 'fadeIn 0.35s ease' }} key={onboardStep}>
          <div style={{ fontSize: 64, textAlign: 'center', marginBottom: 24 }}>{current.emoji}</div>
          <div style={{ fontSize: 26, fontWeight: 700, textAlign: 'center', marginBottom: 12, lineHeight: 1.3 }}>{current.title}</div>

          {current.desc && (
            <div style={{ fontSize: 15, color: '#777', textAlign: 'center', lineHeight: 1.7, marginBottom: 32 }}>{current.desc}</div>
          )}

          {current.steps && (
            <div style={{ marginBottom: 32 }}>
              {current.steps.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: i < current.steps.length - 1 ? '1px solid #f0f0ec' : 'none' }}>
                  <div style={{ width: 44, height: 44, background: '#E1F5EE', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{s.text}</div>
                </div>
              ))}
            </div>
          )}

          {current.isMarkets && (
            <div style={{ marginBottom: 32 }}>
              <div style={g.marketsGrid}>
                {MARKETS.map(m => (
                  <div key={m.id} style={g.mCard(onboardMarkets.has(m.id))} onClick={() => toggleOnboardMarket(m.id)}>
                    <div style={{ fontSize: 26 }}>{m.emoji}</div>
                    <div style={{ fontSize: 12, fontWeight: 500, marginTop: 5, color: '#1a1a1a' }}>{m.name}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: '#bbb', textAlign: 'center' }}>Selezionati: {onboardMarkets.size}</div>
            </div>
          )}
        </div>

        <div style={{ padding: '0 24px 40px' }}>
          <button style={g.btn} onClick={() => isLast ? finishOnboarding() : setOnboardStep(s => s + 1)}>
            {isLast ? '🚀 Inizia a risparmiare' : 'Continua →'}
          </button>
          {onboardStep > 0 && (
            <button style={{ ...g.btn, background: 'transparent', color: '#aaa', border: 'none', marginTop: 8, fontSize: 14 }} onClick={() => setOnboardStep(s => s - 1)}>
              ← Indietro
            </button>
          )}
          {onboardStep === 0 && (
            <button style={{ ...g.btn, background: 'transparent', color: '#bbb', border: 'none', marginTop: 8, fontSize: 13 }} onClick={finishOnboarding}>
              Salta
            </button>
          )}
        </div>
      </div>
    );
  }

  // APP PRINCIPALE
  const totalSaved = history.reduce((s, h) => s + h.saving, 0);
  const avgSaving = history.length > 0 ? totalSaved / history.length : 0;

  return (
    <div style={g.wrap}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={g.inner}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={g.logo}>SpesaSmart 🛒</div>
            <div style={g.tagline}>Risparmia sulla spesa</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginLeft: 24 }}>
            <button style={{ background: showHistory ? '#f0f0ec' : '#f0f0ec', border: 'none', borderRadius: 10, padding: '0 14px', height: 44, fontSize: 13, fontWeight: 500, color: showHistory ? '#1D9E75' : '#777', cursor: 'pointer', background: showHistory ? '#E1F5EE' : '#f0f0ec' }}
              onClick={() => { setShowHistory(true); setStep('upload'); setResults(null); }}>
              📊 Storico
            </button>
            <button style={{ border: 'none', borderRadius: 10, padding: '0 14px', height: 44, fontSize: 13, fontWeight: 500, color: !showHistory ? '#fff' : '#777', cursor: 'pointer', background: !showHistory ? '#1D9E75' : '#f0f0ec' }}
              onClick={() => setShowHistory(false)}>
              🛒 Spesa
            </button>
          </div>
        </div>

        {/* STORICO */}
        {showHistory && (
          <>
            {history.length === 0 ? (
              <div style={{ ...g.card, textAlign: 'center', padding: '48px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Nessuna scansione ancora</div>
                <div style={{ fontSize: 13, color: '#aaa', marginBottom: 24 }}>Carica il tuo primo scontrino per vedere lo storico risparmi</div>
                <button style={{ ...g.btn, fontSize: 13, padding: '11px', background: 'transparent', border: '1px solid #e0e0d8', color: '#aaa' }} onClick={() => {
                  const demo = [
                    { id: 1, date: '28 apr 2026', products: 12, spentTotal: 38.50, bestMarket: 'Eurospin', bestTotal: 31.20, saving: 7.30 },
                    { id: 2, date: '21 apr 2026', products: 8, spentTotal: 24.80, bestMarket: 'Lidl', bestTotal: 20.10, saving: 4.70 },
                    { id: 3, date: '14 apr 2026', products: 15, spentTotal: 52.30, bestMarket: 'Eurospin', bestTotal: 43.80, saving: 8.50 },
                    { id: 4, date: '7 apr 2026', products: 10, spentTotal: 31.60, bestMarket: 'Conad', bestTotal: 27.40, saving: 4.20 },
                    { id: 5, date: '1 apr 2026', products: 9, spentTotal: 29.90, bestMarket: 'Lidl', bestTotal: 25.50, saving: 4.40 },
                  ];
                  setHistory(demo);
                  localStorage.setItem('spesasmart_history', JSON.stringify(demo));
                }}>
                  Carica dati di esempio
                </button>
              </div>
            ) : (
              <>
                {/* Riepilogo totale */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
                  <div style={g.metric}>
                    <div style={g.mLabel}>Totale risparmiato</div>
                    <div style={g.mVal(true)}>€{totalSaved.toFixed(2)}</div>
                  </div>
                  <div style={g.metric}>
                    <div style={g.mLabel}>Scansioni</div>
                    <div style={g.mVal(false)}>{history.length}</div>
                  </div>
                  <div style={g.metric}>
                    <div style={g.mLabel}>Media/spesa</div>
                    <div style={g.mVal(true)}>€{avgSaving.toFixed(2)}</div>
                  </div>
                </div>

                {/* Lista scansioni */}
                <span style={g.lbl}>Ultime scansioni</span>
                {history.map((h, i) => (
                  <div key={h.id} style={g.card}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 44, height: 44, background: '#E1F5EE', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🧾</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{h.date}</div>
                        <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{h.products} prodotti · miglior offerta: {h.bestMarket}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#0F6E56' }}>-€{h.saving.toFixed(2)}</div>
                        <div style={{ fontSize: 11, color: '#ccc' }}>€{h.spentTotal.toFixed(2)} spesi</div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* UPLOAD */}
        {!showHistory && step === 'upload' && (
          <div style={g.card}>
            {error && <div style={g.err}>{error}</div>}
            <div style={g.uploadZone} onClick={() => fileRef.current.click()}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
              <div style={{ fontSize: 42, marginBottom: 10 }}>📷</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Carica foto scontrino</div>
              <div style={{ fontSize: 13, color: '#aaa' }}>Tocca per scattare o scegli dalla galleria</div>
            </div>
            <button style={g.demoBtn} onClick={loadDemo}>→ Prova con scontrino di esempio</button>
          </div>
        )}

        {!showHistory && step === 'loading' && (
          <div style={{ ...g.card, textAlign: 'center', padding: '52px 20px' }}>
            <div style={g.spinner} />
            <div style={{ fontSize: 15, color: '#aaa' }}>{loading}</div>
          </div>
        )}

        {!showHistory && step === 'products' && (
          <>
            <button style={g.back} onClick={() => setStep('upload')}>← indietro</button>
            <div style={g.card}>
              <span style={g.lbl}>Prodotti rilevati — {products.filter(p => p.checked).length} selezionati</span>
              {products.map((p, i) => (
                <div key={i} style={g.productRow}>
                  <input type="checkbox" checked={p.checked} onChange={() => toggleProduct(i)} style={{ accentColor: '#1D9E75', width: 20, height: 20, cursor: 'pointer', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 14 }}>{p.name}</span>
                  <span style={{ fontSize: 14, color: '#aaa', minWidth: 52, textAlign: 'right' }}>€{p.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={g.card}>
              <span style={g.lbl}>Dove vuoi comprare?</span>
              <div style={g.marketsGrid}>
                {MARKETS.map(m => (
                  <div key={m.id} style={g.mCard(selectedMarkets.has(m.id))} onClick={() => toggleMarket(m.id)}>
                    <div style={{ fontSize: 26 }}>{m.emoji}</div>
                    <div style={{ fontSize: 12, fontWeight: 500, marginTop: 5, color: '#1a1a1a' }}>{m.name}</div>
                  </div>
                ))}
              </div>
              <button style={g.btn} onClick={doCompare}>Confronta prezzi →</button>
            </div>
          </>
        )}

        {!showHistory && step === 'results' && results && (
          <>
            <button style={g.back} onClick={() => setStep('products')}>← modifica selezione</button>
            <div style={g.metrics}>
              <div style={g.metric}><div style={g.mLabel}>Spesa attuale</div><div style={g.mVal(false)}>€{results.currentTotal.toFixed(2)}</div></div>
              <div style={g.metric}><div style={g.mLabel}>Miglior offerta</div><div style={g.mVal(true)}>€{results.marketTotals[0].total.toFixed(2)}</div></div>
              <div style={g.metric}><div style={g.mLabel}>Risparmio</div><div style={g.mVal(true)}>€{results.marketTotals[0].saving.toFixed(2)}</div></div>
            </div>

            <span style={g.lbl}>Tutti i supermercati — dal più conveniente</span>
            {results.marketTotals.map((m, i) => {
              const isBest = i === 0;
              const isExpanded = isBest || expandedMarket === m.id;
              return (
                <div key={m.id} style={{ ...g.cartCard(isBest), cursor: isBest ? 'default' : 'pointer' }}
                  onClick={() => !isBest && setExpandedMarket(expandedMarket === m.id ? null : m.id)}>
                  {isBest && <div style={g.bestBadge}>⭐ Miglior offerta</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 28 }}>{m.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: isBest ? '#0F6E56' : '#aaa', marginTop: 2 }}>
                        {isBest ? `Risparmi €${m.saving.toFixed(2)}` : `€${m.saving.toFixed(2)} di risparmio`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: isBest ? '#0F6E56' : '#1a1a1a' }}>€{m.total.toFixed(2)}</div>
                        {!isBest && <div style={{ fontSize: 11, color: '#ccc' }}>+€{(m.total - results.marketTotals[0].total).toFixed(2)}</div>}
                      </div>
                      {!isBest && (
                        <div style={{ fontSize: 20, color: '#ccc', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', lineHeight: 1 }}>›</div>
                      )}
                    </div>
                  </div>
                  {isExpanded && (
                    <button style={g.cartBtn(isBest)} onClick={e => { e.stopPropagation(); window.open(m.url, '_blank'); }}>
                      Vai al carrello {m.name} →
                    </button>
                  )}
                </div>
              );
            })}

            <div style={g.extraSaving}>
              <div style={{ fontSize: 28 }}>✨</div>
              <div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>Con SpesaSmart Pro potresti risparmiare</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#FFD700' }}>€{results.proSaving.toFixed(2)}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>€{results.extraSaving.toFixed(2)} in più rispetto alla miglior offerta</div>
              </div>
            </div>

            <div style={g.proBox}>
              <div style={g.proBadge}>PRO</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Risparmio massimo garantito</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 16, lineHeight: 1.5 }}>
                L'algoritmo Pro divide i prodotti tra i supermercati più convenienti e prepara i carrelli per te.
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {results.proCarts.map(m => (
                  <div key={m.id} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 10px', flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 20 }}>{m.emoji}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>{m.items.length} prodotti</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>€{m.total.toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <button style={g.proBtn} onClick={() => setShowProModal(true)}>
                🔓 Sblocca Pro — €2.99/mese
              </button>
            </div>

            <button style={{ ...g.btn, background: 'transparent', color: '#aaa', border: '1px solid #e0e0d8' }} onClick={() => { setStep('upload'); setResults(null); }}>
              + Nuovo scontrino
            </button>
          </>
        )}
      </div>

      {showProModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowProModal(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '28px 20px', width: '100%', maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, background: '#e0e0d8', borderRadius: 2, margin: '0 auto 20px' }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: '#FFB800', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>SpesaSmart Pro</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Risparmio massimo su ogni spesa</div>
            <div style={{ fontSize: 14, color: '#888', marginBottom: 24, lineHeight: 1.6 }}>L'algoritmo Pro ottimizza ogni prodotto sul supermercato più conveniente e prepara i carrelli per te.</div>
            {[
              ['🛒', 'Carrelli multipli ottimizzati', 'Ogni prodotto nel supermercato più economico'],
              ['📊', 'Storico risparmi', 'Tieni traccia di quanto risparmi nel tempo'],
              ['🔔', 'Alert offerte', 'Notifica quando i tuoi prodotti scendono di prezzo'],
              ['📋', 'Lista ricorrente', 'Salva la spesa tipo, confronta ogni settimana'],
            ].map(([icon, title, desc]) => (
              <div key={title} style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
                  <div style={{ fontSize: 13, color: '#aaa' }}>{desc}</div>
                </div>
              </div>
            ))}
            <button style={{ ...g.btn, background: '#1a1a2e', marginTop: 8 }} onClick={() => setShowProModal(false)}>
              Inizia — €2.99/mese
            </button>
            <button style={{ ...g.btn, background: 'transparent', color: '#aaa', border: 'none', marginTop: 8, fontSize: 14 }} onClick={() => setShowProModal(false)}>
              No grazie
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
