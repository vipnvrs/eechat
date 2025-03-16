<script setup lang="ts">
import { ref, reactive, onMounted, defineProps, watch } from "vue"
import { useI18n } from "vue-i18n"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useModelStore } from "@/stores/model"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/toast/use-toast"
import { Toaster } from "@/components/ui/toast"
import Icon from "@/components/Icon.vue"
import { llmApi } from "@/api/request"
import type {
  LLMProvider,
  LLMModel,
  LLMModelArray,
  APIConfig,
  ProviderConfig,
} from "@/types/llm"
import { Loader2, Check } from "lucide-vue-next"
import { Switch } from "@/components/ui/switch"

// 定义props接收providerId
const props = defineProps({
  providerId: {
    type: String,
    default: "",
  },
})

const { toast } = useToast()
const { t } = useI18n()
const testLoading = ref(false)
const saveLoading = ref(false)
const testPassed = reactive<Record<string, boolean>>({
  openai: false,
  anthropic: false,
  deepseek: false,
})
const modelStore = useModelStore()

// 添加当前选中的提供商
const currentProvider = ref("deepseek")

const providers = ref<Record<string, LLMProvider>>({})

// API 模型配置状态
const apiConfig = reactive<APIConfig>({
  apiKey: "sk-5f86865628c54c4f954090aae9395d3a",
  baseUrl: "",
  config: {},
  state: false,
  info: {},
})

// 测试连接
async function testConnection(provider: string) {
  testLoading.value = true
  try {
    const config: ProviderConfig = {
      models: _flattenModels(models.value),
      apiKey: apiConfig.apiKey,
      baseUrl: apiConfig.baseUrl,
      state: apiConfig.state,
    }
    const model = currentCheckModelObject.value
    const res = await llmApi.testConnection(provider, config, model)
    if (res) {
      testPassed[provider] = true
      await llmApi.saveConfigProvider(provider, config)
      toast({
        title: t('settings.apiModel.connectionSuccess'),
        description: t('settings.apiModel.connectionSuccessDesc'),
      })
    }
  } catch (error: any) {
    testPassed[provider] = false
    toast({
      title: t('settings.apiModel.connectionFailed'),
      description: error.message,
      variant: "destructive",
    })
  } finally {
    testLoading.value = false
  }
}

// 获取提供商列表
const defaultProvider = "deepseek"
async function getProviders(refresh) {
  const res = await llmApi.getProviders()
  providers.value = res

  // 如果有传入的providerId，则优先使用它
  if (props.providerId && res[props.providerId]) {
    handleProviderChange(props.providerId, res[props.providerId])
  } else if (refresh) {
    handleProviderChange(defaultProvider, res[defaultProvider])
  }
}

// 监听providerId变化
watch(
  () => props.providerId,
  (newVal) => {
    if (newVal && providers.value && providers.value[newVal]) {
      handleProviderChange(newVal, providers.value[newVal])
    }
  }
)

// 组件挂载时初始化
onMounted(() => {
  getProviders(true)
})

const handleProviderChange = async (provider: string, value: object) => {
  currentProvider.value = provider
  getModels()
  // 查询配置
  const res = await getConfigProvider()
  if (res) {
    apiConfig.apiKey = res.api_key ? "sk-configed" : ""
    apiConfig.baseUrl = res.base_url
    apiConfig.state = res.state ? true : false
  } else {
    apiConfig.apiKey = ""
    apiConfig.baseUrl = (value as any).api?.url || ""
    apiConfig.state = false
  }
  apiConfig.info = value
  console.log(apiConfig)
}

const modelsArray = ref<LLMModel[]>([])
const models = ref({})

const getModels = async () => {
  const provider = currentProvider.value
  const res = await llmApi.getModels(provider)
  const data = {}
  modelsArray.value = res
  currentCheckModel.value = res[0]?.id
  currentCheckModelObject.value = res[0]
  res.forEach((item) => {
    if (!data[item.group_name]) {
      data[item.group_name] = []
    }
    if (typeof item.apiKey == "undefined") item.apiKey = ""
    data[item.group_name].push(item)
  })
  console.log(data)
  models.value = data
}
const currentCheckModel = ref("")

