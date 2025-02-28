// src/stores/ollama.ts
import { defineStore } from 'pinia'

interface DownloadState {
  downloadStatus: {
    [key: string]: {
      completed: number
      total: number
      percent: number
      speed: number
      status: string
    }
  }
}

export const useOllamaStore = defineStore('ollama', {
  state: (): DownloadState => ({
    downloadStatus: {},
  }),

  actions: {
    updateDownloadStatus(
      modelName: string,
      status: {
        completed: number
        total: number
        percent: number
        speed: number
        status: string
      },
    ) {
      this.downloadStatus[modelName] = status
    },

    clearDownloadStatus(modelName: string) {
      delete this.downloadStatus[modelName]
    },
  },

  getters: {
    getDownloadStatus: state => {
      return (modelName: string) => state.downloadStatus[modelName]
    },
    isDownloading: state => {
      return (modelName: string) => !!state.downloadStatus[modelName]
    },
  },
})
