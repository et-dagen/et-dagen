<script setup lang="ts">
  import { Check, Copy, Send, X } from '@lucide/vue'
  import { Badge } from '@/components/ui/badge'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { alertError } from '@/composables/useAlerts'
  import type { InvitationStatus } from '@/domain/business/invitation'
  import { EmailAddress } from '@/domain/email'
  import { dayOf, type ListedInvitation } from '@/lib/invitations'

  const props = defineProps<{ companyUid: string }>()

  const { t, locale } = useI18n()
  const { copy, copied } = useClipboard()

  const { data: invitations, refresh } = await useFetch<ListedInvitation[]>(
    '/api/v1/company/invitations',
    { query: { companyUID: props.companyUid }, default: () => [] },
  )

  const email = ref('')
  const error = ref('')
  const sending = ref(false)
  // the server returns the link once; it is gone when the page is left
  const sent = ref<{ email: string; link: string } | null>(null)

  async function invite() {
    email.value = email.value.trim()
    if (!EmailAddress.is(email.value)) {
      error.value = t('admin.companies.invitations.invalid_email')
      return document.getElementById('invite-email')?.focus()
    }
    sending.value = true
    error.value = ''
    try {
      const { link } = await $fetch<{ link: string }>(
        '/api/v1/company/invitations',
        {
          method: 'POST',
          body: { companyUID: props.companyUid, email: email.value },
        },
      )
      sent.value = { email: email.value, link }
      email.value = ''
    } catch (cause) {
      error.value = getErrorAlertContext(cause).message
    } finally {
      sending.value = false
      await refresh()
    }
  }

  const revoking = ref<string | null>(null)
  async function revoke(invitation: ListedInvitation) {
    revoking.value = invitation.id
    try {
      await $fetch(`/api/v1/company/invitations/${invitation.id}`, {
        method: 'DELETE',
      })
      if (sent.value?.email === invitation.email) sent.value = null
      await refresh()
    } catch (cause) {
      alertError(cause)
    } finally {
      revoking.value = null
    }
  }

  const statusBadge: Record<InvitationStatus, string> = {
    pending: 'tw:border-transparent tw:bg-plate tw:text-plate-foreground',
    joined:
      'tw:border-transparent tw:bg-secondary tw:text-secondary-foreground',
    expired: 'tw:text-muted-foreground',
    revoked: 'tw:text-muted-foreground',
  }

  const detailOf = (invitation: ListedInvitation) => {
    const day = (instant: string) => dayOf(instant, locale.value)
    const sentOn = t('admin.companies.invitations.sent_on', {
      day: day(invitation.createdAt),
    })
    if (invitation.status !== 'pending') return sentOn
    const until = t('admin.companies.invitations.expires_on', {
      day: day(invitation.expiresAt),
    })
    return `${sentOn}, ${until}`
  }
</script>

<template>
  <section
    class="tw:flex tw:max-w-3xl tw:flex-col tw:gap-5"
    aria-labelledby="invitations-title"
  >
    <div class="tw:flex tw:flex-col tw:gap-1">
      <h2 id="invitations-title" class="tw:text-xl tw:font-extrabold">
        {{ $t('admin.companies.invitations.title') }}
      </h2>
      <p class="tw:max-w-[65ch] tw:text-muted-foreground">
        {{ $t('admin.companies.invitations.lead') }}
      </p>
    </div>

    <div
      class="tw:flex tw:flex-col tw:gap-5 tw:rounded-lg tw:border tw:bg-card tw:p-4 tw:lg:p-6"
    >
      <form
        novalidate
        class="tw:flex tw:flex-col tw:gap-2"
        @submit.prevent="invite"
      >
        <Label for="invite-email">
          {{ $t('admin.companies.invitations.email') }}
        </Label>
        <div class="tw:flex tw:flex-col tw:gap-2 tw:sm:flex-row">
          <Input
            id="invite-email"
            v-model="email"
            type="email"
            autocomplete="off"
            inputmode="email"
            class="tw:sm:max-w-sm"
            :aria-invalid="!!error || undefined"
            :aria-describedby="error ? 'invite-error' : undefined"
          />
          <Button type="submit" :disabled="sending">
            <Send aria-hidden="true" />
            {{
              $t(
                sending
                  ? 'admin.companies.invitations.sending'
                  : 'admin.companies.invitations.send',
              )
            }}
          </Button>
        </div>
        <p
          v-if="error"
          id="invite-error"
          role="alert"
          class="tw:text-sm tw:font-semibold tw:text-destructive"
        >
          {{ error }}
        </p>
      </form>

      <div
        v-if="sent"
        role="status"
        class="tw:flex tw:flex-col tw:gap-3 tw:rounded-md tw:bg-secondary tw:p-4"
      >
        <p class="tw:text-sm">
          <span class="tw:font-semibold">
            {{ $t('admin.companies.invitations.sent', { email: sent.email }) }}
          </span>
          {{ ' ' }}
          {{ $t('admin.companies.invitations.link_once') }}
        </p>
        <div class="tw:flex tw:gap-2">
          <Input
            :model-value="sent.link"
            readonly
            :aria-label="$t('admin.companies.invitations.link')"
            class="tw:bg-background tw:font-mono tw:text-xs"
            @focus="($event.target as HTMLInputElement).select()"
          />
          <Button variant="outline" @click="copy(sent.link)">
            <Check v-if="copied" class="tw:text-plate" aria-hidden="true" />
            <Copy v-else aria-hidden="true" />
            {{
              $t(
                copied
                  ? 'admin.companies.invitations.copied'
                  : 'admin.companies.invitations.copy',
              )
            }}
          </Button>
        </div>
      </div>

      <ul
        v-if="invitations.length"
        class="tw:-mx-4 tw:divide-y tw:border-t tw:lg:-mx-6"
      >
        <li
          v-for="invitation in invitations"
          :key="invitation.id"
          class="tw:grid tw:grid-cols-[minmax(0,1fr)_auto] tw:items-center tw:gap-x-3 tw:gap-y-1 tw:px-4 tw:py-3 tw:sm:grid-cols-[minmax(0,1fr)_auto_7rem] tw:lg:px-6"
        >
          <div class="tw:flex tw:min-w-0 tw:flex-col">
            <span class="tw:font-medium tw:break-all">
              {{ invitation.email }}
            </span>
            <span class="tw:text-sm tw:text-muted-foreground">
              {{ detailOf(invitation) }}
            </span>
          </div>
          <Badge
            class="tw:rounded-[4px]"
            :class="statusBadge[invitation.status]"
          >
            {{ $t(`admin.companies.invitations.status.${invitation.status}`) }}
          </Badge>
          <div class="tw:col-span-2 tw:flex tw:sm:col-span-1 tw:sm:justify-end">
            <Button
              v-if="invitation.status === 'pending'"
              variant="ghost"
              size="sm"
              class="tw:-ml-2.5 tw:sm:ml-0"
              :disabled="revoking === invitation.id"
              :aria-label="
                $t('admin.companies.invitations.revoke_label', {
                  email: invitation.email,
                })
              "
              @click="revoke(invitation)"
            >
              <X aria-hidden="true" />
              {{ $t('admin.companies.invitations.revoke') }}
            </Button>
          </div>
        </li>
      </ul>
      <p v-else class="tw:text-sm tw:text-muted-foreground">
        {{ $t('admin.companies.invitations.empty') }}
      </p>
    </div>
  </section>
</template>
