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
  { emoji: '🛒', title: 'Benvenuto in SpesaSmart', desc: 'Fotografa lo scontrino e scopri subito dove potresti spendere meno — supermercato per supermercato.' },
  { emoji: '📸', title: 'Come funziona', steps: [
    { icon: '📷', text: 'Fotografi lo scontrino' },
    { icon: '🤖', text: "L'AI legge i prodotti" },
    { icon: '💰', text: 'Trovi il più conveniente' },
    { icon: '🛒', text: 'Vai al carrello e risparmi' },
  ]},
  { emoji: '🏪', title: 'I tuoi supermercati', desc: 'Scegli quelli vicino a te.', isMarkets: true },
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
  const [savedList, setSavedList] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    setOnboarded(!!localStorage.getItem('spesasmart_onboarded'));
    const h = localStorage.getItem('spesasmart_history');
    if (h) setHistory(JSON.parse(h));
    const sl = localStorage.getItem('spesasmart_savedlist');
    if (sl) setSavedList(JSON.parse(sl));
  }, []);

  function finishOnboarding() {
    localStorage.setItem('spesasmart_onboarded', '1');
    setSelectedMarkets(new Set(onboardMarkets));
    setOnboarded(true);
  }

  function saveList() {
    const sel = products.filter(p => p.checked);
    if (!sel.length) return;
    const list = sel.map(p => ({ name: p.name, price: p.price }));
    setSavedList(list);
    localStorage.setItem('spesasmart_savedlist', JSON.stringify(list));
    alert(`Lista salvata! ${list.length} prodotti memorizzati.`);
  }

  function loadSavedList() {
    if (!savedList) return;
    setProducts(savedList.map(p => ({ ...p, checked: true })));
    setStep('products');
    setShowHistory(false);
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
    setSelectedMarkets(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleProduct(i) {
    setProducts(prev => prev.map((p, idx) => idx === i ? { ...p, checked: !p.checked } : p));
  }

  function doCompare() {
    const sel = products.filter(p => p.checked);
    if (!sel.length) { alert('Seleziona almeno un prodotto'); return; }
    if (selectedMarkets.size < 2) { alert('Seleziona almeno 2 supermercati'); return; }
    const markets = MARKETS.filter(m => selectedMarkets.has(m.id));
    const currentTotal = sel.reduce((s, p) => s + p.price, 0);
    const rows = sel.map(p => {
      const prices = markets.map(m => ({ market: m.name, marketId: m.id, marketEmoji: m.emoji, marketUrl: m.url, price: parseFloat((p.price * m.mult * (0.93 + Math.random() * 0.14)).toFixed(2)) }));
      return { product: p, prices, best: prices.reduce((a, b) => a.price < b.price ? a : b) };
    });
    const marketTotals = markets.map(m => {
      const total = parseFloat(rows.reduce((s, r) => s + r.prices.find(x => x.marketId === m.id).price, 0).toFixed(2));
      return { ...m, total, saving: parseFloat((currentTotal - total).toFixed(2)) };
    }).sort((a, b) => a.total - b.total);
    const proCartMap = {};
    markets.forEach(m => { proCartMap[m.id] = []; });
    rows.forEach(r => { proCartMap[r.best.marketId].push({ name: r.product.name, price: r.best.price }); });
    const proCarts = markets.map(m => ({ ...m, items: proCartMap[m.id], total: parseFloat(proCartMap[m.id].reduce((s, p) => s + p.price, 0).toFixed(2)) })).filter(m => m.items.length > 0).sort((a, b) => b.items.length - a.items.length);
    const proTotal = parseFloat(rows.reduce((s, r) => s + r.best.price, 0).toFixed(2));
    const proSaving = parseFloat((currentTotal - proTotal).toFixed(2));
    const extraSaving = parseFloat((proSaving - marketTotals[0].saving).toFixed(2));
    const entry = { id: Date.now(), date: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }), products: sel.length, spentTotal: parseFloat(currentTotal.toFixed(2)), bestMarket: marketTotals[0].name, bestTotal: marketTotals[0].total, saving: marketTotals[0].saving };
    setHistory(prev => { const updated = [entry, ...prev].slice(0, 50); localStorage.setItem('spesasmart_history', JSON.stringify(updated)); return updated; });
    setResults({ rows, currentTotal, markets, marketTotals, proCarts, proTotal, proSaving, extraSaving });
    setExpandedMarket(null);
    setStep('results');
  }

  const totalSaved = history.reduce((s, h) => s + h.saving, 0);
  const avgSaving = history.length > 0 ? totalSaved / history.length : 0;

  // Design tokens
  const T = {
    bg: '#FAFAF8',
    card: '#FFFFFF',
    dark: '#0A0A0A',
    hero: '#0F6E56',
    green: '#1D9E75',
    greenLight: '#E8F8F2',
    greenDark: '#0F6E56',
    border: '#EEEEE9',
    muted: '#A8A8A0',
    gold: '#FFD700',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  };

  const css = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    * { -webkit-tap-highlight-color: transparent; }
  `;

  if (onboarded === null) return null;

  // ONBOARDING
  if (!onboarded) {
    const cur = ONBOARDING[onboardStep];
    const isLast = onboardStep === ONBOARDING.length - 1;
    return (
      <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', maxWidth: 560, margin: '0 auto' }}>
        <style>{css}</style>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '24px 0 0' }}>
          {ONBOARDING.map((_, i) => (
            <div key={i} style={{ height: 4, width: i === onboardStep ? 28 : 8, borderRadius: 2, background: i === onboardStep ? T.dark : T.border, transition: 'all 0.3s' }} />
          ))}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px', animation: 'fadeUp 0.3s ease' }} key={onboardStep}>
          <div style={{ fontSize: 60, textAlign: 'center', marginBottom: 28 }}>{cur.emoji}</div>
          <div style={{ fontSize: 28, fontWeight: 800, textAlign: 'center', marginBottom: 14, letterSpacing: '-0.03em', lineHeight: 1.2 }}>{cur.title}</div>
          {cur.desc && <div style={{ fontSize: 15, color: T.muted, textAlign: 'center', lineHeight: 1.7, marginBottom: 32 }}>{cur.desc}</div>}
          {cur.steps && (
            <div style={{ background: T.card, borderRadius: 20, overflow: 'hidden', marginBottom: 32, border: `1px solid ${T.border}` }}>
              {cur.steps.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i < cur.steps.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <div style={{ width: 40, height: 40, background: T.greenLight, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: T.dark }}>{s.text}</div>
                </div>
              ))}
            </div>
          )}
          {cur.isMarkets && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 32 }}>
              {MARKETS.map(m => (
                <div key={m.id} onClick={() => setOnboardMarkets(prev => { const n = new Set(prev); n.has(m.id) ? n.delete(m.id) : n.add(m.id); return n; })}
                  style={{ padding: '14px 8px', border: onboardMarkets.has(m.id) ? `2px solid ${T.green}` : `1px solid ${T.border}`, borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: onboardMarkets.has(m.id) ? T.greenLight : T.card, transition: 'all 0.1s' }}>
                  <div style={{ fontSize: 26 }}>{m.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 500, marginTop: 5, color: T.dark }}>{m.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding: '0 24px 48px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => isLast ? finishOnboarding() : setOnboardStep(s => s + 1)}
            style={{ padding: '15px', background: T.dark, color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.01em' }}>
            {isLast ? '🚀 Inizia a risparmiare' : 'Continua →'}
          </button>
          {onboardStep > 0 && <button onClick={() => setOnboardStep(s => s - 1)} style={{ padding: '13px', background: 'transparent', color: T.muted, border: 'none', fontSize: 14, cursor: 'pointer' }}>← Indietro</button>}
          {onboardStep === 0 && <button onClick={finishOnboarding} style={{ padding: '13px', background: 'transparent', color: T.muted, border: 'none', fontSize: 13, cursor: 'pointer' }}>Salta</button>}
        </div>
      </div>
    );
  }

  // APP
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', maxWidth: 560, margin: '0 auto', paddingBottom: 40 }}>
      <style>{css}</style>

      {/* NAV */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: T.dark, letterSpacing: '-0.03em' }}>
          Spesa<span style={{ color: T.green }}>Smart</span>
        </div>
        <div style={{ display: 'flex', background: '#EFEFEB', borderRadius: 10, padding: 3, gap: 2 }}>
          {[['📊', true], ['🛒', false]].map(([icon, isHistory]) => (
            <button key={icon} onClick={() => { setShowHistory(isHistory); if (isHistory) { setStep('upload'); setResults(null); } }}
              style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', background: showHistory === isHistory ? T.card : 'transparent', color: showHistory === isHistory ? T.dark : T.muted, boxShadow: showHistory === isHistory ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
              {icon} {isHistory ? 'Storico' : 'Spesa'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* STORICO */}
        {showHistory && (
          <>
            {history.length === 0 ? (
              <div style={{ background: T.card, borderRadius: 20, padding: '48px 20px', textAlign: 'center', border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.01em' }}>Nessuna scansione ancora</div>
                <div style={{ fontSize: 13, color: T.muted, marginBottom: 24 }}>Carica il tuo primo scontrino per vedere lo storico</div>
                <button style={{ padding: '11px 20px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 12, fontSize: 13, color: T.muted, cursor: 'pointer' }} onClick={() => {
                  const demo = [
                    { id: 1, date: '28 apr 2026', products: 12, spentTotal: 38.50, bestMarket: 'Eurospin', bestTotal: 31.20, saving: 7.30 },
                    { id: 2, date: '21 apr 2026', products: 8, spentTotal: 24.80, bestMarket: 'Lidl', bestTotal: 20.10, saving: 4.70 },
                    { id: 3, date: '14 apr 2026', products: 15, spentTotal: 52.30, bestMarket: 'Eurospin', bestTotal: 43.80, saving: 8.50 },
                    { id: 4, date: '7 apr 2026', products: 10, spentTotal: 31.60, bestMarket: 'Conad', bestTotal: 27.40, saving: 4.20 },
                    { id: 5, date: '1 apr 2026', products: 9, spentTotal: 29.90, bestMarket: 'Lidl', bestTotal: 25.50, saving: 4.40 },
                  ];
                  setHistory(demo); localStorage.setItem('spesasmart_history', JSON.stringify(demo));
                }}>Carica dati di esempio</button>
              </div>
            ) : (
              <>
                <div style={{ background: T.hero, borderRadius: 20, padding: '20px', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Totale risparmiato</div>
                  <div style={{ fontSize: 42, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 16 }}>€{totalSaved.toFixed(2)}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 12 }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Scansioni</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>{history.length}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 12 }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Media/spesa</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>€{avgSaving.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Ultime scansioni</div>
                {history.map(h => (
                  <div key={h.id} style={{ background: T.card, borderRadius: 16, padding: '14px 16px', marginBottom: 8, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, background: T.greenLight, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🧾</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.dark }}>{h.date}</div>
                      <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{h.products} prodotti · {h.bestMarket}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 17, fontWeight: 700, color: T.green }}>-€{h.saving.toFixed(2)}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>€{h.spentTotal.toFixed(2)} spesi</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* UPLOAD */}
        {!showHistory && step === 'upload' && (
          <div style={{ background: T.card, borderRadius: 20, overflow: 'hidden', border: `1px solid ${T.border}` }}>
            {error && <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '12px 18px', fontSize: 13 }}>{error}</div>}
            <div style={{ padding: '40px 20px 32px', textAlign: 'center', borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }} onClick={() => fileRef.current.click()}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
              <div style={{ width: 60, height: 60, background: T.greenLight, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 16px' }}>📷</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.dark, marginBottom: 6, letterSpacing: '-0.01em' }}>Carica foto scontrino</div>
              <div style={{ fontSize: 13, color: T.muted }}>Tocca per scattare o scegli dalla galleria</div>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {savedList && (
                <button onClick={loadSavedList} style={{ padding: '13px', background: T.greenLight, color: T.greenDark, border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  📋 Lista salvata · {savedList.length} prodotti
                </button>
              )}
              <button onClick={loadDemo} style={{ padding: '12px', background: 'transparent', color: T.muted, border: `1px solid ${T.border}`, borderRadius: 12, fontSize: 13, cursor: 'pointer' }}>
                → Prova con scontrino di esempio
              </button>
            </div>
          </div>
        )}

        {/* LOADING */}
        {!showHistory && step === 'loading' && (
          <div style={{ background: T.card, borderRadius: 20, padding: '60px 20px', textAlign: 'center', border: `1px solid ${T.border}` }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${T.border}`, borderTopColor: T.green, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <div style={{ fontSize: 15, color: T.muted }}>{loading}</div>
          </div>
        )}

        {/* PRODUCTS */}
        {!showHistory && step === 'products' && (
          <>
            <button onClick={() => setStep('upload')} style={{ background: 'none', border: 'none', color: T.muted, fontSize: 13, cursor: 'pointer', marginBottom: 14, padding: 0 }}>← indietro</button>
            <div style={{ background: T.card, borderRadius: 20, overflow: 'hidden', border: `1px solid ${T.border}`, marginBottom: 12 }}>
              <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Prodotti rilevati · {products.filter(p => p.checked).length} selezionati</span>
              </div>
              {products.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: i < products.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <input type="checkbox" checked={p.checked} onChange={() => toggleProduct(i)} style={{ accentColor: T.green, width: 18, height: 18, cursor: 'pointer', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 14, color: T.dark }}>{p.name}</span>
                  <span style={{ fontSize: 14, color: T.muted, minWidth: 52, textAlign: 'right' }}>€{p.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, borderRadius: 20, padding: '18px', border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Dove vuoi comprare?</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                {MARKETS.map(m => (
                  <div key={m.id} onClick={() => toggleMarket(m.id)}
                    style={{ padding: '13px 8px', border: selectedMarkets.has(m.id) ? `2px solid ${T.green}` : `1px solid ${T.border}`, borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: selectedMarkets.has(m.id) ? T.greenLight : T.card, transition: 'all 0.1s' }}>
                    <div style={{ fontSize: 24 }}>{m.emoji}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, marginTop: 5, color: T.dark }}>{m.name}</div>
                  </div>
                ))}
              </div>
              <button onClick={doCompare} style={{ width: '100%', padding: '15px', background: T.dark, color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.01em' }}>
                Confronta prezzi →
              </button>
              <button onClick={saveList} style={{ width: '100%', padding: '12px', background: 'transparent', color: T.green, border: `1px solid ${T.green}`, borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: 'pointer', marginTop: 8 }}>
                📋 Salva come lista ricorrente
              </button>
            </div>
          </>
        )}

        {/* RESULTS */}
        {!showHistory && step === 'results' && results && (
          <>
            <button onClick={() => setStep('products')} style={{ background: 'none', border: 'none', color: T.muted, fontSize: 13, cursor: 'pointer', marginBottom: 14, padding: 0 }}>← modifica selezione</button>

            {/* Hero dark */}
            <div style={{ background: T.hero, borderRadius: 20, padding: '22px', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Risparmio possibile</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 4 }}>€{results.marketTotals[0].saving.toFixed(2)}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 18 }}>rispetto alla tua spesa attuale</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Spesa attuale</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>€{results.currentTotal.toFixed(2)}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Miglior offerta</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>€{results.marketTotals[0].total.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Supermercati</div>

            {results.marketTotals.map((m, i) => {
              const isBest = i === 0;
              const isExpanded = isBest || expandedMarket === m.id;
              return (
                <div key={m.id} onClick={() => !isBest && setExpandedMarket(expandedMarket === m.id ? null : m.id)}
                  style={{ background: isBest ? T.greenLight : T.card, border: isBest ? `2px solid ${T.green}` : `1px solid ${T.border}`, borderRadius: 16, padding: '14px 16px', marginBottom: 8, position: 'relative', cursor: isBest ? 'default' : 'pointer' }}>
                  {isBest && <div style={{ position: 'absolute', top: -10, right: 14, background: T.green, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 99 }}>⭐ Miglior offerta</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 26 }}>{m.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: T.dark }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: isBest ? T.green : T.muted, marginTop: 2, fontWeight: isBest ? 500 : 400 }}>
                        {isBest ? `Risparmi €${m.saving.toFixed(2)}` : `€${m.saving.toFixed(2)} di risparmio`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: isBest ? T.greenDark : T.dark, letterSpacing: '-0.02em' }}>€{m.total.toFixed(2)}</div>
                        {!isBest && <div style={{ fontSize: 11, color: T.muted }}>+€{(m.total - results.marketTotals[0].total).toFixed(2)}</div>}
                      </div>
                      {!isBest && <div style={{ color: T.muted, fontSize: 18, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</div>}
                    </div>
                  </div>
                  {isExpanded && (
                    <button onClick={e => { e.stopPropagation(); window.open(m.url, '_blank'); }}
                      style={{ width: '100%', marginTop: 12, padding: '12px', background: isBest ? T.green : T.dark, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                      Vai al carrello {m.name} →
                    </button>
                  )}
                </div>
              );
            })}

            {/* Pro upsell */}
            <div style={{ background: T.dark, borderRadius: 20, padding: '18px', marginTop: 8, marginBottom: 12 }}>
              <div style={{ display: 'inline-block', background: T.gold, color: T.dark, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, marginBottom: 10 }}>PRO</div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Risparmio massimo garantito</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>con carrelli multipli ottimizzati</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: T.gold, letterSpacing: '-0.02em' }}>€{results.proSaving.toFixed(2)}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>+€{results.extraSaving.toFixed(2)} vs free</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {results.proCarts.map(m => (
                  <div key={m.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px', flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 18 }}>{m.emoji}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{m.items.length} prod.</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>€{m.total.toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowProModal(true)}
                style={{ width: '100%', padding: '13px', background: T.gold, color: T.dark, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                🔓 Sblocca Pro · €2.99/mese
              </button>
            </div>

            <button onClick={() => { setStep('upload'); setResults(null); }}
              style={{ width: '100%', padding: '13px', background: 'transparent', color: T.muted, border: `1px solid ${T.border}`, borderRadius: 14, fontSize: 14, cursor: 'pointer' }}>
              + Nuovo scontrino
            </button>
          </>
        )}
      </div>

      {/* PRO MODAL */}
      {showProModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowProModal(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '28px 20px 40px', width: '100%', maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, background: T.border, borderRadius: 2, margin: '0 auto 24px' }} />
            <div style={{ display: 'inline-block', background: T.gold, color: T.dark, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, marginBottom: 10 }}>SPESASMART PRO</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>Risparmio massimo su ogni spesa</div>
            <div style={{ fontSize: 14, color: T.muted, marginBottom: 24, lineHeight: 1.6 }}>L'algoritmo Pro ottimizza ogni prodotto sul supermercato più conveniente e prepara i carrelli per te.</div>
            {[['🛒', 'Carrelli multipli ottimizzati', 'Ogni prodotto nel supermercato più economico'],
              ['📊', 'Storico risparmi avanzato', 'Grafici e analisi nel tempo'],
              ['🔔', 'Alert offerte', 'Notifica quando scendono i prezzi'],
              ['📋', 'Lista ricorrente illimitata', 'Più liste, più famiglie'],
            ].map(([icon, title, desc]) => (
              <div key={title} style={{ display: 'flex', gap: 14, marginBottom: 18, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, background: T.greenLight, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.dark }}>{title}</div>
                  <div style={{ fontSize: 13, color: T.muted }}>{desc}</div>
                </div>
              </div>
            ))}
            <button onClick={() => setShowProModal(false)} style={{ width: '100%', padding: '15px', background: T.dark, color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8, letterSpacing: '-0.01em' }}>
              Inizia — €2.99/mese
            </button>
            <button onClick={() => setShowProModal(false)} style={{ width: '100%', padding: '13px', background: 'transparent', color: T.muted, border: 'none', fontSize: 14, cursor: 'pointer', marginTop: 6 }}>
              No grazie
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
