<script setup lang="ts">
import { ref, onMounted, watch, reactive } from 'vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { ChevronsDownUp } from 'lucide-vue-next'
import Icon from '@/components/icon.vue'

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
  // try {
  //   loading.value = true
  //   error.value = ''
  //   const response = await fetch('http://localhost:11434/api/tags')
  //   const data = await response.json()
  //   models.value = data.models
  //   // 设置默认选中第一个模型
  //   if (models.value.length > 0) {
  //     selectedModel.value = models.value[0].name
  //     emits('update:modelId', models.value[0].name)
  //   }
  // } catch (err) {
  //   error.value = '获取模型列表失败'
  //   console.error('Failed to fetch models:', err)
  // } finally {
  //   loading.value = false
  // }
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

const formData = reactive({
  temperature: [12600],
})

// 模型数据
const modelData = [
  { sup: 'ollama', name: 'Ollama', icon: 'ollama', models: ['Deepseek R1'] },
] 
</script>

<template>
  <div>
    <Dialog width="100%">
      <DialogTrigger>
        <Button size="sm" variant="outline">
          <span> Deepseek R1 </span>
          <ChevronsDownUp></ChevronsDownUp>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>模型设置</DialogTitle>
          <DialogDescription> 自定义配置您的模型 </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-6">
          <div class="grid gap-2">
            <Label>模型提供商</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="选择模型提供商" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ollama">
                  <div class="flex items-center">
                    <Icon name="ollama" :size="24"></Icon>
                    <div class="ml-2">Ollama</div>
                  </div>
                </SelectItem>
                <SelectItem value="openai">
                  <div class="flex items-center">
                    <Icon name="openai" :size="24"></Icon>
                    <div class="ml-2">OpenAI</div>
                  </div>
                </SelectItem>
                <SelectItem value="claude">
                  <div class="flex items-center">
                    <Icon name="claude" :size="24"></Icon>
                    <div class="ml-2">Claude</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid gap-2">
            <Label>API 请求地址</Label>
            <Input type="text" placeholder="http://" />
          </div>
          <div class="grid gap-2">
            <Label>模型</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apple"> Deepseek R1 </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid gap-2">
            <Label
              >单次回复限制 <Badge variant="outline">max_tokens</Badge></Label
            >
            <div class="flex">
              <Slider
                v-model="formData.temperature"
                :default-value="[12600]"
                :max="32000"
                :min="100"
                :step="100"
              />
              <Input
                class="w-20 ml-2"
                v-model="formData.temperature[0]"
              ></Input>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" @click="handleSubmit"> 保存设置 </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
.select-trigger {
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
}
</style>
