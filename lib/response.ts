import { NextResponse } from 'next/server'

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(message: string, status: number, code?: string): NextResponse {
  return NextResponse.json(
    { success: false, error: { message, code } },
    { status }
  )
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): NextResponse {
  const totalPages = Math.ceil(total / limit)
  return NextResponse.json({
    success: true,
    data,
    pagination: { total, page, limit, totalPages },
  })
}
