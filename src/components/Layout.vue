<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import Message from '@/components/Message.vue'
import ChatInput from '@/components/ChatInput.vue'
import LocalAI from '@/api/request'

const chatHistory = ref<Array<{ role: string; content: string }>>([])
const currentAssistantMessage = ref('')

// 初始化 LocalAI 实例，配置消息处理回调
const localAI = new LocalAI({
  onMessage: (content: string) => {
    if (!currentAssistantMessage.value) {
      // 首次收到消息，创建新的助手消息
      chatHistory.value.push({
        role: 'assistant',
        content: content,
      })
    } else {
      // 更新最后一条助手消息
      chatHistory.value[chatHistory.value.length - 1].content =
        currentAssistantMessage.value + content
    }
    currentAssistantMessage.value += content
  },
})

const sendMsg = async (msg: string) => {
  // 重置当前助手消息
  currentAssistantMessage.value = ''

  // 添加用户消息到历史记录
  chatHistory.value.push({ role: 'user', content: msg })

  try {
    await localAI.createChatCompletion([
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
  <div class="w-[700px] mx-auto h-full flex p-2">
    <div class="flex flex-col flex-grow align-bottom">
      <div class="fixed bg-white content-center top-0 pt-1">
        <div class="py-4 border-b w-[700px]">Deepseek R1</div>
      </div>
      <div class="pt-[100px] pb-[300px] max-w-[100vw]">
        <Message :messages="chatHistory"></Message>
      </div>
      <div class="fixed  bg-white content-center bottom-0 pb-2">
        <ChatInput @sendMsg="sendMsg"></ChatInput>
      </div>
    </div>
  </div>
</template>
