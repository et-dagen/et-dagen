<script setup lang="ts">
  import {
    FileText,
    ListChecks,
    Ticket,
    UserRound,
    Utensils,
    Settings,
  } from '@lucide/vue'

  const groups = [
    {
      title: 'user.page.events',
      links: [
        { to: '#billett', label: 'user.page.ticket', icon: Ticket },
        { to: '#pameldinger', label: 'user.page.sign_ups', icon: ListChecks },
      ],
    },
    {
      title: 'user.page.information',
      links: [
        { to: '#profil', label: 'user.page.profile', icon: UserRound },
        { to: '#cv', label: 'user.resume.resume', icon: FileText },
        { to: '#allergier', label: 'user.page.allergies', icon: Utensils },
        { to: '#konto', label: 'user.page.account', icon: Settings },
      ],
    },
  ]
</script>

<template>
  <nav :aria-label="$t('user.page.sections')" class="tw:space-y-8">
    <div v-for="group in groups" :key="group.title">
      <p class="tw:px-3 tw:font-bold">{{ $t(group.title) }}</p>
      <ul class="tw:mt-2 tw:space-y-0.5">
        <li v-for="link in group.links" :key="link.to">
          <a
            :href="link.to"
            class="tw:flex tw:items-center tw:gap-3 tw:rounded-md tw:px-3 tw:py-2 tw:text-muted-foreground tw:transition-colors tw:hover:bg-muted tw:hover:text-foreground"
          >
            <component :is="link.icon" class="tw:size-4" aria-hidden="true" />
            {{ $t(link.label) }}
          </a>
        </li>
      </ul>
    </div>
  </nav>
</template>
