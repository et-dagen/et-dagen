<script setup lang="ts">
  import { ArrowLeft, Save } from '@lucide/vue'
  import FieldError from '@/components/form/FieldError.vue'
  import PortraitField from '@/components/admin/form/PortraitField.vue'
  import { Button } from '@/components/ui/button'
  import { Checkbox } from '@/components/ui/checkbox'
  import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
  } from '@/components/ui/form'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { useResourceForm } from '@/composables/admin/useResourceForm'
  import { alertError } from '@/composables/useAlerts'
  import {
    BoardMemberForm,
    toMemberBody,
    type ListedMember,
  } from '@/contracts/board'

  const props = defineProps<{
    id?: string
    initial: Partial<BoardMemberForm>
    photo?: string | null
  }>()

  const { t } = useI18n()
  const localePath = useLocalePath()
  const photoFile = ref<File | null>(null)

  const uploadPhoto = async (id: string, file: File) => {
    const body = new FormData()
    body.append('file', file)
    await $fetch(`/api/v1/board/${id}/photo`, { method: 'PUT', body })
  }

  const { submit, saving } = useResourceForm({
    schema: BoardMemberForm,
    initial: props.initial,
    back: '/admin/board',
    saved: () =>
      t(props.id ? 'admin.board.form.updated' : 'admin.board.form.created'),
    save: async (values) => {
      const body = toMemberBody(values)
      if (props.id) {
        await $fetch(`/api/v1/board/${props.id}`, { method: 'PUT', body })
        if (photoFile.value) await uploadPhoto(props.id, photoFile.value)
        return props.id
      }

      const { id } = await $fetch<ListedMember>('/api/v1/board', {
        method: 'POST',
        body,
      })
      // the member exists now: report a failed portrait, but do not save the member twice
      try {
        if (photoFile.value) await uploadPhoto(id, photoFile.value)
      } catch (error) {
        alertError(error)
      }
      return id
    },
  })
</script>

<template>
  <form class="flex max-w-3xl flex-col gap-6" novalidate @submit="submit">
    <NuxtLink
      :to="localePath('/admin/board')"
      class="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      {{ $t('admin.board.name') }}
    </NuxtLink>
    <h1
      class="text-2xl leading-8 font-extrabold tracking-tight lg:text-[2rem] lg:leading-10"
    >
      {{
        $t(id ? 'admin.board.form.edit_title' : 'admin.board.form.new_title')
      }}
    </h1>

    <div class="grid gap-5 rounded-lg border bg-card p-4 lg:grid-cols-2 lg:p-6">
      <div class="flex flex-col gap-2 lg:col-span-2">
        <Label>{{ $t('admin.board.form.photo') }}</Label>
        <PortraitField v-model="photoFile" :current="photo" />
      </div>

      <FormField v-slot="{ componentField }" name="name">
        <FormItem class="lg:col-span-2">
          <FormLabel>{{ $t('admin.board.form.name') }}</FormLabel>
          <FormControl>
            <Input v-bind="componentField" autocomplete="off" />
          </FormControl>
          <FieldError />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="titleNb">
        <FormItem>
          <FormLabel>{{ $t('admin.board.form.title_nb') }}</FormLabel>
          <FormControl>
            <Input v-bind="componentField" placeholder="Leder" />
          </FormControl>
          <FieldError />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="titleEn">
        <FormItem>
          <FormLabel>{{ $t('admin.board.form.title_en') }}</FormLabel>
          <FormControl>
            <Input v-bind="componentField" placeholder="Manager" />
          </FormControl>
          <FieldError />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="email">
        <FormItem>
          <FormLabel>{{ $t('admin.board.form.email') }}</FormLabel>
          <FormControl>
            <Input type="email" v-bind="componentField" autocomplete="off" />
          </FormControl>
          <FieldError />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="phone">
        <FormItem>
          <FormLabel>{{ $t('admin.board.form.phone') }}</FormLabel>
          <FormControl>
            <Input
              type="tel"
              v-bind="componentField"
              placeholder="+47 400 00 000"
              autocomplete="off"
            />
          </FormControl>
          <FieldError />
        </FormItem>
      </FormField>

      <FormField
        v-slot="{ value, handleChange }"
        name="featured"
        type="checkbox"
      >
        <FormItem class="flex items-start gap-3 lg:col-span-2">
          <FormControl>
            <Checkbox
              :model-value="value"
              class="mt-0.5"
              @update:model-value="handleChange"
            />
          </FormControl>
          <div>
            <FormLabel>{{ $t('admin.board.form.featured') }}</FormLabel>
            <p class="text-sm text-muted-foreground">
              {{ $t('admin.board.form.featured_hint') }}
            </p>
          </div>
        </FormItem>
      </FormField>
    </div>

    <div class="flex flex-wrap gap-3">
      <Button type="submit" :disabled="saving">
        <Save aria-hidden="true" />
        {{ $t(id ? 'admin.board.form.save' : 'admin.board.form.create') }}
      </Button>
      <Button as-child variant="outline">
        <NuxtLink :to="localePath('/admin/board')">
          {{ $t('admin.list.cancel') }}
        </NuxtLink>
      </Button>
    </div>
  </form>
</template>
