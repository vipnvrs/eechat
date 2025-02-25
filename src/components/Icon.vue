<template>
  <div>
    <!-- <img :src="src" alt="" :width="props.size" :height="props.size" /> -->
    <!-- <AvatarImage :src="src" :alt="name" /> -->
    <Avatar :size="props.size">
      <AvatarImage :src="src" :alt="props.name" />
      <AvatarFallback>{{ props.name }}</AvatarFallback>
    </Avatar>
  </div>
</template>

<script setup>
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
const emit = defineEmits()
const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    default: 24,
  },
})
const baseUrl =
  'https://registry.npmmirror.com/@lobehub/icons-static-svg/1.25.0/files/icons/'
const src = baseUrl + props.name + '.svg'

// onMounted(() => {
//   //console.log('onMounted')
// })
</script>

<style scoped></style>
