<script setup lang="ts">
import { ref, reactive } from "vue"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const serverPath = ref("../server")
const resStr = ref("")
const handleClickStart = async () => {
  console.log("handleClickStart")
  const res = await window.ipcRenderer.invoke("startEggServer", serverPath.value)
  console.log(res)
  resStr.value = res
}
const handleClickStop = async () => {
  console.log("handleClickStop")
  try {
    const res = await window.ipcRenderer.invoke("stopEggServer")
    resStr.value = res
  } catch (error) {
    resStr.value = JSON.stringify(error)
  }
}
</script>

<template>
  <div class="h-full space-y-6">
    <div>for dev playground</div>
    <div class="flex flex-col space-y-6">
      <Input v-model="serverPath"></Input>
      <div class="flex space-x-2">
        <Button @click="handleClickStart">startEggServer</Button>
        <Button @click="handleClickStop">stopEggServer</Button>
      </div>
      <div class="res">
        {{ resStr }}
      </div>
    </div>
  </div>
</template>

<style scoped></style>
