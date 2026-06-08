import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { getUploadPath } from '@/lib/files'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    try {
      if (!requireAdmin(request)) {
        return NextResponse.json({ error: '未授权' }, { status: 401 })
      }
    } catch (error) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 })
    }

    const { id } = await params

    // 查找文件
    const file = await db.file.findUnique({
      where: { id }
    })

    if (!file) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 })
    }

    // 删除物理文件
    const filePath = getUploadPath(file.filename)
    try {
      await unlink(filePath)
    } catch (error) {
      console.error('删除物理文件失败:', error)
      // 继续删除数据库记录
    }

    // 删除数据库记录
    await db.file.delete({
      where: { id }
    })

    return NextResponse.json({ message: '文件删除成功' })
  } catch (error) {
    console.error('文件删除错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
