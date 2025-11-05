import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { adminId: string; username: string }
    } catch (error) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 })
    }

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json({ error: '没有选择文件' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 生成唯一文件名
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const filename = `${timestamp}-${randomString}.${fileExtension}`

    // 保存文件到uploads目录
    const path = join(process.cwd(), 'uploads', filename)
    await writeFile(path, buffer)

    // 保存文件信息到数据库
    const fileRecord = await db.file.create({
      data: {
        filename,
        originalName: file.name,
        path: `/uploads/${filename}`,
        size: file.size,
        mimeType: file.type,
        uploadedBy: decoded.adminId
      }
    })

    return NextResponse.json({ 
      message: '文件上传成功',
      file: {
        id: fileRecord.id,
        filename: fileRecord.originalName,
        size: fileRecord.size,
        mimeType: fileRecord.mimeType
      }
    })
  } catch (error) {
    console.error('文件上传错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}