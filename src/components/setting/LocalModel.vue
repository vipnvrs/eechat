<script setup lang="ts">
import { ref, onMounted, watch, reactive, computed } from 'vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
} from '@/components/ui/pagination'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Search } from 'lucide-vue-next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Rocket } from 'lucide-vue-next'
import { modelsData } from '@/lib/models'
import { getIconName, modelSizeToGB } from '@/lib/utils'
import Icon from '@/components/Icon.vue'
import { LoaderCircle } from 'lucide-vue-next'
import { ollamaApi } from '@/api/request'
import { useOllamaStore } from '@/stores/ollama'
import ModelFilter from './ModelFilter.vue'
import type { FilterOption } from './ModelFilter.vue'

const ollamaStore = useOllamaStore()

const loading = ref(false)

const ollamaState = reactive({
  error: '服务未响应',
  installed: false,
  running: false,
  checked: false,
})
const getOllamaState = async () => {
  loading.value = true
  const res = await ollamaApi.getOllamaSatate()
  ollamaState.error = res.error
  ollamaState.installed = res.installed
  ollamaState.running = res.running
  ollamaState.checked = true
  console.log(ollamaState)
  loading.value = false
  if (res.running) {
    listModel()
  }
}
const installOllama = async () => {
  const res = await ollamaApi.installOllama()
  console.log(res)
  getOllamaState()
}
const startOllama = async () => {
  loading.value = true
  const res = await ollamaApi.startOllama()
  console.log(res)
  loading.value = false
  getOllamaState()
}
const stopOllama = async () => {
  const res = await ollamaApi.stopOllama()
  console.log(res)
  getOllamaState()
}
const handlePullModel = async (model: string) => {
  try {
    const response = await ollamaApi.pullModel(model)

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    while (reader) {
      const { done, value } = await reader.read()
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (!line) continue
        try {
          const data = JSON.parse(line)
          console.log(done, data)
          // 更新下载状态
          ollamaStore.updateDownloadStatus(model, {
            completed: data.completed,
            total: data.total,
            percent: data.percent,
            speed: data.speed,
            status: data.status,
          })
        } catch (e) {
          // console.error('Parse response error:', e)
        }
      }
      if (done) {
        ollamaStore.clearDownloadStatus(model)
        break
      }
    }
  } catch (error) {
    console.error('Download failed:', error)
    ollamaStore.clearDownloadStatus(model)
  }
}

const listModel = async () => {
  try {
    const res = await ollamaApi.listModel()
    if (res?.data?.models) {
      ollamaStore.setLocalModels(res.data.models)
    }
  } catch (error) {
    console.error('获取本地模型列表失败:', error)
  }
}

onMounted(() => {
  getOllamaState()
})

// 筛选和搜索状态
const selectedFilters = ref<FilterOption[]>(['all'])
const searchQuery = ref('0.5')
const filteredModels = ref(modelsData)

watch(searchQuery, val => {
  console.log(val);
})

</script>

