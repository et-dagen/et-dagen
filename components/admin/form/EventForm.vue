<script setup lang="ts">
  import { ArrowLeft, Save } from '@lucide/vue'
  import { useProgrammes } from '@/composables/useProgrammes'
  import { STUDY_YEARS } from '@/lib/user/programmes'
  import EventTabs from '@/components/admin/EventTabs.vue'
  import FieldError from '@/components/form/FieldError.vue'
  import TextField from '@/components/form/TextField.vue'
  import RichText from '@/components/admin/form/RichText.vue'
  import SearchPicker from '@/components/admin/form/SearchPicker.vue'
  import { Button } from '@/components/ui/button'
  import { Checkbox } from '@/components/ui/checkbox'
  import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
  } from '@/components/ui/form'
  import { Input } from '@/components/ui/input'
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select'
  import { useHostCompanies } from '@/composables/admin/useHostCompanies'
  import { useResourceForm } from '@/composables/admin/useResourceForm'
  import { EventInput, toV1Event } from '@/contracts/event'

  const props = withDefaults(
    defineProps<{
      uid?: string
      initial: Record<string, unknown>
      /** The list the form returns to: the admin panel's or the company panel's */
      panel?: string
    }>(),
    { uid: undefined, panel: '/admin/events' },
  )

  const { t } = useI18n()
  const localePath = useLocalePath()

  const {
    allowed,
    choices: companyOptions,
    onlyChoice,
  } = await useHostCompanies({
    resource: 'event',
    uid: props.uid,
    current: props.initial.companyUID,
    first: [{ value: 'etdagene', label: 'E&T-dagene' }],
  })
  const panelName = computed(() =>
    props.panel.startsWith('/company/')
      ? 'company.admin.events.name'
      : 'admin.events.name',
  )
  const { programmes: listed, nameOf, codeOf } = await useProgrammes()
  const programmes = computed(() => listed.value.map(({ code }) => code))

  const { form, submit, saving } = useResourceForm({
    schema: EventInput,
    // an event from before codes stores names; pick the programmes they name
    initial: {
      ...props.initial,
      ...(Array.isArray(props.initial.programmes) && {
        programmes: (props.initial.programmes as string[]).map(codeOf),
      }),
    },
    back: props.panel,
    saved: () =>
      t(props.uid ? 'admin.events.form.updated' : 'admin.events.form.created'),
    save: async (values) => {
      const body = toV1Event(values)
      if (props.uid) {
        await $fetch('/api/v1/event', {
          method: 'PUT',
          body: { ...body, eventUID: props.uid },
        })
        return props.uid
      }
      await $fetch('/api/v1/event', { method: 'POST', body })
    },
  })
  // with one company to choose from, a new entry is for that company
  watchEffect(() => {
    if (onlyChoice.value && !form.values.companyUID)
      form.setFieldValue('companyUID', onlyChoice.value)
  })
  const signup = computed(() => form.values.signup === true)

  function toggle<T>(list: T[] | undefined, item: T) {
    return list?.includes(item)
      ? list.filter((i) => i !== item)
      : [...(list ?? []), item]
  }
</script>

