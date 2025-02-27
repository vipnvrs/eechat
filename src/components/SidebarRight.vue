<script setup lang="ts">
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { SquarePen } from 'lucide-vue-next'
import { reactive } from 'vue'
import { watch } from 'vue'

const formData = reactive({
  title: '',
  systemPrompt: 'you are a helpful assistant',
  temperature: [0.6],
  top_p: [1],
  presence_penalty: [0],
  frequency_penalty: [0],
})

const props = defineProps({
  activeSession: Object,
})

watch(
  () => props.activeSession,
  session => {
    if (session) {
      formData.title = session.title
    }
  },
  { deep: true },
)

const handleSubmit = () => {
  console.log('Form submitted!', formData)
}
</script>

<template>
  <Sidebar side="right" class="p-2">
    <SidebarHeader>对话设置</SidebarHeader>
    <SidebarContent>
      <form class="p-2 space-y-8">
        <!-- <FormField name="title"> -->
        <div class="grid gap-2">
          <Label>对话名称</Label>
          <Input type="text" placeholder="shadcn" v-model="formData.title" />
        </div>
        <!-- </FormField> -->
        <div class="grid gap-2">
          <Label class="flex justify-between items-center">
            <span> 
              <span>系统提示</span>
              <Badge variant="outline">角色设定</Badge>
            </span>
            <Button variant="ghost" size="icon">
              <SquarePen></SquarePen>
            </Button>
          </Label>
          <Textarea
            type="text"
            placeholder="shadcn"
            v-model="formData.systemPrompt"
          />
        </div>
        <div class="grid gap-2">
          <Label>创意活跃度 <Badge variant="outline">temperature</Badge></Label>
          <div class="flex">
            <Slider
              v-model="formData.temperature"
              :default-value="[0.6]"
              :max="1"
              :min="0"
              :step="0.01"
            />
            <Input class="w-14 ml-2" v-model="formData.temperature[0]"></Input>
          </div>
        </div>
        <div class="grid gap-2">
          <Label>思维开放度 <Badge variant="outline">top_p</Badge></Label>
          <div class="flex">
            <Slider
              v-model="formData.top_p"
              :default-value="[1]"
              :max="1"
              :min="0"
              :step="0.01"
            />
            <Input class="w-14 ml-2" v-model="formData.top_p[0]"></Input>
          </div>
        </div>
        <div class="grid gap-2">
          <Label
            >表述发散度 <Badge variant="outline">presence_penalty</Badge></Label
          >
          <div class="flex">
            <Slider
              v-model="formData.presence_penalty"
              :default-value="[0]"
              :max="2"
              :min="-2.0"
              :step="0.01"
            />
            <Input
              class="w-14 ml-2"
              v-model="formData.presence_penalty[0]"
            ></Input>
          </div>
        </div>
        <div class="grid gap-2">
          <Label
            >词汇丰富度
            <Badge variant="outline">frequency_penalty</Badge></Label
          >
          <div class="flex">
            <Slider
              v-model="formData.frequency_penalty"
              :default-value="[0]"
              :max="2.0"
              :min="-2.0"
              :step="0.01"
            />
            <Input
              class="w-14 ml-2"
              v-model="formData.frequency_penalty[0]"
            ></Input>
          </div>
        </div>
        <!-- <Button type="submit"> Submit </Button> -->
      </form>
    </SidebarContent>
    <SidebarFooter
      ><Button type="submit" @click="handleSubmit">
        保存设置
      </Button></SidebarFooter
    >
  </Sidebar>
</template>
