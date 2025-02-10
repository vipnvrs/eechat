<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Props {
  message: string
  role: string
}

defineProps<Props>()
</script>

<template>
  <div class="flex gap-3" :class="role === 'user' ? 'flex-row-reverse' : ''">
    <Avatar>
      <AvatarImage 
        :src="role === 'user' 
          ? 'https://github.com/shadcn.png' 
          : 'https://github.com/radix-vue.png'" 
        :alt="role === 'user' ? '@user' : '@ai'" 
      />
      <AvatarFallback>{{ role === 'user' ? 'U' : 'AI' }}</AvatarFallback>
    </Avatar>
    
    <div class="flex flex-col gap-2 max-w-[80%]">
      <div class="text-sm text-muted-foreground">
        {{ role === 'user' ? '用户' : 'AI助手' }}
      </div>
      <div class="rounded-lg p-3" 
        :class="role === 'user' 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted'">
        {{ message }}
      </div>
    </div>
  </div>
</template>