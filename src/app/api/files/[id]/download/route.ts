import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 查找文件
    const file = await db.file.findFirst({
      where: {
        OR: [{ id: params.id }, { filename: params.id }]
      }
    })

    if (!file) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 })
    }

    // 读取文件
    const filePath = join(process.cwd(), 'uploads', file.filename)
    const fileBuffer = await readFile(filePath)

    // 设置响应头
    const headers = new Headers()
    headers.set('Content-Type', file.mimeType)
    headers.set('Content-Length', file.size.toString())
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`)
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    headers.set('Pragma', 'no-cache')
    headers.set('Expires', '0')

    // 返回文件
    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('文件下载错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}