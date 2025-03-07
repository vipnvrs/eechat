<script setup lang="ts">
import { ref } from "vue"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowUpToLine } from "lucide-vue-next"
import { CornerDownLeft } from "lucide-vue-next"

const count = ref(0)
const msg = ref("")
const emit = defineEmits(["sendMsg"])

const handleSendMsg = (e: Event) => {
  emit("sendMsg", msg.value)
  msg.value = ""
}

// 监听回车键
const initEvent = () => {
  window.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleSendMsg(e)
    }
  })
}
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault()
    handleSendMsg(e)
  } else if (e.key === "Enter" && e.shiftKey) {
    // 允许默认换行行为
    e.stopPropagation() // 添加这行防止事件冒泡
  }
}

// 删除 initEvent 函数及其调用
</script>

<template>
  <div class="relative l-footer">
    <form @submit.prevent="handleSendMsg">
      <Textarea
        v-model="msg"
        class="h-[100px] rounded-none focus-visible:ring-offset-0 focus-visible:ring-0"
        placeholder="输入消息，使用 Enter 发送, Shift + Enter 换行"
        @keydown="handleKeyDown"
      ></Textarea>
      <Button
        type="submit"
        :disabled="disabled"
        size="sm"
        class="ml-auto gap-1.5 absolute bottom-2 right-2"
      >
        发送
        <CornerDownLeft class="size-3.5" />
      </Button>
    </form>
  </div>
</template>
