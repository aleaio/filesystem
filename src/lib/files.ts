import { mkdir } from 'fs/promises'
import { extname, isAbsolute, relative, resolve } from 'path'
import { randomUUID } from 'crypto'

const DEFAULT_MAX_UPLOAD_BYTES = 100 * 1024 * 1024
const configuredMaxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES)

export const MAX_UPLOAD_BYTES =
  Number.isFinite(configuredMaxUploadBytes) && configuredMaxUploadBytes > 0
    ? configuredMaxUploadBytes
    : DEFAULT_MAX_UPLOAD_BYTES

export const UPLOAD_DIR = resolve(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads')

export async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true })
}

export function getUploadPath(filename: string) {
  const filePath = resolve(UPLOAD_DIR, filename)
  const relativePath = relative(UPLOAD_DIR, filePath)

  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    throw new Error('Invalid upload path')
  }

  return filePath
}

export function createStoredFilename(originalName: string) {
  const extension = extname(originalName).toLowerCase()
  return `${Date.now()}-${randomUUID()}${extension}`
}

export function contentDispositionAttachment(filename: string) {
  const fallback = filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_')
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`
}
