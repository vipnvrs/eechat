<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue"
import { useI18n } from "vue-i18n"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast/use-toast"
import { Plus, Loader2 } from "lucide-vue-next"
import { llmApi } from "@/api/request"
import type { Model } from "@/types/llm"
import { MODEL_CAPABILITIES } from '@/types/llm'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'


const { t, locale} = useI18n()
const { toast } = useToast()
const isOpen = ref(false)
const isLoading = ref(false)
const currentLang = computed(() => locale.value)

const props = defineProps({
  provider_id: {
    type: String,
    default: 'deepseek',
  },
})

// 表单数据 - 按照 Model 类型定义
const formData = reactive<Model>({
  id: "",
  provider_id: props.provider_id,
  state: true,
  name: "",
  group_name: "自定义分组",
  capabilities: ['llm']
})

watch(() => formData.id, (newId) => {
  if (newId && newId.length > 0 && formData.name.toLocaleLowerCase() != newId.toLocaleLowerCase() ) {
    const firstChar = newId.charAt(0).toUpperCase();
    const restChars = newId.substring(1);
    formData.name = firstChar + restChars;
    console.log('ID:', newId, '首字母:', firstChar, '剩余部分:', restChars, '结果:', formData.name);
  }
})

// 重置表单
const resetForm = () => {
  formData.provider_id = props.provider_id
  formData.state = true
  formData.name = ""
  formData.group_name = "自定义分组"
  formData.capabilities = ['llm']
}

// 提交表单
const handleSubmit = async () => {
  if (!formData.name) {
    toast({
      title: t('settings.apiModel.formError'),
      description: t('settings.apiModel.formErrorDesc'),
      variant: "destructive",
    })
    return
  }

  try {
    isLoading.value = true
    
    // 构建 API 请求数据
    const requestData = {
      ...formData,
    }

    // 调用API添加模型
    const res = await llmApi.addModel(requestData)
    
    // toast({
    //   title: t('settings.apiModel.addSuccess'),
    //   description: t('settings.apiModel.addSuccessDesc'),
    // })
    
    // 关闭对话框并重置表单
    isOpen.value = false
    resetForm()
    
    // 触发刷新
    emit('refresh')
  } catch (error: any) {
    toast({
      title: t('settings.apiModel.addFailed'),
      description: error.message,
      variant: "destructive",
    })
  } finally {
    isLoading.value = false
  }
}

// 定义事件
const emit = defineEmits(['refresh'])

// 打开对话框
const openDialog = () => {
  resetForm()
  isOpen.value = true
}

// 切换能力选择
function toggleCapability(capability) {
  const index = formData.capabilities.indexOf(capability)
if (index === -1) {
    formData.capabilities.push(capability)
  } else {
    formData.capabilities.splice(index, 1)
  }
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <Button variant="outline" size="sm" @click="openDialog">
        <Plus class="h-4 w-4" />
        新增模型
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>新增模型</DialogTitle>
        <DialogDescription>
          新增模型自定义模型
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right" for="id">
            模型ID
          </Label>
          <Input
            id="id"
            v-model="formData.id"
            class="col-span-3"
          />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right" for="name">
            模型名称
          </Label>
          <Input
            id="name"
            v-model="formData.name"
            class="col-span-3"
          />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right" for="group_name">
            分组名称
          </Label>
          <Input
            id="name"
            v-model="formData.group_name"
            class="col-span-3"
          />
        </div>
        <div class="grid grid-cols-4 gap-4 mt-2 ">
            <Label class="text-right" for="name">模型能力</Label>
            <div class="space-y-3 col-span-3" >
              <div v-for="capability in MODEL_CAPABILITIES" :key="capability.value" class="flex items-center space-x-2">
                <Checkbox 
                  :id="capability.value" 
                  :model-value="formData.capabilities.includes(capability.value)"
                  @update:model-value="toggleCapability(capability.value)" 
                />
                <label :for="capability.value" class="w-full text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>{{ capability.label[currentLang.toLowerCase().startsWith('zh') ? 'zh' : 'en'] }}
                        ({{capability.value}})</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{{ capability.description[currentLang.toLowerCase().startsWith('zh') ? 'zh' : 'en'] }}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </label>
              </div>
            </div>
          </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" @click="isOpen = false">
          {{ t('common.cancel') }}
        </Button>
        <Button type="submit" @click="handleSubmit" :disabled="isLoading">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t('common.save') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
