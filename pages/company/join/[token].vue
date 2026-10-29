<script setup lang="ts">
  import InvitationJoin from '@/components/company/InvitationJoin.vue'
  import { Button } from '@/components/ui/button'
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
  <div class="et-ui">
    <div
      class="tw:mx-auto tw:flex tw:max-w-lg tw:flex-col tw:gap-6 tw:px-4 tw:py-10 tw:lg:py-16"
    >
      <InvitationJoin
        v-if="invitation && !closed"
        :token="token"
        :invitation="invitation"
      />
      <div
        v-else
        class="tw:flex tw:flex-col tw:gap-6 tw:rounded-lg tw:border tw:bg-card tw:p-6 tw:sm:p-8"
      >
        <div class="tw:flex tw:flex-col tw:gap-2">
          <h1 class="tw:text-3xl tw:font-extrabold tw:tracking-tight">
            {{ $t(`invitation.closed.${closed}.title`) }}
          </h1>
          <p class="tw:text-muted-foreground">
            {{ $t(`invitation.closed.${closed}.text`) }}
          </p>
        </div>
        <div class="tw:flex tw:flex-wrap tw:gap-3">
          <Button v-if="closed === 'joined'" as-child size="lg" class="tw:h-11">
            <NuxtLink :to="localePath('/user/signin')">
              {{ $t('signup.sign_in') }}
            </NuxtLink>
          </Button>
          <Button
            as-child
            size="lg"
            class="tw:h-11"
            :variant="closed === 'joined' ? 'outline' : 'default'"
          >
            <NuxtLink :to="localePath('/contact')">
              {{ $t('signup.company.contact') }}
            </NuxtLink>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
