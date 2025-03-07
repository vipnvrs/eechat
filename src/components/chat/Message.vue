<script setup lang="ts">
import MessageItem from '@/components/chat/MessageItem.vue'

defineProps<{
  messages: Array<{ role: string; content: string }>
}>()
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex-1 leading-8">
      <MessageItem v-for="(message, index) in messages" :key="index" :message="message.content" :role="message.role"
        :isLastMessage="index === messages.length - 1" />
    </div>
  </div>
</template>
