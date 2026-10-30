<script setup lang="ts">
  import { useForm } from 'vee-validate'
  import FieldError from '@/components/form/FieldError.vue'
  import { Button } from '@/components/ui/button'
  import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
  } from '@/components/ui/form'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import PasswordInput from '@/components/form/PasswordInput.vue'
  import { InvitationAccept } from '@/contracts/user'
  import { EmailAddress, sameAccount } from '@/domain/email'
  import { typedSchemaOf } from '@/lib/forms/zodSchema'
  import { dayOf, type InvitationPreview } from '@/lib/invitations'
  import type { User } from '@/models/User'

  const props = defineProps<{ token: string; invitation: InvitationPreview }>()

  const { t, locale } = useI18n()
  const localePath = useLocalePath()
  const auth = useAuthStore()

  const company = computed(() => props.invitation.company.name)
  const signedInAs = computed(() => auth.user?.email ?? null)
  const invitedHere = computed(
    () =>
      signedInAs.value !== null &&
      EmailAddress.is(signedInAs.value) &&
      EmailAddress.is(props.invitation.email) &&
      sameAccount(signedInAs.value, props.invitation.email),
  )

  // someone without an account opens one; someone with one signs in
  const mode = ref<'open' | 'sign-in'>('open')
  const pending = ref(false)
  const error = ref('')
  const notice = ref('')

  const redeem = (body?: InvitationAccept) =>
    $fetch(`/api/v1/invitation/${props.token}`, { method: 'POST', body })

  // the protected company page needs the user and their new role before it opens
  async function joined() {
    auth.user = await $fetch<User>('/api/v1/user')
    await auth.loadSubject()
    await navigateTo(localePath('/company/admin'))
  }

  async function run(step: () => Promise<void>) {
    pending.value = true
    error.value = ''
    notice.value = ''
    try {
      await step()
    } catch (cause) {
      error.value = getErrorAlertContext(cause).message
    } finally {
      pending.value = false
    }
  }

  const form = useForm({ validationSchema: typedSchemaOf(InvitationAccept) })
  const formEl = ref<HTMLFormElement | null>(null)
  const focusInvalid = () =>
    nextTick(() =>
      formEl.value
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus(),
    )

  const openAccount = form.handleSubmit(async (account) => {
    pending.value = true
    error.value = ''
    try {
      await redeem(account)
      await signInHere(props.invitation.email, account.password)
      await joined()
    } catch (cause) {
      const code = (cause as { data?: { code?: string } }).data?.code
      if (code === 'invitation/account-exists') {
        mode.value = 'sign-in'
        notice.value = t('invitation.join.has_account')
      } else {
        error.value = getErrorAlertContext(cause).message
      }
    } finally {
      pending.value = false
    }
  }, focusInvalid)

  const password = ref('')
  function signInAndJoin() {
    if (!password.value) {
      error.value = t('errors.auth.missing-password')
      return document.getElementById('join-password')?.focus()
    }
    return run(async () => {
      await signInHere(props.invitation.email, password.value)
      await redeem()
      await joined()
    })
  }

  const joinSignedIn = () =>
    run(async () => {
      await redeem()
      await joined()
    })

  const forgot = () =>
    run(async () => {
      await requestPasswordReset(props.invitation.email).catch(() => {})
      notice.value = t('signin.reset_sent', { email: props.invitation.email })
    })

  function switchTo(next: 'open' | 'sign-in') {
    mode.value = next
    error.value = ''
    notice.value = ''
  }

  const inputClass = [
    'tw:h-11 tw:focus-visible:border-plate tw:focus-visible:ring-plate/15',
    'tw:aria-invalid:focus-visible:border-destructive',
  ].join(' ')
</script>

