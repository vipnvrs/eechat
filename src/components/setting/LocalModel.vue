<script setup lang="ts">
import { ref, onMounted, watch, reactive, computed } from "vue"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
} from "@/components/ui/pagination"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Search, RefreshCw } from "lucide-vue-next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Rocket } from "lucide-vue-next"
import { modelsData } from "@/lib/models"
import { getIconName, modelSizeToGB } from "@/lib/utils"
import Icon from "@/components/Icon.vue"
import { LoaderCircle, Download, Trash } from "lucide-vue-next"
import { ollamaApi } from "@/api/request"
import { useOllamaStore } from "@/stores/ollama"
import { useModelStore } from "@/stores/model"
import ModelFilter from "./ModelFilter.vue"
import type { FilterOption } from "./ModelFilter.vue"
import { useToast } from "@/components/ui/toast/use-toast"
import { Toaster } from "@/components/ui/toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { Loader2 } from "lucide-vue-next"
// import { useDialog, useMessage } from 'naive-ui'

// const dialog = useDialog()
// const message = useMessage()
const loading = ref(false)
const ollamaStore = useOllamaStore()
const modelStore = useModelStore()
const { toast } = useToast()

const ollamaState = reactive({
  error: "服务未响应",
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
  if (res.data) {
    showInstallDialog.value = true
    downloadUrl.value = res.data
  }
  console.log(res)
}
const startOllama = async () => {
  loading.value = true
  const res = await ollamaApi.startOllama()
  console.log(res)
  loading.value = false
  getOllamaState()
}
const stopOllama = async () => {
  loading.value = true
  const res = await ollamaApi.stopOllama()
  loading.value = false
  getOllamaState()
}
const handlePullModel = async (model: string) => {
  try {
    const response = await ollamaApi.pullModel(model)
    if (!response) return
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    while (reader) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split("\n")

      for (const line of lines) {
        if (!line || !line.startsWith("data: ")) continue
        try {
          const data = JSON.parse(line.slice(5))
          ollamaStore.updateDownloadStatus(model, {
            completed: data.completed,
            total: data.total,
            percent: data.percent,
            speed: data.speed,
            status: data.status,
          })
          console.log(data)
          if (data.status === "success") {
            ollamaStore.clearDownloadStatus(model)
            await listModel() // 刷新模型列表
            toast({
              title: `${model} 安装成功`,
              description: "模型已安装成功，快去使用吧。",
            })
            break
          }
        } catch (e) {
          console.error("Parse response error:", e)
        }
      }
    }
  } catch (error) {
    console.error("Download failed:", error)
    ollamaStore.clearDownloadStatus(model)
  }
}

const listModel = async () => {
  try {
    const res = await ollamaApi.listModel()
    if (res?.data?.models) {
      ollamaStore.setLocalModels(res.data.models)
      const modelsData = res.data.models
      if (modelsData?.length) {
        // 转换本地模型格式
        const formattedModels = modelsData.map((model) => ({
          id: model.name,
          name: model.name,
          provider_id: "local",
          group_name: "Local",
          state: true, // 本地模型默认启用
          type: "local",
          capabilities: ["chat", "completion"],
          from: "local",
        }))
        modelStore.updateLocalModels(formattedModels)
      }
    }
  } catch (error) {
    console.error("获取本地模型列表失败:", error)
  }
}

onMounted(() => {
  getOllamaState()
})

// 筛选和搜索状态
const selectedFilters = ref<FilterOption[]>(["all"])
const searchQuery = ref("")
const filteredModels = ref(modelsData)

const deleteModel = async (model: string) => {
  try {
    loading.value = true
    const res = await ollamaApi.removeModel(model)
    toast({
      title: "删除成功",
      description: `模型 ${model} 已被删除`,
    })
    // 删除成功后，刷新本地模型列表
    await listModel()
  } catch (error) {
    console.log(error)

    toast({
      title: "删除失败",
      variant: "destructive",
      description: (error as Error).message || "未知错误",
    })
    // console.error('删除模型失败:', error)
  } finally {
    loading.value = false
  }
}

// 添加状态变量
const showInstallDialog = ref(false)
const downloadUrl = ref("")

// 添加处理安装的函数
const handleInstall = async () => {
  await window.ipcRenderer.invoke("open-url", downloadUrl.value)
  showInstallDialog.value = false
  toast({
    title: "开始下载",
    description: "请完成安装后重启本软件以检查安装状态",
  })
}
</script>

