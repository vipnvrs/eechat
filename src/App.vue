<script setup lang="ts">
import HelloWorld from "./components/HelloWorld.vue"
import { onMounted } from "vue"
import Layout from "@/components/Layout.vue"
import { useModelStore } from "@/stores/model"
import { llmApi, ollamaApi } from "@/api/request"
import { LLMProvider, ModelProvider } from "@/types/llm"
const modelStore = useModelStore()

// 初始化模型配置
async function initModelConfig() {
  try {
    modelStore.isLoading = true

    // 1. 初始化本地模型提供商
    modelStore.initLocalProvider()

    // 2. 获取所有API提供商
    const providers = await llmApi.getProviders()

    // 3. 遍历处理每个提供商
    for (const [providerId, providerInfo] of Object.entries(providers) as [
      string,
      LLMProvider
    ][]) {
      // 获取提供商配置
      const config = await llmApi.getConfigProvider(providerId)

      // 获取该提供商的所有模型
      const models = await llmApi.getModels(providerId)

      // 构建提供商对象
      const provider: ModelProvider = {
        id: providerId,
        name: providerInfo.name || providerId,
        type: "api",
        // 使用服务端返回的状态
        state: providerInfo.state,
        models: models.map((model) => ({
          ...model,
          // 使用服务端返回的模型状态
          state: model.state,
        })),
        config: {
          apiKey: config?.api_key || "",
          baseUrl: config?.base_url || providerInfo.api_url || "",
        },
        description: providerInfo.description,
        icon: providerId,
      }

      // 更新到 store
      modelStore.setProvider(providerId, provider)
    }

    console.log(modelStore.providers)

    // 4. 获取本地模型配置
    const localModels = await ollamaApi.listModel()
    const modelsData = localModels.data.models
    if (modelsData?.length) {
      // 转换本地模型格式
      const formattedModels = modelsData.map((model) => ({
        id: model.name,
        name: model.name,
        provider_id: "local",
        group_name: "Local",
        state: true, // 本地模型默认启用
        type: "local",
        capabilities: ["chat", "completion"],
        from: "local",
      }))
      modelStore.updateLocalModels(formattedModels)
    }
  } catch (error) {
    console.log(error)

    modelStore.error = (error as Error).message
  } finally {
    modelStore.isLoading = false
  }
}
// 在应用启动时初始化
onMounted(() => {
  initModelConfig()
})
</script>

<template>
  <div class="h-full w-full overflow-hidden"><Layout></Layout></div>
</template>

<style>
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo.electron:hover {
  filter: drop-shadow(0 0 2em #9feaf9);
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
