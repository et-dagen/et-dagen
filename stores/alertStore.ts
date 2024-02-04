export const alertTypes = [
  'error',
  'info',
  'success',
  'warning',
  undefined,
] as const
export type AlertType = (typeof alertTypes)[number]

export interface Alert {
  show: boolean
  type: AlertType
  message: string
}

export const useAlertStore = defineStore('alert', {
  state: (): Alert => {
    return {
      type: undefined,
      message: 'Default message',
      show: false,
    }
  },
  actions: {
    alert(message: string = 'Default message', type: AlertType = undefined) {
      console.info('Alert:', type, message)
      this.type = type
      this.message = message
      this.show = true
    },
    clear() {
      this.type = undefined
      this.message = 'Default message'
      this.show = false
    },
  },
})
