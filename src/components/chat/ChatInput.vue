<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowUpToLine } from 'lucide-vue-next'
import { CornerDownLeft } from 'lucide-vue-next'

const count = ref(0)
const msg = ref('给我写一个企业网站')
const emit = defineEmits(['sendMsg'])

const handleSendMsg = (e: Event) => {
  emit('sendMsg', msg.value)
  msg.value = ''
}

// 监听回车键
const initEvent = () => {
  window.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      handleSendMsg(e)
    }
  })
}
initEvent()

defineProps<{
  disabled?: boolean
}>()
</script>

<template>
  <div class="relative">
    <Textarea
      v-model="msg"
      :disabled="disabled"
      class="h-[100px] rounded-none focus-visible:ring-offset-0 focus-visible:ring-0"
      placeholder="输入您要发送的消息"
    ></Textarea>
    <!-- <Button @click="handleSendMsg" class="absolute bottom-2 right-2" variant="" size="icon">
      <ArrowUpToLine />
    </Button> -->
    <Button
      @click="handleSendMsg"
      :disabled="disabled"
      type="submit"
      size="sm"
      class="ml-auto gap-1.5 absolute bottom-2 right-2"
    >
      发送
      <CornerDownLeft class="size-3.5" />
    </Button>
  </div>
</template>
