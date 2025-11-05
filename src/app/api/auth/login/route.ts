import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 })
    }

    // 查找管理员
    const admin = await db.admin.findUnique({
      where: { username }
    })

    if (!admin) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, admin.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    // 生成JWT token
    const token = jwt.sign(
      { adminId: admin.id, username: admin.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    return NextResponse.json({ 
      token,
      admin: {
        id: admin.id,
        username: admin.username
      }
    })
  } catch (error) {
    console.error('登录错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}