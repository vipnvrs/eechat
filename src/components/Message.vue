<script setup lang="ts">
import MessageItem from '@/components/MessageItem.vue';

defineProps<{
  messages: Array<{ role: string, content: string }>
}>()
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="p-4 border-b">Deepseek R1</div>
    <div class="flex-1 overflow-auto p-4 space-y-4">
      <MessageItem 
        v-for="(message, index) in messages"
        :key="index"
        :message="message.content"
        :role="message.role"
      />
    </div>
  </div>
</template>
