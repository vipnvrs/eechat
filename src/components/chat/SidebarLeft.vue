<script setup lang="ts">
import { Label } from '@/components/ui/label'
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
import {ChatSession} from '@/types/chat'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'
import { Toaster } from '@/components/ui/toast'
import {
  ArchiveX,
  Command,
  File,
  Inbox,
  SlidersHorizontal,
  Trash2,
  Copy,
  Plus,
  EllipsisVertical,
} from 'lucide-vue-next'
import { h, ref, onMounted, toRaw } from 'vue'
import { chatApi } from '@/api/request'
import router from '@/router'

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: 'icon',
})

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      title: '对话',
      url: '/',
      icon: Inbox,
      isActive: true,
    },
    {
      title: '智能体',
      url: 'box',
      icon: File,
      isActive: false,
    },
    {
      title: '设置',
      url: 'setting',
      icon: SlidersHorizontal,
      isActive: false,
    },
  ],
  chats: [
    {
      name: '新对话',
      teaser: '对话的内容简短展示的内容',
    },
  ],
}
const emit = defineEmits(['sessionChange'])

const activeItem = ref(data.navMain[0])
const chats = ref(data.chats)
// const { setOpen } = useSidebar()

const activeSessionId = ref<number>(0)
const sessions = ref<ChatSession[]>([])

// 获取会话列表
const fetchSessions = async localActiveSessionId => {
  try {
    const res = await chatApi.getSessions()
    sessions.value = res.data
    console.log(sessions.value)
    if (sessions.value.length > 0 && !localActiveSessionId) {
      activeSessionId.value = sessions.value[0].id
      emit('sessionChange', sessions.value[0])
    }
  } catch (error) {
    console.error('Failed to fetch sessions:', error)
  }
}

// 创建新对话
const createNewChat = async () => {
  try {
    const res = await chatApi.createChat()
    const newSession = res
    sessions.value.unshift(newSession)
    activeSessionId.value = newSession.id
    emit('sessionChange', newSession)
  } catch (error) {
    console.error('Failed to create chat:', error)
  }
}

// 切换会话
const handleSessionChange = session => {
  const sessoionId = session.id
  activeSessionId.value = sessoionId
  emit('sessionChange', session)
}

// 删除会话
const { toast } = useToast()
const deleteLoading = ref(false)
const sessionToDelete = ref<ChatSession | null>(null)

const handleRemoveSession = item => {
  sessionToDelete.value = JSON.parse(JSON.stringify(item))
  console.log(sessionToDelete.value)
}
const confirmDeleteSession = async () => {
  if (!sessionToDelete.value) return
  deleteLoading.value = true
  try {
    const res = await chatApi.removeSession(sessionToDelete.value.id)
    // @ts-ignore
    sessions.value = sessions.value.filter(s => s.id !== sessionToDelete.value.id)
    if(res) {
      // 如果删除的是当前活动会话，切换到第一个会话
      if (activeSessionId.value === sessionToDelete.value.id && sessions.value.length > 0) {
        handleSessionChange(sessions.value[0])
      }
      toast({
        title: '删除成功',
        description: `会话 "${sessionToDelete.value.title}" 已被删除`
      })
    }
  } catch (error) {
    console.error('Failed to delete session:', error)
    toast({
      title: '删除失败',
      variant: 'destructive',
      description: (error as Error).message || '未知错误'
    })
  } finally {
    deleteLoading.value = false
    sessionToDelete.value = null
  }
}
const activeSessionTitle = ref<string>('')
onMounted(() => {
  const localActiveSession = localStorage.getItem('activeSession')
  let localActiveSessionId = null
  if (localActiveSession) {
    const activeSession = JSON.parse(localActiveSession)
    activeSessionId.value = activeSession.id
    activeSessionTitle.value = activeSession.title
    localActiveSessionId = activeSession.id
    handleSessionChange(activeSession)
  }
  fetchSessions(localActiveSessionId)
})
</script>
<template>
  <Toaster />
  <!-- 添加确认对话框 -->
  <AlertDialog :open="!!sessionToDelete" @update:open="">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>确认删除会话?</AlertDialogTitle>
        <AlertDialogDescription>
          此操作将删除会话 "{{ sessionToDelete?.title }}"，删除后无法恢复。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>取消</AlertDialogCancel>
        <AlertDialogAction :disabled="deleteLoading" @click="confirmDeleteSession">
          <Loader2 v-if="deleteLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ deleteLoading ? "删除中..." : "确认删除" }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  <Sidebar class="hidden flex-1 md:flex absolute">
    <SidebarHeader class="gap-3.5 border-b p-4">
      <div class="flex w-full items-center justify-between">
        <div class="text-base font-medium text-foreground">
          {{ activeItem.title }}
        </div>
        <Label class="flex items-center gap-2 text-sm">
          <Button size="sm" class="font-bold" @click="createNewChat">
            <Plus class="w-4 h-4" />新对话
          </Button>
        </Label>
      </div>
      <SidebarInput placeholder="输入要搜索的内容..." />
    </SidebarHeader>
    <SidebarContent>
      <ScrollArea class="h-full w-full">
        <SidebarGroup class="px-0">
          <template v-for="(item, index) in sessions">
            <SidebarGroupLabel v-if="index % 4 == 0" class="pl-4 mt-6"
              >最近 {{ index + 7 }} 天</SidebarGroupLabel
            >
            <SidebarGroupContent>
              <a
                @click="handleSessionChange(item)"
                :key="item.id"
                href="#"
                class="group/item flex items-center whitespace-nowrap border-b p-4 leading-tight hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                :class="
                  item.id === activeSessionId
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : ''
                "
              >
                <span class="flex flex-col items-center gap-1">
                  <span class="flex w-full items-center gap-2">
                    <span class="font-bold">{{ item.title }}</span>
                  </span>
                  <span
                    class="line-clamp-1 w- whitespace-break-spaces text-sm text-gray-500"
                    >你好，我是
                    梦境画家，一位能将你的梦想变成现实的梦境艺术家。，让我们开始对话吧！
                    <!-- {{ item.title }} -->
                  </span>
                </span>
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
                  <!-- <DropdownMenuContent algin="start" side="right" as-child> -->
                  <DropdownMenuContent align="start" side="right">
                    <DropdownMenuItem> <Copy></Copy> 复制 </DropdownMenuItem>
                    <DropdownMenuItem
                      @click.stop="handleRemoveSession(item)"
                      class="text-red-600 hover:text-red-500"
                    >
                      <Trash2></Trash2> 删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </a>
            </SidebarGroupContent>
          </template>
        </SidebarGroup>
        <ScrollBar />
      </ScrollArea>
    </SidebarContent>
  </Sidebar>
</template>