// 模型配置
const getConfigProvider = async () => {
  const res = await llmApi.getConfigProvider(currentProvider.value)
  return res
}

// 更新提供商是否开启
const saveConfigProviderState = async (state: boolean) => {
  const config: ProviderConfig = {
    apiKey: apiConfig.apiKey,
    baseUrl: apiConfig.baseUrl,
    state,
    models: _flattenModels(models.value),
  }
  config.models?.forEach((item: any) => {
    if (item && typeof item === "object") {
      item.model_id = item.id
    }
  })
  const res = await llmApi.saveConfigProviderState(currentProvider.value, config)
  modelStore.updateProviderState(currentProvider.value, state)
  console.log(modelStore)

  getProviders(false)
}

// 更新模型是否开启
const saveConfigModelState = async (
  state: boolean,
  models: Record<string, LLMModel[]>,
  modelItem: LLMModel
) => {
  const flattenedModels = _flattenModels(models)
  const config = {
    state,
    models: flattenedModels,
  }
  const model_id = modelItem.from === "config" ? modelItem.model_id : modelItem.id
  // @ts-ignore
  const res = await llmApi.saveConfigModelState(model_id, config)
  console.log(res)
  getModels()
}

// 展开 Models 数据
const _flattenModels = (models: Record<string, LLMModel[]>): LLMModel[] => {
  const result: LLMModel[] = []
  for (const key in models) {
    if (models.hasOwnProperty(key)) {
      result.push(...models[key])
    }
  }
  return result
}

const currentCheckModelObject = ref<LLMModel | undefined>({} as LLMModel)
const handleCurrentCheckModelUpdate = (modelId: string) => {
  const selectedModel = modelsArray.value.find((model) => model.id === modelId)
  currentCheckModelObject.value = selectedModel
}
</script>

