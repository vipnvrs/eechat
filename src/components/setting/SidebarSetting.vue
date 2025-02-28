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
import { Brain, HardDrive } from 'lucide-vue-next'
import LocalModel from '@/components/setting/LocalModel.vue'

// const props = withDefaults(defineProps<SidebarProps>(), {
//   collapsible: 'icon',
// })
const menuData = [
  {
    label: '模型',
    icon: Brain,
    items: [
      {
        label: '本地模型',
        icon: HardDrive,
        key: 'LocalModel',
        component: markRaw(LocalModel),
      },
      {
        label: 'API 模型',
        icon: Brain,
        key: 'apiModel',
        component: markRaw(LocalModel),
      },
    ],
  },
  {
    label: '通用',
    icon: Brain,
    items: [
      {
        label: '界面',
        icon: HardDrive,
        key: 'interface',
        component: markRaw(LocalModel),
      },
      {
        label: '关于',
        icon: Brain,
        key: 'about',
      },
    ],
  },
  {
    label: '数据',
    icon: Brain,
    items: [
      {
        label: '备份/恢复',
        icon: HardDrive,
        key: 'interface',
        component: markRaw(LocalModel),
      },
    ],
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
          <div class="text-base font-medium text-foreground">设置</div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup
          class="group-data-[collapsible=icon]:hidden"
          v-for="group in menuData"
          :key="group.label"
        >
          <SidebarGroupLabel>{{ group.label }}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in group.items" :key="item.label">
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
