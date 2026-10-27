<script setup lang="ts">
  import { movedEditorPath } from '@/lib/admin/movedEditors'

  // the old editor's address; the form lives in the admin or company panel now
  definePageMeta({
    protected: true,
    area: 'admin',
    middleware: () =>
      navigateTo(
        useLocalePath()(
          movedEditorPath('company', undefined, useAuthStore().allows('admin')),
        ),
      ),
  })
</script>

<template>
  <div />
</template>
