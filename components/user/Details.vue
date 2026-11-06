<script setup lang="ts">
  import { FileText, Pencil, Upload } from '@lucide/vue'
  import DeleteAccount from '@/components/user/DeleteAccount.vue'
  import { alertError, notify } from '@/composables/useAlerts'
  import { useAuthStore } from '@/stores/authStore'
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from '@/components/ui/alert-dialog'
  import { Button } from '@/components/ui/button'
  import { dietLabel } from '@/lib/forms/diet'

  const auth = useAuthStore()
  const localePath = useLocalePath()
  const { t } = useI18n()

  const user = computed(() => auth.user)
  const restrictions = computed<string[]>(() =>
    Object.values(user.value?.dietaryRestrictions ?? {}),
  )
  const restrictionName = (value: string) => dietLabel(value, t)

  const studies = computed(() =>
    [
      user.value?.studyProgram,
      user.value?.currentYear &&
        t('user.page.year', { n: user.value.currentYear }),
    ]
      .filter(Boolean)
      .join(' · '),
  )

  const fileName = computed(
    () => user.value?.resume?.split('/').pop()?.split('?')[0] ?? '',
  )

  const busy = ref(false)
  const picker = useTemplateRef<HTMLInputElement>('picker')

  const upload = async (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file || !auth.user) return
    const body = new FormData()
    body.append('file', file)
    body.append('userUID', auth.user.uid)
    busy.value = true
    try {
      const link = await $fetch<string>('/api/v1/resume', {
        method: 'POST',
        body,
      })
      auth.user = { ...auth.user, resume: link }
      notify(t('user.page.resume_uploaded'), 'success')
    } catch (error) {
      alertError(error)
    } finally {
      busy.value = false
      input.value = ''
    }
  }

  const remove = async () => {
    if (!auth.user) return
    busy.value = true
    try {
      await $fetch('/api/v1/resume', {
        method: 'DELETE',
        body: { userUID: auth.user.uid },
      })
      auth.user = { ...auth.user, resume: '' }
      notify(t('user.page.resume_deleted'), 'success')
    } catch (error) {
      alertError(error)
    } finally {
      busy.value = false
    }
  }
</script>

<template>
  <div class="rounded-lg border bg-card">
    <section aria-labelledby="profil-title" class="p-5 sm:px-6">
      <div class="flex items-center justify-between gap-3">
        <h3 id="profil-title" class="font-extrabold">
          {{ $t('user.page.profile') }}
        </h3>
        <Button as-child variant="outline" size="sm">
          <NuxtLink :to="localePath('/user/edit')">
            <Pencil aria-hidden="true" />
            {{ $t('user.page.edit') }}
          </NuxtLink>
        </Button>
      </div>
      <p class="mt-2 text-lg font-bold">{{ user?.name }}</p>
      <p class="text-sm break-all text-muted-foreground">
        {{ user?.email }}
      </p>
      <p v-if="studies" class="mt-1 text-sm text-muted-foreground">
        {{ studies }}
      </p>
    </section>

    <section aria-labelledby="allergier-title" class="border-t p-5 sm:px-6">
      <div class="flex items-center justify-between gap-3">
        <h3 id="allergier-title" class="font-extrabold">
          {{ $t('user.page.allergies') }}
        </h3>
        <Button as-child variant="outline" size="sm">
          <NuxtLink :to="localePath('/user/edit')">
            <Pencil aria-hidden="true" />
            {{ $t('user.page.edit') }}
          </NuxtLink>
        </Button>
      </div>
      <ul v-if="restrictions.length" class="mt-3 flex flex-wrap gap-2">
        <li
          v-for="restriction in restrictions"
          :key="restriction"
          class="rounded-full border px-3 pt-1 pb-0.5 text-sm font-bold"
        >
          {{ restrictionName(restriction) }}
        </li>
      </ul>
      <p v-else class="mt-2 text-sm text-muted-foreground">
        {{ $t('user.page.no_allergies') }}
      </p>
    </section>

    <section aria-labelledby="cv-title" class="border-t p-5 sm:px-6">
      <div class="flex items-center justify-between gap-3">
        <h3 id="cv-title" class="font-extrabold">
          {{ $t('user.resume.resume') }}
        </h3>
        <div class="flex gap-2">
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
          <AlertDialog v-if="user?.resume">
            <AlertDialogTrigger as-child>
              <Button variant="outline" size="sm" :disabled="busy">
                {{ $t('user.page.remove') }}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent class="rounded-md bg-card">
              <AlertDialogHeader>
                <AlertDialogTitle class="text-lg font-bold">
                  {{ $t('user.page.resume_delete_title') }}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {{ $t('user.page.resume_delete_text') }}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{{
                  $t('user.page.cancel')
                }}</AlertDialogCancel>
                <AlertDialogAction @click="remove">
                  {{ $t('user.page.resume_delete') }}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <input
          ref="picker"
          type="file"
          accept="application/pdf"
          class="sr-only"
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
        class="mt-3 flex min-w-0 items-center gap-2 font-bold underline decoration-border decoration-2 underline-offset-4 hover:decoration-brand"
      >
        <FileText class="size-5 shrink-0 text-brand" aria-hidden="true" />
        <span class="truncate">{{ fileName }}</span>
      </a>
      <p v-else class="mt-2 text-sm text-muted-foreground">
        {{ $t('user.page.no_resume') }}
      </p>
    </section>

    <DeleteAccount class="border-t p-5 sm:px-6" />
  </div>
</template>
