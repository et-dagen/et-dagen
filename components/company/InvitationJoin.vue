<script setup lang="ts">
  import { useField, useForm } from 'vee-validate'
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
  <div class="ma-10">
    <h4 class="text-center pt-4 pb-7">
      {{ $t('invitation.join.title', { company }) }}
    </h4>
    <VContainer>
      <VRow>
        <p class="text-center">
          {{
            $t('invitation.join.lead', {
              company,
              day: dayOf(invitation.expiresAt, locale),
            })
          }}
        </p>
      </VRow>
      <VRow>
        <VTextField
          :model-value="invitation.email"
          :label="$t('invitation.join.address')"
          variant="outlined"
          readonly
          hide-details
        />
      </VRow>
    </VContainer>

    <!-- signed in with the invited address: one click -->
    <VContainer v-if="invitedHere">
      <VRow>
        <p>{{ $t('invitation.join.signed_in') }}</p>
      </VRow>
      <VRow>
        <VBtn
          color="success"
          class="btn"
          :loading="pending"
          @click="joinSignedIn"
        >
          {{ $t('invitation.join.join', { company }) }}
        </VBtn>
      </VRow>
    </VContainer>

    <!-- signed in as someone else: the invitation belongs to another account -->
    <VContainer v-else-if="signedInAs">
      <VRow>
        <p>
          {{ $t('invitation.join.other_account', { email: signedInAs }) }}
        </p>
      </VRow>
      <VRow>
        <VBtn
          color="primary"
          variant="outlined"
          class="btn"
          :loading="pending"
          @click="run(signOutHere)"
        >
          {{ $t('invitation.join.sign_out') }}
        </VBtn>
      </VRow>
    </VContainer>

    <VForm v-else-if="mode === 'open'" novalidate @submit.prevent="openAccount">
      <VContainer>
        <!-- the address, for password managers that save the pair -->
        <input
          type="email"
          name="username"
          autocomplete="username"
          :value="invitation.email"
          readonly
          tabindex="-1"
          aria-hidden="true"
          class="d-sr-only"
        />
        <VRow>
          <VTextField
            id="join-name"
            v-model="name"
            :label="$t('signup.name')"
            name="name"
            autocomplete="name"
            variant="outlined"
            :error-messages="shown(nameError)"
          />
        </VRow>
        <VRow>
          <VTextField
            id="join-new-password"
            v-model="newPassword"
            :label="$t('invitation.join.new_password')"
            name="password"
            autocomplete="new-password"
            variant="outlined"
            :type="showPassword ? 'text' : 'password'"
            :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :hint="$t('signup.password_hint')"
            persistent-hint
            :error-messages="shown(newPasswordError)"
            @click:append-inner="showPassword = !showPassword"
          />
        </VRow>
      </VContainer>
      <VContainer>
        <VRow>
          <VBtn color="success" type="submit" class="btn" :loading="pending">
            {{ $t('invitation.join.open') }}
          </VBtn>
        </VRow>
      </VContainer>
      <VContainer class="my-0 pt-2">
        <VRow class="mt-0">
          <span class="question">{{ $t('invitation.join.have_account') }}</span>
        </VRow>
        <VRow class="mt-0">
          <VBtn
            color="primary"
            variant="outlined"
            class="btn"
            :disabled="pending"
            @click="mode = 'sign-in'"
          >
            {{ $t('invitation.join.sign_in_instead') }}
          </VBtn>
        </VRow>
      </VContainer>
    </VForm>

    <VForm v-else novalidate @submit.prevent="signInAndJoin">
      <VContainer>
        <input
          type="email"
          name="username"
          autocomplete="username"
          :value="invitation.email"
          readonly
          tabindex="-1"
          aria-hidden="true"
          class="d-sr-only"
        />
        <VRow>
          <VTextField
            id="join-password"
            v-model="password"
            :label="$t('signin.password')"
            name="password"
            autocomplete="current-password"
            variant="outlined"
            :type="showPassword ? 'text' : 'password'"
            :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :error-messages="passwordError"
            @click:append-inner="showPassword = !showPassword"
          />
        </VRow>
      </VContainer>
      <VContainer>
        <VRow>
          <VBtn color="success" type="submit" class="btn" :loading="pending">
            {{ $t('invitation.join.sign_in_and_join', { company }) }}
          </VBtn>
        </VRow>
      </VContainer>
      <VContainer class="my-0 pt-2">
        <VRow class="mt-0">
          <button
            type="button"
            class="forgot"
            :disabled="pending"
            @click="forgot"
          >
            {{ $t('invitation.join.forgot') }}
          </button>
        </VRow>
        <VRow class="mt-0">
          <span class="question">{{ $t('invitation.join.no_account') }}</span>
        </VRow>
        <VRow class="mt-0">
          <VBtn
            color="primary"
            variant="outlined"
            class="btn"
            :disabled="pending"
            @click="mode = 'open'"
          >
            {{ $t('invitation.join.open_instead') }}
          </VBtn>
        </VRow>
      </VContainer>
    </VForm>
  </div>
</template>

<style scoped lang="scss">
  @use 'sass:map';
  @use 'vuetify/settings';

  .v-container {
    max-width: 26rem;
    margin-block: 0.5rem;
  }

  .v-row {
    justify-content: center;
    padding-block: 0.5rem;
  }

  // a company's name can make a label longer than the old buttons were wide
  .btn {
    min-width: 60%;
    max-width: 100%;
    height: auto;
    min-height: 52px;

    :deep(.v-btn__content) {
      white-space: normal;
    }
  }

  .question {
    margin: 0.4rem auto 0;
    text-align: center;
  }

  .forgot {
    margin: 0.4rem auto;
    font-weight: 600;
    font-style: italic;
    font-size: 1.1rem;

    &:hover {
      text-decoration: underline;
    }
  }

  @media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
    .btn {
      width: 100%;
    }
  }
</style>
