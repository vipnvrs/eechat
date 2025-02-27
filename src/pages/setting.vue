<script setup lang="ts">
import SidebarSetting from '@/components/setting/SidebarSetting.vue'
import LocalModel from '@/components/setting/LocalModel.vue'
import { ref, markRaw } from 'vue';

const activeMenu = ref({
  label: '本地模型',
  icon: 'HardDrive',
  key: 'LocalModel',
  component: markRaw(LocalModel),
})

const handleChange = e => {
  console.log('change', e)
  activeMenu.value = e
}
</script>

<template>
  <div class="flex relative">
    <SidebarSetting @change="handleChange"></SidebarSetting>
    <div class="md:w-[60%] sm:w-full sm:px-4 mx-auto h-[100vh] max-[100vh] flex flex-col overflow-hidden">
      <div class="font-bold py-6">{{activeMenu.label  }}</div>
      <component class="flex-1" :is="activeMenu.component"></component>
    </div>
  </div>
</template>
