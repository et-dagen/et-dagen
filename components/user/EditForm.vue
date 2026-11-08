<script setup lang="ts">
  import EmailInput from '@/components/form/EmailInput.vue'
  import SelectInput from '@/components/form/SelectInput.vue'
  import TextInput from '@/components/form/TextInput.vue'
  import DietInput from '@/components/user/DietInput.vue'
  import { useResourceForm } from '@/composables/admin/useResourceForm'
  import { useProgrammes } from '@/composables/useProgrammes'
  import { profileInput, toV1Profile } from '@/contracts/profile'
  import { STUDY_YEARS } from '@/lib/user/programmes'
  import { useAuthStore } from '@/stores/authStore'

  const router = useRouter()
  const auth = useAuthStore()
  const { t } = useI18n()

  // a company contact has no study programme or year
  const student = !(auth.currentSubject?.roles.includes('company') ?? false)
  const user = auth.user!

  const { yearsOf } = await useProgrammes()
  // a student without a programme on record may still pick any year
  const years = computed(() =>
    user.studyProgram ? yearsOf(user.studyProgram) : STUDY_YEARS,
  )

  const { form, submit, saving } = useResourceForm({
    schema: profileInput(student),
    initial: {
      name: user.name ?? '',
      currentYear: student ? Number(user.currentYear) || undefined : null,
      dietaryRestrictions: Object.values(user.dietaryRestrictions ?? {}).map(
        String,
      ),
    },
    back: '/user',
    saved: () => t('user.profile.saved'),
    save: async (values) => {
      const { profile, account } = toV1Profile(
        user.uid,
        values,
        user.studyProgram,
      )
      await $fetch('/api/v1/user', { method: 'POST', body: profile })
      await $fetch('/api/v1/user', { method: 'PUT', body: account })
      // Min side reads the signed-in user from the store
      auth.user = {
        ...auth.user!,
        name: values.name,
        currentYear: profile.currentYear ?? undefined,
        dietaryRestrictions: profile.dietaryRestrictions,
      }
    },
  })

  // the contract's messages are keys under form.errors
  const vuetifyProps = (state: { errors: string[] }) => ({
    'error-messages': state.errors.map((error) => t(`form.errors.${error}`)),
  })
  const [name, nameProps] = form.defineField('name', { props: vuetifyProps })
  const [currentYear, currentYearProps] = form.defineField('currentYear', {
    props: vuetifyProps,
  })
  const [dietaryRestrictions] = form.defineField('dietaryRestrictions')
</script>

<template>
  <!-- Header -->
  <h4 class="text-sm-h3 text-h4 font-weight-bold text-center pt-16 pb-4">
    {{ $t('edit.user.title') }}
  </h4>

  <!-- Edit Form -->
  <VForm @submit.prevent="submit">
    <VContainer>
      <!-- Name -->
      <VRow>
        <TextInput
          v-model="name"
          v-bind="nameProps"
          autocomplete="name"
          :content="{
            label: $t('edit.user.attributes.name'),
          }"
        />
      </VRow>

      <!-- email: the sign-in, changed only by an admin -->
      <VRow>
        <EmailInput
          :model-value="user.email"
          :label="$t('edit.user.attributes.email')"
          :hint="$t('user.profile.email_hint')"
          persistent-hint
          readonly
        />
      </VRow>

      <!-- current year -->
      <VRow v-if="student">
        <SelectInput
          v-model="currentYear"
          v-bind="currentYearProps"
          :content="{
            label: $t('edit.user.attributes.currentyear'),
            options: years,
          }"
        />
      </VRow>

      <!-- dietary restrictions -->
      <DietInput v-model="dietaryRestrictions" />
    </VContainer>

    <!-- Actions -->
    <VContainer>
      <VRow justify="center">
        <VCol cols="6">
          <VBtn block variant="outlined" color="error" @click="router.back()">
            {{ $t('edit.user.cancel') }}
          </VBtn>
        </VCol>
        <VCol cols="6">
          <VBtn
            block
            variant="flat"
            color="success"
            type="submit"
            :disabled="!form.meta.value.dirty"
            :loading="saving"
          >
            {{ $t('edit.user.save') }}
          </VBtn>
        </VCol>
      </VRow>
    </VContainer>
  </VForm>
</template>

<style scoped lang="scss">
  .v-container {
    max-width: 50rem;
  }

  .v-row {
    padding-block: 0.6rem;
  }
</style>
