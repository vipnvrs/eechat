module.exports = {
  deepseek: [
    {
      id: 'deepseek-chat',
      provider: 'deepseek',
      name: 'DeepSeek Chat',
      group: 'DeepSeek Chat',
    },
    {
      id: 'deepseek-reasoner',
      provider: 'deepseek',
      name: 'DeepSeek Reasoner',
      group: 'DeepSeek Reasoner',
    },
  ],
  ollama: [],
  openai: [
    {
      id: 'gpt-4.5-preview',
      provider: 'openai',
      name: ' gpt-4.5-preview',
      group: 'gpt-4.5',
    },
    { id: 'gpt-4o', provider: 'openai', name: ' GPT-4o', group: 'GPT 4o' },
    {
      id: 'gpt-4o-mini',
      provider: 'openai',
      name: ' GPT-4o-mini',
      group: 'GPT 4o',
    },
    { id: 'o1-mini', provider: 'openai', name: ' o1-mini', group: 'o1' },
    { id: 'o1-preview', provider: 'openai', name: ' o1-preview', group: 'o1' },
  ],
}

// export const TEXT_TO_IMAGES_MODELS = [
//   {
//     id: 'black-forest-labs/FLUX.1-schnell',
//     provider: 'silicon',
//     name: 'FLUX.1 Schnell',
//     group: 'FLUX',
//   },
//   {
//     id: 'black-forest-labs/FLUX.1-dev',
//     provider: 'silicon',
//     name: 'FLUX.1 Dev',
//     group: 'FLUX',
//   },
//   {
//     id: 'black-forest-labs/FLUX.1-pro',
//     provider: 'silicon',
//     name: 'FLUX.1 Pro',
//     group: 'FLUX',
//   },
//   {
//     id: 'Pro/black-forest-labs/FLUX.1-schnell',
//     provider: 'silicon',
//     name: 'FLUX.1 Schnell Pro',
//     group: 'FLUX',
//   },
//   {
//     id: 'LoRA/black-forest-labs/FLUX.1-dev',
//     provider: 'silicon',
//     name: 'FLUX.1 Dev LoRA',
//     group: 'FLUX',
//   },
//   {
//     id: 'deepseek-ai/Janus-Pro-7B',
//     provider: 'silicon',
//     name: 'Janus-Pro-7B',
//     group: 'deepseek-ai',
//   },
//   {
//     id: 'stabilityai/stable-diffusion-3-5-large',
//     provider: 'silicon',
//     name: 'Stable Diffusion 3.5 Large',
//     group: 'Stable Diffusion',
//   },
//   {
//     id: 'stabilityai/stable-diffusion-3-5-large-turbo',
//     provider: 'silicon',
//     name: 'Stable Diffusion 3.5 Large Turbo',
//     group: 'Stable Diffusion',
//   },
//   {
//     id: 'stabilityai/stable-diffusion-3-medium',
//     provider: 'silicon',
//     name: 'Stable Diffusion 3 Medium',
//     group: 'Stable Diffusion',
//   },
//   {
//     id: 'stabilityai/stable-diffusion-2-1',
//     provider: 'silicon',
//     name: 'Stable Diffusion 2.1',
//     group: 'Stable Diffusion',
//   },
//   {
//     id: 'stabilityai/stable-diffusion-xl-base-1.0',
//     provider: 'silicon',
//     name: 'Stable Diffusion XL Base 1.0',
//     group: 'Stable Diffusion',
//   },
// ]
