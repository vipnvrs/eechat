<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast/use-toast'
import { Toaster } from '@/components/ui/toast'
import Icon from '@/components/Icon.vue'
import { llmApi } from '@/api/request'
import type { LLMProvider } from '@/types/llm'
import { Loader2, CheckCircle2 } from 'lucide-vue-next'

const { toast } = useToast()
const testLoading = ref(false)
const saveLoading = ref(false)
const testPassed = reactive({
  openai: false,
  anthropic: false,
  deepseek: false
})

// 添加当前选中的提供商
const currentProvider = ref('deepseek')

// API 提供商列表
// const providers: LLMProvider[] = [
//   { id: 'openai', name: 'OpenAI', icon: 'openai' },
//   { id: 'anthropic', name: 'Anthropic', icon: 'anthropic' },
//   { id: 'deepseek', name: 'Deepseek', icon: 'deepseek' }
// ]
const providers = ref({})

// API 模型配置状态
const apiConfig = reactive({
  openai: {
    apiKey: '',
    baseUrl: '',
    modelGroups: [
      {
        name: 'GPT-4',
        description: '最新的 GPT-4 系列模型',
        models: [
          {
            name: 'gpt-4-turbo-preview',
            capabilities: ['长文本', '代码', '创意写作'],
            description: '最新的 GPT-4 模型,支持更长的上下文'
          },
          {
            name: 'gpt-4',
            capabilities: ['推理', '创意', '分析'],
            description: 'GPT-4 基础模型'
          }
        ]
      },
      {
        name: 'GPT-3.5',
        description: '性能优秀的通用模型系列',
        models: [
          {
            name: 'gpt-3.5-turbo',
            capabilities: ['快速', '经济', '通用'],
            description: '适合日常对话和简单任务'
          },
          {
            name: 'gpt-3.5-turbo-16k',
            capabilities: ['长文本', '经济', '通用'],
            description: '支持更长上下文的 3.5 模型'
          }
        ]
      }
    ]
  },
  anthropic: {
    apiKey: '',
    baseUrl: '',
    modelGroups: [
      {
        name: 'Claude 3',
        description: '最新的 Claude 3 系列模型',
        models: [
          {
            name: 'claude-3-opus',
            capabilities: ['视觉', '分析', '专业'],
            description: 'Claude 最强大的模型,支持图像理解'
          },
          {
            name: 'claude-3-sonnet',
            capabilities: ['平衡', '经济', '可靠'],
            description: '平衡性能和成本的理想选择'
          }
        ]
      },
      {
        name: 'Claude 2',
        description: 'Claude 2 系列模型',
        models: [
          {
            name: 'claude-2.1',
            capabilities: ['分析', '可靠', '通用'],
            description: '稳定可靠的通用模型'
          }
        ]
      }
    ]
  },
  google: {
    apiKey: '',
    baseUrl: '',
    modelGroups: [
      {
        name: 'Gemini',
        description: 'Google 最新的 Gemini 系列模型',
        models: [
          {
            name: 'gemini-pro',
            capabilities: ['多模态', '推理', '创意'],
            description: '支持文本和图像的多模态模型'
          },
          {
            name: 'gemini-pro-vision',
            capabilities: ['视觉', '分析', '专业'],
            description: '专注于视觉理解的模型'
          }
        ]
      }
    ]
  },
  mistral: {
    apiKey: '',
    baseUrl: '',
    modelGroups: [
      {
        name: 'Mistral',
        description: 'Mistral AI 的高性能模型系列',
        models: [
          {
            name: 'mistral-large',
            capabilities: ['推理', '分析', '专业'],
            description: '最强大的 Mistral 模型'
          },
          {
            name: 'mistral-medium',
            capabilities: ['平衡', '经济', '可靠'],
            description: '性能与成本平衡的选择'
          },
          {
            name: 'mistral-small',
            capabilities: ['快速', '经济', '轻量'],
            description: '轻量级快速响应模型'
          }
        ]
      }
    ]
  },
  deepseek: {
    apiKey: 'sk-5f86865628c54c4f954090aae9395d3a',
    baseUrl: 'https://api.deepseek.com/v1',
    modelGroups: [
      {
        name: 'Deepseek',
        description: 'Deepseek 的高性能模型系列',
        models: [
          {
            name: 'deepseek-large',
            capabilities: ['推理', '分析', '专业'],
            description: '最强大的 Deepseek 模型'
          },
          {
            name: 'deepseek-medium',
            capabilities: ['平衡', '经济', '可靠'],
            description: '性能与成本平衡的选择'
          },
          {
            name: 'deepseek-small',
            capabilities: ['快速', '经济', '轻量'],
            description: '轻量级快速响应模型'
          }
        ]
      }
    ]
  }
})

// 测试连接
async function testConnection(provider: string) {
  testLoading.value = true
  try {
    const config = {
      apiKey: apiConfig[provider].apiKey,
      baseUrl: apiConfig[provider].baseUrl,
      models: apiConfig[provider].modelGroups,
    }
    const res = await llmApi.testConnection(provider, config)
    if (res) {
      testPassed[provider] = true
      toast({
        title: '连接成功',
        description: '已成功连接到 API'
      })
    }
  } catch (error: any) {
    testPassed[provider] = false
    toast({
      title: '连接失败',
      description: error.message,
      variant: 'destructive'
    })
  } finally {
    testLoading.value = false
  }
}

