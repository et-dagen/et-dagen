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
    <div class="mx-auto flex max-w-lg flex-col gap-6 px-4 py-10 lg:py-16">
      <InvitationJoin
        v-if="invitation && !closed"
        :token="token"
        :invitation="invitation"
      />
      <div
        v-else
        class="flex flex-col gap-6 rounded-lg border bg-card p-6 sm:p-8"
      >
        <div class="flex flex-col gap-2">
          <h1 class="text-3xl font-extrabold tracking-tight">
            {{ $t(`invitation.closed.${closed}.title`) }}
          </h1>
          <p class="text-muted-foreground">
            {{ $t(`invitation.closed.${closed}.text`) }}
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <Button v-if="closed === 'joined'" as-child size="lg" class="h-11">
            <NuxtLink :to="localePath('/user/signin')">
              {{ $t('signup.sign_in') }}
            </NuxtLink>
          </Button>
          <Button
            as-child
            size="lg"
            class="h-11"
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