<template>
  <div class="space-y-4 flex flex-col overflow-hidden pb-4">
    <Alert class="hidden">
      <Rocket class="h-4 w-4" />
      <AlertTitle class="font-bold">可以正常运行</AlertTitle>
      <AlertDescription>
        <p>处理器: 12th Gen Intel(R) Core(TM) i5-12400F 12 2.496GHz</p>
        <p>内存: 31.85 GB/ 14.67 GB 可用</p>
        <p>显卡: NVIDIA GeForce RTX 3060 Ti</p>
        <p>建议: 由于硬件资源有限，建议选择轻量级的模型，如: 1b、2b 等</p>
      </AlertDescription>
    </Alert>
    <div class="flex rounded p-4 border justify-between items-center">
      <div class="font-bold flex items-center space-x-2">
        <template v-if="ollamaState.running">
          <div class="rounded-full w-2 h-2 mr-3 bg-green-500"></div>
          本地服务运行正常
        </template>
        <template v-if="!ollamaState.running && ollamaState.installed">
          <div class="rounded-full w-2 h-2 mr-3 bg-yellow-500"></div>
          {{ ollamaState.error }}
        </template>
        <template v-if="!ollamaState.installed">
          <div class="rounded-full w-2 h-2 mr-3 bg-red-500"></div>
          {{ ollamaState.error }}
        </template>
      </div>
      <div>
        <Button v-if="!ollamaState.checked" @click="getOllamaState">刷新状态</Button>
        <Button v-if="ollamaState.running" @click="stopOllama">停止 Ollama
          <LoaderCircle v-if="loading" class="animate-spin w-4 h-4 ml-2"></LoaderCircle>
        </Button>
        <Button v-if="!ollamaState.installed && ollamaState.checked" @click="installOllama">安装 Ollama
          <LoaderCircle v-if="loading" class="animate-spin w-4 h-4 ml-2"></LoaderCircle>
        </Button>
        <Button v-if="!ollamaState.running && ollamaState.installed" @click="startOllama">启动 Ollama
          <LoaderCircle v-if="loading" class="animate-spin w-4 h-4 ml-2"></LoaderCircle>
        </Button>
      </div>
    </div>
    <div class="flex justify-between items-center pt-6">
      <div class="font-bold">模型管理</div>
      <Button variant="link" class="text-gray-400">更多模型?</Button>
    </div>

    <ModelFilter v-model="selectedFilters" v-model:search-query="searchQuery"
      @update:filteredModels="filtered => filteredModels = filtered" />

    <ScrollArea class="flex-1 flex flex-col space-y-2">
      <template v-for="item in filteredModels">
        <div class="rounded border p-4 mb-4" v-for="(model, modelIndex) in item.sizes"
          :key="`${item.name}-${model}-${modelIndex}`">
          <div class="flex justify-between items-center">
            <div class="flex items-center space-x-2">
              <Icon :name="getIconName(item.name)"></Icon>
              <div class="font-bold">{{ item.name }}:{{ model }}</div>
              <Badge variant="outline">{{ modelSizeToGB(model) }}</Badge>
              <!-- 添加本地模型标记 -->
              <Badge v-if="ollamaStore.isModelInstalled(`${item.name}:${model}`)" variant="outline"
                class="border-green-500 text-green-500">
                已安装
              </Badge>
              <!-- 显示模型详细信息 -->
              <div v-if="ollamaStore.getModelInfo(`${item.name}:${model}`)" class="text-sm text-gray-500">
                {{
                  ollamaStore.getModelInfo(`${item.name}:${model}`).details
                    .parameter_size
                }}
                |
                {{
                  ollamaStore.getModelInfo(`${item.name}:${model}`).details
                    .quantization_level
                }}
              </div>
            </div>
            <Button size="sm" @click="handlePullModel(`${item.name}:${model}`)"
              :disabled="ollamaStore.isDownloading(`${item.name}:${model}`)">
              <template v-if="ollamaStore.isDownloading(`${item.name}:${model}`)">
                <LoaderCircle class="animate-spin w-4 h-4 mr-2" />
                {{
                  ollamaStore.getDownloadStatus(`${item.name}:${model}`)
                    .percent
                }}%
              </template>
              <template v-else> 安装 </template>
            </Button>
          </div>

          <!-- 添加下载进度条 -->
          <div v-if="ollamaStore.isDownloading(`${item.name}:${model}`)" class="mt-2">
            <div class="w-full bg-gray-200 rounded">
              <div class="bg-blue-600 h-2 rounded" :style="{
                width: `${ollamaStore.getDownloadStatus(`${item.name}:${model}`)
                  .percent
                  }%`,
              }"></div>
            </div>
            <div class="text-sm text-gray-500 mt-1">
              {{
                ollamaStore.getDownloadStatus(`${item.name}:${model}`).speed
              }}MB/s
            </div>
          </div>
          <div class="flex space-x-2">
            <Badge variant="secondary">LLM</Badge>
            <Badge variant="secondary" v-for="(capability, capIndex) in item.capabilities"
              :key="`${capability}-${capIndex}`">
              {{ capability }}
            </Badge>
          </div>
          <div class="text-sm text-gray-500 truncate whitespace-pre-wrap">
            {{ item.description }}
          </div>
        </div>
      </template>
    </ScrollArea>

    <Pagination v-slot="{ page }" :items-per-page="10" :total="100" :sibling-count="1" show-edges :default-page="2"
      class="hidden">
      <PaginationList v-slot="{ items }" class="flex items-center gap-1">
        <PaginationFirst />
        <PaginationPrev />

        <template v-for="(item, index) in items">
          <PaginationListItem v-if="item.type === 'page'" :key="index" :value="item.value" as-child>
            <Button class="w-9 h-9 p-0" :variant="item.value === page ? 'default' : 'outline'">
              {{ item.value }}
            </Button>
          </PaginationListItem>
          <PaginationEllipsis v-else :key="item.type" :index="index" />
        </template>

        <PaginationNext />
        <PaginationLast />
      </PaginationList>
    </Pagination>
  </div>
</template>

<style scoped>
.select-trigger {
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
}
</style>
