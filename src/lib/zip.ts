import { Readable } from 'stream'
import { readFile } from 'fs/promises'

// CRC-32 (IEEE) 查表
const crcTable = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf: Buffer): number {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

export interface ZipEntry {
  /** 压缩包内的条目路径（可含 "/"），使用 UTF-8 */
  name: string
  /** 磁盘上的物理文件绝对路径 */
  filePath: string
}

/**
 * 用「存储(store)」方式生成 ZIP 的流，零第三方依赖。
 * 逐个文件读取并推送（本地头 + 文件名 + 数据），最后写中央目录与 EOCD。
 * 适用于本应用规模（单文件 < 100MB、单包 < 4GB、条目 < 65535）。
 */
export function createStoredZipStream(entries: ZipEntry[]): Readable {
  async function* generate() {
    const central: Buffer[] = []
    let offset = 0

    for (const entry of entries) {
      const data = await readFile(entry.filePath)
      const nameBuf = Buffer.from(entry.name, 'utf8')
      const crc = crc32(data)

      // 本地文件头（30 字节）
      const local = Buffer.alloc(30)
      local.writeUInt32LE(0x04034b50, 0) // 签名
      local.writeUInt16LE(20, 4) // version needed
      local.writeUInt16LE(0x0800, 6) // 通用标志位：bit11 = 文件名为 UTF-8
      local.writeUInt16LE(0, 8) // 压缩方法：0 = store
      local.writeUInt16LE(0, 10) // mod time
      local.writeUInt16LE(0x21, 12) // mod date = 1980-01-01
      local.writeUInt32LE(crc, 14)
      local.writeUInt32LE(data.length, 18) // compressed size
      local.writeUInt32LE(data.length, 22) // uncompressed size
      local.writeUInt16LE(nameBuf.length, 26)
      local.writeUInt16LE(0, 28) // extra length
      yield local
      yield nameBuf
      yield data

      // 中央目录记录（46 字节 + 文件名），先暂存，最后统一输出
      const cd = Buffer.alloc(46)
      cd.writeUInt32LE(0x02014b50, 0) // 签名
      cd.writeUInt16LE(20, 4) // version made by
      cd.writeUInt16LE(20, 6) // version needed
      cd.writeUInt16LE(0x0800, 8) // UTF-8 标志
      cd.writeUInt16LE(0, 10) // 压缩方法
      cd.writeUInt16LE(0, 12) // time
      cd.writeUInt16LE(0x21, 14) // date
      cd.writeUInt32LE(crc, 16)
      cd.writeUInt32LE(data.length, 20)
      cd.writeUInt32LE(data.length, 24)
      cd.writeUInt16LE(nameBuf.length, 28)
      cd.writeUInt16LE(0, 30) // extra length
      cd.writeUInt16LE(0, 32) // comment length
      cd.writeUInt16LE(0, 34) // disk number start
      cd.writeUInt16LE(0, 36) // internal attrs
      cd.writeUInt32LE(0, 38) // external attrs
      cd.writeUInt32LE(offset, 42) // 本地头偏移
      central.push(Buffer.concat([cd, nameBuf]))

      offset += local.length + nameBuf.length + data.length
    }

    // 中央目录
    const cdStart = offset
    let cdSize = 0
    for (const record of central) {
      cdSize += record.length
      yield record
    }

    // 中央目录结束记录（EOCD，22 字节）
    const eocd = Buffer.alloc(22)
    eocd.writeUInt32LE(0x06054b50, 0) // 签名
    eocd.writeUInt16LE(0, 4) // 当前磁盘号
    eocd.writeUInt16LE(0, 6) // 中央目录起始磁盘号
    eocd.writeUInt16LE(central.length, 8) // 本磁盘条目数
    eocd.writeUInt16LE(central.length, 10) // 总条目数
    eocd.writeUInt32LE(cdSize, 12) // 中央目录大小（字节 12-15）
    eocd.writeUInt32LE(cdStart, 16) // 中央目录偏移（字节 16-19）
    eocd.writeUInt16LE(0, 20) // 注释长度
    yield eocd
  }

  return Readable.from(generate())
}
