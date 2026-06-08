import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'stream'
import { db } from '@/lib/db'
import { contentDispositionAttachment, getUploadPath } from '@/lib/files'
import { createStoredZipStream } from '@/lib/zip'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawPath = searchParams.get('path') ?? ''

    // 规范化并校验路径，去掉首尾斜杠，拒绝穿越
    const folderPath = rawPath.replace(/^\/+|\/+$/g, '')
    if (!folderPath || folderPath.includes('..')) {
      return NextResponse.json({ error: '无效的文件夹路径' }, { status: 400 })
    }

    const prefix = `${folderPath}/`
    const files = await db.file.findMany({
      where: { originalName: { startsWith: prefix } },
      select: { filename: true, originalName: true },
      orderBy: { originalName: 'asc' },
    })

    if (files.length === 0) {
      return NextResponse.json({ error: '文件夹为空或不存在' }, { status: 404 })
    }

    // 压缩包内以该文件夹为根：去掉父级前缀，保留所选文件夹这一层
    const parent = folderPath.includes('/')
      ? folderPath.slice(0, folderPath.lastIndexOf('/') + 1)
      : ''
    const folderName = folderPath.split('/').pop() || 'folder'

    const entries = files.map((file) => ({
      name: file.originalName.slice(parent.length),
      filePath: getUploadPath(file.filename),
    }))

    const webStream = Readable.toWeb(createStoredZipStream(entries)) as ReadableStream

    const headers = new Headers()
    headers.set('Content-Type', 'application/zip')
    headers.set('Content-Disposition', contentDispositionAttachment(`${folderName}.zip`))
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    headers.set('Pragma', 'no-cache')
    headers.set('Expires', '0')

    return new NextResponse(webStream, { status: 200, headers })
  } catch (error) {
    console.error('文件夹打包下载错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
