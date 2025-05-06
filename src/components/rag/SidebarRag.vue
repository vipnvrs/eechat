<script setup lang="ts">
import { Label } from '@/components/ui/label'
import { useI18n } from 'vue-i18n'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  type SidebarProps,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'
import { Toaster } from '@/components/ui/toast'
import {
  Trash2,
  Plus,
  EllipsisVertical,
  FileText,
  FolderOpen,
  Upload
} from 'lucide-vue-next'
import { h, ref, onMounted, computed } from 'vue'
import { useEnvStore } from "@/stores/env"

const envStore = useEnvStore()

// 设置语言
const { t } = useI18n()
const { toast } = useToast()

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: 'icon',
})

// 知识库文件列表
const knowledgeFiles = ref([
  { id: '1', title: '产品说明书.pdf', type: 'pdf', created_at: '2023-06-15T10:30:00Z', size: '2.5MB' },
  { id: '2', title: '用户手册.docx', type: 'docx', created_at: '2023-06-16T14:20:00Z', size: '1.8MB' },
  { id: '3', title: '技术规格.xlsx', type: 'xlsx', created_at: '2023-07-01T09:15:00Z', size: '0.9MB' },
  { id: '4', title: '常见问题.md', type: 'md', created_at: '2023-07-10T16:45:00Z', size: '0.3MB' },
  { id: '5', title: '安装指南.txt', type: 'txt', created_at: '2023-08-05T11:30:00Z', size: '0.1MB' },
])

const activeFileId = ref('')

// 切换选中文件
const handleFileChange = file => {
  activeFileId.value = file.id
  // 这里可以添加其他处理逻辑
}

// 删除文件相关
const deleteLoading = ref(false)
const fileToDelete = ref(null)

const handleRemoveFile = item => {
  fileToDelete.value = JSON.parse(JSON.stringify(item))
}

const handleCancelDelete = () => {
  fileToDelete.value = null
  deleteLoading.value = false
}

const confirmDeleteFile = async () => {
  if (!fileToDelete.value) return
  deleteLoading.value = true
  try {
    // 模拟删除操作
    knowledgeFiles.value = knowledgeFiles.value.filter(file => file.id !== fileToDelete.value.id)
    
    toast({
      title: t('rag.sidebar.deleteSuccess'),
      description: t('rag.sidebar.deleteSuccessDesc', { title: fileToDelete.value.title })
    })
  } catch (error) {
    console.error('Failed to delete file:', error)
    toast({
      title: t('rag.sidebar.deleteFailed'),
      variant: 'destructive',
      description: (error as Error).message || t('rag.sidebar.unknownError')
    })
  } finally {
    deleteLoading.value = false
    fileToDelete.value = null
  }
}

// 上传新文件
const uploadNewFile = () => {
  // 这里实现上传文件的逻辑
  toast({
    title: t('rag.sidebar.uploadPrompt'),
    description: t('rag.sidebar.uploadPromptDesc')
  })
}

onMounted(() => {
  // 初始化逻辑，例如从服务器获取知识库文件列表
})

// 添加时间分组函数
const getTimeGroup = (date: string) => {
  const now = new Date()
  const targetDate = new Date(date)
  const diffDays = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return t('common.timeGroup.today')
  if (diffDays === 1) return t('common.timeGroup.yesterday')
  if (diffDays <= 7) return t('common.timeGroup.within7days')
  if (diffDays <= 30) return t('common.timeGroup.within30days')

  // 如果是不同年份，显示完整年月
  if (targetDate.getFullYear() !== now.getFullYear()) {
    return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long' }).format(targetDate)
  }
  // 同年不同月
  return new Intl.DateTimeFormat('zh-CN', { month: 'long' }).format(targetDate)
}

// 对文件列表进行分组
const groupedFiles = computed(() => {
  if (!knowledgeFiles.value) return {}

  const groups = {}
  knowledgeFiles.value.forEach(file => {
    const group = getTimeGroup(file.created_at)
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(file)
  })

  return groups
})
</script>

<template>
  <Toaster />
  <!-- 添加确认对话框 -->
  <AlertDialog :open="!!fileToDelete" @update:open="">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t('rag.sidebar.confirmDelete') }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ t('rag.sidebar.confirmDeleteDesc', { title: fileToDelete?.title }) }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="handleCancelDelete">{{ t('common.cancel') }}</AlertDialogCancel>
        <AlertDialogAction :disabled="deleteLoading" @click="confirmDeleteFile">
          <Loader2 v-if="deleteLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ deleteLoading ? t('rag.sidebar.deleting') : t('rag.sidebar.confirmDeleteBtn') }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  <Sidebar></Sidebar>
  <SidebarHeader class="gap-3.5 border-b p-4 h-[64px]">
    <div class="flex w-full items-center justify-between">
      <div class="text-base font-medium text-foreground">
        {{ t('rag.sidebar.title') }}
      </div>
      <Label class="flex items-center gap-2 text-sm">
        <Button size="sm" class="font-bold" @click="uploadNewFile">
          <Upload class="w-4 h-4" />{{ t('rag.sidebar.uploadFile') }}
        </Button>
      </Label>
    </div>
  </SidebarHeader>
  <SidebarContent>
    <ScrollArea class="w-full h-fulll" :class="envStore.isWeb ? 'h-[calc(100dvh-64px-30px)]' : 'h-[calc(100dvh-64px)]'">
      <SidebarGroup class="px-0">
        <template v-for="(files, groupName) in groupedFiles" :key="groupName">
          <SidebarGroupLabel class="pl-4 mt-2 text-xs text-gray-400">{{
            groupName
          }}</SidebarGroupLabel>
          <SidebarGroupContent>
            <template v-for="item in files" :key="item.id">
              <a
                @click="handleFileChange(item)"
                href="#"
                class="group/item flex justify-between items-center px-4 py-1 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                :class="
                  item.id === activeFileId
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : ''
                "
              >
                <div class="flex-1 max-w-[80%] space-y-2">
                  <div class="flex items-center gap-2">
                    <FileText class="w-4 h-4" />
                    <div
                      class="truncate text-gray-950 dark:text-white"
                      :class="item.id === activeFileId ? 'font-bold' : 'font-normal'"
                    >
                      {{ item.title }}
                    </div>
                  </div>
                  <div class="text-xs text-gray-500">{{ item.size }}</div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button
                      class="invisible group-hover/item:visible"
                      size="icon"
                      variant="ghost"
                      v-on:click.stop=""
                    >
                      <EllipsisVertical class=""></EllipsisVertical>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="right">
                    <DropdownMenuItem
                      @click.stop="handleRemoveFile(item)"
                      class="text-red-600 hover:text-red-500"
                    >
                      <Trash2></Trash2> {{ t('common.delete') }}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </a>
            </template>
          </SidebarGroupContent>
        </template>
      </SidebarGroup>
      <ScrollBar />
    </ScrollArea>
  </SidebarContent>
</template>