// 保存配置
async function saveConfig(provider: string) {
  saveLoading.value = true
  const config = {
    apiKey: apiConfig[provider].apiKey,
    baseUrl: apiConfig[provider].baseUrl,
    models: apiConfig[provider].modelGroups,
  }
  try {
    // 先测试连接
    const testRes = await llmApi.testConnection(provider, config)
    if (!testRes) {
      throw new Error('连接测试失败,请检查配置')
    }
    testPassed[provider] = true

    // 测试通过后保存
    await llmApi.saveConfig(provider, config)
    toast({
      title: '保存成功',
      description: '配置已更新'
    })
  } catch (error: any) {
    testPassed[provider] = false
    toast({
      title: '保存失败',
      description: error.message,
      variant: 'destructive'
    })
  } finally {
    saveLoading.value = false
  }
}

// 获取提供商列表
async function getProviders() {
  const res = await llmApi.getProviders()
  providers.value = res
  console.log(providers.value)
}
getProviders()

const handleProviderClick = (provider: string) => {
  currentProvider.value = provider
  getModels(provider)
}

const models = ref({})
const getModels = async (provider: string) => {
  const res = await llmApi.getModels(provider)
  console.log(res);
  const data = {}
  res.forEach(item => {
    if (!data[item.group]) {
      data[item.group] = []
    }
    data[item.group].push(item)
  });
  models.value = data
  console.log(data);

}

</script>

<template>
  <Toaster />
  <div class="flex h-full">
    <!-- 左侧 Sidebar -->
    <div class="w-[180px]">
      <div class="font-bold mb-4">模型提供商</div>
      <ScrollArea class="h-[calc(100vh-8rem)] border p-4 rounded-md">
        <div class="space-y-2">
          <div v-for="(value, provider) in providers" :key="provider" @click="handleProviderClick(provider)"
            class="flex items-center space-x-2 p-2 rounded-lg cursor-pointer"
            :class="{ 'bg-slate-100 dark:bg-slate-800': currentProvider === provider }">
            <Icon :name="provider" :size="24" />
            <span>{{ provider }}</span>
          </div>
        </div>
      </ScrollArea>
    </div>

    <!-- 右侧配置区域 -->
    <div class="flex-1 flex flex-col h-full">
      <div v-if="currentProvider" class="flex flex-col h-full p-4 pt-0">
        <!-- 头部 -->
        <div class="flex justify-between items-center mb-4">
          <div class="font-bold flex items-center space-x-2">
            <!-- <Icon :name="providers.find(p => p.id === currentProvider)?.icon" :size="24" />
            <span>{{providers.find(p => p.id === currentProvider)?.name}}</span> -->
          </div>
          <div class="flex space-x-2">
            <Button :disabled="testLoading" @click="testConnection(currentProvider)">
              <Loader2 v-if="testLoading" class="mr-2 h-4 w-4 animate-spin" />
              <CheckCircle2 v-else-if="testPassed[currentProvider]" class="mr-1 h-4 w-4 text-green-500" />
              {{ testLoading ? '测试中...' : '测试连接' }}
            </Button>
            <Button :disabled="saveLoading" @click="saveConfig(currentProvider)">
              <Loader2 v-if="saveLoading" class="mr-2 h-4 w-4 animate-spin" />
              {{ saveLoading ? '保存中...' : '保存配置' }}
            </Button>
          </div>
        </div>

        <!-- 配置表单 -->
        <div class="space-y-4">
          <div class="grid gap-2">
            <Label>API Key</Label>
            <Input v-model="apiConfig[currentProvider].apiKey" type="password"
              :placeholder="`sk-${currentProvider === 'anthropic' ? 'ant-' : ''}...`" />
          </div>

          <div class="grid gap-2">
            <Label>API Base URL</Label>
            <Input v-model="apiConfig[currentProvider].baseUrl"
              :placeholder="`https://api.${currentProvider}.com${currentProvider === 'openai' ? '/v1' : ''}`" />
          </div>
        </div>

        <!-- 模型列表 -->
        <div class="flex-1 pt-6 min-h-0 overflow-hidden">
          <Label>可用模型</Label>
          <ScrollArea class="h-full w-full rounded-md pb-8">
            <!-- <div class="space-y-6 p-4 pb-8"> -->
            <div v-for="(group, key) in models" :key="key" class="space-y-4">
              <!-- 组标题 -->
              <div class="flex items-center space-x-2 pt-6">
                <h3 class="font-semibold text-lg">{{ key }}</h3>
                <!-- <span class="text-sm text-gray-500">{{ group.description }}</span> -->
              </div>

              <!-- 组内模型 -->
              <div class="flex flex-col space-y-4 mt-0">
                <div v-for="model in group" :key="model.name"
                  class="flex flex-col space-y-2 p-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border">
                  <div class="flex items-center space-x-2">
                    <Icon :name="model.provider" :size="24" />
                    <div class="font-medium">{{ model.name }}</div>
                    <!-- <Button variant="outline" size="sm">选择</Button> -->
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
