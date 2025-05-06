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

// 知识库文件夹列表
const knowledgeFolders = ref([
  { id: '1', title: '默认知识库', created_at: '2023-06-15T10:30:00Z', count: 5 },
  // { id: '2', title: '用户手册', created_at: '2023-06-16T14:20:00Z', count: 3 },
  // { id: '3', title: '技术规格', created_at: '2023-07-01T09:15:00Z', count: 8 },
  // { id: '4', title: '常见问题', created_at: '2023-07-10T16:45:00Z', count: 12 },
  // { id: '5', title: '安装指南', created_at: '2023-08-05T11:30:00Z', count: 4 },
])

const activeFolderId = ref('')

// 切换选中文件夹
const handleFolderChange = folder => {
  activeFolderId.value = folder.id
  // 这里可以添加其他处理逻辑
}

// 删除文件夹相关
const deleteLoading = ref(false)
const folderToDelete = ref(null)

const handleRemoveFolder = item => {
  folderToDelete.value = JSON.parse(JSON.stringify(item))
}

const handleCancelDelete = () => {
  folderToDelete.value = null
  deleteLoading.value = false
}

const confirmDeleteFolder = async () => {
  if (!folderToDelete.value) return
  deleteLoading.value = true
  try {
    // 模拟删除操作
    knowledgeFolders.value = knowledgeFolders.value.filter(folder => folder.id !== folderToDelete.value.id)
    
    toast({
      title: t('rag.sidebar.deleteSuccess'),
      description: t('rag.sidebar.deleteSuccessDesc', { title: folderToDelete.value.title })
    })
  } catch (error) {
    console.error('Failed to delete folder:', error)
    toast({
      title: t('rag.sidebar.deleteFailed'),
      variant: 'destructive',
      description: (error as Error).message || t('rag.sidebar.unknownError')
    })
  } finally {
    deleteLoading.value = false
    folderToDelete.value = null
  }
}

// 创建新文件夹
const createNewFolder = () => {
  // 这里实现创建文件夹的逻辑
  toast({
    title: t('rag.sidebar.create'),
    description: t('rag.sidebar.create')
  })
}

onMounted(() => {
  // 初始化逻辑，例如从服务器获取知识库文件夹列表
})
</script>

<template>
  <Toaster />
  <!-- 添加确认对话框 -->
  <AlertDialog :open="!!folderToDelete" @update:open="">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t('rag.sidebar.confirmDelete') }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ t('rag.sidebar.confirmDeleteDesc', { title: folderToDelete?.title }) }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="handleCancelDelete">{{ t('common.cancel') }}</AlertDialogCancel>
        <AlertDialogAction :disabled="deleteLoading" @click="confirmDeleteFolder">
          <Loader2 v-if="deleteLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ deleteLoading ? t('rag.sidebar.deleting') : t('rag.sidebar.confirmDeleteBtn') }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  <Sidebar class="hidden flex-1 md:flex absolute">
    <SidebarHeader class="gap-3.5 border-b p-4 h-[64px]">
      <div class="flex w-full items-center justify-between">
        <div class="text-base font-medium text-foreground">
          {{ t('rag.sidebar.title') }}
        </div>
        <Label class="flex items-center gap-2 text-sm">
          <Button size="sm" class="font-bold" @click="createNewFolder">
            <Plus class="w-4 h-4" />{{ t('rag.sidebar.create') }}
          </Button>
        </Label>
      </div>
    </SidebarHeader>
    <SidebarContent>
      <ScrollArea class="w-full h-fulll" :class="envStore.isWeb ? 'h-[calc(100dvh-64px-30px)]' : 'h-[calc(100dvh-64px)]'">
        <SidebarGroup class="p-0">
          <template v-for="item in knowledgeFolders" :key="item.id">
            <a
              @click="handleFolderChange(item)"
              class="group/item flex justify-between items-center px-4 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              :class="
                item.id === activeFolderId
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : ''
              "
            >
              <div class="flex-1 max-w-[90%] space-y-1 text-sm">
                <div class="flex items-center gap-2">
                  <FolderOpen class="w-4 h-4" />
                  <div
                    class="truncate text-gray-950 dark:text-white"
                    :class="item.id === activeFolderId ? 'font-bold' : 'font-normal'"
                  >
                    {{ item.title }}
                  </div>
                </div>
                <div class="text-xs text-gray-500">{{ item.count }} 个文档</div>
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
                    @click.stop="handleRemoveFolder(item)"
                    class="text-red-600 hover:text-red-500"
                  >
                    <Trash2></Trash2> {{ t('common.delete') }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </a>
          </template>
        </SidebarGroup>
        <ScrollBar />
      </ScrollArea>
    </SidebarContent>
  </Sidebar>
</template>