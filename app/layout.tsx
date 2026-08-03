import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Domain Toolkit Pro',
  description: 'Professional network & domain analysis — DNS, WHOIS, SSL, WebSocket, Security Headers, Hosting/CDN detection and more.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png',  media: '(prefers-color-scheme: dark)'  },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#06060b',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark bg-background">
      <head>
        <Script
          src="https://www.paypal.com/sdk/js?client-id=BAAkvjcanjgXq_sh6PfNBQlXY4eRYjdzdo4ZZuR9AbxTC1BPxob7aLTFmELAsitTuFdZ8-jM3pfl0UBtGU&components=hosted-buttons&disable-funding=venmo&currency=USD"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}