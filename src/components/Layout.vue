<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import Message from '@/components/Message.vue'
import ChatInput from "@/components/ChatInput.vue";
import LocalAI from '@/api/request'
// import { fetchApi } from '../api/request'

// defineProps<{ msg: string }>()

const localAI = new LocalAI();

// 定义对话历史数组
const chatHistory = ref<Array<{ role: string, content: string }>>([])

const sendMsg = async (msg: string) => {
  // 添加用户消息到历史记录
  chatHistory.value.push({ role: 'user', content: msg })
  
  const response = await localAI.createChatCompletion([
    { role: 'system', content: '你是一个AI助手' },
    { role: 'user', content: msg }
  ])
  
  // 添加AI响应到历史记录
  if (response.choices && response.choices[0]?.message) {
    chatHistory.value.push({
      role: 'assistant',
      content: response.choices[0].message.content
    })
  }
  console.log(chatHistory.value);
  
}

</script>

<template>
  <div class="w-[700px] mx-auto h-full flex flex-col p-2">
    <div class="flex flex-col flex-grow align-bottom">
      <Message :messages="chatHistory"></Message>
      <ChatInput @sendMsg="sendMsg"></ChatInput>
    </div>
  </div>
</template>