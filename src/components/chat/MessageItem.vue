<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { LoaderCircle} from 'lucide-vue-next'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import remarkRehype from 'remark-rehype'
import rehypeHighlight from 'rehype-highlight'
import rehypeMermaid from 'rehype-mermaid'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
import { ref, onMounted, computed, watch, callWithErrorHandling } from 'vue'
import type { RehypeMermaidOptions } from 'rehype-mermaid'

interface Props {
  message: string
  role: string
}

const props = defineProps<Props>()

// 添加错误处理函数
const handleMermaidError = () => {
  // 移除所有 mermaid 错误信息元素
  const errorElements = document.querySelectorAll('div[style*="font-family: trebuchet ms"]')
  errorElements.forEach(el => el.remove())
}

const mermaidOptions: RehypeMermaidOptions = {
  strategy: 'img-svg',
  errorFallback(el, diagram, error) {
    console.error('Mermaid rendering error:', error)
    return {
      type: 'element',
      tagName: 'div',
      properties: {
        className: ['mermaid-error', 'p-4', 'text-red-500', 'bg-red-50', 'dark:bg-red-900/10', 'rounded-lg']
      },
      children: [
        {
          type: 'element',
          tagName: 'pre',
          properties: { className: ['mt-2', 'text-sm'] },
          children: [{ type: 'text', value: diagram }]
        }
      ]
    }
  },
  mermaidConfig: {
    theme: 'default',
    securityLevel: 'loose',
    startOnLoad: false
  }
}

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

const renderMarkdown = async (message: string) => {
  if (!message) return ''

  try {
    // 正则匹配提取 <think></think> 标签中的内容
    const thinkReg = `/<think>(.*?)</think >/gs`
    const parts = message.split(thinkReg)

    // 处理每个部分
    const htmlParts = await Promise.all(parts.map(async (part, index) => {
      if (index % 2 === 1) {
        // 奇数索引部分是 <think> 标签中的内容
        const content = part.trim()
        if (content) {
          // 处理思考过程中的 Markdown
          const thinkHtml = await processor.process(content)
          return `<details><summary>思考过程</summary><div class="think">${thinkHtml.toString()}</div></details>`
        } else {
          return ''
        }
      } else {
        // 偶数索引部分是普通 Markdown 内容
        const result = await processor.process(part)
        return result.toString()
      }
    }))

    // 合并所有部分
    return htmlParts.join('')
  } catch (error) {
    console.error('Markdown rendering error:', error)
    return `<div class="text-red-500">Error rendering markdown: ${error.message}</div>`
  }
}

// 创建响应式变量存储渲染后的HTML
const renderedHTML = ref('')

// 监听消息变化，重新渲染Markdown
watch(() => props.message, async (newMessage) => {
  if (newMessage) {
    renderedHTML.value = await renderMarkdown(newMessage)
  } else {
    renderedHTML.value = ''
  }
}, { immediate: true })
</script>

<template>
  <div v-if="message == ''"
    class="bg-white dark:bg-[#404558] dark:text-white rounded-lg p-2 flex items-center w-[110px] justify-center">
    <LoaderCircle class="animate-spin w-4 h-4"></LoaderCircle>
    <span class="ml-2 text-[14px]">思考中...</span>
  </div>
  <div v-else class="flex pb-4" :class="role === 'user' ? 'flex-row-reverse' : ''">
    <!-- <Avatar>
      <AvatarImage 
        :src="role === 'user' 
          ? 'https://github.com/shadcn.png' 
          : 'https://github.com/radix-vue.png'" 
        :alt="role === 'user' ? '@user' : '@ai'" 
      />
      <AvatarFallback>{{ role === 'user' ? 'U' : 'AI' }}</AvatarFallback>
    </Avatar> -->

    <div class="flex flex-col max-w-[80%]">
      <!-- <div class="text-sm text-muted-foreground">
        {{ role === 'user' ? '用户' : 'AI助手' }}
      </div> -->
      <div class="rounded-lg px-4 py-2 list-disc text-[14px]" :class="role === 'user'
    ? 'bg-primary text-primary-foreground'
    : 'bg-gray-100 dark:bg-primary-foreground dark:text-white'" v-html="renderedHTML">
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

.think {
  font-style: italic;
  color: #555;
  font-size: 14px;
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
</style>