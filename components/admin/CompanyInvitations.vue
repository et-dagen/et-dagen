<script setup lang="ts">
  import { Check, Copy, Send, X } from '@lucide/vue'
  import { getErrorAlertContext, alertError } from '@/composables/useAlerts'
  import { Badge } from '@/components/ui/badge'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
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
    pending: 'border-transparent bg-plate text-plate-foreground',
    joined: 'border-transparent bg-secondary text-secondary-foreground',
    expired: 'text-muted-foreground',
    revoked: 'text-muted-foreground',
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
    id="invitations"
    class="flex max-w-3xl scroll-mt-6 flex-col gap-5"
    aria-labelledby="invitations-title"
  >
    <div class="flex flex-col gap-1">
      <h2 id="invitations-title" class="text-xl font-extrabold">
        {{ $t('admin.companies.invitations.title') }}
      </h2>
      <p class="max-w-[65ch] text-muted-foreground">
        {{ $t('admin.companies.invitations.lead') }}
      </p>
    </div>

    <div class="flex flex-col gap-5 rounded-lg border bg-card p-4 lg:p-6">
      <form novalidate class="flex flex-col gap-2" @submit.prevent="invite">
        <Label for="invite-email">
          {{ $t('admin.companies.invitations.email') }}
        </Label>
        <div class="flex flex-col gap-2 sm:flex-row">
          <Input
            id="invite-email"
            v-model="email"
            type="email"
            autocomplete="off"
            inputmode="email"
            class="sm:max-w-sm"
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
          class="text-sm font-semibold text-destructive"
        >
          {{ error }}
        </p>
      </form>

      <div
        v-if="sent"
        role="status"
        class="flex flex-col gap-3 rounded-md bg-secondary p-4"
      >
        <p class="text-sm">
          <span class="font-semibold">
            {{ $t('admin.companies.invitations.sent', { email: sent.email }) }}
          </span>
          {{ ' ' }}
          {{ $t('admin.companies.invitations.link_once') }}
        </p>
        <div class="flex gap-2">
          <Input
            :model-value="sent.link"
            readonly
            :aria-label="$t('admin.companies.invitations.link')"
            class="bg-background font-mono text-xs"
            @focus="($event.target as HTMLInputElement).select()"
          />
          <Button variant="outline" @click="copy(sent.link)">
            <Check v-if="copied" class="text-plate" aria-hidden="true" />
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

      <ul v-if="invitations.length" class="-mx-4 divide-y border-t lg:-mx-6">
        <li
          v-for="invitation in invitations"
          :key="invitation.id"
          class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto_7rem] lg:px-6"
        >
          <div class="flex min-w-0 flex-col">
            <span class="font-medium break-all">
              {{ invitation.email }}
            </span>
            <span class="text-sm text-muted-foreground">
              {{ detailOf(invitation) }}
            </span>
          </div>
          <Badge class="rounded-[4px]" :class="statusBadge[invitation.status]">
            {{ $t(`admin.companies.invitations.status.${invitation.status}`) }}
          </Badge>
          <div class="col-span-2 flex sm:col-span-1 sm:justify-end">
            <Button
              v-if="invitation.status === 'pending'"
              variant="ghost"
              size="sm"
              class="-ml-2.5 sm:ml-0"
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
      <p v-else class="text-sm text-muted-foreground">
        {{ $t('admin.companies.invitations.empty') }}
      </p>
    </div>
  </section>
</template>
