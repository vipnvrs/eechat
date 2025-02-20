<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
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
  <div class="w-[700px] mx-auto h-full flex p-2">
    <div class="flex flex-col flex-grow align-bottom w-[700px]">
      <div class="fixed bg-white content-center top-0 pt-1">
        <div class="py-4 border-b w-[700px] px-2 flex justify-between">
          <ModelSelect @update:modelId="handleModelSelect"></ModelSelect>
          <Ollama></Ollama>
        </div>
      </div>
      <div class="pt-[100px] pb-[300px]">
        <Message :messages="chatHistory"></Message>
      </div>
      <div class="fixed  bg-white content-center bottom-0 pb-2">
        <ChatInput @sendMsg="sendMsg"></ChatInput>
      </div>
    </div>
  </div>
</template>
