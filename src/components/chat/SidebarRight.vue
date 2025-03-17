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
import { reactive, ref } from 'vue'
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import PromptEditor from '@/components/chat/PromptEditor.vue'
import { chatApi } from '@/api/request'
import { useToast } from '@/components/ui/toast/use-toast'

const { t } = useI18n()
const { toast } = useToast()

const formData = reactive({
  title: '',
  systemPrompt: 'you are a helpful assistant',
  temperature: [0.6],
  top_p: [1],
  presence_penalty: [0],
  frequency_penalty: [0],
})

const props = defineProps({
  activeSession: {
    type: Object,
    required: true
  }
})

watch(
  () => props.activeSession,
  async (session) => {
    if (session?.id) {
      try {
        const settings = await chatApi.getSettings(session.id)
        formData.title = settings.title
        formData.systemPrompt = settings.systemPrompt || 'You are a helpful assistant'
        formData.temperature = [settings.temperature ?? 0.6]
        formData.top_p = [settings.top_p ?? 1]
        formData.presence_penalty = [settings.presence_penalty ?? 0]
        formData.frequency_penalty = [settings.frequency_penalty ?? 0]
      } catch (error) {
        toast({
          variant: 'destructive',
          title: t('common.error'),
          description: (error as Error).message,
        })
      }
    }
  },
  { immediate: true, deep: true },
)

const handleSubmit = async () => {
  try {
    if (!props.activeSession?.id) {
      throw new Error('会话不存在')
    }
    
    await chatApi.updateSettings(props.activeSession.id, {
      title: formData.title,
      systemPrompt: formData.systemPrompt,
      temperature: formData.temperature,
      top_p: formData.top_p,
      presence_penalty: formData.presence_penalty,
      frequency_penalty: formData.frequency_penalty,
    })
    
    toast({
      title: t('common.success'),
      description: t('chat.settings.saveSuccess'),
    })
  } catch (error) {
    toast({
      variant: 'destructive',
      title: t('common.error'),
      description: (error as Error).message,
    })
  }
}

const isPromptEditorOpen = ref(false)

watch(
  () => props.activeSession,
  session => {
    if (session) {
      formData.title = session.title
    }
  },
  { deep: true },
)

const openPromptEditor = () => {
  isPromptEditorOpen.value = true
}

const savePrompt = (newPrompt: string) => {
  formData.systemPrompt = newPrompt
}
</script>

<template>
  <Sidebar side="right">
    <SidebarHeader class="p-4">{{ t('chat.settings.title') }}</SidebarHeader>
    <SidebarContent>
      <form class="p-4 space-y-8">
        <!-- <FormField name="title"> -->
        <div class="grid gap-2">
          <Label>{{ t('chat.settings.chatName') }}</Label>
          <Input type="text" placeholder="shadcn" v-model="formData.title" />
        </div>
        <!-- </FormField> -->
        <div class="grid gap-2">
          <Label class="flex justify-between items-center">
            <span> 
              <span>{{ t('chat.settings.systemPrompt') }}</span>
              <Badge variant="outline">{{ t('chat.settings.rolePrompt') }}</Badge>
            </span>
            <Button variant="ghost" size="icon" @click="openPromptEditor">
              <SquarePen></SquarePen>
            </Button>
          </Label>
          <Textarea
            type="text"
            placeholder=""
            v-model="formData.systemPrompt"
          />
        </div>
        <div class="grid gap-2">
          <Label>{{ t('chat.settings.creativity') }} <Badge variant="outline">temperature</Badge></Label>
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
          <Label>{{ t('chat.settings.openness') }} <Badge variant="outline">top_p</Badge></Label>
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
            >{{ t('chat.settings.expressiveness') }} <Badge variant="outline">presence_penalty</Badge></Label
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
            >{{ t('chat.settings.vocabulary') }}
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
        {{ t('chat.settings.saveSettings') }}
      </Button></SidebarFooter
    >
  </Sidebar>
  
  <PromptEditor 
    v-model:isOpen="isPromptEditorOpen"
    :initialPrompt="formData.systemPrompt"
    @save="savePrompt"
  />
</template>
