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
  const [selectedMarkets, setSelectedMarkets] = useState(new Set(['esselunga', 'conad', 'eurospin', 'eurospin', 'lidl']));
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [showProModal, setShowProModal] = useState(false);
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

    // Prezzi per ogni prodotto per ogni supermercato
    const rows = sel.map(p => {
      const prices = markets.map(m => ({
        market: m.name,
        marketId: m.id,
        marketEmoji: m.emoji,
        marketUrl: m.url,
        price: parseFloat((p.price * m.mult * (0.93 + Math.random() * 0.14)).toFixed(2))
      }));
      const best = prices.reduce((a, b) => a.price < b.price ? a : b);
      return { product: p, prices, best };
    });

    // FREE: totale per supermercato (compri tutto lì)
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

    // PRO: ottimizzazione prodotto per prodotto
    const proCartMap = {}; // marketId -> [products]
    markets.forEach(m => { proCartMap[m.id] = []; });

    rows.forEach(r => {
      proCartMap[r.best.marketId].push({
        name: r.product.name,
        price: r.best.price,
        originalPrice: r.product.price
      });
    });

    const proCarts = markets
      .map(m => ({
        ...m,
        items: proCartMap[m.id],
        total: parseFloat(proCartMap[m.id].reduce((s, p) => s + p.price, 0).toFixed(2))
      }))
      .filter(m => m.items.length > 0)
      .sort((a, b) => b.items.length - a.items.length);

    const proTotal = parseFloat(rows.reduce((s, r) => s + r.best.price, 0).toFixed(2));
    const proSaving = parseFloat((currentTotal - proTotal).toFixed(2));
    const freeBestSaving = marketTotals[0].saving;
    const extraSaving = parseFloat((proSaving - freeBestSaving).toFixed(2));

    setResults({ rows, currentTotal, markets, marketTotals, proCarts, proTotal, proSaving, extraSaving });
    setStep('results');
  }

  const g = {
    wrap: { maxWidth: 560, margin: '0 auto', padding: '20px 16px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#1a1a1a', background: '#f7f7f3', minHeight: '100vh' },
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
    mVal: (g) => ({ fontSize: 20, fontWeight: 700, color: g ? '#0F6E56' : '#1a1a1a' }),
    spinner: { width: 36, height: 36, border: '3px solid #eee', borderTopColor: '#1D9E75', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' },
    err: { background: '#FEF2F2', color: '#991B1B', borderRadius: 10, padding: '12px 14px', marginBottom: 12, fontSize: 13 },
    cartCard: (best) => ({ background: best ? '#E1F5EE' : '#fff', border: best ? '2px solid #1D9E75' : '1px solid #e8e8e4', borderRadius: 16, padding: '16px', marginBottom: 10, position: 'relative' }),
    bestBadge: { position: 'absolute', top: -10, right: 14, background: '#0F6E56', color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 99 },
    cartBtn: (best) => ({ width: '100%', padding: '12px', background: best ? '#1D9E75' : 'transparent', color: best ? '#fff' : '#1D9E75', border: best ? 'none' : '1.5px solid #1D9E75', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 12 }),
    proBox: { background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: 18, padding: '20px', marginBottom: 12, position: 'relative', overflow: 'hidden' },
    proTitle: { fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 },
    proDesc: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 16, lineHeight: 1.5 },
    proBtn: { width: '100%', padding: '13px', background: '#FFD700', color: '#1a1a1a', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
    proBadge: { display: 'inline-block', background: '#FFD700', color: '#1a1a1a', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, marginBottom: 10 },
    extraSaving: { background: '#1a1a2e', borderRadius: 12, padding: '14px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 },
  };

  return (
    <div style={g.wrap}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={g.logo}>SpesaSmart 🛒</div>
      <div style={g.tagline}>Carica lo scontrino, risparmia subito</div>

      {/* UPLOAD */}
      {step === 'upload' && (
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

      {/* LOADING */}
      {step === 'loading' && (
        <div style={{ ...g.card, textAlign: 'center', padding: '52px 20px' }}>
          <div style={g.spinner} />
          <div style={{ fontSize: 15, color: '#aaa' }}>{loading}</div>
        </div>
      )}

      {/* PRODUCTS */}
      {step === 'products' && (
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

      {/* RESULTS */}
      {step === 'results' && results && (
        <>
          <button style={g.back} onClick={() => setStep('products')}>← modifica selezione</button>

          {/* Metriche */}
          <div style={g.metrics}>
            <div style={g.metric}><div style={g.mLabel}>Spesa attuale</div><div style={g.mVal(false)}>€{results.currentTotal.toFixed(2)}</div></div>
            <div style={g.metric}><div style={g.mLabel}>Miglior offerta</div><div style={g.mVal(true)}>€{results.marketTotals[0].total.toFixed(2)}</div></div>
            <div style={g.metric}><div style={g.mLabel}>Risparmio</div><div style={g.mVal(true)}>€{results.marketTotals[0].saving.toFixed(2)}</div></div>
          </div>

          {/* FREE: carrelli per supermercato */}
          <span style={g.lbl}>Tutti i supermercati — dal più conveniente</span>

          {results.marketTotals.map((m, i) => (
            <div key={m.id} style={g.cartCard(i === 0)}>
              {i === 0 && <div style={g.bestBadge}>⭐ Miglior offerta</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 28 }}>{m.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: i === 0 ? '#0F6E56' : '#aaa', marginTop: 2 }}>
                    {i === 0 ? `Risparmi €${m.saving.toFixed(2)}` : `€${m.saving.toFixed(2)} di risparmio`}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: i === 0 ? '#0F6E56' : '#1a1a1a' }}>€{m.total.toFixed(2)}</div>
                  {i > 0 && <div style={{ fontSize: 11, color: '#ccc' }}>+€{(m.total - results.marketTotals[0].total).toFixed(2)} vs migliore</div>}
                </div>
              </div>
              {i === 0 && (
                <button style={g.cartBtn(true)} onClick={() => window.open(m.url, '_blank')}>
                  Vai al carrello {m.name} →
                </button>
              )}
            </div>
          ))}

          {/* PRO UPSELL */}
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
            <div style={g.proTitle}>Risparmio massimo garantito</div>
            <div style={g.proDesc}>
              L'algoritmo Pro divide i tuoi prodotti tra i supermercati più convenienti e prepara carrelli separati già pronti. Compri il meglio da ognuno, risparmi il massimo possibile.
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

          <button style={{ ...g.btn, marginTop: 4, background: 'transparent', color: '#aaa', border: '1px solid #e0e0d8' }} onClick={() => { setStep('upload'); setResults(null); }}>
            + Nuovo scontrino
          </button>
        </>
      )}

      {/* PRO MODAL */}
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