<template>
  <Toaster />
  <div class="flex h-full">
    <!-- 左侧 Sidebar -->
    <div class="w-40 border-r pr-2">
      <div class="font-bold mb-4 ml-6">{{ t('settings.apiModel.modelProvider') }}</div>
      <ScrollArea class="h-[calc(100vh-8rem)]">
        <div class="space-y-2">
          <div
            v-for="(value, provider) in providers"
            :key="provider"
            @click="handleProviderChange(provider, value)"
            class="flex items-center justify-between space-x-2 p-2 rounded-lg cursor-pointer"
            :class="{ 'bg-slate-100 dark:bg-slate-800': currentProvider === provider }"
          >
            <div>
              <div
                class="w-1.5 h-1.5 rounded-full"
                :class="(value as any).state ? 'bg-green-400' : ''"
              ></div>
            </div>
            <div class="flex-1 flex items-center space-x-2">
              <Icon :name="provider" :size="24" />
              <span>{{ provider }}</span>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>

    <!-- 右侧配置区域 -->
    <div class="flex-1 flex flex-col h-full">
      <div v-if="currentProvider" class="flex flex-col h-full p-4 pt-0">
        <!-- 头部 -->
        <div class="flex justify-between items-center mb-4 border-b pb-4">
          <div class="font-bold flex items-center space-x-2">
            <Icon :name="currentProvider" :size="24" />
            <span>{{ currentProvider }}</span>
          </div>
          <div class="flex space-x-2 items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Switch
                    v-model="apiConfig.state"
                    @update:model-value="saveConfigProviderState"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{{ t('settings.apiModel.enableProvider') }}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <!-- <Button :disabled="testLoading" @click="testConnection(currentProvider)">
              <Loader2 v-if="testLoading" class="mr-2 h-4 w-4 animate-spin" />
              <CheckCircle2 v-else-if="testPassed[currentProvider]" class="mr-1 h-4 w-4 text-green-500" />
              {{ testLoading ? '测试中...' : '测试连接' }}
            </Button> -->
            <!-- <Button :disabled="saveLoading" @click="saveConfig(currentProvider)">
              <Loader2 v-if="saveLoading" class="mr-2 h-4 w-4 animate-spin" />
              {{ saveLoading ? '保存中...' : '保存配置' }}
            </Button> -->
          </div>
        </div>

        <!-- 配置表单 -->
        <div class="space-y-4">
          <Label>{{ t('settings.apiModel.modelConfig') }}</Label>
          <div class="grid gap-2">
            <Label class="font-bold">API Key</Label>
            <Input
              v-model="apiConfig.apiKey"
              type="password"
              :placeholder="`sk-${currentProvider === 'anthropic' ? 'ant-' : ''}...`"
            />
          </div>

          <div class="grid gap-2">
            <Label class="font-bold">API URL</Label>
            <Input
              v-model="apiConfig.baseUrl"
              :placeholder="`https://api.${currentProvider}.com${
                currentProvider === 'openai' ? '/v1' : ''
              }`"
            />
          </div>
          <div class="grid gap-2">
            <Label>{{ t('settings.apiModel.connectivityCheck') }}</Label>
            <div class="flex items-center space-x-2">
              <Select
                class="w-full flex-1"
                v-model="currentCheckModel"
                @update:modelValue="handleCurrentCheckModelUpdate"
              >
                <SelectTrigger class="w-full flex-1">
                  <SelectValue :placeholder="t('settings.apiModel.selectModelToTest')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="item in modelsArray" :value="item.id" :key="item.id">
                    {{ item.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                :disabled="testLoading || !apiConfig.apiKey || !apiConfig.baseUrl"
                @click="testConnection(currentProvider)"
              >
                <Loader2 v-if="testLoading" class="mr-2 h-4 w-4 animate-spin" />
                <Check
                  v-else-if="testPassed[currentProvider]"
                  class="mr-1 h-4 w-4 text-green-500"
                />
                {{ testLoading ? t('settings.apiModel.testing') : t('settings.apiModel.testConnection') }}
              </Button>
            </div>
          </div>
        </div>

        <!-- 模型列表 -->
        <div class="flex-1 pt-6 min-h-0 overflow-hidden">
          <Label>{{ t('settings.apiModel.availableModels') }}</Label>
          <ScrollArea class="h-full w-full rounded-md pb-8">
            <!-- {{ models['DeepSeek Chat'] }} -->
            <div v-for="(group, key) in models" :key="key" class="space-y-4">
              <!-- 组标题 -->
              <div class="flex items-center space-x-2 pt-6">
                <div class="font-semibold font-bold">{{ key }}</div>
                <!-- <span class="text-sm text-gray-500">{{ group.description }}</span> -->
              </div>

              <!-- 组内模型 -->
              <div class="flex flex-col mt-0 border rounded-md">
                <div
                  v-for="model in group"
                  :key="
                    //@ts-ignore
                    model.name
                  "
                  class="flex flex-col space-y-2 p-4 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div class="flex items-center space-x-2 justify-between">
                    <div class="flex items-center space-x-2">
                      <Icon
                        :name="
                          //@ts-ignore
                          model.provider_id
                        "
                        :size="24"
                      />
                      <div class="font-medium">
                        {{
                          //@ts-ignore
                          model.name
                        }}
                      </div>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Switch
                            v-model="
                              //@ts-ignore
                              model.state
                            "
                            @update:model-value="
                              //@ts-ignore
                              saveConfigModelState($event, models, model)
                            "
                          >
                          </Switch>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{{ t('settings.apiModel.enableModel') }}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <!-- <div class="flex space-x-2">
                  <Badge variant="secondary" v-for="capability in model.capabilities" :key="capability">
                    {{ capability }}
                  </Badge>
                </div>
                <div class="text-sm text-gray-500">
                  {{ model.description }}
                </div> -->
                </div>
              </div>
            </div>
            <!-- </div> -->
          </ScrollArea>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  gap: 0.5rem;
}
</style>
