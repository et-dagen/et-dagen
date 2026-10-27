<script setup lang="ts">
  import { movedEditorPath } from '@/lib/admin/movedEditors'

  // the old editor's address; the form lives in the admin or company panel now
  definePageMeta({
    protected: true,
    area: 'jobs',
    middleware: () =>
      navigateTo(
        useLocalePath()(
          movedEditorPath('job', undefined, useAuthStore().allows('admin')),
        ),
      ),
  })
</script>

<template>
  <div />
</template>
