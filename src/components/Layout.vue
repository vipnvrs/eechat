<script setup lang="ts">
import { ref } from 'vue'

const sidebarLeftOpenMain = ref(false)
import { SidebarProvider, type SidebarProps } from '@/components/ui/sidebar'
import SidebarMain from '@/components/SidebarMain.vue'
const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: 'icon',
})
import TitleBar from '@/components/TitleBar.vue'
</script>

<template>
  <div class="flex w-full flex-col">
    <div class="fixed w-full h-full pointer-events-none">
      <img src="https://images.unsplash.com/photo-1530177150700-84cd9a3b059b?q=80&w=3840&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="" 
      class="w-full h-[100dvh] object-cover opacity-10 z-[-1] pointer-events-none">
      <!-- <div class="absolute inset-0 bg-black/5 backdrop-blur-[2px] z-[-2] pointer-events-none"></div> -->
    </div>
    <TitleBar class="h-[30px] w-full"></TitleBar>
    <div class="w-full flex">
      <SidebarProvider class="w-auto" v-model:open="sidebarLeftOpenMain">
        <SidebarMain></SidebarMain>
      </SidebarProvider>
      <div class="flex-1 overflow-auto relative z-10">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>
