<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/components/ui/toast/use-toast'
import { 
  FileText, 
  Download, 
  Trash2, 
  MoreHorizontal,
  FileType,
  CheckCircle,
  Clock
} from 'lucide-vue-next'

const { t } = useI18n()
const { toast } = useToast()

// 模拟文档数据
const documents = ref([
  { 
    id: '1', 
    title: '产品说明书.pdf', 
    description: '详细介绍产品功能和使用方法的说明文档',
    type: 'pdf',  
    created_at: '2023-06-15T10:30:00Z',
    dataCount: 5,
    status: 'ready', // ready 或 indexing
    enabled: true
  },
  { 
    id: '2', 
    title: '用户手册.docx', 
    description: '面向最终用户的操作指南和常见问题解答',
    type: 'docx',  
    created_at: '2023-06-16T14:20:00Z',
    dataCount: 3,
    status: 'indexing',
    enabled: true
  },
  { 
    id: '3', 
    title: '技术规格.xlsx', 
    description: '产品技术参数和性能指标详细说明',
    type: 'xlsx',  
    created_at: '2023-07-01T09:15:00Z',
    dataCount: 8,
    status: 'ready',
    enabled: false
  },
  { 
    id: '4', 
    title: '常见问题.md', 
    description: '用户常见问题和解决方案汇总',
    type: 'md',  
    created_at: '2023-07-10T16:45:00Z',
    dataCount: 12,
    status: 'ready',
    enabled: true
  },
  { 
    id: '5', 
    title: '安装指南.txt', 
    description: '软件安装步骤和环境配置要求',
    type: 'txt',  
    created_at: '2023-08-05T11:30:00Z',
    dataCount: 2,
    status: 'indexing',
    enabled: false
  },
])

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// 获取文件图标
const getFileIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'pdf':
    case 'docx':
    case 'xlsx':
    case 'md':
    case 'txt':
      return FileText
    default:
      return FileType
  }
}

// 获取状态图标
const getStatusIcon = (status: string) => {
  return status === 'ready' ? CheckCircle : Clock
}

// 获取状态颜色
const getStatusColor = (status: string) => {
  return status === 'ready' ? 'text-green-500' : 'text-gray-400'
}

// 获取状态文本
const getStatusText = (status: string) => {
  return status === 'ready' ? t('rag.document.statusReady') : t('rag.document.statusIndexing')
}

// 下载文档
const downloadDocument = (doc) => {
  toast({
    title: t('rag.document.downloadStarted'),
    description: t('rag.document.downloadStartedDesc', { title: doc.title })
  })
}

// 删除文档
const deleteDocument = (doc) => {
  documents.value = documents.value.filter(d => d.id !== doc.id)
  toast({
    title: t('rag.document.deleteSuccess'),
    description: t('rag.document.deleteSuccessDesc', { title: doc.title })
  })
}

// 切换启用状态
const toggleEnabled = (doc) => {
  const index = documents.value.findIndex(d => d.id === doc.id)
  if (index !== -1) {
    documents.value[index].enabled = !documents.value[index].enabled
    
    toast({
      title: documents.value[index].enabled 
        ? t('rag.document.enabled') 
        : t('rag.document.disabled'),
      description: t('rag.document.toggleStatusDesc', { title: doc.title })
    })
  }
}
</script>

<template>
  <div class="w-full h-full overflow-hidden flex flex-col">
    <ScrollArea class="max-h-[calc(100vh-180px)] relative">
    <table class="max-w-full w-full">
      <thead>
        <tr>
          <th class="w-[300px]">{{ t('rag.document.name') }}</th>
          <th>{{ t('rag.document.dataCount') }}</th>
          <th>{{ t('rag.document.status') }}</th>
          <th>{{ t('rag.document.enabled') }}</th>
          <th>{{ t('rag.document.createdAt') }}</th>
          <th class="text-right p-3">{{ t('rag.document.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="doc in documents" :key="doc.id">
          <td class="">
            <div class="flex flex-col">
              <div class="flex items-center gap-2">
                <component :is="getFileIcon(doc.type)" class="h-4 w-4" />
                <span>{{ doc.title }}</span>
              </div>
              <div class="text-xs text-gray-500 mt-1 ml-6">
                {{ doc.description }}
              </div>
            </div>
          </td>
          <td>{{ doc.dataCount }} 条</td>
          <td>
            <div class="flex items-center gap-2">
              <component :is="getStatusIcon(doc.status)" class="h-4 w-4" :class="getStatusColor(doc.status)" />
              <span>{{ getStatusText(doc.status) }}</span>
            </div>
          </td>
          <td>
            <Switch 
              v-model="doc.enabled" 
              @update:checked="toggleEnabled(doc)"
              :disabled="doc.status === 'indexing'"
            />
          </td>
          <td>{{ formatDate(doc.created_at) }}</td>
          <td class="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" class="h-8 w-8 p-0">
                  <span class="sr-only">{{ t('common.openMenu') }}</span>
                  <MoreHorizontal class="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="downloadDocument(doc)">
                  <Download class="mr-2 h-4 w-4" />
                  <span>{{ t('rag.document.download') }}</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  @click="deleteDocument(doc)" 
                  class="text-red-600 hover:text-red-500"
                  :disabled="doc.status === 'indexing'"
                >
                  <Trash2 class="mr-2 h-4 w-4" />
                  <span>{{ t('common.delete') }}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </td>
        </tr>
      </tbody>
    </table>
    </ScrollArea>
  </div>
</template>

<style scoped>
td {
  @apply text-sm p-3;
}

th {
  @apply text-left p-3 font-normal text-sm;
}

thead {
  @apply sticky top-0 bg-background z-10 border-b;
}

tbody tr {
  @apply border-b hover:bg-muted/50;
}
</style>