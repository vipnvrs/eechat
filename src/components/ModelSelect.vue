<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Model {
  name: string
  size: number
  digest: string
}

const models = ref<Model[]>([])
const selectedModel = ref('')
const loading = ref(true)
const error = ref('')

const fetchModels = async () => {
  try {
    loading.value = true
    error.value = ''
    const response = await fetch('http://localhost:11434/api/tags')
    const data = await response.json()
    models.value = data.models

    // 设置默认选中第一个模型
    if (models.value.length > 0) {
      selectedModel.value = models.value[0].name
      emits('update:modelId', models.value[0].name)
    }
  } catch (err) {
    error.value = '获取模型列表失败'
    console.error('Failed to fetch models:', err)
  } finally {
    loading.value = false
  }
}

const emits = defineEmits<{
  (e: 'update:modelId', value: string): void
}>()

const handleSelect = (value: string) => {
  selectedModel.value = value
  emits('update:modelId', value)
}

onMounted(() => {
  fetchModels()
})
</script>

<template>
  <div>
    <Select
      title="模型"
      size="sm"
      v-model="selectedModel"
      @update:modelValue="handleSelect"
    >
      <SelectTrigger class="w-[180px]">
        <SelectValue :placeholder="loading ? '加载中...' : '选择模型'" />
      </SelectTrigger>
      <SelectContent>
        <div v-if="error" class="p-2 text-sm text-red-500">
          {{ error }}
        </div>
        <div
          v-else-if="models.length === 0 && !loading"
          class="p-2 text-sm text-gray-500"
        >
          暂无可用模型
        </div>
        <SelectItem
          v-for="model in models"
          :key="model.digest"
          :value="model.name"
        >
          {{ model.name }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>

<style scoped>
.select-trigger {
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
}
</style>
