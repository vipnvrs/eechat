<script setup lang="ts">
import { ref, markRaw } from 'vue'
import {
  SidebarProvider,
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
import Icon from '@/components/icon.vue'
import { Brain, LayoutGrid } from 'lucide-vue-next'

// const props = withDefaults(defineProps<SidebarProps>(), {
//   collapsible: 'icon',
// })
const menuData = [
  {
    label: '全部',
    icon: LayoutGrid,
    key: 'LocalModel',
  },
  {
    label: '学术',
    icon: Brain,
    key: 'Academic',
  },
  {
    label: '文案',
    icon: Brain,
    key: 'Copywriting',
  },
  {
    label: '设计',
    icon: Brain,
    key: 'Design',
  },
  {
    label: '商业',
    icon: Brain,
    key: 'Commercial',
  },
  {
    label: '编程',
    icon: Brain,
    key: 'Programming',
  },
  {
    label: '科技',
    icon: Brain,
    key: 'Technology',
  },
  {
    label: '音乐',
    icon: Brain,
    key: 'Music',
  },
  {
    label: '开源',
    icon: Brain,
    key: 'OpenSource',
  },
  {
    label: '金融',
    icon: Brain,
    key: 'Financial',
  },
  {
    label: '医疗',
    icon: Brain,
    key: 'Medical',
  },
  {
    label: '法律',
    icon: Brain,
    key: 'Legal',
  },
  {
    label: '教育',
    icon: Brain,
    key: 'Education',
  },
  {
    label: '娱乐',
    icon: Brain,
    key: 'Entertainment',
  },
  {
    label: '政府',
    icon: Brain,
    key: 'Government',
  },
  {
    label: '其他',
    icon: Brain,
    key: 'Other',
  },


]
const emit = defineEmits(['change'])

const handleMenuClick = e => {
  emit('change', e)
}
</script>

<template>
  <SidebarProvider class="w-auto" :style="{ '--sidebar-width': '200px' }">
    <Sidebar class="hidden flex-1 md:flex absolute">
      <SidebarHeader class="gap-3.5 border-b p-4">
        <div class="flex w-full items-center justify-between">
          <div class="text-base font-medium text-foreground">发现</div>
        </div>
        <SidebarInput placeholder="输入要搜索的内容..." />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>我的</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton @click="handleMenuClick('mine')" as-child>
                <div class="flex items-center">
                  <component :is="'my'"></component>
                  <span class="ml-2">我的</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup
          class="group-data-[collapsible=icon]:hidden"
        >
          <SidebarGroupLabel>助手</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in menuData" :key="item.label">
              <SidebarMenuButton @click="handleMenuClick(item)" as-child>
                <div class="flex items-center">
                  <component :is="item.icon"></component>
                  <span class="ml-2">{{ item.label }}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  </SidebarProvider>
</template>
