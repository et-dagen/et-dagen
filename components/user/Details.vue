<script setup lang="ts">
  import { FileText, Pencil, Trash2, Upload } from '@lucide/vue'
  import { Button } from '@/components/ui/button'
  import { dietaryFlags } from '~/config/app.config'

  const auth = useAuthStore()
  const localePath = useLocalePath()
  const { te, t } = useI18n()

  const user = computed(() => auth.user)
  const restrictions = computed<string[]>(() =>
    Object.values(user.value?.dietaryRestrictions ?? {}),
  )
  const known = new Set(dietaryFlags.map((flag) => flag.name))
  const restrictionName = (value: string) =>
    known.has(value) && te(`dietary_restrictions.${value}`)
      ? t(`dietary_restrictions.${value}`)
      : value

  const fileName = computed(
    () => user.value?.resume?.split('/').pop()?.split('?')[0] ?? '',
  )

  const busy = ref(false)
  const picker = useTemplateRef<HTMLInputElement>('picker')

  // the auth store holds the résumé link, so a reload shows the change
  const upload = async (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file || !user.value) return
    const body = new FormData()
    body.append('file', file)
    body.append('userUID', user.value.uid)
    busy.value = true
    try {
      await $fetch('/api/v1/resume', { method: 'POST', body })
      location.reload()
    } catch (error) {
      alertError(error)
      busy.value = false
    }
  }

  const remove = async () => {
    if (!user.value) return
    busy.value = true
    try {
      await $fetch('/api/v1/resume', {
        method: 'DELETE',
        body: { userUID: user.value.uid },
      })
      location.reload()
    } catch (error) {
      alertError(error)
      busy.value = false
    }
  }
</script>

<template>
  <div class="tw:grid tw:gap-4 tw:md:grid-cols-3">
    <section
      id="profil"
      aria-labelledby="profil-title"
      class="tw:flex tw:scroll-mt-24 tw:flex-col tw:rounded-lg tw:border tw:bg-card tw:p-5"
    >
      <div class="tw:flex tw:items-center tw:justify-between tw:gap-3">
        <h3 id="profil-title" class="tw:font-bold">
          {{ $t('user.page.profile') }}
        </h3>
        <Button as-child variant="outline" size="sm">
          <NuxtLink :to="localePath('/user/edit')">
            <Pencil aria-hidden="true" />
            {{ $t('user.page.edit') }}
          </NuxtLink>
        </Button>
      </div>
      <p class="tw:mt-4 tw:text-lg tw:font-extrabold">{{ user?.name }}</p>
      <p class="tw:text-sm tw:break-all tw:text-muted-foreground">
        {{ user?.email }}
      </p>
      <p
        v-if="user?.studyProgram"
        class="tw:mt-2 tw:text-sm tw:text-muted-foreground"
      >
        {{ user.studyProgram }}
        <template v-if="user.currentYear">
          · {{ $t('user.page.year', { n: user.currentYear }) }}
        </template>
      </p>
    </section>

    <section
      id="cv"
      aria-labelledby="cv-title"
      class="tw:flex tw:scroll-mt-24 tw:flex-col tw:rounded-lg tw:border tw:bg-card tw:p-5"
    >
      <div class="tw:flex tw:items-center tw:justify-between tw:gap-3">
        <h3 id="cv-title" class="tw:font-bold">
          {{ $t('user.resume.resume') }}
        </h3>
        <div class="tw:flex tw:gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="busy"
            @click="picker?.click()"
          >
            <Upload aria-hidden="true" />
            {{
              user?.resume ? $t('user.page.replace') : $t('user.page.upload')
            }}
          </Button>
          <Button
            v-if="user?.resume"
            variant="outline"
            size="sm"
            :disabled="busy"
            :aria-label="$t('user.resume.delete_resume')"
            @click="remove"
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
        <input
          ref="picker"
          type="file"
          accept="application/pdf"
          class="tw:sr-only"
          tabindex="-1"
          aria-hidden="true"
          @change="upload"
        />
      </div>
      <a
        v-if="user?.resume"
        :href="`/api/v1/resume/file?userUID=${user.uid}`"
        target="_blank"
        rel="noopener"
        class="tw:mt-4 tw:flex tw:min-w-0 tw:items-center tw:gap-2 tw:font-bold tw:underline tw:decoration-border tw:decoration-2 tw:underline-offset-4 tw:hover:decoration-brand"
      >
        <FileText
          class="tw:size-5 tw:shrink-0 tw:text-brand"
          aria-hidden="true"
        />
        <span class="tw:truncate">{{ fileName }}</span>
      </a>
      <p v-else class="tw:mt-4 tw:text-sm tw:text-muted-foreground">
        {{ $t('user.page.no_resume') }}
      </p>
    </section>

    <section
      id="allergier"
      aria-labelledby="allergier-title"
      class="tw:flex tw:scroll-mt-24 tw:flex-col tw:rounded-lg tw:border tw:bg-card tw:p-5"
    >
      <div class="tw:flex tw:items-center tw:justify-between tw:gap-3">
        <h3 id="allergier-title" class="tw:font-bold">
          {{ $t('user.page.allergies') }}
        </h3>
        <Button as-child variant="outline" size="sm">
          <NuxtLink :to="localePath('/user/edit')">
            <Pencil aria-hidden="true" />
            {{ $t('user.page.edit') }}
          </NuxtLink>
        </Button>
      </div>
      <ul
        v-if="restrictions.length"
        class="tw:mt-4 tw:flex tw:flex-wrap tw:gap-2"
      >
        <li
          v-for="restriction in restrictions"
          :key="restriction"
          class="tw:rounded-full tw:border tw:px-3 tw:pt-1 tw:pb-0.5 tw:text-sm tw:font-bold"
        >
          {{ restrictionName(restriction) }}
        </li>
      </ul>
      <p v-else class="tw:mt-4 tw:text-sm tw:text-muted-foreground">
        {{ $t('user.page.no_allergies') }}
      </p>
    </section>
  </div>
</template>
