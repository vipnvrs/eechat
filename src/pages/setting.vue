<script setup lang="ts">
import SidebarSetting from "@/components/setting/SidebarSetting.vue"
import LocalModel from "@/components/setting/LocalModel.vue"
import ApiModel from "@/components/setting/ApiModel.vue"
import { ref, markRaw, onMounted } from "vue"
import { useRoute } from "vue-router"
import { useModelStore } from "@/stores/model"
import { ModelProvider } from "@/types/llm"

const route = useRoute()
const modelStore = useModelStore()

// 定义可用的菜单项
const menuItems = {
  LocalModel: {
    label: "本地模型",
    icon: "HardDrive",
    key: "LocalModel",
    component: markRaw(LocalModel),
    props: { providerId: "" },
  },
  ApiModel: {
    label: "API模型配置",
    icon: "Cloud",
    key: "ApiModel",
    component: markRaw(ApiModel),
    // 可以传递provider_id参数给组件
    props: { providerId: "" },
  },
}

const activeMenu = ref(menuItems.LocalModel)

const handleChange = (e) => {
  console.log("change", e)
  activeMenu.value = e
}

// 根据跳转参数跳转本地模型或API模型配置
onMounted(() => {
  const action = route.query.action as string
  if (action) {
    if (action.toLowerCase() === "local") {
      // 跳转到本地模型配置
      activeMenu.value = menuItems.LocalModel
    } else {
      // 跳转到API模型配置，并传递provider_id
      activeMenu.value = {
        ...menuItems.ApiModel,
        props: { providerId: action },
      }
    }
  }
})
</script>

<template>
  <div class="flex relative">
    <SidebarSetting @change="handleChange"></SidebarSetting>
    <div
      class="md:w-[60%] sm:w-full sm:px-4 mx-auto h-[100vh] max-[100vh] flex flex-col overflow-hidden"
    >
      <div class="font-bold text-2xl py-6">{{ activeMenu.label }}</div>
      <component
        class="flex-1"
        :is="activeMenu.component"
        v-bind="activeMenu.props || {}"
      ></component>
    </div>
  </div>
</template>
