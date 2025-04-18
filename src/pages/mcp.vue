<script setup lang="ts">
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ref, onMounted } from "vue"
import { SquareArrowOutUpRight } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import mcpMock from '@/api/mcpMock.json'
import { Plus } from "lucide-vue-next"
import { Settings, Terminal, FileText } from "lucide-vue-next"
import Env from "@/components/mcp/Env.vue"
import Config from "@/components/mcp/Config.vue"

const { t } = useI18n()

// 分类列表
const categories = ref([
  {
    title: '推荐',
    value: 'recommended'
  },
  ...mcpMock.FiledAgg.Category.map(cat => ({
    title: cat.Value,
    value: cat.Value,
    count: cat.Count
  }))
])

// MCP 列表
const mcpList = ref(mcpMock.McpServer.McpServers)
const filteredMcpList = ref(mcpList.value)

// 当前选中的分类
const activeCategory = ref('recommended')

// 处理分类切换
const handleCategoryChange = (value: string) => {
  activeCategory.value = value
  if (value === 'recommended') {
    filteredMcpList.value = mcpList.value
  } else {
    filteredMcpList.value = mcpList.value.filter(item => item.Category === value)
  }
}

// 处理安装
const handleInstall = (mcp) => {
  console.log('安装', mcp)
}

// 添加已安装 MCP 列表
const installedMcps = ref([
  {
    Id: 1,
    ChineseName: 'Fetch网页内容抓取',
    FromSiteIcon: 'https://resouces.modelscope.cn/studio-cover-pre/studio-cover_761f7bfe-fc5c-4753-b955-dcdd3288941b.png',
    FromSite: 'github',
    AbstractCN: '该服务器使大型语言模型能够检索和处理网页内容，将HTML转换为markdown格式，以便于更轻松地使用。'
  },
  {
    Id: 2,
    ChineseName: '高德地图',
    FromSiteIcon: 'https://resouces.modelscope.cn/studio-cover-pre/studio-cover_982efeea-b6fe-4c38-91da-501de5a7f098.png',
    FromSite: 'github',
    AbstractCN: '高德地图是一个支持任何MCP协议客户端的服务器，允许用户轻松利用高德地图MCP服务器获取各种基于位置的服务。'
  },
  {
    Id: 1,
    ChineseName: 'Fetch网页内容抓取',
    FromSiteIcon: 'https://resouces.modelscope.cn/studio-cover-pre/studio-cover_761f7bfe-fc5c-4753-b955-dcdd3288941b.png',
    FromSite: 'github',
    AbstractCN: '该服务器使大型语言模型能够检索和处理网页内容，将HTML转换为markdown格式，以便于更轻松地使用。'
  },
  {
    Id: 2,
    ChineseName: '高德地图',
    FromSiteIcon: 'https://resouces.modelscope.cn/studio-cover-pre/studio-cover_982efeea-b6fe-4c38-91da-501de5a7f098.png',
    FromSite: 'github',
    AbstractCN: '高德地图是一个支持任何MCP协议客户端的服务器，允许用户轻松利用高德地图MCP服务器获取各种基于位置的服务。'
  }
])

// 处理添加新应用
const handleAddNew = () => {
  console.log('添加新应用')
}
</script>

<template>
  <div class="mx-auto h-[100vh] max-[100vh] px-4 max-sm:px-4 flex flex-col overflow-hidden">
    <!-- 修改标题部分 -->
    <div class="flex justify-between items-center">
      <div>
        <div class="font-bold pt-6 text-2xl">MCP管理</div>
        <div class="mt-2 text-sm text-gray-400">
          管理和安装 MCP 应用，提升 AI 助手的能力
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <Config></Config>
        <Env></Env>
        <Button variant="outline">
          <FileText class="w-4 h-4 mr-2" />
          帮助文档
        </Button>
      </div>
    </div>

    <ScrollArea class="h-[calc(100dvh-130px)]">
    <!-- 调整已安装部分布局 -->
    <div class="mt-6">
      <div class="font-medium mb-3 flex justify-between">
        <h3>已安装应用</h3>
        <!-- <div class="flex items-center space-x-2">
          <Button variant="outline">配置文件</Button>
          <Button variant="outline">运行环境</Button>
        </div> -->
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 添加新应用卡片 -->
        <div class="rounded-md border overflow-hidden cursor-pointer hover:border-primary" @click="handleAddNew">
          <div class="flex flex-col items-center justify-center h-[172px] text-muted-foreground">
            <Plus class="w-8 h-8 mb-2" />
            <span class="text-sm">添加新应用</span>
          </div>
        </div>

        <div 
          v-for="item in installedMcps" 
          :key="item.Id"
          class="rounded-md border overflow-hidden"
        >
          <div class="font-bold p-4">
            {{ item.ChineseName }}
          </div>
          <Separator></Separator>
          <div class="p-4 relative">
            <div class="text-sm">{{ item.AbstractCN }}</div>
            <div class="flex justify-between items-center mt-4">
              <div class="flex items-center">
                <img 
                  :src="item.FromSiteIcon" 
                  class="w-4 h-4 rounded-full"
                  alt="icon"
                />
                <span class="ml-2 text-sm text-gray-500">{{ item.FromSite }}</span>
              </div>
              <Button variant="ghost" size="icon">
                <SquareArrowOutUpRight class="text-gray-400"></SquareArrowOutUpRight>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 调整下半部分布局 -->
    <div class=" flex-1 mt-6">
      <div class="font-medium mb-3 flex justify-between">
        <h3>推荐应用</h3>
        <div class="flex items-center space-x-2">
          <Button variant="outline">查看更多</Button>
        </div>
      </div>
        <div class="">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div v-for="item in filteredMcpList" :key="item.Id" class="rounded-md border overflow-hidden">
              <!-- 卡片内容保持不变 -->
              <div class="font-bold p-4">
                {{ item.ChineseName || item.Name }}
              </div>
              <Separator></Separator>
              <div class="p-4 relative">
                <div class="text-sm line-clamp-3">{{ item.AbstractCN || item.Abstract }}</div>
                <div class="flex justify-between items-center mt-4">
                  <div class="flex items-center">
                    <img 
                      :src="item.FromSiteIcon" 
                      class="w-4 h-4 rounded-full"
                      alt="icon"
                    />
                    <span class="ml-2 text-sm text-gray-500">{{ item.FromSite }}</span>
                  </div>
                  <Button @click="handleInstall(item)" variant="ghost" size="icon">
                    <SquareArrowOutUpRight class="text-gray-400"></SquareArrowOutUpRight>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  </ScrollArea>
  </div>
</template>