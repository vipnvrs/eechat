<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLanguage } from '@/i18n'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type AvailableLanguages = 'en' | 'zh'

const { locale } = useI18n()
const currentLanguage = ref<AvailableLanguages>(locale.value as AvailableLanguages)

const changeLanguage = (value: string) => {
  const lang = value as AvailableLanguages
  currentLanguage.value = lang
  setLanguage(lang)
}

onMounted(() => {
  currentLanguage.value = locale.value as AvailableLanguages
})

const languages = {
  en: 'English',
  zh: '简体中文',
}
</script>

<template>
  <div class="language-switcher">
    <Tabs
      :default-value="currentLanguage"
      v-model="currentLanguage"
      @update:modelValue="(value: string | number) => changeLanguage(String(value))"
    >
      <TabsList class="w-full">
        <TabsTrigger v-for="(value, key) in languages" :value="key" :key="key">
          <div class="flex items-center space-x-1">
            <span>{{ value }}</span>
          </div>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  </div>
</template>
