<script setup lang="ts">
  import UserForm from '@/components/admin/form/UserForm.vue'
  import type { User } from '~/models/User'

  const uid = String(useRoute().params.id)
  const { data: users } = await useFetch<User[]>('/api/v1/user', {
    query: { scope: 'all' },
  })
  const user = computed(() => users.value?.find((u) => u.uid === uid))

  // the form's shape, from what v1 stores
  const initial = computed(() => {
    const u = user.value
    if (!u) return null
    const role = u.userType ?? 'basic'
    return {
      userType: role,
      name: u.name ?? '',
      email: u.email ?? '',
      studyProgram: u.studyProgram ?? '',
      currentYear: u.currentYear ? Number(u.currentYear) : '',
      companyUID: u.companyUID ?? '',
      dietaryRestrictions: Array.isArray(u.dietaryRestrictions)
        ? u.dietaryRestrictions
        : [],
    }
  })
</script>

<template>
  <UserForm v-if="initial" :uid="uid" :initial="initial" />
  <p v-else class="tw:text-muted-foreground">
    {{ $t('admin.users.form.missing') }}
  </p>
</template>
