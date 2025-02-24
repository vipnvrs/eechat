<script setup lang="ts">
import { ref } from 'vue'
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
import { chatApi } from '@/api/request'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const activeSessionId = ref<number>()
const chatHistory = ref<Message[]>([])
const loading = ref(false)
const currentAssistantMessage = ref('')

const handleSessionChange = async (sessionId: number) => {
  activeSessionId.value = sessionId
  console.log('Session changed:', sessionId);
  localStorage.setItem('activeSessionId', sessionId.toString())
  chatHistory.value = []
  chatApi.getMessages(sessionId)
    .then((messages) => {
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
      content: ''
    })

    // 发送消息并处理流式响应
    await chatApi.sendMessage(
      [
        { role: 'system', content: '你是一个AI助手' },
        ...chatHistory.value.slice(0, -1) // 不包含空的助手消息
      ],
      activeSessionId.value,
      (content: string) => {
        // 更新最后一条消息的内容
        const lastMessage = chatHistory.value[chatHistory.value.length - 1]
        lastMessage.content += content
      }
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
  <SidebarProvider :style="{ '--sidebar-width': '300px' }">
    <AppSidebar @session-change="handleSessionChange" />
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
          <Message :messages="chatHistory" />
        </div>
        <div class="sticky bottom-0 content-center shrink-0 items-center gap-2 border-b bg-background">
          <ChatInput @sendMsg="sendMsg" :disabled="loading" />
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
