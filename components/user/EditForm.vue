<script setup lang="ts">
  import EmailInput from '@/components/form/EmailInput.vue'
  import SelectInput from '@/components/form/SelectInput.vue'
  import TextInput from '@/components/form/TextInput.vue'
  import DietInput from '@/components/user/DietInput.vue'
  import FormButton from '@/components/user/FormButton.vue'
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
  const fieldProps = (state: { errors: string[] }) => ({
    'error-messages': state.errors.map((error) => t(`form.errors.${error}`)),
  })
  const [name, nameProps] = form.defineField('name', { props: fieldProps })
  const [currentYear, currentYearProps] = form.defineField('currentYear', {
    props: fieldProps,
  })
  const [dietaryRestrictions] = form.defineField('dietaryRestrictions')
</script>

<template>
  <h4
    class="tw:pt-16 tw:pb-4 tw:text-center tw:text-[2.125rem] tw:leading-10 tw:font-bold tw:tracking-[0.0073529412em] tw:min-[600px]:text-5xl tw:min-[600px]:leading-[3.125rem] tw:min-[600px]:tracking-normal"
  >
    {{ $t('edit.user.title') }}
  </h4>

  <form novalidate @submit.prevent="submit">
    <div class="tw:mx-auto tw:max-w-[50rem] tw:px-1 tw:pt-1">
      <div class="tw:py-[0.6rem]">
        <TextInput
          v-model="name"
          v-bind="nameProps"
          autocomplete="name"
          :content="{
            label: $t('edit.user.attributes.name'),
          }"
        />
      </div>

      <!-- email: the sign-in, changed only by an admin -->
      <div class="tw:py-[0.6rem]">
        <EmailInput
          :model-value="user.email"
          :label="$t('edit.user.attributes.email')"
          :hint="$t('user.profile.email_hint')"
          persistent-hint
          readonly
        />
      </div>

      <div v-if="student" class="tw:py-[0.6rem]">
        <SelectInput
          v-model="currentYear"
          v-bind="currentYearProps"
          :content="{
            label: $t('edit.user.attributes.currentyear'),
            options: years,
          }"
        />
      </div>

      <DietInput v-model="dietaryRestrictions" />
    </div>

    <div
      class="tw:mx-auto tw:grid tw:max-w-[50rem] tw:grid-cols-2 tw:gap-6 tw:p-4"
    >
      <FormButton
        tone="error"
        look="outlined"
        class="tw:w-full"
        @click="router.back()"
      >
        {{ $t('edit.user.cancel') }}
      </FormButton>
      <FormButton
        tone="success"
        look="flat"
        type="submit"
        class="tw:w-full"
        :disabled="!form.meta.value.dirty"
        :loading="saving"
      >
        {{ $t('edit.user.save') }}
      </FormButton>
    </div>
  </form>
</template>
