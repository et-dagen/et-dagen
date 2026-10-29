<script setup lang="ts">
  import UserForm from '@/components/admin/form/UserForm.vue'
  import { userTypeOf } from '@/contracts/user'
  import type { User } from '~/models/User'

  const uid = String(useRoute().params.id)
  const { data: users } = await useFetch<User[]>('/api/v1/user', {
    query: { scope: 'all' },
  })
  // stored roles and memberships, or for a user not migrated yet what the migration will give them
  const { data: access } = await useFetch('/api/v1/user/access', {
    query: { uid },
  })
  const user = computed(() => users.value?.find((u) => u.uid === uid))

  // the form's shape, from the profile and the access
  const initial = computed(() => {
    const u = user.value
    if (!u) return null
    const { userType, companyUIDs, withheld } = access.value
      ? userTypeOf(access.value)
      : { userType: 'basic' as const, companyUIDs: [], withheld: [] }
    return {
      userType,
      companyUIDs,
      withheld,
      name: u.name ?? '',
      studyProgram: u.studyProgram ?? '',
      currentYear: u.currentYear ? Number(u.currentYear) : '',
      companyUID: userType === 'company' ? (companyUIDs[0] ?? '') : '',
      dietaryRestrictions: Array.isArray(u.dietaryRestrictions)
        ? u.dietaryRestrictions
        : [],
    }
  })
</script>

<template>
  <UserForm
    v-if="initial"
    :uid="uid"
    :email="user?.email ?? ''"
    :initial="initial"
  />
  <p v-else class="tw:text-muted-foreground">
    {{ $t('admin.users.form.missing') }}
  </p>
</template>