<template>
  <Toaster />
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
        <div class="ml-2">
          <Button @click="getOllamaState" size="icon" variant="ghost">
            <RefreshCw class="w-2 h-2 text-gray-300"></RefreshCw>
          </Button>
        </div>
      </div>
      <div>
        <Button v-if="!ollamaState.checked" @click="getOllamaState">刷新状态</Button>
        <Button v-if="ollamaState.running" @click="stopOllama"
          >停止模型管理器
          <LoaderCircle v-if="loading" class="animate-spin w-4 h-4 ml-2"></LoaderCircle>
        </Button>
        <Button
          v-if="!ollamaState.installed && ollamaState.checked"
          @click="installOllama"
          >安装模型管理器
          <LoaderCircle v-if="loading" class="animate-spin w-4 h-4 ml-2"></LoaderCircle>
        </Button>
        <Button v-if="!ollamaState.running && ollamaState.installed" @click="startOllama"
          >启动模型管理器
          <LoaderCircle v-if="loading" class="animate-spin w-4 h-4 ml-2"></LoaderCircle>
        </Button>
      </div>
    </div>
    <div class="flex justify-between items-center pt-2">
      <div class="font-bold">模型管理</div>
      <Button variant="link" class="text-gray-400">更多模型?</Button>
    </div>

    <ModelFilter
      v-model="selectedFilters"
      v-model:search-query="searchQuery"
      @update:filteredModels="(filtered) => (filteredModels = filtered)"
    />

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
              <!-- 添加本地模型标记 -->
              <Badge
                v-if="ollamaStore.isModelInstalled(`${item.name}:${model}`)"
                variant="outline"
                class="border-green-500 text-green-500"
              >
                已安装
              </Badge>
              <!-- 显示模型详细信息 -->
              <div
                v-if="ollamaStore.getModelInfo(`${item.name}:${model}`)"
                class="text-sm text-gray-500"
              >
                {{
                  ollamaStore.getModelInfo(`${item.name}:${model}`)?.details
                    ?.parameter_size
                }}
                |
                {{
                  ollamaStore.getModelInfo(`${item.name}:${model}`)?.details
                    ?.quantization_level
                }}
              </div>
            </div>
            <div class="flex space-x-2">
              <!-- 安装测试使用 -->
              <!-- <Button size="icon" @click="handlePullModel(`${item.name}:${model}`)">
                <template v-if="ollamaStore.isDownloading(`${item.name}:${model}`)">
                  {{
                    ollamaStore.getDownloadStatus(`${item.name}:${model}`)
                      .percent
                  }}%
                </template>
                <template v-else> 
                  <Download></Download>
                </template>
              </Button> -->
              <Button
                v-if="!ollamaStore.isModelInstalled(`${item.name}:${model}`)"
                size="icon"
                @click="handlePullModel(`${item.name}:${model}`)"
              >
                <template v-if="ollamaStore.isDownloading(`${item.name}:${model}`)">
                  {{ ollamaStore.getDownloadStatus(`${item.name}:${model}`).percent }}%
                </template>
                <template v-else>
                  <!-- 安装  -->
                  <Download></Download>
                </template>
              </Button>
              <AlertDialog v-else>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" :disabled="loading">
                    <Trash></Trash>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认删除模型?</AlertDialogTitle>
                    <AlertDialogDescription>
                      此操作将删除模型
                      {{ `${item.name}:${model}` }}，删除后需要重新下载才能使用。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction
                      :disabled="loading"
                      @click="deleteModel(`${item.name}:${model}`)"
                    >
                      <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
                      {{ loading ? "删除中..." : "确认删除" }}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <!-- 添加下载进度条 -->
          <div v-if="ollamaStore.isDownloading(`${item.name}:${model}`)" class="mt-2">
            <div class="w-full bg-gray-200 rounded">
              <div
                class="bg-blue-600 h-2 rounded"
                :style="{
                  width: `${
                    ollamaStore.getDownloadStatus(`${item.name}:${model}`).percent
                  }%`,
                }"
              ></div>
            </div>
            <div class="text-sm text-gray-500 mt-1">
              {{ ollamaStore.getDownloadStatus(`${item.name}:${model}`).speed }}MB/s
            </div>
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
    <!-- <Pagination v-slot="{ page }" :items-per-page="10" :total="100" :sibling-count="1" show-edges :default-page="2"
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
    </Pagination> -->
  </div>
  <AlertDialog :open="showInstallDialog" @update:open="showInstallDialog = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>下载并安装 Ollama</AlertDialogTitle>
        <AlertDialogDescription>
          点击确认将打开浏览器下载 Ollama。完成安装后请重启本软件以检查安装状态。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>取消</AlertDialogCancel>
        <AlertDialogAction @click="handleInstall"> 马上下载 </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<style scoped></style>
