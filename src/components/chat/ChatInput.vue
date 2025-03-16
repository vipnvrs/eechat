<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowUpToLine } from "lucide-vue-next"
import { CornerDownLeft } from "lucide-vue-next"

const { t } = useI18n()

const count = ref(0)
const msg = ref("")
const emit = defineEmits(["sendMsg"])
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
})

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
        class="h-[120px] rounded-none focus-visible:ring-offset-0 focus-visible:ring-0 border-l-0"
        :placeholder="t('chat.inputPlaceholder')"
        @keydown="handleKeyDown"
      ></Textarea>
      <Button
        type="submit"
        :disabled="disabled"
        size="icon"
        class="ml-auto gap-1.5 absolute bottom-12 right-4"
      >
        <CornerDownLeft class="size-3.5" />
      </Button>
    </form>
  </div>
</template>
