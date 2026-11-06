<script setup lang="ts">
  import FieldError from '@/components/form/FieldError.vue'
  import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
  } from '@/components/ui/form'
  import { Input } from '@/components/ui/input'

  /**
   * A labelled text field of a vee-validate form, with its hint and error. `class` sets the
   * field's place in the form's grid; other attributes, such as `type` or `autocomplete`, go to
   * the input.
   */
  defineOptions({ inheritAttrs: false })
  const attrs = useAttrs()
  const inputAttrs = computed(() =>
    Object.fromEntries(
      Object.entries(attrs).filter(([key]) => key !== 'class'),
    ),
  )
  defineProps<{
    name: string
    label: string
    hint?: string
    variant?: 'default' | 'public'
  }>()
</script>

<template>
  <FormField v-slot="{ componentField }" :name="name">
    <FormItem :class="attrs.class">
      <FormLabel>{{ label }}</FormLabel>
      <FormControl>
        <Input
          v-bind="{ ...inputAttrs, ...componentField }"
          :variant="variant"
        />
      </FormControl>
      <FormDescription v-if="hint">{{ hint }}</FormDescription>
      <FieldError />
    </FormItem>
  </FormField>
</template>
