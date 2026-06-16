import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { createProjectSchema, parseTags } from '@/lib/validations/project'
import { getAuthUser } from '@/lib/auth-guard'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }
    const userId = user.userId

    const profile = await prisma.profile.findUnique({
      where: { userId },
    })

    if (!profile) {
      return errorResponse('Profile not found', 404, 'NOT_FOUND')
    }

    const projects = await prisma.project.findMany({
      where: { menteeId: profile.id },
      orderBy: { createdAt: 'desc' },
    })

    return successResponse(projects)
  } catch (err) {
    console.error('[GET /api/projects]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
    }
    const userId = user.userId

    const profile = await prisma.profile.findUnique({
      where: { userId },
    })

    if (!profile) {
      return errorResponse('Profile not found', 404, 'NOT_FOUND')
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return errorResponse('Invalid JSON body', 400, 'VALIDATION_ERROR')
    }

    const parsed = createProjectSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors[0]?.message ?? 'Validation failed',
        400,
        'VALIDATION_ERROR'
      )
    }

    const { title, description, tags: rawTags } = parsed.data
    const tags = parseTags(rawTags)

    const project = await prisma.project.create({
      data: {
        menteeId: profile.id,
        title,
        description,
        tags,
        status: 'draft',
      },
    })

    return successResponse(project, 201)
  } catch (err) {
    console.error('[POST /api/projects]', err)
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
