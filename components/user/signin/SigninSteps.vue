<script setup lang="ts">
  import { Eye, EyeOff } from '@lucide/vue'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { EmailAddress } from '@/domain/email'
  import { errorFeedback } from '@/composables/errors/feedback'

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
  <div class="tw:rounded-lg tw:border tw:bg-card tw:p-6 tw:sm:p-8">
    <div class="tw:mb-6 tw:grid tw:grid-cols-2 tw:gap-1.5" aria-hidden="true">
      <span class="tw:h-1 tw:rounded-full tw:bg-brand" />
      <span
        class="tw:h-1 tw:rounded-full tw:bg-border tw:transition-colors tw:duration-300"
        :class="step === 2 && 'tw:bg-brand'"
      />
    </div>
    <p class="tw:sr-only" aria-live="polite">
      {{ $t('signin.step', { n: step }) }}
    </p>

    <Transition
      mode="out-in"
      enter-active-class="tw:transition tw:duration-200 tw:ease-out tw:motion-reduce:transition-none"
      enter-from-class="tw:opacity-0 tw:translate-x-2"
      leave-active-class="tw:transition tw:duration-100 tw:motion-reduce:transition-none"
      leave-to-class="tw:opacity-0"
      @after-enter="focusStep"
    >
      <form
        v-if="step === 1"
        key="email"
        novalidate
        class="tw:flex tw:flex-col tw:gap-5"
        @submit.prevent="next"
      >
        <h1 class="tw:text-3xl tw:font-extrabold tw:tracking-tight">
          {{ $t('signin.title') }}
        </h1>
        <div class="tw:flex tw:flex-col tw:gap-2">
          <Label for="signin-email">{{ $t('signin.email') }}</Label>
          <Input
            id="signin-email"
            v-model="email"
            type="email"
            name="username"
            autocomplete="username"
            inputmode="email"
            autofocus
            class="tw:h-11 tw:focus-visible:border-plate tw:focus-visible:ring-plate/15 tw:aria-invalid:focus-visible:border-destructive"
            :aria-invalid="!!error || undefined"
            :aria-describedby="error ? 'signin-error' : undefined"
          />
          <p
            v-if="error"
            id="signin-error"
            role="alert"
            class="tw:text-sm tw:font-semibold tw:text-destructive"
          >
            {{ error }}
          </p>
        </div>
        <Button type="submit" size="lg" class="tw:h-11">
          {{ $t('signin.continue') }}
        </Button>
      </form>

      <form
        v-else
        key="password"
        novalidate
        class="tw:flex tw:flex-col tw:gap-5"
        @submit.prevent="submit"
      >
        <div class="tw:flex tw:flex-col tw:gap-1">
          <h1 class="tw:text-3xl tw:font-extrabold tw:tracking-tight">
            {{ $t('signin.password_title') }}
          </h1>
          <p
            class="tw:flex tw:min-w-0 tw:flex-wrap tw:items-baseline tw:gap-x-2 tw:text-muted-foreground"
          >
            <span class="tw:min-w-0 tw:break-all">{{ email }}</span>
            <button
              type="button"
              class="tw:font-semibold tw:text-foreground tw:underline tw:underline-offset-4 tw:hover:text-brand"
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
          class="tw:sr-only"
        />
        <div class="tw:flex tw:flex-col tw:gap-2">
          <Label for="signin-password">{{ $t('signin.password') }}</Label>
          <div class="tw:relative">
            <Input
              id="signin-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              name="password"
              autocomplete="current-password"
              class="tw:h-11 tw:pr-20 tw:focus-visible:border-plate tw:focus-visible:ring-plate/15 tw:aria-invalid:focus-visible:border-destructive"
              :aria-invalid="!!error || undefined"
              :aria-describedby="error ? 'signin-error' : undefined"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              class="tw:absolute tw:inset-y-1 tw:right-1 tw:h-auto"
              :aria-pressed="showPassword"
              :aria-label="$t('signin.show_label')"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" aria-hidden="true" />
              <Eye v-else aria-hidden="true" />
              {{ $t(showPassword ? 'signin.hide' : 'signin.show') }}
            </Button>
          </div>
          <p
            v-if="error"
            id="signin-error"
            role="alert"
            class="tw:text-sm tw:font-semibold tw:text-destructive"
          >
            {{ error }}
          </p>
        </div>
        <Button type="submit" size="lg" class="tw:h-11" :disabled="pending">
          {{ $t(pending ? 'signin.pending' : 'signin.submit') }}
        </Button>
        <div class="tw:flex tw:flex-col tw:gap-2">
          <button
            type="button"
            class="tw:w-fit tw:font-semibold tw:text-brand tw:underline-offset-4 tw:hover:underline tw:disabled:opacity-60"
            :disabled="resetting"
            @click="forgot"
          >
            {{ $t('signin.forgot') }}
          </button>
          <p
            v-if="notice"
            role="status"
            class="tw:text-sm tw:text-muted-foreground"
          >
            {{ notice }}
          </p>
        </div>
      </form>
    </Transition>
  </div>
</template>
