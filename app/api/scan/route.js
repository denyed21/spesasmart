export async function POST(request) {
  try {
    const { image, mediaType } = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return Response.json({ error: 'API key non configurata' }, { status: 500 });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: image }
            },
            {
              type: 'text',
              text: `Estrai i prodotti alimentari da questo scontrino della spesa.
Rispondi SOLO con un array JSON valido, nessun testo extra, nessun markdown.
Formato esatto: [{"name":"nome prodotto leggibile","price":prezzo_numero}]
Regole:
- Normalizza i nomi (es. "LATT.INT.1LT" → "Latte intero 1L")
- Usa il prezzo finale scontato se presente
- Ignora righe non-prodotto (IVA, totale, punti fedeltà, ecc.)
- Se il prezzo non è leggibile, ometti il prodotto
- Solo prodotti alimentari o per la casa`
            }
          ]
        }]
      })
    });

    const data = await response.json();
    const text = data.content?.map(i => i.text || '').join('') || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const products = JSON.parse(clean);

    return Response.json({ products });
  } catch (err) {
    return Response.json({ error: 'Errore nella lettura dello scontrino' }, { status: 500 });
  }
}
