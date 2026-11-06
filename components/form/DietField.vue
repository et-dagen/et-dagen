<script setup lang="ts">
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { dietOf, typedOf } from '@/lib/forms/diet'
  import { dietaryFlags } from '~/config/app.config'

  defineProps<{ otherLabel: string }>()
  const diet = defineModel<string[]>({ default: () => [] })

  const KNOWN = dietaryFlags.map((flag) => flag.name)
  const chosen = computed(() =>
    diet.value.filter((restriction) => KNOWN.includes(restriction)),
  )
  const other = ref(typedOf(diet.value, KNOWN))
  const toggle = (flag: string) => {
    diet.value = dietOf(
      chosen.value.includes(flag)
        ? chosen.value.filter((restriction) => restriction !== flag)
        : [...chosen.value, flag],
      other.value,
    )
  }
  watch(other, (typed) => (diet.value = dietOf(chosen.value, typed)))
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="flag in KNOWN"
      :key="flag"
      type="button"
      :aria-pressed="diet.includes(flag)"
      class="inline-flex h-8 items-center rounded-md border bg-card px-2.5 pt-0.5 text-sm hover:bg-accent aria-pressed:border-plate aria-pressed:bg-plate aria-pressed:text-plate-foreground"
      @click="toggle(flag)"
    >
      {{ $t(`dietary_restrictions.${flag}`) }}
    </button>
  </div>
  <div class="flex flex-col gap-2">
    <Label for="diet-other">{{ otherLabel }}</Label>
    <Input id="diet-other" v-model="other" class="lg:w-1/2" />
  </div>
</template>
