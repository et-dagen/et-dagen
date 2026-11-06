<script setup lang="ts">
  import { Eye, EyeOff } from '@lucide/vue'
  import { getErrorAlertContext } from '@/composables/useAlerts'
  import { requestPasswordReset, signinUser } from '@/composables/auth/session'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { EmailAddress } from '@/domain/email'
  import { errorFeedback } from '@/lib/errors/feedback'

  const { t } = useI18n()
  const step = ref<1 | 2>(1)
  const email = ref('')
  const password = ref('')
  const showPassword = ref(false)
  const pending = ref(false)
  const error = ref('')
  const notice = ref('')
  const resetting = ref(false)

  async function focus(id: string) {
    await nextTick()
    document.getElementById(id)?.focus()
  }

  // step 2 never depends on the address, so the page cannot tell anyone whether it has an account
  function next() {
    email.value = email.value.trim()
    if (!EmailAddress.is(email.value)) {
      error.value = t('signin.invalid_email')
      return focus('signin-email')
    }
    error.value = ''
    step.value = 2
  }

  function back() {
    step.value = 1
    password.value = ''
    error.value = ''
    notice.value = ''
  }

  // the steps swap with an out-in transition, so the field exists only after it enters
  const focusStep = () =>
    focus(step.value === 1 ? 'signin-email' : 'signin-password')

  async function submit() {
    if (!password.value) {
      error.value = t('errors.auth.missing-password')
      return focus('signin-password')
    }
    pending.value = true
    error.value = ''
    notice.value = ''
    try {
      await signinUser(email.value, password.value)
    } catch (cause) {
      error.value = getErrorAlertContext(cause).message
      await focus('signin-password')
    } finally {
      pending.value = false
    }
  }

  // only failures that say nothing about the account are shown; the rest get the same answer
  const SHOWN_RESET_ERRORS = [
    'errors.network.offline',
    'errors.auth.too-many-requests',
  ]

  async function forgot() {
    error.value = ''
    resetting.value = true
    try {
      await requestPasswordReset(email.value)
    } catch (cause) {
      const { key } = errorFeedback(cause, () => true)
      if (SHOWN_RESET_ERRORS.includes(key)) {
        error.value = getErrorAlertContext(cause).message
        return
      }
    } finally {
      resetting.value = false
    }
    notice.value = t('signin.reset_sent', { email: email.value })
  }
</script>

<template>
  <div class="rounded-lg border bg-card p-6 sm:p-8">
    <div class="mb-6 grid grid-cols-2 gap-1.5" aria-hidden="true">
      <span class="h-1 rounded-full bg-brand" />
      <span
        class="h-1 rounded-full bg-border transition-colors duration-300"
        :class="step === 2 && 'bg-brand'"
      />
    </div>
    <p class="sr-only" aria-live="polite">
      {{ $t('signin.step', { n: step }) }}
    </p>

    <Transition
      mode="out-in"
      enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
      enter-from-class="opacity-0 translate-x-2"
      leave-active-class="transition duration-100 motion-reduce:transition-none"
      leave-to-class="opacity-0"
      @after-enter="focusStep"
    >
      <form
        v-if="step === 1"
        key="email"
        novalidate
        class="flex flex-col gap-5"
        @submit.prevent="next"
      >
        <h1 class="text-3xl font-extrabold tracking-tight">
          {{ $t('signin.title') }}
        </h1>
        <div class="flex flex-col gap-2">
          <Label for="signin-email">{{ $t('signin.email') }}</Label>
          <Input
            id="signin-email"
            v-model="email"
            type="email"
            name="username"
            autocomplete="username"
            inputmode="email"
            autofocus
            variant="public"
            :aria-invalid="!!error || undefined"
            :aria-describedby="error ? 'signin-error' : undefined"
          />
          <p
            v-if="error"
            id="signin-error"
            role="alert"
            class="text-sm font-semibold text-destructive"
          >
            {{ error }}
          </p>
        </div>
        <Button type="submit" size="lg" class="h-11">
          {{ $t('signin.continue') }}
        </Button>
      </form>

      <form
        v-else
        key="password"
        novalidate
        class="flex flex-col gap-5"
        @submit.prevent="submit"
      >
        <div class="flex flex-col gap-1">
          <h1 class="text-3xl font-extrabold tracking-tight">
            {{ $t('signin.password_title') }}
          </h1>
          <p
            class="flex min-w-0 flex-wrap items-baseline gap-x-2 text-muted-foreground"
          >
            <span class="min-w-0 break-all">{{ email }}</span>
            <button
              type="button"
              class="font-semibold text-foreground underline underline-offset-4 hover:text-brand"
              :aria-label="$t('signin.change_label')"
              @click="back"
            >
              {{ $t('signin.change') }}
            </button>
          </p>
        </div>
        <!-- the address again, for password managers that save the pair -->
        <input
          type="email"
          name="username"
          autocomplete="username"
          :value="email"
          readonly
          tabindex="-1"
          aria-hidden="true"
          class="sr-only"
        />
        <div class="flex flex-col gap-2">
          <Label for="signin-password">{{ $t('signin.password') }}</Label>
          <div class="relative">
            <Input
              id="signin-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              name="password"
              autocomplete="current-password"
              variant="public"
              class="pr-20"
              :aria-invalid="!!error || undefined"
              :aria-describedby="error ? 'signin-error' : undefined"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              class="absolute inset-y-1 right-1 h-auto"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" aria-hidden="true" />
              <Eye v-else aria-hidden="true" />
              {{ $t(showPassword ? 'signin.hide' : 'signin.show') }}
              <span class="sr-only">{{ $t('signin.the_password') }}</span>
            </Button>
          </div>
          <p
            v-if="error"
            id="signin-error"
            role="alert"
            class="text-sm font-semibold text-destructive"
          >
            {{ error }}
          </p>
        </div>
        <Button type="submit" size="lg" class="h-11" :disabled="pending">
          {{ $t(pending ? 'signin.pending' : 'signin.submit') }}
        </Button>
        <div class="flex flex-col gap-2">
          <button
            type="button"
            class="w-fit font-semibold text-brand underline-offset-4 hover:underline disabled:opacity-60"
            :disabled="resetting"
            @click="forgot"
          >
            {{ $t('signin.forgot') }}
          </button>
          <p v-if="notice" role="status" class="text-sm text-muted-foreground">
            {{ notice }}
          </p>
        </div>
      </form>
    </Transition>
  </div>
</template>
