import { toast } from 'vue-sonner'

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
/**
 * Short feedback after an action, shown as a toast
 *
 * @remarks
 * The store keeps its old shape so existing callers do not change; the toasts themselves are
 * rendered by vue-sonner in `components/common/Alert.vue`.
 */
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
      this.type = type
      this.message = message
      this.show = true
      // toasts only exist in the browser
      if (import.meta.server) return
      if (type) toast[type](message)
      else toast(message)
    },
    clear() {
      this.type = undefined
      this.message = 'Default message'
      this.show = false
      if (import.meta.client) toast.dismiss()
    },
  },
})
