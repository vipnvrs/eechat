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
import { Search } from 'lucide-vue-next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Rocket } from 'lucide-vue-next'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { modelsData } from '@/lib/models'
import {getIconName, modelSizeToGB} from '@/lib/utils'
import Icon from '@/components/Icon.vue'
import { LoaderCircle} from 'lucide-vue-next'
import { ollamaApi } from '@/api/request'

const loading = ref(false)

const ollamaState = reactive({
  error: "服务未响应",
  installed:false,
  running: false,
  checked: false
})
const getOllamaState = async () => {
  loading.value = true
  const res = await ollamaApi.getOllamaSatate()
  ollamaState.error = res.error
  ollamaState.installed = res.installed
  ollamaState.running = res.running
  ollamaState.checked = true
  console.log(ollamaState);
  loading.value = false
}
const installOllama = async () => {
  const res = await ollamaApi.installOllama()
  console.log(res);
  getOllamaState()
}
const startOllama = async () => {
  loading.value = true
  const res = await ollamaApi.startOllama()
  console.log(res);
  loading.value = false
  getOllamaState()
}
const stopOllama = async () => {
  const res = await ollamaApi.stopOllama()
  console.log(res);
  getOllamaState()
}

onMounted(() => {
  getOllamaState()
})

// 添加搜索关键字
const searchQuery = ref('')

// 添加计算属性来过滤模型 
const filteredModels = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return modelsData

  return modelsData.filter(item => {
    // 搜索条件:模型名称、描述、功能标签、模型大小
    const nameMatch = item.name.toLowerCase().includes(query)
    const capabilitiesMatch = item.capabilities.some(cap => 
      cap.toLowerCase().includes(query)
    )
    // 添加模型大小匹配
    const sizeMatch = item.sizes.some(size => {
      // 移除 b/m 单位进行数字比较
      const sizeNum = size.replace(/[bm]/i, '')
      const queryNum = query.replace(/[bm]/i, '')
      // 完全匹配如 "7b" "1b"
      const exactMatch = size.toLowerCase() === query
      // 数字匹配如 "7" "1" 
      const numberMatch = sizeNum === queryNum
      return exactMatch || numberMatch
    })
    return nameMatch || capabilitiesMatch || sizeMatch
  })
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
        <template v-if="ollamaState.running"><div class="rounded-full w-2 h-2 mr-3 bg-green-500"></div> 本地服务运行正常</template>
        <template v-if="!ollamaState.running && ollamaState.installed"><div class="rounded-full w-2 h-2 mr-3 bg-yellow-500"></div> {{ollamaState.error}}</template>
        <template v-if="!ollamaState.installed"><div class="rounded-full w-2 h-2 mr-3 bg-red-500"></div> {{ollamaState.error}}</template>
      </div>
      <div>
        <Button v-if="!ollamaState.checked" @click="getOllamaState">刷新状态</Button>
        <Button v-if="ollamaState.running" @click="stopOllama">停止 Ollama <LoaderCircle v-if="loading" class="animate-spin w-4 h-4 ml-2"></LoaderCircle></Button>
        <Button v-if="!ollamaState.installed && ollamaState.checked" @click="installOllama">安装 Ollama <LoaderCircle v-if="loading" class="animate-spin w-4 h-4 ml-2"></LoaderCircle></Button>
        <Button v-if="!ollamaState.running && ollamaState.installed" @click="startOllama">启动 Ollama <LoaderCircle v-if="loading" class="animate-spin w-4 h-4 ml-2"></LoaderCircle></Button>        
      </div>
    </div>
    <div class="flex justify-between items-center py-6">
      <div class="font-bold">模型管理</div>
      <div class="relative w-full max-w-sm items-center">
        <Input
          id="search"
          type="text"
          v-model="searchQuery"
          placeholder="搜索模型名称、描述或功能..."
          class="pl-10"
        />
        <span
          class="absolute start-0 inset-y-0 flex items-center justify-center px-2"
        >
          <Search class="size-6 text-muted-foreground" />
        </span>
      </div>
    </div>
    <ScrollArea class="flex-1 flex flex-col space-y-2">
      <template v-for="item in filteredModels">
        <div
          class="rounded border p-4 mb-4"
          v-for="(model, modelIndex) in item.sizes" 
          :key="`${item.name}-${model}-${modelIndex}`"
        >
          <div class="flex justify-between items-center">
            <div class="flex items-center space-x-2">
              <Icon :name="getIconName(item.name)"></Icon>
              <div class="font-bold">{{ item.name }}:{{ model }}</div>
              <Badge variant="outline">{{ modelSizeToGB(model) }}</Badge>
            </div>
            <Button variant="" size="sm">安装</Button>
          </div>
          <div class="flex space-x-2">
            <Badge variant="secondary">LLM</Badge>
            <Badge
              variant="secondary" 
              v-for="(capability, capIndex) in item.capabilities"
              :key="`${capability}-${capIndex}`"
            >
              {{ capability }}
            </Badge>
          </div>
          <div class="text-sm text-gray-500 truncate whitespace-pre-wrap">
            {{ item.description }}
          </div>
        </div>
      </template>
    </ScrollArea>

    <Pagination
      v-slot="{ page }"
      :items-per-page="10"
      :total="100"
      :sibling-count="1"
      show-edges
      :default-page="2"
      class="hidden"
    >
      <PaginationList v-slot="{ items }" class="flex items-center gap-1">
        <PaginationFirst />
        <PaginationPrev />

        <template v-for="(item, index) in items">
          <PaginationListItem
            v-if="item.type === 'page'"
            :key="index"
            :value="item.value"
            as-child
          >
            <Button
              class="w-9 h-9 p-0"
              :variant="item.value === page ? 'default' : 'outline'"
            >
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
