<script setup lang="ts">
  import { ImageUp, X } from '@lucide/vue'
  import { Button } from '@/components/ui/button'

  const props = defineProps<{ current?: string | null }>()
  const file = defineModel<File | null>({ default: null })

  const input = ref<HTMLInputElement>()
  const preview = ref<string | null>(null)
  watch(file, (chosen, _, onCleanup) => {
    if (!chosen) return (preview.value = null)
    preview.value = URL.createObjectURL(chosen)
    onCleanup(() => URL.revokeObjectURL(preview.value!))
  })
  const shown = computed(() => preview.value ?? props.current ?? null)

  const choose = (event: Event) => {
    file.value = (event.target as HTMLInputElement).files?.[0] ?? null
  }
</script>

<template>
  <div class="tw:flex tw:items-center tw:gap-4">
    <div
      class="tw:grid tw:size-20 tw:shrink-0 tw:place-items-center tw:overflow-hidden tw:rounded-md tw:border tw:bg-white"
    >
      <img
        v-if="shown"
        :src="shown"
        alt=""
        class="tw:size-full tw:object-contain"
      />
      <ImageUp
        v-else
        class="tw:size-6 tw:text-muted-foreground"
        aria-hidden="true"
      />
    </div>
    <div class="tw:flex tw:flex-col tw:gap-2">
      <input
        ref="input"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        class="tw:sr-only"
        :aria-label="$t('admin.companies.form.logo_choose')"
        @change="choose"
      />
      <div class="tw:flex tw:gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          @click="input?.click()"
        >
          <ImageUp aria-hidden="true" />
          {{
            $t(
              shown
                ? 'admin.companies.form.logo_replace'
                : 'admin.companies.form.logo_choose',
            )
          }}
        </Button>
        <Button
          v-if="file"
          type="button"
          variant="ghost"
          size="sm"
          @click="file = null"
        >
          <X aria-hidden="true" />
          {{ $t('admin.companies.form.logo_undo') }}
        </Button>
      </div>
      <p class="tw:text-sm tw:text-muted-foreground">
        {{ file ? file.name : $t('admin.companies.form.logo_hint') }}
      </p>
    </div>
  </div>
</template>
