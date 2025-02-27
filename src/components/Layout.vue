<script setup lang="ts">
import { ref } from 'vue'

const sidebarLeftOpenMain = ref(false)
import { SidebarProvider, type SidebarProps } from '@/components/ui/sidebar'
import SidebarMain from '@/components/SidebarMain.vue'
const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: 'icon',
})
</script>

<template>
  <div class="flex w-full h-full">
    <SidebarProvider class="w-auto" v-model:open="sidebarLeftOpenMain">
      <SidebarMain></SidebarMain>
    </SidebarProvider>
    <div class="flex-1">
      <router-view></router-view>
    </div>
  </div>
</template>
