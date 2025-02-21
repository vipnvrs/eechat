<script setup lang="ts">
import MessageItem from '@/components/MessageItem.vue';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

defineProps<{
  messages: Array<{ role: string, content: string }>
}>()
</script>

<template>
    <div class="h-full flex flex-col">
      <div class="flex-1 leading-8">
        <!-- <ScrollArea class="h-full"> -->
        <MessageItem v-for="(message, index) in messages" :key="index" :message="message.content"
          :role="message.role" />
    <!-- <ScrollBar orientation="vertical" />
  </ScrollArea> -->
      </div>
    </div>
</template>
