<script setup lang="ts">
  import { movedEditorPath } from '@/lib/admin/movedEditors'

  // the old editor's address; the form lives in the admin or company panel now
  definePageMeta({
    protected: true,
    area: 'events',
    middleware: (to) =>
      navigateTo(
        useLocalePath()(
          movedEditorPath(
            'event',
            String(to.params.id),
            useAuthStore().allows('admin'),
          ),
        ),
      ),
  })
</script>

<template>
  <div />
</template>
