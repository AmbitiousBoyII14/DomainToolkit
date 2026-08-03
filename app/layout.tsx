import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { ThemeScript } from '@/components/theme-script'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Domain Toolkit Pro',
  description: 'Professional domain & network analysis — DNS, WHOIS, SSL, WebSocket, Security, Geo, Email & more.',
  icons: { icon: [{ url: '/icon-light-32x32.png' }, { url: '/icon.svg', type: 'image/svg+xml' }], apple: '/apple-icon.png' },
}

export const viewport: Viewport = { colorScheme: 'light dark', themeColor: '#ffffff' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="bg-background">
      <head>
        <Script src="https://www.paypal.com/sdk/js?client-id=BAAkvjcanjgXq_sh6PfNBQlXY4eRYjdzdo4ZZuR9AbxTC1BPxob7aLTFmELAsitTuFdZ8-jM3pfl0UBtGU&components=hosted-buttons&disable-funding=venmo&currency=USD" strategy="afterInteractive" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeScript />
        {children}
      </body>
    </html>
  )
}