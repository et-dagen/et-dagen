<script setup lang="ts">
  import { Monitor, Moon, Sun } from '@lucide/vue'
  import { Button } from '@/components/ui/button'
  import { useAdminTheme } from '@/composables/useAdminTheme'

  const { theme, next } = useAdminTheme()
  const icon = computed(
    () => ({ system: Monitor, light: Sun, dark: Moon })[theme.value],
  )
</script>

<template>
  <Button
    variant="ghost"
    size="icon"
    class="text-current hover:bg-white/15 hover:text-current"
    :aria-label="$t(`admin.shell.theme.${theme}`)"
    :title="$t(`admin.shell.theme.${theme}`)"
    @click="next"
  >
    <component :is="icon" class="size-5" />
  </Button>
</template>
