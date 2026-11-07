<script setup lang="ts">
  const localePath = useLocalePath()
</script>

<template>
  <div class="ma-10">
    <h4 class="text-center pt-4 pb-7">{{ $t('signup.company.title') }}</h4>
    <VContainer>
      <VRow>
        <p class="text-center">{{ $t('signup.company.lead') }}</p>
      </VRow>
    </VContainer>
    <VContainer>
      <VRow>
        <p class="no-invitation">{{ $t('signup.company.no_invitation') }}</p>
      </VRow>
      <VRow>
        <VBtn color="primary" class="btn" :to="localePath('/contact')">
          {{ $t('signup.company.contact') }}
        </VBtn>
      </VRow>
    </VContainer>
    <VContainer class="my-0 pt-2">
      <VRow class="mt-0">
        <p class="have-account">
          {{ $t('signup.have_account') }}
          <NuxtLink :to="localePath('/user/signin')" class="sign-in">
            {{ $t('signup.sign_in') }}
          </NuxtLink>
        </p>
      </VRow>
    </VContainer>
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

  .no-invitation {
    font-weight: 600;
  }

  .have-account {
    margin: 0.4rem auto;
    text-align: center;
  }

  .sign-in {
    font-weight: 600;
    font-style: italic;
  }

  .btn {
    width: 60%;
  }

  @media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
    .btn {
      width: 100%;
    }
  }
</style>
