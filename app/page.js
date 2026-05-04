'use client';
import { useState, useRef } from 'react';

const MARKETS = [
  { id: 'esselunga', name: 'Esselunga', emoji: '🟢', mult: 1.00 },
  { id: 'conad',     name: 'Conad',     emoji: '🔵', mult: 0.95 },
  { id: 'carrefour', name: 'Carrefour', emoji: '🔴', mult: 0.98 },
  { id: 'eurospin',  name: 'Eurospin',  emoji: '🟡', mult: 0.82 },
  { id: 'lidl',      name: 'Lidl',      emoji: '⚪', mult: 0.85 },
  { id: 'coop',      name: 'Coop',      emoji: '🟣', mult: 0.97 },
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

export default function Home() {
  const [step, setStep] = useState('upload');
  const [products, setProducts] = useState([]);
  const [selectedMarkets, setSelectedMarkets] = useState(new Set(['esselunga', 'conad', 'eurospin']));
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const fileRef = useRef();

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setPreview(URL.createObjectURL(file));
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
      setError('Errore nella lettura. Riprova con una foto più nitida.');
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
    const rows = sel.map(p => {
      const prices = markets.map(m => ({
        market: m.name,
        marketId: m.id,
        price: parseFloat((p.price * m.mult * (0.93 + Math.random() * 0.14)).toFixed(2))
      }));
      const best = prices.reduce((a, b) => a.price < b.price ? a : b);
      return { product: p, prices, best };
    });

    const currentTotal = sel.reduce((s, p) => s + p.price, 0);
    const bestTotal = rows.reduce((s, r) => s + r.best.price, 0);
    const saving = currentTotal - bestTotal;

    const counts = {};
    rows.forEach(r => { counts[r.best.market] = (counts[r.best.market] || 0) + 1; });
    const topMarket = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

    setResults({ rows, currentTotal, bestTotal, saving, topMarket, markets });
    setStep('results');
  }

  const s = {
    wrap: { maxWidth: 600, margin: '0 auto', padding: '24px 16px' },
    logo: { fontSize: 26, fontWeight: 600, color: '#0F6E56', marginBottom: 4 },
    tagline: { fontSize: 14, color: '#666', marginBottom: 28 },
    card: { background: '#fff', borderRadius: 16, padding: '20px', marginBottom: 16, border: '1px solid #e8e8e4' },
    uploadZone: { border: '2px dashed #ccc', borderRadius: 12, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: '#fafaf8' },
    uploadTitle: { fontSize: 16, fontWeight: 500, marginBottom: 6 },
    uploadSub: { fontSize: 13, color: '#888' },
    demoBtn: { marginTop: 16, width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: 10, background: 'transparent', fontSize: 13, color: '#666', cursor: 'pointer' },
    label: { fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'block' },
    productRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f0f0ec' },
    productName: { flex: 1, fontSize: 14 },
    productPrice: { fontSize: 14, color: '#666', minWidth: 50, textAlign: 'right' },
    marketsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 },
    marketCard: (sel) => ({ padding: '12px 8px', border: sel ? '2px solid #1D9E75' : '1px solid #e0e0d8', borderRadius: 10, cursor: 'pointer', textAlign: 'center', background: sel ? '#E1F5EE' : '#fff' }),
    marketName: { fontSize: 12, fontWeight: 500, marginTop: 4 },
    primaryBtn: { width: '100%', padding: 14, background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 500, cursor: 'pointer' },
    backBtn: { background: 'none', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0 },
    metricGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 },
    metric: { background: '#f5f5f0', borderRadius: 10, padding: 14 },
    metricLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
    metricValue: (green) => ({ fontSize: 22, fontWeight: 600, color: green ? '#0F6E56' : '#1a1a1a' }),
    savingBox: { background: '#E1F5EE', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 },
    savingBig: { fontSize: 30, fontWeight: 700, color: '#0F6E56' },
    savingDesc: { fontSize: 13, color: '#0F6E56', lineHeight: 1.5 },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 },
    th: { textAlign: 'left', padding: '8px 6px', color: '#888', fontWeight: 500, borderBottom: '1px solid #eee' },
    td: { padding: '10px 6px', borderBottom: '1px solid #f5f5f0' },
    badgeBest: { background: '#E1F5EE', color: '#0F6E56', fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 500 },
    badgeSave: { background: '#FAEEDA', color: '#854F0B', fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 500, marginLeft: 4 },
    spinner: { width: 36, height: 36, border: '3px solid #e0e0d8', borderTopColor: '#1D9E75', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' },
    errorBox: { background: '#FCEBEB', color: '#A32D2D', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14 },
  };

  return (
    <div style={s.wrap}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } button:hover { opacity: 0.85; }`}</style>
      <div style={s.logo}>SpesaSmart 🛒</div>
      <div style={s.tagline}>Carica lo scontrino, risparmia subito</div>

      {step === 'upload' && (
        <div style={s.card}>
          {error && <div style={s.errorBox}>{error}</div>}
          <div style={s.uploadZone} onClick={() => fileRef.current.click()}>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFile} />
            <div style={{ fontSize: 36, marginBottom: 10 }}>📷</div>
            <div style={s.uploadTitle}>Carica foto scontrino</div>
            <div style={s.uploadSub}>Tocca per scattare o scegli dalla galleria</div>
          </div>
          <button style={s.demoBtn} onClick={loadDemo}>→ Prova con scontrino di esempio</button>
        </div>
      )}

      {step === 'loading' && (
        <div style={{ ...s.card, textAlign: 'center', padding: '48px 20px' }}>
          <div style={s.spinner} />
          <div style={{ fontSize: 15, color: '#666' }}>{loading}</div>
        </div>
      )}

      {step === 'products' && (
        <>
          <button style={s.backBtn} onClick={() => setStep('upload')}>← indietro</button>
          <div style={s.card}>
            <span style={s.label}>Prodotti rilevati</span>
            {products.map((p, i) => (
              <div key={i} style={s.productRow}>
                <input type="checkbox" checked={p.checked} onChange={() => toggleProduct(i)} style={{ accentColor: '#1D9E75', width: 18, height: 18 }} />
                <span style={s.productName}>{p.name}</span>
                <span style={s.productPrice}>€{p.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div style={s.card}>
            <span style={s.label}>Supermercati da confrontare</span>
            <div style={s.marketsGrid}>
              {MARKETS.map(m => (
                <div key={m.id} style={s.marketCard(selectedMarkets.has(m.id))} onClick={() => toggleMarket(m.id)}>
                  <div style={{ fontSize: 22 }}>{m.emoji}</div>
                  <div style={s.marketName}>{m.name}</div>
                </div>
              ))}
            </div>
            <button style={s.primaryBtn} onClick={doCompare}>Confronta prezzi →</button>
          </div>
        </>
      )}

      {step === 'results' && results && (
        <>
          <button style={s.backBtn} onClick={() => setStep('products')}>← modifica selezione</button>
          <div style={s.metricGrid}>
            <div style={s.metric}><div style={s.metricLabel}>Spesa attuale</div><div style={s.metricValue(false)}>€{results.currentTotal.toFixed(2)}</div></div>
            <div style={s.metric}><div style={s.metricLabel}>Prezzo migliore</div><div style={s.metricValue(true)}>€{results.bestTotal.toFixed(2)}</div></div>
            <div style={s.metric}><div style={s.metricLabel}>Risparmio</div><div style={s.metricValue(true)}>€{results.saving.toFixed(2)}</div></div>
          </div>
          <div style={s.savingBox}>
            <div style={s.savingBig}>€{results.saving.toFixed(2)}</div>
            <div style={s.savingDesc}>di risparmio possibile<br /><strong>{results.topMarket[0]}</strong> è il più conveniente<br />per {results.topMarket[1]} prodotti su {results.rows.length}</div>
          </div>
          <div style={s.card}>
            <span style={s.label}>Confronto per prodotto</span>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Prodotto</th>
                  {results.markets.map(m => <th key={m.id} style={s.th}>{m.name}</th>)}
                  <th style={s.th}>Migliore</th>
                </tr>
              </thead>
              <tbody>
                {results.rows.map((r, i) => (
                  <tr key={i}>
                    <td style={s.td}>{r.product.name}</td>
                    {r.prices.map((p, j) => (
                      <td key={j} style={{ ...s.td, color: p.market === r.best.market ? '#0F6E56' : '#999', fontWeight: p.market === r.best.market ? 600 : 400 }}>
                        €{p.price.toFixed(2)}
                      </td>
                    ))}
                    <td style={s.td}>
                      <span style={s.badgeBest}>{r.best.market}</span>
                      <span style={s.badgeSave}>€{r.best.price.toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={s.card}>
            <span style={s.label}>Vai al carrello</span>
            <select style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #ddd', marginBottom: 10, fontSize: 14 }} id="cart-select">
              {results.markets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <button style={s.primaryBtn} onClick={() => alert('Prossimo step: integrazione carrello reale!')}>
              Aggiungi al carrello →
            </button>
            <div style={{ fontSize: 12, color: '#aaa', marginTop: 8, textAlign: 'center' }}>I link genereranno commissioni affiliazione</div>
          </div>
        </>
      )}
    </div>
  );
}
