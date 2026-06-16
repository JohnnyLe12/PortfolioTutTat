import { SignJWT, jwtVerify } from 'jose'

export interface JWTPayload {
  userId: string
  role: 'mentee' | 'buddy' | 'company' | 'admin'
  iat?: number
  exp?: number
}

function getAccessSecret(): Uint8Array {
  const secret = process.env.JWT_ACCESS_SECRET
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is not defined in environment variables')
  }
  return new TextEncoder().encode(secret)
}

function getRefreshSecret(): Uint8Array {
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables')
  }
  return new TextEncoder().encode(secret)
}

export async function signAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const secret = getAccessSecret()
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secret)
}

export async function signRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const secret = getRefreshSecret()
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  const secret = getAccessSecret()
  const { payload } = await jwtVerify(token, secret)
  return payload as unknown as JWTPayload
}

export async function verifyRefreshToken(token: string): Promise<JWTPayload> {
  const secret = getRefreshSecret()
  const { payload } = await jwtVerify(token, secret)
  return payload as unknown as JWTPayload
}
