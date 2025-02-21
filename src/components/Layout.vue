<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import AppSidebar from '@/components/Sidebar.vue'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'

import Message from '@/components/Message.vue'
import ChatInput from '@/components/ChatInput.vue'
import ModelSelect from '@/components/ModelSelect.vue'
import Ollama from '@/components/Ollama.vue'
import LocalAI from '@/api/request'

const chatHistory = ref<Array<{ role: string; content: string }>>([])
const currentAssistantMessage = ref('')
const selectedModel = ref('') // 添加选中模型的状态

// 更新 LocalAI 实例创建
const localAI = computed(() => new LocalAI({
  model: selectedModel.value || 'deepseek-r1', // 使用选中的模型,如果没有则使用默认值
  onMessage: (content: string) => {
    if (!currentAssistantMessage.value) {
      chatHistory.value.push({
        role: 'assistant',
        content: content,
      })
    } else {
      chatHistory.value[chatHistory.value.length - 1].content = 
        currentAssistantMessage.value + content
    }
    currentAssistantMessage.value += content
  },
}))

// 处理模型选择
const handleModelSelect = (modelId: string) => {
  selectedModel.value = modelId
}

const sendMsg = async (msg: string) => {
  // 重置当前助手消息
  currentAssistantMessage.value = ''

  // 添加用户消息到历史记录
  chatHistory.value.push({ role: 'user', content: msg })

  try {
    await localAI.value.createChatCompletion([
      { role: 'system', content: '你是一个AI助手' },
      ...chatHistory.value, // 包含完整对话历史
    ])
  } catch (error) {
    console.error('Error during chat completion:', error)
    // 可以在这里添加错误处理的UI反馈
  }
}
</script>

<template>
  <SidebarProvider
    :style="{
      '--sidebar-width': '300px',
    }"
  >
    <AppSidebar />
    <SidebarInset class="">
      <div class="w-full h-full overflow-y-hidden max-h-[100vh] flex flex-col">
      <header class="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-4">
        <SidebarTrigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem class="hidden md:block">
              <BreadcrumbLink href="#">
                对话
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator class="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>新对话</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div class="h-full pb-[100px] overflow-y-scroll p-4 bg-slate-200">
        <Message :messages="chatHistory" class=""></Message>
      </div>
      <div class="sticky bottom-0  content-center shrink-0 items-center gap-2 border-b bg-background">
        <ChatInput @sendMsg="sendMsg"></ChatInput>
      </div>
    </div>
    </SidebarInset>
  </SidebarProvider>
</template>
