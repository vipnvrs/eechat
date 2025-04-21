import { defineStore } from 'pinia'
import { mcpApi } from '@/api/request'

interface McpState {
  tools: any[]
  loading: boolean
  selectedTool: any | null
  selectedTools: any[] // 新增：存储多选的工具
  error: string | null
  initialized: boolean
  toolsEnabled: boolean
}

export const useMcpStore = defineStore('mcp', {
  state: (): McpState => ({
    tools: [],
    loading: false,
    selectedTool: null,
    selectedTools: [], // 新增：初始化为空数组
    error: null,
    initialized: false,
    toolsEnabled: true,
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
  },

  getters: {
    // 获取当前选中的工具列表
    // getSelectedTools: (state) => state.selectedTools,
    getSelectedTools: state => {
      if (!state.toolsEnabled) {
        return []
      }
      return state.selectedTools
    },

    // 检查是否有工具被选中
    hasSelectedTools: state => state.selectedTools.length > 0,

    // 获取选中工具的数量
    selectedToolsCount: state => state.selectedTools.length,

    // 检查是否有工具可用
    hasTools: state => state.tools.length > 0,

    // 获取工具数量
    toolCount: state => state.tools.length,
  },

  persist: {
    pick: ['selectedTools', 'toolsEnabled'],
  },
})