/**
 * 导入模型数据到数据库
 * 将 models.js 中的模型数据导入到数据库中
 */

const path = require('path')
const sqlite3 = require('sqlite3').verbose()
const models = require('./dataset/models')
const fs = require('fs')

// 数据库文件路径
const dbPath = path.join(__dirname, '../database/database.db')

// 导入数据的主函数
async function importModels() {
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
        CREATE TABLE IF NOT EXISTS llm_models (
          id TEXT PRIMARY KEY,
          provider_id TEXT NOT NULL,
          name TEXT NOT NULL,
          group_name TEXT,
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
          console.log('模型表同步完成')

          // 准备导入的数据
          let sortIndex = 0
          let importCount = 0
          let updateCount = 0
          const now = new Date().toISOString()
          const providers = Object.keys(models)
          const modelCounts = []

          // 常用大模型列表，这些模型将自动设置为启用状态
          const popularModels = [
            'gpt-4o',
            'gpt-4-turbo',
            'gpt-4',
            'gpt-3.5-turbo',
            'gpt-4o-mini',
            'claude-3-opus',
            'claude-3-sonnet',
            'claude-3-haiku',
            'claude-3.5-sonnet',
            'claude-3.7-sonnet',
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'gemini-2.0-flash',
            'deepseek-chat',
            'deepseek-coder',
            'DeepSeek-R1',
            'DeepSeek-V3',
            'llama-3',
            'llama-3.1',
            'llama-3.2',
            'llama-3.3',
            'qwen-turbo',
            'Qwen2.5-72B',
            'QVQ-72B',
            'yi-large',
            'yi-lightning',
          ]

          // 遍历所有提供商和模型
          for (const [provider, providerModels] of Object.entries(models)) {
            if (Array.isArray(providerModels)) {
              const count = providerModels.length
              modelCounts.push({ provider, count })

              for (const model of providerModels) {
                const id = `${provider}:${model.id}`

                // 判断是否为常用大模型
                let isPopular = false
                for (const popularModel of popularModels) {
                  if (
                    model.id
                      .toLowerCase()
                      .includes(popularModel.toLowerCase()) ||
                    model.name
                      .toLowerCase()
                      .includes(popularModel.toLowerCase())
                  ) {
                    isPopular = true
                    break
                  }
                }

                // 设置状态值：如果模型明确设置了状态，使用该状态；否则根据是否为常用模型决定
                const state =
                  model.state !== undefined
                    ? model.state
                      ? 1
                      : 0
                    : isPopular
                    ? 1
                    : 0

                // 先检查模型是否已存在
                db.get(
                  'SELECT id FROM llm_models WHERE id = ?',
                  [id],
                  (err, row) => {
                    if (err) {
                      console.error(`查询模型 ${id} 失败:`, err.message)
                      return
                    }

                    let stmt
                    if (row) {
                      // 模型已存在，执行更新
                      stmt = db.prepare(`
                      UPDATE llm_models 
                      SET provider_id = ?, name = ?, group_name = ?, state = ?, sort = ?, updated_at = ?
                      WHERE id = ?
                    `)

                      stmt.run(
                        provider,
                        model.name,
                        model.group,
                        state,
                        sortIndex++,
                        now,
                        id,
                        function (err) {
                          if (err) {
                            console.error(`更新模型 ${id} 失败:`, err.message)
                          } else {
                            updateCount++
                          }
                        },
                      )
                    } else {
                      // 模型不存在，执行插入
                      stmt = db.prepare(`
                      INSERT INTO llm_models 
                      (id, provider_id, name, group_name, state, sort, created_at, updated_at) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `)

                      stmt.run(
                        id,
                        provider,
                        model.name,
                        model.group,
                        state,
                        sortIndex++,
                        now,
                        now,
                        function (err) {
                          if (err) {
                            console.error(`插入模型 ${id} 失败:`, err.message)
                          } else {
                            importCount++
                          }
                        },
                      )
                    }
                    stmt.finalize()
                  },
                )
              }
            }
          }

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
              `成功导入 ${importCount} 个新模型，更新 ${updateCount} 个已有模型`,
            )

            // 导出导入结果日志
            const logData = {
              timestamp: now,
              totalModels: importCount + updateCount,
              newModels: importCount,
              updatedModels: updateCount,
              providers: providers,
              modelCount: modelCounts,
            }

            fs.writeFileSync(
              path.join(__dirname, 'import-models-log.json'),
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
importModels()
  .then(() => {
    console.log('脚本执行完毕')
  })
  .catch(err => {
    console.error('脚本执行失败:', err)
    process.exit(1)
  })
