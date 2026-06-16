import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { token } = body as { token?: string }
  
  const secret = process.env.JWT_ACCESS_SECRET
  
  const info: Record<string, unknown> = {
    secretAvailable: !!secret,
    secretLength: secret?.length ?? 0,
    secretFirst10: secret?.substring(0, 10) ?? 'N/A',
    tokenProvided: !!token,
  }
  
  if (token && secret) {
    try {
      const encoded = new TextEncoder().encode(secret)
      const result = await jwtVerify(token, encoded)
      info.verifyResult = 'SUCCESS'
      info.payload = result.payload
    } catch (err) {
      info.verifyResult = 'FAILED'
      info.verifyError = (err as Error).message
    }
  }
  
  return NextResponse.json(info)
}
