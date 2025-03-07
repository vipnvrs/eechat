<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Button } from '@/components/ui/button'
import pkg from '../../../package.json'

const version = ref(pkg.version)
</script>

<template>
  <div class="h-full space-y-6">
    <div>一个简单易用的聊天工具。</div>
    <div>v{{ version }}</div>
    <div>
      <Button>检查更新</Button>
    </div>
  </div>
</template>

<style scoped></style>
