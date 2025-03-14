<template>
  <div class="flex items-center">
    <Avatar size="sm" class="overflow-hidden p-1 bg-slate-300 dark:bg-white dark:text-sidebar" :style="{
        height: props.size + 'px',
        width: props.size + 'px',
      }">
      <AvatarImage :src="src"></AvatarImage>
      <AvatarFallback>{{ props.name.charAt(0).toUpperCase() }}</AvatarFallback>
    </Avatar>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, defineProps, defineEmits } from 'vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
const emit = defineEmits()
const props = defineProps({
  name: {
    type: String,
    required: true,
    default: '',
  },
  size: {
    type: Number,
    default: 24,
  },
})

const baseUrl = 'https://registry.npmmirror.com/@lobehub/icons-static-svg/1.25.0/files/icons/'

const src = ref('')
watch(
  () => props.name, val => {
    src.value = baseUrl + val + '.svg'
  }, {
  immediate: true,
},)

// onMounted(() => {
//   //console.log('onMounted')
// })
</script>

<style scoped></style>
