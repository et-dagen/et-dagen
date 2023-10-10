<script setup lang="ts">
  import type { AlertType } from 'composables/useAlerts'

  const initialState = {
    email: '',
    password: '',
  }

  const state = reactive({
    ...initialState,
  })

  const initialAlertState = {
    show: false,
    alertRoute: '',
    type: undefined as AlertType,
  }

  const alertState = reactive({
    ...initialAlertState,
  })

  const isRegistering = ref<boolean>(false)

  const form = ref()
  const submit = () => {
    isRegistering.value = true
    signinUser(state.email, state.password)
      .catch((error) => {
        const content = getAlertRouteAndType(error.message)

        alertState.alertRoute = content.route
        alertState.type = content.type as AlertType
        alertState.show = true

        console.error(error)
      })
      .finally(() => {
        isRegistering.value = false
      })
  }
</script>

<template>
  <VSnackbar v-model="alertState.show">
    {{ $t(`${alertState.alertRoute}`) }}

    <template #actions>
      <v-btn
        :color="alertState.type"
        variant="text"
        @click="alertState.show = false"
      >
        {{ $t('alert.close_alert') }}
      </v-btn>
    </template>
  </VSnackbar>

  <VForm ref="form" @submit.prevent="submit">
    <VContainer>
      <VRow>
        <UserFormTextInput
          v-model="state.email"
          :content="{
            label: $t('user.login.email'),
          }"
        />
      </VRow>
      <VRow>
        <UserFormPasswordInput v-model="state.password" />
      </VRow>
    </VContainer>
    <VContainer>
      <VRow>
        <VBtn
          color="success"
          type="submit"
          class="btn--submit"
          :loading="isRegistering"
        >
          {{ $t('user.sign_in') }}
        </VBtn>
      </VRow>
    </VContainer>
    <VContainer>
      <VRow>
        <!-- TODO: Add @click hook to use Firebase 'Forgot Password' feature -->
        <span class="btn--forgot">{{ $t('user.login.forgot') }}</span>
      </VRow>
      <VRow>
        <VBtn
          color="primary"
          @click="() => navigateTo('/user/signup')"
          variant="outlined"
          class="btn--register"
          :disabled="isRegistering"
        >
          {{ $t('user.sign_up') }}
        </VBtn>
      </VRow>
    </VContainer>
  </VForm>
</template>

<style scoped lang="scss">
  @import 'vuetify/settings';

  .v-container {
    max-width: 26rem !important;
    margin-block: 1.2rem;
  }

  .v-row {
    padding-block: 0.1rem;
  }

  .v-tab--selected {
    background: rgba(var(--v-theme-accent), 0.08);
  }

  .v-window__container {
    div {
      padding-block: 0.6rem;
    }
  }

  .btn {
    &--submit,
    &--register {
      width: 60%;
      margin-inline: 20% !important;
    }

    &--forgot {
      margin: 0.4rem auto !important;
      font-weight: 600;
      font-style: italic;
      font-size: 1.1rem;

      &:hover {
        text-decoration: underline;
        cursor: pointer;
      }
    }
  }

  @media #{map-get($display-breakpoints, 'sm-and-down')} {
    .v-tab {
      font-size: 1rem;
    }

    .btn {
      &--submit,
      &--register {
        width: 100%;
        margin: 0 !important;
      }
    }
  }
</style>
