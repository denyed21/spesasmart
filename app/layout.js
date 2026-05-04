import './globals.css'

export const metadata = {
  title: 'SpesaSmart — Risparmia sulla spesa',
  description: 'Carica lo scontrino, confronta i prezzi, risparmia subito',
}

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}