<template>
  <div
    class="tw:flex tw:flex-col tw:gap-8 tw:rounded-lg tw:border tw:bg-card tw:p-6 tw:sm:p-8"
  >
    <div class="tw:flex tw:flex-col tw:gap-2">
      <h1 class="tw:text-3xl tw:font-extrabold tw:tracking-tight">
        {{ $t('invitation.join.title', { company }) }}
      </h1>
      <p class="tw:text-muted-foreground">
        {{
          $t('invitation.join.lead', {
            company,
            day: dayOf(invitation.expiresAt, locale),
          })
        }}
      </p>
    </div>

    <dl class="tw:flex tw:flex-col tw:gap-1">
      <dt class="tw:text-sm tw:font-medium">
        {{ $t('invitation.join.address') }}
      </dt>
      <dd class="tw:break-all tw:text-lg tw:font-semibold">
        {{ invitation.email }}
      </dd>
    </dl>

    <!-- signed in with the invited address: one click -->
    <div v-if="invitedHere" class="tw:flex tw:flex-col tw:gap-3">
      <p class="tw:text-muted-foreground">
        {{ $t('invitation.join.signed_in') }}
      </p>
      <Button
        size="lg"
        class="tw:h-11"
        :disabled="pending"
        @click="joinSignedIn"
      >
        {{ $t('invitation.join.join', { company }) }}
      </Button>
    </div>

    <!-- signed in as someone else: the invitation belongs to another account -->
    <div v-else-if="signedInAs" class="tw:flex tw:flex-col tw:gap-3">
      <p>
        {{ $t('invitation.join.other_account', { email: signedInAs }) }}
      </p>
      <Button
        variant="outline"
        size="lg"
        class="tw:h-11"
        :disabled="pending"
        @click="run(signOutHere)"
      >
        {{ $t('invitation.join.sign_out') }}
      </Button>
    </div>

    <form
      v-else-if="mode === 'open'"
      ref="formEl"
      novalidate
      class="tw:flex tw:flex-col tw:gap-5"
      @submit="openAccount"
    >
      <!-- the address, for password managers that save the pair -->
      <input
        type="email"
        name="username"
        autocomplete="username"
        :value="invitation.email"
        readonly
        tabindex="-1"
        aria-hidden="true"
        class="tw:sr-only"
      />
      <FormField v-slot="{ componentField }" name="name">
        <FormItem>
          <FormLabel>{{ $t('signup.name') }}</FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              autocomplete="name"
              :class="inputClass"
            />
          </FormControl>
          <FieldError />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="password">
        <FormItem>
          <FormLabel>{{ $t('invitation.join.new_password') }}</FormLabel>
          <FormControl>
            <PasswordInput v-bind="componentField" :class="inputClass" />
          </FormControl>
          <FormDescription>{{ $t('signup.password_hint') }}</FormDescription>
          <FieldError />
        </FormItem>
      </FormField>
      <p
        v-if="error"
        role="alert"
        class="tw:text-sm tw:font-semibold tw:text-destructive"
      >
        {{ error }}
      </p>
      <Button type="submit" size="lg" class="tw:h-11" :disabled="pending">
        {{ $t(pending ? 'signup.pending' : 'invitation.join.open') }}
      </Button>
      <p class="tw:text-sm">
        <span class="tw:text-muted-foreground">
          {{ $t('invitation.join.have_account') }}
        </span>
        {{ ' ' }}
        <button
          type="button"
          class="tw:font-bold tw:text-brand tw:underline-offset-4 tw:hover:underline"
          @click="switchTo('sign-in')"
        >
          {{ $t('invitation.join.sign_in_instead') }}
        </button>
      </p>
    </form>

    <form
      v-else
      novalidate
      class="tw:flex tw:flex-col tw:gap-5"
      @submit.prevent="signInAndJoin"
    >
      <input
        type="email"
        name="username"
        autocomplete="username"
        :value="invitation.email"
        readonly
        tabindex="-1"
        aria-hidden="true"
        class="tw:sr-only"
      />
      <p v-if="notice" role="status" class="tw:text-sm tw:font-semibold">
        {{ notice }}
      </p>
      <div class="tw:flex tw:flex-col tw:gap-2">
        <Label for="join-password">{{ $t('signin.password') }}</Label>
        <Input
          id="join-password"
          v-model="password"
          type="password"
          name="password"
          autocomplete="current-password"
          :class="inputClass"
          :aria-invalid="!!error || undefined"
          :aria-describedby="error ? 'join-error' : undefined"
        />
        <p
          v-if="error"
          id="join-error"
          role="alert"
          class="tw:text-sm tw:font-semibold tw:text-destructive"
        >
          {{ error }}
        </p>
        <button
          type="button"
          class="tw:w-fit tw:text-sm tw:font-semibold tw:underline tw:underline-offset-4 tw:hover:text-brand"
          :disabled="pending"
          @click="forgot"
        >
          {{ $t('invitation.join.forgot') }}
        </button>
      </div>
      <Button type="submit" size="lg" class="tw:h-11" :disabled="pending">
        {{ $t('invitation.join.sign_in_and_join', { company }) }}
      </Button>
      <p class="tw:text-sm">
        <span class="tw:text-muted-foreground">
          {{ $t('invitation.join.no_account') }}
        </span>
        {{ ' ' }}
        <button
          type="button"
          class="tw:font-bold tw:text-brand tw:underline-offset-4 tw:hover:underline"
          @click="switchTo('open')"
        >
          {{ $t('invitation.join.open_instead') }}
        </button>
      </p>
    </form>

    <p
      v-if="(invitedHere || signedInAs) && error"
      role="alert"
      class="tw:-mt-4 tw:text-sm tw:font-semibold tw:text-destructive"
    >
      {{ error }}
    </p>
  </div>
</template>
