<script setup lang="ts">
  import { Check, X } from '@lucide/vue'
  import { Button } from '@/components/ui/button'
  import { Checkbox } from '@/components/ui/checkbox'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select'
  import { DEGREES } from '@/domain/fair/programme'
  import type { ProgrammeRow } from '@/lib/admin/programmes'

  /** A programme being added has no code yet; one being changed keeps its code */
  const props = defineProps<{ initial?: ProgrammeRow; busy: boolean }>()
  const emit = defineEmits<{ save: [programme: ProgrammeRow]; cancel: [] }>()

  const id = useId()
  const code = ref(props.initial?.code ?? '')
  const name = ref(props.initial?.name ?? '')
  const degree = ref(props.initial?.degree ?? 'bachelor')
  const open = ref(props.initial?.open ?? true)

  const save = () =>
    emit('save', {
      code: code.value.trim().toUpperCase(),
      name: name.value,
      degree: degree.value,
      open: open.value,
    })
</script>

<template>
  <form
    class="flex flex-col gap-4 bg-muted/40 p-4"
    @submit.prevent="save"
    @keydown.esc="emit('cancel')"
  >
    <div class="grid gap-4 sm:grid-cols-[10rem_1fr_14rem]">
      <div class="flex flex-col gap-2">
        <Label :for="`${id}-code`">{{
          $t('admin.fair.programmes.code')
        }}</Label>
        <Input
          :id="`${id}-code`"
          v-model="code"
          class="font-mono uppercase"
          :disabled="!!initial"
          required
          maxlength="20"
          autocapitalize="characters"
          spellcheck="false"
        />
      </div>
      <div class="flex flex-col gap-2">
        <Label :for="`${id}-name`">{{
          $t('admin.fair.programmes.name')
        }}</Label>
        <Input :id="`${id}-name`" v-model="name" required maxlength="120" />
      </div>
      <div class="flex flex-col gap-2">
        <Label :for="`${id}-degree`">
          {{ $t('admin.fair.programmes.degree') }}
        </Label>
        <Select v-model="degree">
          <SelectTrigger :id="`${id}-degree`" class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in DEGREES" :key="option" :value="option">
              {{ $t(`degree.${option}`) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <p class="text-sm text-muted-foreground">
      {{
        $t(
          initial
            ? 'admin.fair.programmes.code_kept'
            : 'admin.fair.programmes.code_hint',
        )
      }}
    </p>
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-2">
        <Checkbox :id="`${id}-open`" v-model="open" />
        <Label :for="`${id}-open`" class="font-normal">
          {{ $t('admin.fair.programmes.open') }}
        </Label>
      </div>
      <div class="flex gap-2 sm:ml-auto">
        <Button type="button" variant="ghost" @click="emit('cancel')">
          <X aria-hidden="true" />
          {{ $t('admin.fair.programmes.cancel') }}
        </Button>
        <Button type="submit" :disabled="busy || !name.trim() || !code.trim()">
          <Check aria-hidden="true" />
          {{ $t('admin.fair.programmes.save') }}
        </Button>
      </div>
    </div>
  </form>
</template>
