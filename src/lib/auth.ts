import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

export type AdminTokenPayload = {
  adminId: string
  username: string
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET is required')
  }

  return secret
}

export function signAdminToken(payload: AdminTokenPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '24h' })
}

export function verifyAdminToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as AdminTokenPayload
}

export function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  return verifyAdminToken(authHeader.substring(7))
}
