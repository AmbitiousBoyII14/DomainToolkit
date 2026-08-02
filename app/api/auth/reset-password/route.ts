import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const GITHUB_TOKEN = process.env.GITHUB_PAT ?? ''
const REPO_OWNER = 'AmbitiousBoyII14'
const REPO_NAME = 'DomainToolkit'
const USERS_PATH = 'data/users.json'

interface User {
  id: string; name: string; email: string; passwordHash?: string
  avatar?: string; plan: string; provider: string
  resetToken?: string; resetTokenExpiry?: number
  createdAt: number; lastLogin?: number
}

function hashPass(pw: string): string {
  return crypto.createHash('sha256').update('dtp_salt_' + pw).digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const { token, email, newPassword } = await req.json()
    if (!token || !email || !newPassword) return NextResponse.json({ error: 'Token, email, and new password required' }, { status: 400 })
    if (newPassword.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

    const fetchRes = await fetch(
      'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + USERS_PATH,
      { headers: { Authorization: 'Bearer ' + GITHUB_TOKEN, Accept: 'application/vnd.github+json' } }
    )
    if (!fetchRes.ok) return NextResponse.json({ error: 'Server error' }, { status: 500 })
    const fd = await fetchRes.json()
    const users: User[] = JSON.parse(Buffer.from(fd.content, 'base64').toString('utf-8'))
    const sha = fd.sha

    const idx = users.findIndex(u => u.email === email.toLowerCase().trim())
    if (idx < 0) return NextResponse.json({ error: 'Invalid reset link' }, { status: 400 })

    const user = users[idx]
    if (!user.resetToken || user.resetToken !== token) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    if (!user.resetTokenExpiry || user.resetTokenExpiry < Date.now()) return NextResponse.json({ error: 'Reset token expired. Request a new one.' }, { status: 400 })

    users[idx].passwordHash = hashPass(newPassword)
    delete users[idx].resetToken
    delete users[idx].resetTokenExpiry
    users[idx].lastLogin = Date.now()

    const updatedJson = JSON.stringify(users, null, 2)
    const encoded = Buffer.from(updatedJson).toString('base64')
    await fetch(
      'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + USERS_PATH,
      {
        method: 'PUT',
        headers: { Authorization: 'Bearer ' + GITHUB_TOKEN, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Password reset for ' + email, content: encoded, sha }),
      }
    )

    return NextResponse.json({ success: true, message: 'Password reset successfully!' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
