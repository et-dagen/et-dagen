<script setup lang="ts">
  import { useForm } from 'vee-validate'
  import EmailInput from '@/components/form/EmailInput.vue'
  import SelectInput from '@/components/form/SelectInput.vue'
  import TextInput from '@/components/form/TextInput.vue'
  import DietInput from '@/components/user/DietInput.vue'
  import PasswordInput from '@/components/user/PasswordInput.vue'
  import { alertError, notify } from '@/composables/useAlerts'
  import { registerUser } from '@/composables/auth/registration'
  import { useProgrammes } from '@/composables/useProgrammes'
  import { StudentSignup } from '@/contracts/user'
  import { typedSchemaOf } from '@/lib/forms/zodSchema'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const { open: programmes, yearsOf, labelOf } = await useProgrammes()

  const programmeOptions = computed(() =>
    programmes.value
      .map((programme) => ({
        title: labelOf(programme),
        value: programme.code,
      }))
      .sort((a, b) => a.title.localeCompare(b.title)),
  )

  const form = useForm({
    validationSchema: typedSchemaOf(StudentSignup),
    initialValues: { dietaryRestrictions: [] },
  })

  // the contract's messages are keys under form.errors
  const vuetifyProps = (state: { errors: string[] }) => ({
    'error-messages': state.errors.map((error) => t(`form.errors.${error}`)),
  })
  const field = <K extends keyof StudentSignup>(name: K) =>
    form.defineField(name, { props: vuetifyProps })

  const [name, nameProps] = field('name')
  const [email, emailProps] = field('email')
  const [password, passwordProps] = field('password')
  const [studyProgram, studyProgramProps] = field('studyProgram')
  const [currentYear, currentYearProps] = field('currentYear')
  const [dietaryRestrictions] = field('dietaryRestrictions')

  const years = computed(() => yearsOf(studyProgram.value))
  // a year the new programme does not have would be refused; clear it
  watch(years, (offered) => {
    if (currentYear.value && !offered.includes(Number(currentYear.value))) {
      form.setFieldValue('currentYear', undefined as never, false)
    }
  })

  // the contract checks one password; the second is only typed to catch a slip
  const passwordConfirmation = ref('')
  const confirmChecked = ref(false)
  const confirmErrors = computed(() =>
    confirmChecked.value && passwordConfirmation.value !== password.value
      ? [t('error.form.general.equal_password')]
      : [],
  )

  const userType = ref<'student' | 'company'>('student')
  const isRegistering = ref<boolean>(false)

  const register = form.handleSubmit(
    async (values) => {
      if (confirmErrors.value.length) return
      isRegistering.value = true
      try {
        await registerUser(values)
      } catch (cause) {
        if ((cause as { code?: string }).code === 'auth/email-already-in-use') {
          form.setFieldError('email', 'email_taken')
        } else {
          alertError(cause)
        }
      } finally {
        isRegistering.value = false
      }
    },
    () => notify(t('alert.error.form.invalid'), 'error'),
  )

  const submit = () => {
    confirmChecked.value = true
    return register()
  }
</script>

<template>
  <VForm @submit.prevent="submit">
    <VContainer>
      <VRow>
        <TextInput
          v-model="name"
          v-bind="nameProps"
          autocomplete="name"
          :content="{
            label: $t('user.register.full_name'),
          }"
        />
      </VRow>
      <VRow>
        <EmailInput v-model="email" v-bind="emailProps" autocomplete="email" />
      </VRow>
      <VRow>
        <PasswordInput
          v-model="password"
          v-bind="passwordProps"
          autocomplete="new-password"
        />
      </VRow>
      <VRow>
        <PasswordInput
          v-model="passwordConfirmation"
          :error-messages="confirmErrors"
          autocomplete="new-password"
          confirm-password
        />
      </VRow>
      <DietInput v-model="dietaryRestrictions" />
    </VContainer>
    <VContainer class="px-0">
      <VTabs v-model="userType" fixed-tabs color="primary" class="tabs">
        <VTab value="student">{{ $t('user.register.user_type.student') }}</VTab>
        <VTab value="company">{{ $t('user.register.user_type.company') }}</VTab>
      </VTabs>
      <VCardText class="px-0">
        <VWindow v-model="userType">
          <VWindowItem value="student">
            <SelectInput
              v-model="studyProgram"
              v-bind="studyProgramProps"
              :content="{
                label: $t('user.register.study_program'),
                options: programmeOptions,
              }"
            />
            <SelectInput
              v-model="currentYear"
              v-bind="currentYearProps"
              :content="{
                label: $t('user.register.year'),
                options: years,
              }"
            />
          </VWindowItem>

          <VWindowItem value="company">
            <p>{{ $t('signup.company.lead') }}</p>
            <VBtn
              color="primary"
              variant="outlined"
              class="btn--submit mt-4"
              :to="localePath('/company/join')"
            >
              {{ $t('signup.join_company') }}
            </VBtn>
          </VWindowItem>
        </VWindow>
      </VCardText>
      <VBtn
        v-if="userType === 'student'"
        color="success"
        type="submit"
        class="btn--submit"
        :loading="isRegistering"
      >
        {{ $t('user.sign_up') }}
      </VBtn>
    </VContainer>
  </VForm>
</template>

<style scoped lang="scss">
  @use 'sass:map';
  @use 'vuetify/settings';

  .v-container {
    max-width: 26rem;
  }

  .v-row {
    padding-block: 0.6rem;
  }

  .v-tab--selected {
    background: rgba(var(--v-theme-accent), 0.08);
  }

  .v-window__container {
    div {
      padding-block: 0.6rem;
    }
  }

  .btn--submit {
    width: 60%;
    margin-inline: 20%;
  }

  @media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
    .v-tab {
      font-size: 1rem;
    }

    .btn--submit {
      width: 100%;
      margin: 0;
    }
  }
</style>
