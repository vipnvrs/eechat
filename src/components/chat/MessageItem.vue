<script setup lang="ts">
import { ref, defineProps, computed, nextTick, onBeforeUnmount, watch } from "vue"
import { useI18n } from "vue-i18n"
import { LoaderCircle } from "lucide-vue-next"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import rehypeRaw from "rehype-raw"
import rehypeStringify from "rehype-stringify"
import remarkRehype from "remark-rehype"
import rehypeHighlight from "rehype-highlight"
import "highlight.js/styles/atom-one-dark.css"
import { unified } from "unified"

const props = defineProps<{
  message: string
  role: string
}>()
const { t } = useI18n()
const renderedHTML = ref("")
const isThinking = ref(false)
const thinkContent = ref("")
const formalContent = ref("")

// 监听消息变化，处理思考过程和正式内容
watch(() => props.message, (newMessage) => {
  if (newMessage.includes("<think>") && !newMessage.includes("</think>")) {
    // 开始思考状态
    isThinking.value = true
    thinkContent.value = newMessage.replace("<think>", "")
    formalContent.value = ""
  } else if (newMessage.includes("<think>") && newMessage.includes("</think>")) {
    // 思考已结束，提取思考内容和正式内容
    isThinking.value = false
    const thinkMatch = newMessage.match(/<think>([\s\S]*?)<\/think>/);
    thinkContent.value = thinkMatch ? thinkMatch[1] : "";
    formalContent.value = newMessage.replace(/<think>[\s\S]*?<\/think>/, "");
  } else {
    // 没有思考内容，只有正式内容
    isThinking.value = false
    thinkContent.value = ""
    formalContent.value = newMessage
  }
}, { immediate: true })

// 使用 remark 处理 Markdown
const processor = unified()
  .use(remarkParse) // 解析 Markdown
  .use(remarkGfm) // 支持 GFM (GitHub Flavored Markdown)
  .use(remarkMath) // 支持数学公式
  .use(remarkRehype, { allowDangerousHtml: true }) // 转换为 HTML，允许原始 HTML
  .use(rehypeRaw) // 处理原始 HTML
  .use(rehypeHighlight) // 使用默认配置
  .use(rehypeKatex) // 渲染数学公式
  // .use(rehypeMermaid, mermaidOptions) // 简化配置
  .use(rehypeStringify) // 输出 HTML 字符串

// 安全处理后的内容 - 添加这个计算属性以修复未定义的变量
const sanitizedContent = computed(() => processor.processSync(props.message).toString())

// 处理思考内容的 Markdown
const processedThinkContent = computed(() => {
  if (!thinkContent.value) return "";
  return processor.processSync(thinkContent.value).toString();
})

// 处理正式内容的 Markdown
const processedFormalContent = computed(() => {
  if (!formalContent.value) return "";
  return processor.processSync(formalContent.value).toString();
})
</script>

<template>
  <div class="last:min-h-[calc(100dvh-268px)]">
    <div
      v-if="message == ''"
      class="bg-gray-100 dark:bg-primary-foreground dark:text-white rounded-lg p-2 flex items-center w-[110px] justify-center"
    >
      <LoaderCircle class="animate-spin w-4 h-4"></LoaderCircle>
      <span class="ml-2 text-[14px]">{{ t('chat.thinking') }}</span>
    </div>
    <div v-else class="flex pb-4" :class="role === 'user' ? 'flex-row-reverse' : ''">
      <div class="flex flex-col max-w-[80%]">
        <div
          class="rounded-lg px-4 py-2 list-disc text-[14px] whitespace-wrap msg-item"
          :class="
            role === 'user'
              ? 'bg-primary text-primary-foreground'
              : 'bg-gray-100 dark:bg-primary-foreground dark:text-white'
          "
        >
          <!-- 思考中状态 -->
          <div v-if="isThinking" class="thinking-container">
            <div class="think" v-html="processedThinkContent"></div>
            <div class="thinking-indicator">
              <LoaderCircle class="animate-spin w-4 h-4 inline-block mr-1"></LoaderCircle>
              <span>{{ t('chat.thinking') }}</span>
            </div>
          </div>
          
          <!-- 思考已完成，显示思考内容和正式内容 -->
          <template v-else>
            <div v-if="thinkContent" class="think mb-3" v-html="processedThinkContent"></div>
            <div v-html="processedFormalContent || sanitizedContent"></div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 添加代码块样式控制 */
