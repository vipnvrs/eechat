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
import {
  ArchiveX,
  Command,
  File,
  Inbox,
  SlidersHorizontal,
  Trash2,
  Plus,
} from 'lucide-vue-next'
import { h, ref } from 'vue'
const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: 'icon',
})
// This is sample data
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
    {
      name: '新对话',
      teaser: '对话的内容简短展示的内容',
    },
    {
      name: '新对话',
      teaser: '对话的内容简短展示的内容',
    },
    {
      name: '新对话',
      teaser: '对话的内容简短展示的内容',
    },
    {
      name: '新对话',
      teaser: '对话的内容简短展示的内容',
    },
    {
      name: '新对话',
      teaser: '对话的内容简短展示的内容',
    },
    {
      name: '新对话',
      teaser: '对话的内容简短展示的内容',
    },
    {
      name: '新对话',
      teaser: '对话的内容简短展示的内容',
    },
    {
      name: '新对话',
      teaser: '对话的内容简短展示的内容',
    },
  ],
}
const activeItem = ref(data.navMain[0])
const chats = ref(data.chats)
const { setOpen } = useSidebar()
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
            <Button size="sm"> <Plus class="w-4 h-4" />新对话 </Button>
          </Label>
        </div>
        <SidebarInput placeholder="输入要搜索的内容..." />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup class="px-0">
          <SidebarGroupContent>
            <a
              v-for="item in chats"
              :key="item.email"
              href="#"
              class="flex flex-col items-start gap-1 whitespace-nowrap border-b p-4 text-sm leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <div class="flex w-full items-center gap-2">
                <span>{{ item.name }}</span>
              </div>
              <span class="line-clamp-2 w- whitespace-break-spaces text-xs">
                {{ item.teaser }}
              </span>
            </a>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  </Sidebar>
</template>
