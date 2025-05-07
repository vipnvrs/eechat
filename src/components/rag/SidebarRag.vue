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
  Upload,
  Star,
  Settings
} from 'lucide-vue-next'
import { h, ref, onMounted, computed } from 'vue'
import { useEnvStore } from "@/stores/env"
import { useRagStore } from "@/stores/rag"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

const envStore = useEnvStore()
const ragStore = useRagStore()

// 设置语言
const { t } = useI18n()
const { toast } = useToast()

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: 'icon',
})

// 知识库文件夹列表
const knowledgeBases = computed(() => ragStore.bases)

const activeFolderId = ref('')

// 切换选中文件夹
const handleFolderChange = folder => {
  activeFolderId.value = folder.id
  ragStore.selectBase(folder)
}

// 删除文件夹相关
const deleteLoading = ref(false)
const folderToDelete = ref(null)

const handleRemoveFolder = item => {
  folderToDelete.value = JSON.parse(JSON.stringify(item))
}

const handleCancelDelete = () => {
  // folderToDelete.value = null
  // deleteLoading.value = false
}

const confirmDeleteFolder = async () => {
  if (!folderToDelete.value) return
  deleteLoading.value = true
  try {
    await ragStore.deleteBase((folderToDelete.value as { id: string }).id)
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

// 创建新知识库相关
const showCreateDialog = computed(() => ragStore.showCreateDialog)
const newBase = ref({
  title: '',
  description: '',
  is_default: false
})

const createLoading = ref(false)

const openCreateDialog = () => {
  newBase.value = {
    title: '',
    description: '',
    is_default: false
  }
  ragStore.openCreateDialog()
}

const closeCreateDialog = () => {
  ragStore.closeCreateDialog()
}

const handleCreateBase = async () => {
  if (!newBase.value.title.trim()) {
    toast({
      title: t('rag.sidebar.titleRequired'),
      variant: 'destructive'
    })
    return
  }

  createLoading.value = true
  try {
    await ragStore.createBase(newBase.value)
    closeCreateDialog()
  } catch (error) {
    toast({
      title: t('rag.sidebar.createFailed'),
      variant: 'destructive',
      description: (error as Error).message || t('rag.sidebar.unknownError')
    })
  } finally {
    createLoading.value = false
  }
}

// 编辑知识库相关
const showEditDialog = computed(() => ragStore.showEditDialog)
const editBase = ref({
  id: '',
  title: '',
  description: '',
  is_default: false
})

const editLoading = ref(false)

const openEditDialog = (base) => {
  editBase.value = {
    id: base.id,
    title: base.title,
    description: base.description || '',
    is_default: base.is_default || false
  }
  ragStore.openEditDialog(base)
}

const closeEditDialog = () => {
  ragStore.closeEditDialog()
}

const handleUpdateBase = async () => {
  if (!editBase.value.title.trim()) {
    toast({
      title: t('rag.sidebar.titleRequired'),
      variant: 'destructive'
    })
    return
  }

  editLoading.value = true
  try {
    await ragStore.updateBase(editBase.value.id, {
      title: editBase.value.title,
      description: editBase.value.description,
      is_default: editBase.value.is_default
    })
    closeEditDialog()
  } catch (error) {
    toast({
      title: t('rag.sidebar.updateFailed'),
      variant: 'destructive',
      description: (error as Error).message || t('rag.sidebar.unknownError')
    })
  } finally {
    editLoading.value = false
  }
}

// 设置默认知识库
const setDefaultBase = async (base) => {
  try {
    await ragStore.setDefaultBase(base.id)
  } catch (error) {
    toast({
      title: t('rag.sidebar.setDefaultFailed'),
      variant: 'destructive',
      description: (error as Error).message || t('rag.sidebar.unknownError')
    })
  }
}

onMounted(async () => {
  // 初始化逻辑，从服务器获取知识库列表
  try {
    await ragStore.fetchBases()
    // 如果有默认知识库，选中它
    const defaultBase = ragStore.defaultBase
    if (defaultBase) {
      activeFolderId.value = defaultBase.id as string
      ragStore.selectBase(defaultBase)
    } else if (ragStore.bases.length > 0) {
      // 否则选中第一个知识库
      activeFolderId.value = ragStore.bases[0].id as string
      ragStore.selectBase(ragStore.bases[0])
    }
  } catch (error) {
    console.error('Failed to fetch knowledge bases:', error)
    toast({
      title: t('rag.sidebar.fetchFailed'),
      variant: 'destructive',
      description: (error as Error).message || t('rag.sidebar.unknownError')
    })
  }
})
</script>

<template>
  <Toaster />
  <!-- 添加确认对话框 -->
  <AlertDialog :open="!!folderToDelete" @update:open="handleCancelDelete">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t("rag.sidebar.confirmDelete") }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ t("rag.sidebar.confirmDeleteDesc") }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="handleCancelDelete">{{
          t("common.cancel")
        }}</AlertDialogCancel>
        <AlertDialogAction
          class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          :disabled="deleteLoading"
          @click="confirmDeleteFolder"
        >
          <Loader2 v-if="deleteLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("common.delete") }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <!-- 创建知识库对话框 -->
  <Dialog :open="showCreateDialog" @update:open="closeCreateDialog">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t("rag.sidebar.create") }}</DialogTitle>
        <DialogDescription>
          {{ t("rag.sidebar.createBaseDesc") }}
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right" for="title">{{ t("rag.sidebar.title") }}</Label>
          <Input id="title" v-model="newBase.title" class="col-span-3" />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right" for="description">{{
            t("rag.sidebar.description")
          }}</Label>
          <Textarea id="description" v-model="newBase.description" class="col-span-3" />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right" for="is_default">{{
            t("rag.sidebar.isDefault")
          }}</Label>
          <Checkbox id="is_default" v-model="newBase.is_default" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="closeCreateDialog">{{
          t("common.cancel")
        }}</Button>
        <Button :disabled="createLoading" @click="handleCreateBase">
          <Loader2 v-if="createLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("common.create") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- 编辑知识库对话框 -->
  <Dialog :open="showEditDialog" @update:open="closeEditDialog">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t("rag.sidebar.editBase") }}</DialogTitle>
        <DialogDescription>
          {{ t("rag.sidebar.editBaseDesc") }}
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right" for="edit-title">{{ t("rag.sidebar.title") }}</Label>
          <Input id="edit-title" v-model="editBase.title" class="col-span-3" />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right" for="edit-description">{{
            t("rag.sidebar.description")
          }}</Label>
          <Textarea
            id="edit-description"
            v-model="editBase.description"
            class="col-span-3"
          />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right" for="edit-is_default">{{
            t("rag.sidebar.isDefault")
          }}</Label>
          <Checkbox id="edit-is_default" v-model="editBase.is_default" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="closeEditDialog">{{
          t("common.cancel")
        }}</Button>
        <Button :disabled="editLoading" @click="handleUpdateBase">
          <Loader2 v-if="editLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("common.save") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <Sidebar :collapsible="props.collapsible" class="hidden flex-1 md:flex absolute">
    <SidebarHeader class="gap-3.5 border-b p-4 h-[64px]">
      <div class="flex w-full items-center justify-between">
        <div class="text-base font-medium text-foreground">
          {{ t("rag.sidebar.title") }}
        </div>
        <Label class="flex items-center gap-2 text-sm">
          <Button size="sm" class="font-bold" @click="openCreateDialog">
            <Plus class="w-4 h-4" />{{ t("rag.sidebar.create") }}
          </Button>
        </Label>
      </div>
      <!-- <SidebarInput placeholder="搜索知识库..." /> -->
    </SidebarHeader>
    <SidebarContent>
      <ScrollArea
        class="w-full h-fulll"
        :class="envStore.isWeb ? 'h-[calc(100dvh-64px-30px)]' : 'h-[calc(100dvh-64px)]'"
      >
        <div v-if="ragStore.loadingBases" class="flex justify-center py-4">
          <Loader2 class="h-6 w-6 animate-spin" />
        </div>
        <div
          v-else-if="knowledgeBases.length === 0"
          class="px-4 py-2 text-center text-muted-foreground text-sm mt-4"
        >
          {{ t("rag.sidebar.noKnowledgeBases") }}
        </div>
        <template v-for="base in knowledgeBases" :key="base.id">
          <div
            @click="handleFolderChange(base)"
            class="group/item text-sm cursor-pointer flex justify-between items-center px-4 pr-0 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            :class="
              base.id === activeFolderId
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : ''
            "
          >
            <div class="flex items-center justify-between w-full">
              <div>
                <div class="flex items-center">
                  <FolderOpen class="mr-2 h-4 w-4" />
                  <span>{{ base.title }}</span>
                  <Star v-if="base.is_default" class="ml-2 h-3 w-3 text-yellow-400" />
                </div>
                <div class="text-xs text-muted-foreground mt-1">
                  {{ base.document_count || 0 }} {{ t("rag.sidebar.documents") }}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" class="invisible group-hover/item:visible">
                    <EllipsisVertical class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="right">
                  <DropdownMenuItem @click="openEditDialog(base)">
                    <Settings class="mr-2 h-4 w-4" />
                    {{ t("rag.sidebar.edit") }}
                  </DropdownMenuItem>
                  <DropdownMenuItem v-if="!base.is_default" @click="setDefaultBase(base)">
                    <Star class="mr-2 h-4 w-4" />
                    {{ t("rag.sidebar.setDefault") }}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    class="text-destructive"
                    @click="handleRemoveFolder(base)"
                  >
                    <Trash2 class="mr-2 h-4 w-4" />
                    {{ t("rag.sidebar.delete") }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </template>
        <ScrollBar />
      </ScrollArea>
    </SidebarContent>
  </Sidebar>
</template>
