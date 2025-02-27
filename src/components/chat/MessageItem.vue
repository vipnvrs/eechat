<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { LoaderCircle} from 'lucide-vue-next'
// @ts-ignore
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
// @ts-ignore
import markdownItDeflist from 'markdown-it-deflist'
import { ref } from 'vue'

interface Props {
  message: string
  role: string
}

defineProps<Props>()

// 修改 markdown-it 配置
const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
  typographer: true,
  highlight: function (str:string, lang:string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre><code class="hljs w-[660px] text-[13px] leading-[1.6] rounded">' +
               hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
               '</code></pre>';
      } catch (__) {}
    }
    return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>';
  }
}).use(markdownItDeflist)  // 使用 ES 模块方式

const renderMarkdown = (message: string) => {
  if(!message) return ''
  // 正则匹配提取 <think></think> 标签中的内容
  const thinkReg = /<think>(.*?)<\/think>/gs
  const parts = message.split(thinkReg)

  // 处理每个部分
  const htmlParts = parts.map((part, index) => {
    if (index % 2 === 1) {
      // 奇数索引部分是 <think> 标签中的内容
      const content = part.trim()
      if (content) {
        return `<details><summary>思考过程</summary><div class="think">${content}</div></details>`
      } else {
        return ''
      }
    } else {
      // 偶数索引部分是普通 Markdown 内容
      return md.render(part)
    }
  })

  // 合并所有部分
  return htmlParts.join('')
}
</script>

<template>
   <div v-if="message == ''" class="bg-white dark:bg-[#404558] dark:text-white rounded-lg p-2 flex items-center w-[110px] justify-center">
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
      <div class="rounded-lg px-4 py-2 list-disc text-[14px]"
        :class="role === 'user' 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-white dark:bg-[#404558] dark:text-white'"
        v-html="renderMarkdown(message)">
      </div>
    </div>
  </div>
</template>

<style scoped>
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

/* 暗黑模式支持 */
:root[class~="dark"] ol li:before {
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
</style>