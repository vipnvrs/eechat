<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import SidebarRag from '@/components/rag/SidebarRag.vue';
const sidebarLeftOpen = ref(true)
import { useEnvStore } from "@/stores/env"
const envStore = useEnvStore()
</script>

<template>
  <div class="flex relative overflow-hidden">
    <!-- <SidebarProvider
      class="w-auto"
      :style="{ '--sidebar-width': '200px' }"
      v-model:open="sidebarLeftOpen"
    >
    <SidebarRag></SidebarRag>
  </SidebarProvider> -->
  <SidebarProvider
      class="w-auto"
      :style="{ '--sidebar-width': '200px' }"
      v-model:open="sidebarLeftOpen"
    >
      <SidebarRag />
    </SidebarProvider>
    <div class="w-full h-[calc(100dvh-30px)] max-h-[calc(100dvh-30px)] flex flex-col grow" :class="envStore.isWeb ? 'h-[100dvh] max-h-[100dvh]' : ''">rag</div>
  </div>
</template>