:deep(pre) {
  max-width: 100%;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0.75rem 0;
  border-radius: 0.375rem;
}

:deep(code) {
  max-width: 100%;
  word-break: break-all;
  white-space: pre-wrap;
  font-size: 13px;
  line-height: 1.6;
}

/* Mermaid 图表样式 */
:deep(.mermaid) {
  text-align: center;
  margin: 1rem 0;
}

:deep(.mermaid svg) {
  max-width: 100%;
  height: auto;
}

/* 数学公式样式 */
:deep(.katex-display) {
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.5rem 0;
}

summary {
  cursor: pointer;
  font-weight: bold;
}

/* 添加有序列表样式 */
ol {
  counter-reset: item;
  list-style-type: none;
  padding-left: 0;
}

ol li {
  counter-increment: item;
  position: relative;
  padding-left: 2.5em;
  margin: 0.5em 0;
}

ol li:before {
  content: counter(item) ".";
  position: absolute;
  left: 0.8em;
  color: #666;
  font-weight: 500;
}

/* 支持多级有序列表 */
ol ol {
  margin-left: 1em;
}

ol ol li:before {
  content: counter(item, lower-alpha) ".";
}

ol ol ol li:before {
  content: counter(item, lower-roman) ".";
}

/* 添加无序列表样式 */
:deep(ul) {
  list-style-type: none;
  padding-left: 0;
}

:deep(ul li) {
  position: relative;
  padding-left: 2.5em;
  margin: 0.5em 0;
}

:deep(ul li::before) {
  content: "•";
  position: absolute;
  left: 1em;
  color: #666;
  font-weight: bold;
}

:deep(ul ul li::before) {
  content: "◦";
}

:deep(ul ul ul li::before) {
  content: "▪";
}

/* 暗黑模式支持 */
:root[class~="dark"] ol li:before,
:root[class~="dark"] :deep(ul li::before) {
  color: #999;
}

/* 调整列表项间距 */
li p {
  margin: 0.3em 0;
}

/* 确保列表内的代码块正确对齐 */
li pre {
  margin: 1em 0;
}

/* 表格样式 */
:deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
}

:deep(th),
:deep(td) {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

:deep(th) {
  background-color: #f2f2f2;
}

:deep(tr:nth-child(even)) {
  background-color: #f9f9f9;
}

/* 暗黑模式表格样式 */
:root[class~="dark"] :deep(th) {
  background-color: #333;
}

:root[class~="dark"] :deep(td),
:root[class~="dark"] :deep(th) {
  border-color: #444;
}

:root[class~="dark"] :deep(tr:nth-child(even)) {
  background-color: #2a2a2a;
}

/* Graphviz 图表样式 */
:deep(.graphviz) {
  text-align: center;
  margin: 1rem 0;
}

:deep(.graphviz svg) {
  max-width: 100%;
  height: auto;
}

/* 思考状态样式 */
.thinking-container {
  position: relative;
}

.thinking-indicator {
  display: flex;
  align-items: center;
  margin-top: 8px;
  font-style: italic;
  color: #666;
  font-size: 14px;
}

:root[class~="dark"] .thinking-indicator {
  color: #aaa;
}
</style>

<style>
.think {
  font-style: italic;
  color: #555;
}

:root[class~="dark"] .think {
  color: #aaa;
  border-left-color: #555;
}
</style>