<template>
  <p v-if="!allowed" class="tw:text-muted-foreground">
    {{ $t('admin.events.form.missing') }}
  </p>
  <form
    v-else
    class="tw:flex tw:max-w-3xl tw:flex-col tw:gap-6"
    novalidate
    @submit="submit"
  >
    <NuxtLink
      :to="localePath(panel)"
      class="tw:inline-flex tw:w-fit tw:items-center tw:gap-1 tw:text-sm tw:text-muted-foreground tw:hover:text-foreground"
    >
      <ArrowLeft class="tw:size-4" aria-hidden="true" />
      {{ $t(panelName) }}
    </NuxtLink>
    <h1
      class="tw:text-2xl tw:leading-8 tw:font-extrabold tw:tracking-tight tw:lg:text-[2rem] tw:lg:leading-10"
    >
      {{
        uid ? String(initial.title ?? '') : $t('admin.events.form.new_title')
      }}
    </h1>
    <EventTabs
      v-if="uid && initial.signup && panel === '/admin/events'"
      :uid="uid"
    />

    <section
      class="tw:grid tw:gap-5 tw:rounded-lg tw:border tw:bg-card tw:p-4 tw:lg:grid-cols-2 tw:lg:p-6"
    >
      <TextField
        name="title"
        :label="$t('admin.events.form.title')"
        class="tw:lg:col-span-2"
      />

      <FormField v-slot="{ componentField }" name="companyUID">
        <FormItem class="tw:lg:col-span-2">
          <FormLabel>{{ $t('admin.events.form.company') }}</FormLabel>
          <Select v-bind="componentField">
            <FormControl>
              <SelectTrigger class="tw:w-full">
                <SelectValue
                  :placeholder="$t('admin.events.form.choose_company')"
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem
                v-for="option in companyOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <FieldError />
        </FormItem>
      </FormField>

      <TextField
        name="start"
        :label="$t('admin.events.form.start')"
        type="datetime-local"
      />
      <TextField
        name="end"
        :label="$t('admin.events.form.end')"
        type="datetime-local"
      />

      <FormField v-slot="{ componentField }" name="location.name">
        <FormItem>
          <FormLabel>{{ $t('admin.events.form.place') }}</FormLabel>
          <FormControl>
            <Input v-bind="componentField" placeholder="EL5, Elektrobygget" />
          </FormControl>
          <p class="tw:text-sm tw:text-muted-foreground">
            {{ $t('admin.events.form.place_hint') }}
          </p>
          <FieldError />
        </FormItem>
      </FormField>

      <TextField
        name="location.map"
        :label="$t('admin.events.form.map')"
        type="url"
        placeholder="https://"
      />

      <FormField
        v-slot="{ value, handleChange, errorMessage }"
        name="description"
      >
        <FormItem class="tw:lg:col-span-2">
          <FormLabel>{{ $t('admin.events.form.description') }}</FormLabel>
          <FormControl>
            <RichText
              :model-value="value"
              :invalid="!!errorMessage"
              @update:model-value="handleChange"
            />
          </FormControl>
          <FieldError />
        </FormItem>
      </FormField>
    </section>

    <section
      class="tw:grid tw:gap-5 tw:rounded-lg tw:border tw:bg-card tw:p-4 tw:lg:grid-cols-2 tw:lg:p-6"
    >
      <FormField v-slot="{ value, handleChange }" name="signup" type="checkbox">
        <FormItem class="tw:flex tw:items-start tw:gap-3 tw:lg:col-span-2">
          <FormControl>
            <Checkbox
              :model-value="value"
              class="tw:mt-0.5"
              @update:model-value="handleChange"
            />
          </FormControl>
          <div>
            <FormLabel>{{ $t('admin.events.form.signup') }}</FormLabel>
            <p class="tw:text-sm tw:text-muted-foreground">
              {{ $t('admin.events.form.signup_hint') }}
            </p>
          </div>
        </FormItem>
      </FormField>

      <template v-if="signup">
        <FormField v-slot="{ componentField }" name="capacity">
          <FormItem class="tw:lg:col-span-2">
            <FormLabel>{{ $t('admin.events.form.capacity') }}</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="1"
                class="tw:max-w-40"
                v-bind="componentField"
              />
            </FormControl>
            <FieldError />
          </FormItem>
        </FormField>

        <TextField
          name="opens"
          :label="$t('admin.events.form.opens')"
          type="datetime-local"
        />
        <TextField
          name="closes"
          :label="$t('admin.events.form.closes')"
          type="datetime-local"
        />

        <FormField v-slot="{ value, handleChange }" name="years">
          <FormItem class="tw:lg:col-span-2">
            <FormLabel>{{ $t('admin.events.form.years') }}</FormLabel>
            <div class="tw:flex tw:flex-wrap tw:gap-2">
              <button
                v-for="year in STUDY_YEARS"
                :key="year"
                type="button"
                :aria-pressed="(value ?? []).includes(year)"
                class="tw:inline-flex tw:h-9 tw:min-w-16 tw:items-center tw:justify-center tw:rounded-md tw:border tw:bg-card tw:px-3 tw:pt-0.5 tw:text-sm tw:font-semibold tw:hover:bg-accent tw:aria-pressed:border-plate tw:aria-pressed:bg-plate tw:aria-pressed:text-plate-foreground"
                @click="handleChange(toggle(value, year))"
              >
                {{ $t('company.admin.year', { n: year }) }}
              </button>
            </div>
            <p class="tw:text-sm tw:text-muted-foreground">
              {{ $t('admin.events.form.requirements_hint') }}
            </p>
          </FormItem>
        </FormField>

        <FormField v-slot="{ value, handleChange }" name="programmes">
          <FormItem class="tw:lg:col-span-2">
            <FormLabel>{{ $t('admin.events.form.programmes') }}</FormLabel>
            <SearchPicker
              :model-value="value ?? []"
              :options="programmes"
              :label-of="nameOf"
              :placeholder="$t('admin.events.form.programmes_search')"
              @update:model-value="handleChange"
            />
          </FormItem>
        </FormField>
      </template>
    </section>

    <div class="tw:flex tw:flex-wrap tw:gap-3">
      <Button type="submit" :disabled="saving">
        <Save aria-hidden="true" />
        {{ $t(uid ? 'admin.events.form.save' : 'admin.events.form.create') }}
      </Button>
      <Button as-child variant="outline">
        <NuxtLink :to="localePath(panel)">
          {{ $t('admin.list.cancel') }}
        </NuxtLink>
      </Button>
    </div>
  </form>
</template>
