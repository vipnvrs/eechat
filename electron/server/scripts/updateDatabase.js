const fs = require('fs')
const path = require('path')
const sqlite3 = require('sqlite3').verbose()
const { promisify } = require('util')

// 数据库文件路径
const dbPath = path.join(__dirname, '../database/database.db')

// SQL更新文件目录
const sqlUpdateDir = path.join(__dirname, '../database/updateSQl')

// 获取当前数据库版本
async function getCurrentVersion(db) {
  return new Promise((resolve, reject) => {
    db.get('PRAGMA user_version', (err, row) => {
      if (err) {
        reject(err)
        return
      }
      resolve(row.user_version)
    })
  })
}

// 设置数据库版本
async function setVersion(db, version) {
  return new Promise((resolve, reject) => {
    db.run(`PRAGMA user_version = ${version}`, err => {
      if (err) {
        reject(err)
        return
      }
      resolve()
    })
  })
}

// 执行SQL文件
async function executeSqlFile(db, filePath) {
  const sql = fs.readFileSync(filePath, 'utf8')

  // 分割SQL语句（按分号分割，但忽略注释行中的分号）
  const statements = []
  let currentStatement = ''

  // 按行分割SQL
  const lines = sql.split('\n')
  for (const line of lines) {
    const trimmedLine = line.trim()
    // 跳过注释行
    if (trimmedLine.startsWith('--')) continue

    // 添加到当前语句
    currentStatement += line + '\n'

    // 如果行以分号结尾，则认为是一个完整语句
    if (trimmedLine.endsWith(';')) {
      statements.push(currentStatement.trim())
      currentStatement = ''
    }
  }

  // 添加最后一个语句（如果没有分号结尾）
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim())
  }

  // 执行每个语句
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await new Promise((resolve, reject) => {
          console.log(
            `执行SQL: ${statement.substring(0, 100)}${
              statement.length > 100 ? '...' : ''
            }`,
          )
          db.run(statement, err => {
            if (err) {
              // 忽略"column already exists"错误
              if (
                err.message.includes('duplicate column name') ||
                err.message.includes('already exists')
              ) {
                console.log(`警告: ${err.message}`)
                resolve()
                return
              }
              reject(err)
              return
            }
            resolve()
          })
        })
      } catch (error) {
        console.error(`执行SQL语句失败: ${statement}`)
        console.error(`错误信息: ${error.message}`)
        throw error
      }
    }
  }
}

// 获取所有SQL更新文件
function getSqlUpdateFiles() {
  const files = fs
    .readdirSync(sqlUpdateDir)
    .filter(file => file.endsWith('.sql'))
    .sort((a, b) => {
      // 从文件名中提取版本号（假设格式为vX.Y.sql）
      const versionA = a.match(/v(\d+)\.(\d+)\.sql/)
      const versionB = b.match(/v(\d+)\.(\d+)\.sql/)

      if (!versionA || !versionB) return 0

      const majorA = parseInt(versionA[1])
      const minorA = parseInt(versionA[2])
      const majorB = parseInt(versionB[1])
      const minorB = parseInt(versionB[2])

      if (majorA !== majorB) return majorA - majorB
      return minorA - minorB
    })

  return files.map(file => ({
    path: path.join(sqlUpdateDir, file),
    version: getVersionFromFileName(file),
  }))
}

// 从文件名获取版本号
function getVersionFromFileName(fileName) {
  const match = fileName.match(/v(\d+)\.(\d+)\.sql/)
  if (!match) return 0

  const major = parseInt(match[1])
  const minor = parseInt(match[2])

  return major * 100 + minor // 例如：v1.2.sql -> 102
}

// 主函数
async function updateDatabase() {
  console.log('开始更新数据库...')

  // 检查数据库文件是否存在
  if (!fs.existsSync(dbPath)) {
    console.error(`数据库文件不存在: ${dbPath}`)
    return
  }
  // 打开数据库连接
  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, err => {
    if (err) {
      console.error('打开数据库失败:', err)
      throw err
    }
  })
  try {
    // 获取当前数据库版本
    const currentVersion = await getCurrentVersion(db)
    console.log(`当前数据库版本: ${currentVersion}`)

    // 获取所有SQL更新文件
    const updateFiles = getSqlUpdateFiles()
    console.log(`找到 ${updateFiles.length} 个SQL更新文件`)

    // 执行版本高于当前版本的SQL文件
    for (const file of updateFiles) {
      if (file.version > currentVersion) {
        console.log(
          `执行SQL更新文件: ${path.basename(file.path)} (版本 ${file.version})`,
        )
        await executeSqlFile(db, file.path)
        await setVersion(db, file.version)
        console.log(`数据库已更新到版本 ${file.version}`)
      }
    }

    console.log('数据库更新完成')
  } catch (err) {
    console.error('更新数据库时出错:', err)
  } finally {
    // 关闭数据库连接
    db.close()
  }
}

// 执行更新
updateDatabase().catch(err => {
  console.error('更新数据库失败:', err)
  process.exit(1)
})
