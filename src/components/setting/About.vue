<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import pkg from '../../../package.json'
import { Github, Star } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const version = ref(pkg.version)
const github = () => {
  window.ipcRenderer.invoke("open-external", "https://github.com/Lucassssss/eechat")
}
</script>

<template>
  <div class="h-full space-y-6">
    <div>{{ t('settings.about.description') }}</div>
    <div>v{{ version }}</div>
    <div>
      <Button @click="github" class="flex items-center space-x-1 text-sm">
        <Github></Github>
        <span>{{ t('settings.about.star') }}</span>
        <Star class=" fill-yellow-500 text-yellow-500"></Star>
        <span>{{ t('settings.about.accelerate') }}</span>
      </Button>
    </div>
  </div>
</template>

<style scoped></style>
