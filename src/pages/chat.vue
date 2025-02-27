<script setup lang="ts">
import { ref } from 'vue'
import SidebarLeft from '@/components/chat/SidebarLeft.vue'
import SidebarRight from '@/components/chat/SidebarRight.vue'
import { Button } from '@/components/ui/button'
import { SidebarProvider } from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'

import Message from '@/components/chat/Message.vue'
import ChatInput from '@/components/chat/ChatInput.vue'
import ModelSelect from '@/components/ModelSelect.vue'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import Theme from '@/components/Theme.vue'
import { chatApi } from '@/api/request'
import { PanelLeft, PanelRight } from 'lucide-vue-next'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}
const activeSession = ref({})
const chatHistory = ref<Message[]>([])
const loading = ref(false)
const currentAssistantMessage = ref('')
const sidebarLeftOpen = ref(true)
const sidebarRightOpen = ref(true)

const handleSessionChange = async session => {
  activeSession.value = session
  console.log('Session changed:', session.id)
  localStorage.setItem('activeSession', JSON.stringify(session))
  chatHistory.value = []
  chatApi
    .getMessages(session.id)
    .then(messages => {
      chatHistory.value = messages.data
    })
    .catch((error: Error) => {
      console.error('Error loading chat history:', error)
    })
}

const sendMsg = async (msg: string) => {
  if (loading.value) return
  loading.value = true

  try {
    // 添加用户消息到历史记录
    chatHistory.value.push({ role: 'user', content: msg })

    // 添加空的助手消息
    chatHistory.value.push({
      role: 'assistant',
      content: '',
    })

    // 发送消息并处理流式响应
    await chatApi.sendMessage(
      [
        { role: 'system', content: '你是一个AI助手' },
        ...chatHistory.value.slice(0, -1), // 不包含空的助手消息
      ],
      activeSession.value.id,
      (content: string) => {
        // 更新最后一条消息的内容
        const lastMessage = chatHistory.value[chatHistory.value.length - 1]
        lastMessage.content += content
      },
    )
  } catch (error) {
    console.error('Error during chat:', error)
    // 移除失败的助手消息
    chatHistory.value.pop()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex relative overflow-hidden">
    <SidebarProvider
      class="w-auto"
      :style="{ '--sidebar-width': '240px' }"
      v-model:open="sidebarLeftOpen"
    >
      <SidebarLeft @session-change="handleSessionChange" />
    </SidebarProvider>
    <div class="w-full h-[100vh] max-h-[100vh] flex flex-col grow">
      <header
        class="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-4 justify-between"
      >
        <div class="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            class="h-7 w-7"
            @click="sidebarLeftOpen = !sidebarLeftOpen"
          >
            <PanelLeft></PanelLeft>
          </Button>
          <Separator orientation="vertical" class="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{{ activeSession.title }}</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator class="hidden md:block" />
              <BreadcrumbItem class="hidden md:block">
                <ModelSelect></ModelSelect>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div class="flex items-center gap-2">
          <Theme></Theme>
          <Separator orientation="vertical" class="mx-2 h-4" />
          <Button
            size="icon"
            variant="ghost"
            class="h-7 w-7"
            @click="sidebarRightOpen = !sidebarRightOpen"
          >
            <PanelRight></PanelRight>
          </Button>
        </div>
      </header>
      <ScrollArea
        class="h-full w-full px-4 flex-1 bg-slate-200 dark:bg-[#282C34]"
      >
        <Message :messages="chatHistory" class="py-4" />
        <ScrollBar />
      </ScrollArea>
      <div
        class="sticky bottom-0 h-[100px] content-center shrink-0 items-center gap-2 border-b bg-background"
      >
        <ChatInput @sendMsg="sendMsg" :disabled="loading" />
      </div>
    </div>
    <SidebarProvider
      class="w-auto"
      :style="{ '--sidebar-width': '300px' }"
      v-model:open="sidebarRightOpen"
    >
      <SidebarRight :activeSession="activeSession" />
    </SidebarProvider>
  </div>
</template>
