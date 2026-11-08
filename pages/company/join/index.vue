<script setup lang="ts">
  import JoinButton from '@/components/company/JoinButton.vue'
  import JoinColumn from '@/components/company/JoinColumn.vue'

  const localePath = useLocalePath()
</script>

<template>
  <div class="tw:m-10">
    <h4
      class="tw:pt-4 tw:pb-7 tw:text-center tw:text-[2.125rem] tw:leading-[1.175] tw:font-normal tw:tracking-[0.0073529412em]"
    >
      {{ $t('signup.company.title') }}
    </h4>
    <JoinColumn>
      <p class="tw:text-center">{{ $t('signup.company.lead') }}</p>
    </JoinColumn>
    <JoinColumn>
      <p class="tw:font-semibold">{{ $t('signup.company.no_invitation') }}</p>
      <JoinButton :to="localePath('/contact')">
        {{ $t('signup.company.contact') }}
      </JoinButton>
    </JoinColumn>
    <JoinColumn tight>
      <p class="tw:my-[0.4rem] tw:text-center">
        {{ $t('signup.have_account') }}
        <NuxtLink
          :to="localePath('/user/signin')"
          class="tw:font-semibold tw:italic"
        >
          {{ $t('signup.sign_in') }}
        </NuxtLink>
      </p>
    </JoinColumn>
  </div>
</template>
