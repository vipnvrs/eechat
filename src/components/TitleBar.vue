<script setup lang="ts">
import { ArrowDown } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { useEnvStore } from "@/stores/env"
const envStore = useEnvStore()
</script>
<template>
  <div
    style="-webkit-app-region: drag"
    class="bg-sidebar h-[30px] flex items-center justify-center text-center border-b text-xs font-bold max-sm:text-left max-sm:justify-start max-sm:px-6"
    :class="envStore.isWeb && 'hidden'"
  >
    eechat
  </div>
</template>
