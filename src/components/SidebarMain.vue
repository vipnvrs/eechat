<script setup lang="ts">
import NavUser from '@/components/NavUser.vue'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  type SidebarProps,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

import {
  ArchiveX,
  Command,
  File,
  Inbox,
  SlidersHorizontal,
  Trash2,
  Plus,
  Sparkles,
  Compass,
} from 'lucide-vue-next'
import { h, ref, onMounted } from 'vue'
import router from '@/router'

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
      url: 'discover',
      icon: Compass,
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

const goPage = item => {
  console.log(item)
  router.push(item.url)
}
const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: 'icon',
})
const activeItem = ref(data.navMain[0])
</script>
<template>
  <Sidebar collapsible="none" class="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child class="md:h-8 md:p-0">
            <a href="#">
              <!-- <div
                class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
              >
                <Command class="size-4" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">Acme Inc</span>
                <span class="truncate text-xs">Enterprise</span>
              </div>
              -->
              <img
                class="block w-full size-6 rounded-lg dark:hidden block"
                src="../assets/icon.svg"
                alt=""
              />
              <img
                class="w-full size-6 rounded-lg hidden dark:block"
                src="../assets/icon_dark.svg"
                alt=""
              />
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent class="px-0">
          <SidebarMenu>
            <SidebarMenuItem v-for="item in data.navMain" :key="item.title">
              <SidebarMenuButton
                :tooltip="h('div', { hidden: false }, item.title)"
                :is-active="activeItem.title === item.title"
                class="px-2.5 px-2"
                @click="
                  () => {
                    activeItem = item
                    goPage(item)
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
      <!-- <NavUser :user="data.user" /> -->
    </SidebarFooter>
  </Sidebar>
</template>
