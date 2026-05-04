# SpesaSmart 🛒

Carica lo scontrino, confronta i prezzi, risparmia subito.

## Deploy su Vercel (5 minuti)

### 1. Carica su GitHub
1. Vai su github.com → New repository → chiama "spesasmart"
2. Carica tutti i file di questa cartella

### 2. Deploy su Vercel
1. Vai su vercel.com → New Project
2. Importa il repository "spesasmart" da GitHub
3. In "Environment Variables" aggiungi:
   - Nome: `ANTHROPIC_API_KEY`
   - Valore: la tua API key (sk-ant-api03-...)
4. Clicca Deploy

### 3. Fatto!
Vercel ti darà un link tipo: `https://spesasmart-xxx.vercel.app`

## Stack
- Next.js 14
- Claude claude-sonnet-4-20250514 (OCR scontrini)
- Vercel (deploy gratuito)
