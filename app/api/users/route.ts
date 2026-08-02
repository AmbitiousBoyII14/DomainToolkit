import { NextRequest, NextResponse } from 'next/server'

const GITHUB_TOKEN = process.env.GITHUB_PAT ?? ''
const REPO_OWNER = 'AmbitiousBoyII14'
const REPO_NAME = 'DomainToolkit'
const USERS_PATH = 'data/users.json'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  plan: 'free' | 'pro' | 'business'
  provider: 'email' | 'google' | 'facebook'
  createdAt: number
  lastLogin?: number
}

// GET /api/users — fetch all users
export async function GET() {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${USERS_PATH}`,
      { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' } }
    )
    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.message || 'Failed to fetch users' }, { status: res.status })
    }
    const data = await res.json()
    const content = Buffer.from(data.content, 'base64').toString('utf-8')
    const users: User[] = JSON.parse(content)
    return NextResponse.json({ users, sha: data.sha })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/users — register or update a user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { user } = body as { user: User }

    if (!user?.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Fetch current users + SHA
    const fetchRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${USERS_PATH}`,
      { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' } }
    )
    if (!fetchRes.ok) {
      return NextResponse.json({ error: 'Failed to read users file' }, { status: 500 })
    }
    const fetchData = await fetchRes.json()
    const content = Buffer.from(fetchData.content, 'base64').toString('utf-8')
    const users: User[] = JSON.parse(content)
    const sha = fetchData.sha

    // Upsert user
    const idx = users.findIndex(u => u.email === user.email)
    const now = Date.now()
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user, lastLogin: now }
    } else {
      users.push({ ...user, createdAt: now, lastLogin: now })
    }

    // Push to GitHub
    const updatedJson = JSON.stringify(users, null, 2)
    const encoded = Buffer.from(updatedJson).toString('base64')
    const pushRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${USERS_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Update users: ${user.email} (${user.provider})`,
          content: encoded,
          sha,
        }),
      }
    )
    if (!pushRes.ok) {
      const err = await pushRes.json()
      return NextResponse.json({ error: err.message || 'Failed to save user' }, { status: 500 })
    }
    return NextResponse.json({ success: true, user: idx >= 0 ? users[idx] : users[users.length - 1] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PUT /api/users — update user plan (after payment)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, plan } = body as { email: string; plan: 'free' | 'pro' | 'business' }

    if (!email || !plan) {
      return NextResponse.json({ error: 'Email and plan are required' }, { status: 400 })
    }

    const fetchRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${USERS_PATH}`,
      { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' } }
    )
    if (!fetchRes.ok) return NextResponse.json({ error: 'Failed to read users' }, { status: 500 })
    const fetchData = await fetchRes.json()
    const users: User[] = JSON.parse(Buffer.from(fetchData.content, 'base64').toString('utf-8'))
    const sha = fetchData.sha

    const idx = users.findIndex(u => u.email === email)
    if (idx < 0) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    users[idx].plan = plan
    users[idx].lastLogin = Date.now()

    const updatedJson = JSON.stringify(users, null, 2)
    const encoded = Buffer.from(updatedJson).toString('base64')
    const pushRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${USERS_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Upgrade ${email} to ${plan}`,
          content: encoded,
          sha,
        }),
      }
    )
    if (!pushRes.ok) {
      const err = await pushRes.json()
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, user: users[idx] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
