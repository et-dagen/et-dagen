<script setup lang="ts">
  import { movedEditorPath } from '@/lib/admin/movedEditors'

  // the old editor's address; the form lives in the admin or company panel now
  definePageMeta({
    protected: true,
    area: 'admin',
    middleware: (to) =>
      navigateTo(
        useLocalePath()(
          movedEditorPath(
            'company',
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
