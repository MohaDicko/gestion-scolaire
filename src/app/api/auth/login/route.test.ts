import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import * as bcrypt from 'bcryptjs'

// Mock the Prisma Client properly using dynamic import to avoid hoisting issues
vi.mock('@/lib/prisma', async () => {
  const { mockDeep } = await import('vitest-mock-extended')
  return {
    prisma: mockDeep()
  }
})

import { prisma } from '@/lib/prisma'
const prismaMock = prisma as any

// Mock the rate limit to always succeed
vi.mock('@/lib/rateLimit', () => ({
  rateLimit: vi.fn(() => ({ success: true })),
  getClientIp: vi.fn(() => '127.0.0.1'),
}))

// Mock auth encrypt to avoid Next.js specific Jose issues if any
vi.mock('@/lib/auth', () => ({
  encrypt: vi.fn().mockResolvedValue('mocked_jwt_token')
}))

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 400 for invalid email', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid-email', password: 'password123' })
    })
    
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('Adresse email invalide')
  })

  it('should return 401 for non-existent user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
    })
    
    const res = await POST(req)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Email ou mot de passe incorrect.')
  })

  it('should return 200 and a token for valid credentials', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10)
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'STUDENT',
      tenantId: 'tenant-1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)
    
    prismaMock.auditLog.create.mockResolvedValue({} as any)

    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: new Headers({
        'host': 'localhost:3000'
      }),
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
    })
    
    const res = await POST(req)
    expect(res.status).toBe(200)
    
    const json = await res.json()
    expect(json.accessToken).toBe('mocked_jwt_token')
    expect(json.user.email).toBe('test@example.com')
  })
})
