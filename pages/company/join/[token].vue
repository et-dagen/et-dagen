<script setup lang="ts">
  import InvitationJoin from '@/components/company/InvitationJoin.vue'
  import JoinButton from '@/components/company/JoinButton.vue'
  import JoinColumn from '@/components/company/JoinColumn.vue'
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
  <div v-else class="tw:m-10">
    <h4
      class="tw:pt-4 tw:pb-7 tw:text-center tw:text-[2.125rem] tw:leading-[1.175] tw:font-normal tw:tracking-[0.0073529412em]"
    >
      {{ $t(`invitation.closed.${closed}.title`) }}
    </h4>
    <JoinColumn>
      <p class="tw:text-center">
        {{ $t(`invitation.closed.${closed}.text`) }}
      </p>
    </JoinColumn>
    <JoinColumn>
      <JoinButton
        v-if="closed === 'joined'"
        tone="success"
        :to="localePath('/user/signin')"
      >
        {{ $t('signup.sign_in') }}
      </JoinButton>
      <JoinButton
        :tone="closed === 'joined' ? 'outline' : 'brand'"
        :to="localePath('/contact')"
      >
        {{ $t('signup.company.contact') }}
      </JoinButton>
    </JoinColumn>
  </div>
</template>
