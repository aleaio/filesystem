import { NextRequest, NextResponse } from 'next/server'
import { readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const identifier = params.id

    const file = await db.file.findFirst({
      where: {
        OR: [{ id: identifier }, { filename: identifier }]
      }
    })

    if (!file) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 })
    }

    const filePath = join(process.cwd(), 'uploads', file.filename)
    const fileBuffer = await readFile(filePath)

    const headers = new Headers()
    headers.set('Content-Type', file.mimeType)
    headers.set('Content-Length', file.size.toString())
    headers.set(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(file.originalName)}"`
    )
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    headers.set('Pragma', 'no-cache')
    headers.set('Expires', '0')

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('文件获取错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    try {
      jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 })
    }

    // 查找文件
    const file = await db.file.findUnique({
      where: { id: params.id }
    })

    if (!file) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 })
    }

    // 删除物理文件
    const filePath = join(process.cwd(), 'uploads', file.filename)
    try {
      await unlink(filePath)
    } catch (error) {
      console.error('删除物理文件失败:', error)
      // 继续删除数据库记录
    }

    // 删除数据库记录
    await db.file.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: '文件删除成功' })
  } catch (error) {
    console.error('文件删除错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}