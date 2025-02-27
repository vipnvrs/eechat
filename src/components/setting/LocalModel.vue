<script setup lang="ts">
import { ref, onMounted, watch, reactive } from 'vue'
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
import {getIconName} from '@/lib/utils'
import Icon from '@/components/Icon.vue'
onMounted(() => {})

// 模型数据
console.log(modelsData)

// 辅助函数：将参数量转换为文件大小
function modelSizeToGB(size: string): string {
  // 提取数字和单位
  const dNum = 0.73
  const match = size.match(/(\d+(?:\.\d+)?)([bm]+)/)
  if (!match) return 'Unknown'

  const [_, num, unit] = match
  const number = parseFloat(num)

  // 根据单位转换
  switch (unit.toLowerCase()) {
    case 'b': // billion
      return `${(number * dNum).toFixed(1)}GB`
    case 'm': // million
      return `${((number * dNum) / 1000).toFixed(1)}GB`
    default:
      return 'Unknown'
  }
}
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
    <Alert>
      <Rocket class="h-4 w-4" />
      <AlertTitle class="font-bold">暂时无法运行!</AlertTitle>
      <AlertDescription>
        <div>系统未检测到本地模型管理工具，是否马上安装?</div>
        <Button class="mt-2">安装 Ollama</Button>
      </AlertDescription>
    </Alert>
    <div class="flex justify-between items-center py-6">
      <div class="font-bold">模型管理</div>
      <div class="relative w-full max-w-sm items-center">
        <Input id="search" type="text" placeholder="搜索..." class="pl-10" />
        <span
          class="absolute start-0 inset-y-0 flex items-center justify-center px-2"
        >
          <Search class="size-6 text-muted-foreground" />
        </span>
      </div>
    </div>
    <ScrollArea class="flex-1 flex flex-col space-y-2">
      <template v-for="item in modelsData">
        <div
          class="rounded border p-4 mb-4"
          v-for="model in item.sizes"
          :key="item.name"
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
              v-for="capability in item.capabilities"
              :key="capability"
              >{{ capability }}</Badge
            >
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
