<script setup lang="ts">
  import InvitationJoin from '@/components/company/InvitationJoin.vue'
  import type { InvitationPreview } from '@/lib/invitations'

  const route = useRoute()
  const localePath = useLocalePath()
  const token = String(route.params.token)

  // the link lets someone in: keep it out of referrers and search engines
  useHead({
    meta: [
      { name: 'referrer', content: 'no-referrer' },
      { name: 'robots', content: 'noindex' },
    ],
  })

  const { data: invitation } = await useFetch<InvitationPreview>(
    `/api/v1/invitation/${token}`,
  )

  // why a link no longer works, by the invitation's status; a link with no invitation is `missing`
  const closed = computed(() => {
    const status = invitation.value?.status
    if (status === 'pending') return null
    return status ?? 'missing'
  })
</script>

<template>
  <InvitationJoin
    v-if="invitation && !closed"
    :token="token"
    :invitation="invitation"
  />
  <div v-else class="ma-10">
    <h4 class="text-center pt-4 pb-7">
      {{ $t(`invitation.closed.${closed}.title`) }}
    </h4>
    <VContainer>
      <VRow>
        <p class="text-center">
          {{ $t(`invitation.closed.${closed}.text`) }}
        </p>
      </VRow>
    </VContainer>
    <VContainer>
      <VRow v-if="closed === 'joined'">
        <VBtn color="success" class="btn" :to="localePath('/user/signin')">
          {{ $t('signup.sign_in') }}
        </VBtn>
      </VRow>
      <VRow>
        <VBtn
          color="primary"
          class="btn"
          :variant="closed === 'joined' ? 'outlined' : 'elevated'"
          :to="localePath('/contact')"
        >
          {{ $t('signup.company.contact') }}
        </VBtn>
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

  .btn {
    width: 60%;
  }

  @media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
    .btn {
      width: 100%;
    }
  }
</style>
