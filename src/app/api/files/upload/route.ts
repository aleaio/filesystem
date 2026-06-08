import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { createStoredFilename, ensureUploadDir, getUploadPath, MAX_UPLOAD_BYTES } from '@/lib/files'

export async function POST(request: NextRequest) {
  try {
    let decoded
    try {
      decoded = requireAdmin(request)
    } catch (error) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 })
    }

    if (!decoded) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json({ error: '没有选择文件' }, { status: 400 })
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: '文件不能为空' }, { status: 400 })
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: '文件大小超出限制' }, { status: 413 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 生成唯一文件名
    const filename = createStoredFilename(file.name)

    // 保存文件到uploads目录
    await ensureUploadDir()
    const path = getUploadPath(filename)
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
