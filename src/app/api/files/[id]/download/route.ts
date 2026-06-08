import { NextRequest, NextResponse } from 'next/server'
import { stat } from 'fs/promises'
import { createReadStream } from 'fs'
import { Readable } from 'stream'
import { db } from '@/lib/db'
import { contentDispositionAttachment, getUploadPath } from '@/lib/files'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 查找文件
    const file = await db.file.findUnique({
      where: { id }
    })

    if (!file) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 })
    }

    // 读取文件
    const filePath = getUploadPath(file.filename)
    const fileStat = await stat(filePath)
    const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream

    // 设置响应头
    const headers = new Headers()
    headers.set('Content-Type', file.mimeType || 'application/octet-stream')
    headers.set('Content-Length', fileStat.size.toString())
    headers.set('Content-Disposition', contentDispositionAttachment(file.originalName))
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    headers.set('Pragma', 'no-cache')
    headers.set('Expires', '0')

    // 返回文件
    return new NextResponse(stream, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('文件下载错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
