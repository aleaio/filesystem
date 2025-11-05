import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function createAdmin() {
  try {
    const username = 'admin'
    const password = 'admin123' // 默认密码，生产环境应该修改
    
    // 检查是否已存在管理员
    const existingAdmin = await db.admin.findUnique({
      where: { username }
    })
    
    if (existingAdmin) {
      console.log('管理员已存在')
      return
    }
    
    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // 创建管理员
    const admin = await db.admin.create({
      data: {
        username,
        password: hashedPassword
      }
    })
    
    console.log('管理员创建成功:')
    console.log('用户名:', username)
    console.log('密码:', password)
    console.log('请立即修改默认密码！')
    
  } catch (error) {
    console.error('创建管理员失败:', error)
  } finally {
    await db.$disconnect()
  }
}

createAdmin()