import { defineStore } from 'pinia'
import { mcpApi } from '@/api/request'

interface McpState {
  tools: any[]
  loading: boolean
  selectedTool: any | null
  selectedTools: any[] // 存储多选的工具
  error: string | null
  initialized: boolean
  toolsEnabled: boolean
  showAddNewDialog: boolean // 新增：控制弹窗显示
  selectedMcp: any | null // 新增：当前选中的MCP
}

export const useMcpStore = defineStore('mcp', {
  state: (): McpState => ({
    tools: [],
    loading: false,
    selectedTool: null,
    selectedTools: [],
    error: null,
    initialized: false,
    toolsEnabled: true,
    showAddNewDialog: false, // 新增：初始化为false
    selectedMcp: null, // 新增：初始化为null
  }),

  actions: {
    // 获取所有工具列表
    async fetchTools() {
      if (this.loading) return

      try {
        this.loading = true
        this.error = null
        const response = await mcpApi.listAllTools()
        this.tools = response || []
        this.initialized = true
      } catch (error) {
        console.error('获取MCP工具列表失败:', error)
        this.error = error instanceof Error ? error.message : '获取工具列表失败'
      } finally {
        this.loading = false
      }
    },

    async restartServer() {
      try {
        const res = await mcpApi.restartServer()
        console.log('MCP服务器已重启')
        return res
      } catch (error) {
        console.error('重启MCP服务器失败:', error)
        throw error
      }
    },

    // 选择单个工具
    selectTool(tool: any) {
      this.selectedTool = tool
      this.selectedTools = [tool] // 单选时也更新多选数组
    },

    // 选择多个工具
    selectMultipleTools(tools: any[]) {
      this.selectedTools = [...tools] // 使用浅拷贝避免引用问题
      // 如果有选择工具，则将第一个设为当前选中工具，保持向后兼容
      this.selectedTool = tools.length > 0 ? tools[0] : null
    },

    // 清除选择的工具
    clearSelectedTools() {
      this.selectedTool = null
      this.selectedTools = []
    },

    // 设置工具启用状态
    setToolsEnabled(enabled: boolean) {
      this.toolsEnabled = enabled
    },

    // 重置状态
    reset() {
      this.tools = []
      this.selectedTool = null
      this.selectedTools = []
      this.error = null
      this.initialized = false
      this.toolsEnabled = true
    },
    
    // 新增：打开添加新MCP的弹窗
    openAddNewDialog(mcp = null) {
      this.selectedMcp = mcp
      this.showAddNewDialog = true
    },
    
    // 新增：关闭添加新MCP的弹窗
    closeAddNewDialog() {
      this.showAddNewDialog = false
      this.selectedMcp = null
    }
  }
})