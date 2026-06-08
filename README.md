# 文件系统使用说明

## 系统概述

这是一个简洁的文件分享系统，专为企业内部使用设计。支持管理员上传、管理和删除文件，普通用户可以匿名浏览和下载文件。

## 功能特性

- ✅ 管理员账号密码登录
- ✅ 文件上传功能
- ✅ 文件删除功能
- ✅ 文件下载功能
- ✅ 匿名访问（无需登录即可下载）
- ✅ 支持 wget/curl 直接下载
- ✅ 响应式设计，支持移动端
- ✅ 文件搜索功能
- ✅ 文件描述信息

## 管理员账号

管理员账号通过环境变量创建，不再提供固定默认密码：

- **用户名**: 默认 `admin`，可通过 `ADMIN_USERNAME` 修改
- **密码**: 必须通过 `ADMIN_PASSWORD` 设置
- ⚠️ **重要**: 请使用强密码，并妥善保存。

## 使用方法

### 1. 管理员登录

1. 访问主页：`http://localhost:3000`
2. 点击右上角的"管理员登录"按钮
3. 输入管理员账号密码
4. 登录成功后进入管理后台

### 2. 上传文件

1. 在管理后台点击"上传文件"按钮
2. 选择要上传的文件
3. 可选：添加文件描述信息
4. 点击"上传"按钮

### 3. 管理文件

在管理后台，您可以：
- 查看所有已上传的文件
- 搜索文件
- 下载文件
- 删除文件

### 4. 匿名用户下载

普通用户无需登录即可：
- 访问主页浏览所有文件
- 搜索文件
- 下载文件
- 使用 wget/curl 直接下载

### 5. 使用 wget/curl 下载

```bash
# 使用 wget 下载
wget "http://localhost:3000/api/files/{FILE_ID}/download" -O filename

# 使用 curl 下载
curl "http://localhost:3000/api/files/{FILE_ID}/download" -o filename
```

## 文件存储

- 所有文件存储在 `uploads/` 目录下
- 文件名会自动重命名为唯一格式（时间戳+UUID）
- 原始文件名保存在数据库中
- 默认单文件上传上限为 100MB，可通过 `MAX_UPLOAD_BYTES` 调整

## 安全说明

- 管理员密码使用 bcrypt 加密存储
- 使用 JWT token 进行身份验证
- 生产环境必须设置 `JWT_SECRET`
- 文件上传限制：仅管理员可上传
- 文件删除限制：仅管理员可删除

## 部署说明

1. 创建环境变量文件：
   ```bash
   cp .env.example .env
   ```

   然后编辑 `.env`，至少设置：
   ```bash
   DATABASE_URL="file:../db/custom.db"
   JWT_SECRET="请替换为一串足够长的随机密钥"
   ADMIN_USERNAME="admin"
   ADMIN_PASSWORD="请替换为强密码"
   ```

2. 确保安装了所有依赖：
   ```bash
   npm install
   ```

3. 初始化数据库：
   ```bash
   npm run db:push
   ```

4. 创建管理员账号：
   ```bash
   npx tsx scripts/create-admin.ts
   ```

5. 开发环境启动：
   ```bash
   npm run dev
   ```

6. 生产环境启动：
   ```bash
   npm run build
   npm run start
   ```

7. 访问 `http://localhost:3000`

## 技术栈

- **前端**: Next.js 15 + React 19 + TypeScript
- **样式**: Tailwind CSS + shadcn/ui
- **数据库**: SQLite + Prisma ORM
- **认证**: JWT + bcrypt
- **文件处理**: Node.js fs API

## 注意事项

1. **生产环境部署前请设置强密码和 `JWT_SECRET`**
2. **建议配置反向代理（如 Nginx）**
3. **定期备份 uploads 目录和数据库文件**
4. **大文件上传可能需要调整服务器配置**

## 故障排除

### 文件上传失败
- 检查 uploads 目录权限
- 确认服务器磁盘空间充足
- 检查文件大小限制

### 登录失败
- 确认用户名密码正确
- 检查浏览器是否禁用了 cookies
- 尝试清除浏览器缓存

### 文件下载失败
- 确认文件存在于 uploads 目录
- 检查文件权限
- 查看服务器错误日志

## 联系支持

如有问题，请检查控制台错误信息或查看服务器日志。
