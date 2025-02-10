<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowUpToLine } from 'lucide-vue-next';

const count = ref(0)
const msg = ref('')
const emit = defineEmits(['sendMsg'])

const handleSendMsg = e => {
  emit('sendMsg', msg.value)
}
</script>

<template>
  <div class="relative">
    <Textarea v-model="msg" class="h-[100px]" placeholder="输入您要发送的消息"></Textarea>
    <Button @click="handleSendMsg" class="absolute bottom-2 right-2" variant="" size="icon">
      <ArrowUpToLine />
    </Button>
  </div>
</template>