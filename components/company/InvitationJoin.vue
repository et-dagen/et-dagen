<script setup lang="ts">
  import { useField, useForm } from 'vee-validate'
  import JoinButton from '@/components/company/JoinButton.vue'
  import JoinColumn from '@/components/company/JoinColumn.vue'
  import JoinField from '@/components/company/JoinField.vue'
  import { alertError, notify } from '@/composables/useAlerts'
  import { useAuthStore } from '@/stores/authStore'
  import {
    requestPasswordReset,
    signInHere,
    signOutHere,
  } from '@/composables/auth/session'
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
  const showPassword = ref(false)

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
    try {
      await step()
    } catch (cause) {
      alertError(cause)
    } finally {
      pending.value = false
    }
  }

  const form = useForm({ validationSchema: typedSchemaOf(InvitationAccept) })
  const { value: name, errorMessage: nameError } = useField<string>('name')
  const { value: newPassword, errorMessage: newPasswordError } =
    useField<string>('password')
  // the contract's messages are keys under form.errors
  const shown = (key?: string) => (key ? t(`form.errors.${key}`) : undefined)

  const openAccount = form.handleSubmit(
    async (account) => {
      pending.value = true
      try {
        await redeem(account)
        await signInHere(props.invitation.email, account.password)
        await joined()
      } catch (cause) {
        const code = (cause as { data?: { code?: string } }).data?.code
        if (code === 'invitation/account-exists') {
          mode.value = 'sign-in'
          notify(t('invitation.join.has_account'), 'info')
        } else {
          alertError(cause)
        }
      } finally {
        pending.value = false
      }
    },
    ({ errors }) =>
      document
        .getElementById(errors.name ? 'join-name' : 'join-new-password')
        ?.focus(),
  )

  const password = ref('')
  const passwordError = ref<string>()
  function signInAndJoin() {
    if (!password.value) {
      passwordError.value = t('errors.auth.missing-password')
      return document.getElementById('join-password')?.focus()
    }
    passwordError.value = undefined
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
      notify(
        t('signin.reset_sent', { email: props.invitation.email }),
        'success',
      )
    })
</script>

<template>
  <div class="tw:m-10">
    <h4
      class="tw:pt-4 tw:pb-7 tw:text-center tw:text-[2.125rem] tw:leading-[1.175] tw:font-normal tw:tracking-[0.0073529412em]"
    >
      {{ $t('invitation.join.title', { company }) }}
    </h4>
    <JoinColumn>
      <p class="tw:text-center">
        {{
          $t('invitation.join.lead', {
            company,
            day: dayOf(invitation.expiresAt, locale),
          })
        }}
      </p>
      <JoinField
        id="join-address"
        :model-value="invitation.email"
        :label="$t('invitation.join.address')"
        readonly
        hide-details
      />
    </JoinColumn>

    <!-- signed in with the invited address: one click -->
    <JoinColumn v-if="invitedHere">
      <p>{{ $t('invitation.join.signed_in') }}</p>
      <JoinButton tone="success" :loading="pending" @click="joinSignedIn">
        {{ $t('invitation.join.join', { company }) }}
      </JoinButton>
    </JoinColumn>

    <!-- signed in as someone else: the invitation belongs to another account -->
    <JoinColumn v-else-if="signedInAs">
      <p>
        {{ $t('invitation.join.other_account', { email: signedInAs }) }}
      </p>
      <JoinButton tone="outline" :loading="pending" @click="run(signOutHere)">
        {{ $t('invitation.join.sign_out') }}
      </JoinButton>
    </JoinColumn>

    <form v-else-if="mode === 'open'" novalidate @submit.prevent="openAccount">
      <JoinColumn>
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
        <JoinField
          id="join-name"
          v-model="name"
          :label="$t('signup.name')"
          name="name"
          autocomplete="name"
          :error="shown(nameError)"
        />
        <JoinField
          id="join-new-password"
          v-model="newPassword"
          v-model:revealed="showPassword"
          password
          :label="$t('invitation.join.new_password')"
          name="password"
          autocomplete="new-password"
          :hint="$t('signup.password_hint')"
          :error="shown(newPasswordError)"
        />
      </JoinColumn>
      <JoinColumn>
        <JoinButton tone="success" type="submit" :loading="pending">
          {{ $t('invitation.join.open') }}
        </JoinButton>
      </JoinColumn>
      <JoinColumn tight>
        <span class="tw:mt-[0.4rem] tw:text-center">
          {{ $t('invitation.join.have_account') }}
        </span>
        <JoinButton
          tone="outline"
          :disabled="pending"
          @click="mode = 'sign-in'"
        >
          {{ $t('invitation.join.sign_in_instead') }}
        </JoinButton>
      </JoinColumn>
    </form>

    <form v-else novalidate @submit.prevent="signInAndJoin">
      <JoinColumn>
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
        <JoinField
          id="join-password"
          v-model="password"
          v-model:revealed="showPassword"
          password
          :label="$t('signin.password')"
          name="password"
          autocomplete="current-password"
          :error="passwordError"
        />
      </JoinColumn>
      <JoinColumn>
        <JoinButton tone="success" type="submit" :loading="pending">
          {{ $t('invitation.join.sign_in_and_join', { company }) }}
        </JoinButton>
      </JoinColumn>
      <JoinColumn tight>
        <button
          type="button"
          class="tw:my-[0.4rem] tw:text-[1.1rem] tw:font-semibold tw:italic tw:hover:underline tw:disabled:opacity-50"
          :disabled="pending"
          @click="forgot"
        >
          {{ $t('invitation.join.forgot') }}
        </button>
        <span class="tw:mt-[0.4rem] tw:text-center">
          {{ $t('invitation.join.no_account') }}
        </span>
        <JoinButton tone="outline" :disabled="pending" @click="mode = 'open'">
          {{ $t('invitation.join.open_instead') }}
        </JoinButton>
      </JoinColumn>
    </form>
  </div>
</template>
