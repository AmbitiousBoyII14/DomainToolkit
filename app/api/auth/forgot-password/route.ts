import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const GITHUB_TOKEN = process.env.GITHUB_PAT ?? ''
const REPO_OWNER = 'AmbitiousBoyII14'
const REPO_NAME = 'DomainToolkit'
const USERS_PATH = 'data/users.json'
const SITE_URL = process.env.VERCEL_URL
  ? 'https://' + process.env.VERCEL_URL
  : 'https://domain-analyser-xi.vercel.app'

interface User {
  id: string; name: string; email: string; passwordHash?: string
  avatar?: string; plan: string; provider: string
  resetToken?: string; resetTokenExpiry?: number
  createdAt: number; lastLogin?: number
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const fetchRes = await fetch(
      'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + USERS_PATH,
      { headers: { Authorization: 'Bearer ' + GITHUB_TOKEN, Accept: 'application/vnd.github+json' } }
    )
    if (!fetchRes.ok) return NextResponse.json({ error: 'Server error' }, { status: 500 })
    const fd = await fetchRes.json()
    const users: User[] = JSON.parse(Buffer.from(fd.content, 'base64').toString('utf-8'))
    const sha = fd.sha

    const idx = users.findIndex(u => u.email === email.toLowerCase().trim())
    if (idx < 0) {
      return NextResponse.json({ success: true, message: 'If account exists, a reset link was generated.' })
    }

    const token = crypto.randomBytes(32).toString('hex')
    users[idx].resetToken = token
    users[idx].resetTokenExpiry = Date.now() + 3600000

    const updatedJson = JSON.stringify(users, null, 2)
    const encoded = Buffer.from(updatedJson).toString('base64')
    await fetch(
      'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + USERS_PATH,
      {
        method: 'PUT',
        headers: { Authorization: 'Bearer ' + GITHUB_TOKEN, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Reset password for ' + email, content: encoded, sha }),
      }
    )

    const resetUrl = SITE_URL + '/reset-password?token=' + token + '&email=' + encodeURIComponent(email)
    console.log('RESET LINK:', resetUrl)

    return NextResponse.json({ success: true, message: 'Check your email for reset link.', resetUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
