'use client';
import { useState, useRef } from 'react';

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

export default function Home() {
  const [step, setStep] = useState('upload');
  const [products, setProducts] = useState([]);
  const [selectedMarkets, setSelectedMarkets] = useState(new Set(['esselunga', 'conad', 'eurospin']));
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [savingsFilter, setSavingsFilter] = useState(0);
  const fileRef = useRef();

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
        market: m.name,
        marketId: m.id,
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
      return {
        ...m,
        total: parseFloat(total.toFixed(2)),
        saving: parseFloat((currentTotal - total).toFixed(2))
      };
    }).sort((a, b) => a.total - b.total);

    const counts = {};
    rows.forEach(r => { counts[r.best.market] = (counts[r.best.market] || 0) + 1; });

    setResults({ rows, currentTotal, markets, marketTotals });
    setSavingsFilter(0);
    setStep('results');
  }

  const maxSaving = results ? Math.max(...results.marketTotals.map(m => m.saving)) : 0;
  const filteredMarkets = results ? results.marketTotals.filter(m => m.saving >= savingsFilter) : [];

  const c = {
    wrap: { maxWidth: 560, margin: '0 auto', padding: '20px 16px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#1a1a1a' },
    logo: { fontSize: 24, fontWeight: 700, color: '#0F6E56', marginBottom: 2 },
    tagline: { fontSize: 13, color: '#999', marginBottom: 24 },
    card: { background: '#fff', borderRadius: 18, padding: '18px', marginBottom: 12, border: '1px solid #efefeb', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
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
    mVal: (g) => ({ fontSize: 20, fontWeight: 700, color: g ? '#0F6E56' : '#1a1a1a' }),
    spinner: { width: 36, height: 36, border: '3px solid #eee', borderTopColor: '#1D9E75', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' },
    err: { background: '#FEF2F2', color: '#991B1B', borderRadius: 10, padding: '12px 14px', marginBottom: 12, fontSize: 13 },
    cartCard: (best) => ({ background: best ? '#E1F5EE' : '#fff', border: best ? '2px solid #1D9E75' : '1px solid #e8e8e4', borderRadius: 16, padding: '16px', marginBottom: 10, position: 'relative' }),
    bestBadge: { position: 'absolute', top: -10, right: 14, background: '#0F6E56', color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 99 },
    cartBtn: (best) => ({ width: '100%', padding: '12px', background: best ? '#1D9E75' : 'transparent', color: best ? '#fff' : '#1D9E75', border: best ? 'none' : '1.5px solid #1D9E75', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }),
  };

  return (
    <div style={c.wrap}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type=range] { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; background: #e0e0d8; border-radius: 3px; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 24px; height: 24px; border-radius: 50%; background: #1D9E75; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
      `}</style>

      <div style={c.logo}>SpesaSmart 🛒</div>
      <div style={c.tagline}>Carica lo scontrino, risparmia subito</div>

      {step === 'upload' && (
        <div style={c.card}>
          {error && <div style={c.err}>{error}</div>}
          <div style={c.uploadZone} onClick={() => fileRef.current.click()}>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFile} />
            <div style={{ fontSize: 42, marginBottom: 10 }}>📷</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Carica foto scontrino</div>
            <div style={{ fontSize: 13, color: '#aaa' }}>Tocca per scattare o scegli dalla galleria</div>
          </div>
          <button style={c.demoBtn} onClick={loadDemo}>→ Prova con scontrino di esempio</button>
        </div>
      )}

      {step === 'loading' && (
        <div style={{ ...c.card, textAlign: 'center', padding: '52px 20px' }}>
          <div style={c.spinner} />
          <div style={{ fontSize: 15, color: '#aaa' }}>{loading}</div>
        </div>
      )}

      {step === 'products' && (
        <>
          <button style={c.back} onClick={() => setStep('upload')}>← indietro</button>
          <div style={c.card}>
            <span style={c.lbl}>Prodotti rilevati — {products.filter(p => p.checked).length} selezionati</span>
            {products.map((p, i) => (
              <div key={i} style={c.productRow}>
                <input type="checkbox" checked={p.checked} onChange={() => toggleProduct(i)} style={{ accentColor: '#1D9E75', width: 20, height: 20, cursor: 'pointer', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14 }}>{p.name}</span>
                <span style={{ fontSize: 14, color: '#aaa', minWidth: 52, textAlign: 'right' }}>€{p.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div style={c.card}>
            <span style={c.lbl}>Dove vuoi comprare?</span>
            <div style={c.marketsGrid}>
              {MARKETS.map(m => (
                <div key={m.id} style={c.mCard(selectedMarkets.has(m.id))} onClick={() => toggleMarket(m.id)}>
                  <div style={{ fontSize: 26 }}>{m.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 500, marginTop: 5, color: '#1a1a1a' }}>{m.name}</div>
                </div>
              ))}
            </div>
            <button style={c.btn} onClick={doCompare}>Confronta prezzi →</button>
          </div>
        </>
      )}

      {step === 'results' && results && (
        <>
          <button style={c.back} onClick={() => setStep('products')}>← modifica selezione</button>

          <div style={c.metrics}>
            <div style={c.metric}><div style={c.mLabel}>Spesa attuale</div><div style={c.mVal(false)}>€{results.currentTotal.toFixed(2)}</div></div>
            <div style={c.metric}><div style={c.mLabel}>Miglior prezzo</div><div style={c.mVal(true)}>€{results.marketTotals[0].total.toFixed(2)}</div></div>
            <div style={c.metric}><div style={c.mLabel}>Risparmio max</div><div style={c.mVal(true)}>€{maxSaving.toFixed(2)}</div></div>
          </div>

          <div style={c.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: '#777' }}>Voglio risparmiare almeno</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#0F6E56' }}>€{savingsFilter.toFixed(2)}</span>
            </div>
            <input type="range" min={0} max={maxSaving} step={0.10} value={savingsFilter} onChange={e => setSavingsFilter(parseFloat(e.target.value))} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#ccc', marginTop: 6 }}>
              <span>€0</span><span>€{maxSaving.toFixed(2)}</span>
            </div>
          </div>

          <span style={{ ...c.lbl, marginBottom: 10, display: 'block' }}>
            {filteredMarkets.length} supermercati trovati
          </span>

          {filteredMarkets.length === 0 ? (
            <div style={{ ...c.card, textAlign: 'center', padding: '28px', color: '#aaa', fontSize: 14 }}>
              Nessun supermercato raggiunge questo risparmio.<br />
              <span style={{ fontSize: 12 }}>Abbassa il filtro per vedere più opzioni.</span>
            </div>
          ) : (
            filteredMarkets.map((m, i) => (
              <div key={m.id} style={c.cartCard(i === 0)}>
                {i === 0 && <div style={c.bestBadge}>Miglior offerta</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 26 }}>{m.emoji}</span>
                  <span style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>{m.name}</span>
                  <span style={{ fontSize: 24, fontWeight: 700, color: '#0F6E56' }}>€{m.total.toFixed(2)}</span>
                </div>
                <div style={{ fontSize: 13, color: '#0F6E56', marginBottom: 12 }}>
                  Risparmi <strong>€{m.saving.toFixed(2)}</strong> rispetto alla tua spesa attuale
                </div>
                <button style={c.cartBtn(i === 0)} onClick={() => window.open(m.url, '_blank')}>
                  Vai al carrello {m.name} →
                </button>
              </div>
            ))
          )}

          <div style={{ ...c.card, marginTop: 8 }}>
            <span style={c.lbl}>Dettaglio per prodotto</span>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 320 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '7px 6px', color: '#aaa', fontWeight: 500, borderBottom: '1px solid #f0f0ec' }}>Prodotto</th>
                    {results.markets.map(m => <th key={m.id} style={{ textAlign: 'left', padding: '7px 6px', color: '#aaa', fontWeight: 500, borderBottom: '1px solid #f0f0ec', whiteSpace: 'nowrap' }}>{m.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {results.rows.map((r, i) => (
                    <tr key={i}>
                      <td style={{ padding: '9px 6px', borderBottom: '1px solid #f8f8f5', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.product.name}</td>
                      {r.prices.map((p, j) => (
                        <td key={j} style={{ padding: '9px 6px', borderBottom: '1px solid #f8f8f5', color: p.market === r.best.market ? '#0F6E56' : '#aaa', fontWeight: p.market === r.best.market ? 700 : 400 }}>
                          €{p.price.toFixed(2)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td style={{ padding: '9px 6px', fontWeight: 700 }}>Totale</td>
                    {results.marketTotals.map(m => (
                      <td key={m.id} style={{ padding: '9px 6px', fontWeight: 700, color: '#0F6E56' }}>€{m.total.toFixed(2)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <button style={{ ...c.btn, marginTop: 4 }} onClick={() => { setStep('upload'); setResults(null); }}>
            + Nuovo scontrino
          </button>
        </>
      )}
    </div>
  );
}
