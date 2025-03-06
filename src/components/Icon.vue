<template>
  <div>
    <div class="rounded-full bg-no-repeat object-contain bg-red-200flex items-center justify-center">
      <div class="flex items-center justify-center bg-slate-200 rounded-full overflow-hidden" :style="{
        width: props.size + 'px',
        height: props.size + 'px',
      }">
        <img class="block" v-if="props.name.length > 1" :src="src" alt="">
        <div v-else>{{ props.name }}</div>
      </div>
    </div>
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
