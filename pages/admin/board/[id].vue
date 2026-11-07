<script setup lang="ts">
  import BoardMemberForm from '@/components/admin/form/BoardMemberForm.vue'
  import type { ListedMember } from '@/contracts/board'

  const id = String(useRoute().params.id)
  const { data: board } = await useFetch<ListedMember[]>('/api/v1/board')
  const member = computed(() => board.value?.find((m) => m.id === id))
</script>

<template>
  <BoardMemberForm
    v-if="member"
    :id="id"
    :photo="member.photoUrl"
    :initial="{
      name: member.name,
      titleNb: member.title.nb,
      titleEn: member.title.en,
      email: member.email,
      phone: member.phone ?? '',
      featured: member.featured,
    }"
  />
  <p v-else class="tw:text-muted-foreground">
    {{ $t('admin.board.form.missing') }}
  </p>
</template>
