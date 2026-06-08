import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    // 如果没有提供token，返回公开文件列表
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const files = await db.file.findMany({
        select: {
          id: true,
          filename: true,
          originalName: true,
          size: true,
          mimeType: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return NextResponse.json(files)
    }

    // 如果有token，验证并返回文件列表
    try {
      requireAdmin(request)
    } catch (error) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 })
    }

    const files = await db.file.findMany({
      select: {
        id: true,
        filename: true,
        originalName: true,
        size: true,
        mimeType: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(files)
  } catch (error) {
    console.error('获取文件列表错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
