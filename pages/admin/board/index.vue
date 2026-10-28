<script setup lang="ts">
  import {
    ArrowDown,
    ArrowUp,
    Pencil,
    Plus,
    Trash2,
    UserRound,
  } from '@lucide/vue'
  import DeleteDialog from '@/components/admin/DeleteDialog.vue'
  import { Badge } from '@/components/ui/badge'
  import { Button } from '@/components/ui/button'
  import { alertError } from '@/composables/useAlerts'
  import type { ListedMember } from '@/contracts/board'

  const { t, locale } = useI18n()
  const localePath = useLocalePath()
  const alerts = useAlertStore()
  // the member saved last stays lit until the admin moves on
  const changed = computed(() => String(useRoute().query.changed ?? ''))

  const { data: board, refresh } =
    await useFetch<ListedMember[]>('/api/v1/board')
  const titleOf = (member: ListedMember) =>
    locale.value.startsWith('en') ? member.title.en : member.title.nb

  const busy = ref(false)
  async function move(member: ListedMember, by: number) {
    busy.value = true
    try {
      await $fetch(`/api/v1/board/${member.id}/order`, {
        method: 'PUT',
        body: { order: member.order + by },
      })
      await refresh()
    } catch (error) {
      alertError(error)
    } finally {
      busy.value = false
    }
  }

  const removing = ref<ListedMember | null>(null)
  const confirming = computed({
    get: () => removing.value !== null,
    set: (open) => {
      if (!open) removing.value = null
    },
  })
  async function remove() {
    const member = removing.value
    if (!member) return
    busy.value = true
    try {
      await $fetch(`/api/v1/board/${member.id}`, { method: 'DELETE' })
      alerts.alert(t('admin.board.removed', { name: member.name }), 'success')
      removing.value = null
      await refresh()
    } catch (error) {
      alertError(error)
    } finally {
      busy.value = false
    }
  }
</script>

<template>
  <div class="tw:flex tw:max-w-4xl tw:flex-col tw:gap-4">
    <div class="tw:flex tw:flex-col tw:gap-3 tw:sm:flex-row tw:sm:items-center">
      <p class="tw:text-muted-foreground">{{ $t('admin.board.intro') }}</p>
      <Button as-child class="tw:h-10 tw:shrink-0 tw:sm:ml-auto">
        <NuxtLink :to="localePath('/admin/board/new')">
          <Plus aria-hidden="true" />
          {{ $t('admin.board.create') }}
        </NuxtLink>
      </Button>
    </div>

    <ol
      v-if="board?.length"
      class="tw:divide-y tw:overflow-hidden tw:rounded-lg tw:border tw:bg-card"
    >
      <li
        v-for="(member, index) in board"
        :key="member.id"
        :data-changed="member.id === changed || undefined"
        class="tw:flex tw:items-center tw:gap-4 tw:p-3 tw:data-changed:bg-signal/15 tw:data-changed:shadow-[inset_4px_0_0_var(--signal)] tw:sm:p-4"
      >
        <div
          class="tw:grid tw:aspect-[5/6] tw:w-14 tw:shrink-0 tw:place-items-center tw:overflow-hidden tw:rounded-md tw:border tw:bg-muted"
        >
          <img
            v-if="member.photoUrl"
            :src="member.photoUrl"
            alt=""
            class="tw:size-full tw:object-cover"
          />
          <UserRound
            v-else
            class="tw:size-6 tw:text-muted-foreground"
            stroke-width="1.5"
            aria-hidden="true"
          />
        </div>

        <div class="tw:min-w-0 tw:flex-1">
          <div class="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
            <NuxtLink
              :to="localePath(`/admin/board/${member.id}`)"
              class="tw:font-bold tw:hover:underline tw:hover:underline-offset-4"
            >
              {{ member.name }}
            </NuxtLink>
            <Badge v-if="member.featured" variant="secondary">
              {{ $t('admin.board.featured') }}
            </Badge>
          </div>
          <p class="tw:text-sm tw:font-semibold tw:text-brand">
            {{ titleOf(member) }}
          </p>
          <p class="tw:truncate tw:text-sm tw:text-muted-foreground">
            {{ member.email
            }}<template v-if="member.phone">, {{ member.phone }}</template>
          </p>
        </div>

        <div class="tw:flex tw:shrink-0 tw:items-center tw:gap-1">
          <Button
            variant="ghost"
            size="icon"
            :disabled="busy || index === 0"
            :aria-label="$t('admin.board.up', { name: member.name })"
            @click="move(member, -1)"
          >
            <ArrowUp aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            :disabled="busy || index === board.length - 1"
            :aria-label="$t('admin.board.down', { name: member.name })"
            @click="move(member, 1)"
          >
            <ArrowDown aria-hidden="true" />
          </Button>
          <Button
            as-child
            variant="ghost"
            size="icon"
            class="tw:hidden tw:sm:inline-flex"
          >
            <NuxtLink
              :to="localePath(`/admin/board/${member.id}`)"
              :aria-label="$t('admin.board.edit', { name: member.name })"
            >
              <Pencil aria-hidden="true" />
            </NuxtLink>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="tw:text-destructive tw:hover:bg-destructive/10 tw:hover:text-destructive"
            :disabled="busy"
            :aria-label="$t('admin.board.remove', { name: member.name })"
            @click="removing = member"
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </li>
    </ol>
    <p
      v-else
      class="tw:rounded-lg tw:border tw:bg-card tw:p-6 tw:text-muted-foreground"
    >
      {{ $t('admin.board.empty') }}
    </p>

    <DeleteDialog
      v-model:open="confirming"
      :title="$t('admin.board.confirm.title')"
      :description="$t('admin.board.confirm.text')"
      :confirm="$t('admin.board.confirm.action')"
      :items="
        removing
          ? [
              {
                key: removing.id,
                label: removing.name,
                detail: titleOf(removing),
              },
            ]
          : []
      "
      :loading="busy"
      @confirm="remove"
    />
  </div>
</template>
