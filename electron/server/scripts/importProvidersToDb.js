/**
 * 导入提供商数据到数据库
 * 将 providers.js 中的提供商数据导入到数据库中
 */

const path = require('path')
const sqlite3 = require('sqlite3').verbose()
const providers = require('./dataset/providers')
const fs = require('fs')

// 数据库文件路径
const dbPath = path.join(__dirname, '../database/database.db')

// 导入数据的主函数
async function importProviders() {
  return new Promise((resolve, reject) => {
    // 确保数据库目录存在
    const dbDir = path.dirname(dbPath)
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    // 连接数据库
    const db = new sqlite3.Database(dbPath, err => {
      if (err) {
        console.error('数据库连接失败:', err.message)
        reject(err)
        return
      }
      console.log('数据库连接成功')
    })

    // 开启事务
    db.serialize(() => {
      db.run('BEGIN TRANSACTION')

      // 创建表（如果不存在）
      db.run(
        `
        CREATE TABLE IF NOT EXISTS llm_providers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          api_url TEXT,
          official_url TEXT,
          api_key_url TEXT,
          docs_url TEXT,
          models_url TEXT,
          state INTEGER DEFAULT 0,
          sort INTEGER DEFAULT 0,
          created_at TEXT,
          updated_at TEXT,
          deleted_at TEXT
        )
      `,
        err => {
          if (err) {
            console.error('创建表失败:', err.message)
            db.run('ROLLBACK')
            db.close()
            reject(err)
            return
          }
          console.log('提供商表同步完成')

          // 准备导入的数据
          let importCount = 0
          let updateCount = 0
          const now = new Date().toISOString()

          // 常用提供商列表，这些提供商将自动设置为启用状态
          const popularProviders = [
            // 'openai',
            // 'anthropic',
            // 'gemini',
            // 'deepseek',
            // 'o3',
            // 'aihubmix',
            // 'moonshot',
            // 'baichuan',
            // 'zhipu',
            // 'yi',
            // 'mistral',
            // 'groq',
            // 'ollama',
            // 'azure-openai',
          ]

          // 获取所有提供商ID，保持原始顺序
          const providerIds = Object.keys(providers)

          // 遍历所有提供商
          providerIds.forEach((providerId, index) => {
            const provider = providers[providerId]

            // 判断是否为常用提供商
            const isPopular = popularProviders.includes(providerId)

            // 提取API和网站信息
            const apiUrl = provider.api?.url || ''
            const officialUrl = provider.websites?.official || ''
            const apiKeyUrl = provider.websites?.apiKey || ''
            const docsUrl = provider.websites?.docs || ''
            const modelsUrl = provider.websites?.models || ''

            // 格式化提供商名称（首字母大写）
            const name = providerId
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')

            // 先检查提供商是否已存在
            db.get(
              'SELECT id FROM llm_providers WHERE id = ?',
              [providerId],
              (err, row) => {
                if (err) {
                  console.error(`查询提供商 ${providerId} 失败:`, err.message)
                  return
                }

                let stmt
                if (row) {
                  // 提供商已存在，执行更新
                  stmt = db.prepare(`
                    UPDATE llm_providers 
                    SET name = ?, api_url = ?, official_url = ?, api_key_url = ?, 
                        docs_url = ?, models_url = ?, sort = ?, updated_at = ?
                    WHERE id = ?
                  `)

                  stmt.run(
                    name,
                    apiUrl,
                    officialUrl,
                    apiKeyUrl,
                    docsUrl,
                    modelsUrl,
                    index,
                    now,
                    providerId,
                    function (err) {
                      if (err) {
                        console.error(
                          `更新提供商 ${providerId} 失败:`,
                          err.message,
                        )
                      } else {
                        updateCount++
                      }
                    },
                  )
                } else {
                  // 提供商不存在，执行插入
                  stmt = db.prepare(`
                    INSERT INTO llm_providers 
                    (id, name, api_url, official_url, api_key_url, docs_url, models_url, 
                     state, sort, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `)

                  stmt.run(
                    providerId,
                    name,
                    apiUrl,
                    officialUrl,
                    apiKeyUrl,
                    docsUrl,
                    modelsUrl,
                    isPopular ? 1 : 0,
                    index,
                    now,
                    now,
                    function (err) {
                      if (err) {
                        console.error(
                          `插入提供商 ${providerId} 失败:`,
                          err.message,
                        )
                      } else {
                        importCount++
                      }
                    },
                  )
                }
                stmt.finalize()
              },
            )
          })

          // 提交事务
          db.run('COMMIT', err => {
            if (err) {
              console.error('提交事务失败:', err.message)
              db.run('ROLLBACK')
              db.close()
              reject(err)
              return
            }

            console.log(
              `成功导入 ${importCount} 个新提供商，更新 ${updateCount} 个已有提供商`,
            )

            // 导出导入结果日志
            const logData = {
              timestamp: now,
              totalProviders: importCount + updateCount,
              newProviders: importCount,
              updatedProviders: updateCount,
              providers: providerIds,
            }

            fs.writeFileSync(
              path.join(__dirname, 'import-providers-log.json'),
              JSON.stringify(logData, null, 2),
            )

            console.log('导入完成，日志已保存')

            // 关闭数据库连接
            db.close(err => {
              if (err) {
                console.error('关闭数据库连接失败:', err.message)
                reject(err)
              } else {
                console.log('数据库连接已关闭')
                resolve()
              }
            })
          })
        },
      )
    })
  })
}

// 执行导入
importProviders()
  .then(() => {
    console.log('脚本执行完毕')
  })
  .catch(err => {
    console.error('脚本执行失败:', err)
    process.exit(1)
  })
