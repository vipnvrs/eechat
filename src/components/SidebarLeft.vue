<script setup lang="ts">
import NavUser from '@/components/NavUser.vue'
import { Label } from '@/components/ui/label'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  type SidebarProps,
  useSidebar,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'

import {
  ArchiveX,
  Command,
  File,
  Inbox,
  SlidersHorizontal,
  Trash2,
  Plus,
} from 'lucide-vue-next'
import { h, ref, onMounted } from 'vue'
import { chatApi } from '@/api/request'

interface Session {
  id: number
  title: string
  updatedAt: string
  lastMessage?: string
}

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
      url: '#',
      icon: Inbox,
      isActive: true,
    },
    {
      title: '智能体',
      url: '#',
      icon: File,
      isActive: false,
    },
    {
      title: '设置',
      url: '#',
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
const { setOpen } = useSidebar()

const activeSessionId = ref<number>(0)
const sessions = ref<Session[]>([])

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
  <Sidebar
    class="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
    v-bind="props"
  >
    <!-- This is the first sidebar -->
    <!-- We disable collapsible and adjust width to icon. -->
    <!-- This will make the sidebar appear as icons. -->
    <Sidebar
      collapsible="none"
      class="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" as-child class="md:h-8 md:p-0">
              <a href="#">
                <div
                  class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
                >
                  <Command class="size-4" />
                </div>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">Acme Inc</span>
                  <span class="truncate text-xs">Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent class="px-1.5 md:px-0">
            <SidebarMenu>
              <SidebarMenuItem v-for="item in data.navMain" :key="item.title">
                <SidebarMenuButton
                  :tooltip="h('div', { hidden: false }, item.title)"
                  :is-active="activeItem.title === item.title"
                  class="px-2.5 md:px-2"
                  @click="
                    () => {
                      activeItem = item
                      const mail = data.chats.sort(() => Math.random() - 0.5)
                      chats = mail.slice(
                        0,
                        Math.max(5, Math.floor(Math.random() * 10) + 1),
                      )
                      setOpen(true)
                    }
                  "
                >
                  <component :is="item.icon" />
                  <span>{{ item.title }}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser :user="data.user" />
      </SidebarFooter>
    </Sidebar>
    <!--  This is the second sidebar -->
    <!--  We disable collapsible and let it fill remaining space -->
    <Sidebar collapsible="none" class="hidden flex-1 md:flex">
      <SidebarHeader class="gap-3.5 border-b p-4">
        <div class="flex w-full items-center justify-between">
          <div class="text-base font-medium text-foreground">
            {{ activeItem.title }}
          </div>
          <Label class="flex items-center gap-2 text-sm">
            <Button size="sm" @click="createNewChat">
              <Plus class="w-4 h-4" />新对话
            </Button>
          </Label>
        </div>
        <SidebarInput placeholder="输入要搜索的内容..." />
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea class="h-full w-full">
          <SidebarGroup class="px-0">
            <SidebarGroupContent>
              <a
                @click="handleSessionChange(item)"
                v-for="item in sessions"
                :key="item.id"
                href="#"
                class="flex flex-col items-start gap-1 whitespace-nowrap border-b p-4 text-sm leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                :class="item.id === activeSessionId ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''"
              >
                <div class="flex w-full items-center gap-2">
                  <span>{{ item.title }}</span>
                </div>
                <span class="line-clamp-2 w- whitespace-break-spaces text-xs">
                  {{ item.title }}
                </span>
              </a>
            </SidebarGroupContent>
          </SidebarGroup>
          <ScrollBar />
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  </Sidebar>
</template>
