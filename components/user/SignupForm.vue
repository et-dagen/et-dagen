<script setup lang="ts">
  import { useForm } from 'vee-validate'
  import EmailInput from '@/components/form/EmailInput.vue'
  import SelectInput from '@/components/form/SelectInput.vue'
  import TextInput from '@/components/form/TextInput.vue'
  import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from '@/components/ui/tabs'
  import DietInput from '@/components/user/DietInput.vue'
  import FormButton from '@/components/user/FormButton.vue'
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
  const fieldProps = (state: { errors: string[] }) => ({
    'error-messages': state.errors.map((error) => t(`form.errors.${error}`)),
  })
  const field = <K extends keyof StudentSignup>(name: K) =>
    form.defineField(name, { props: fieldProps })

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
  const BUTTON =
    'tw:mx-[20%] tw:w-[60%] tw:max-[960px]:mx-0 tw:max-[960px]:w-full'
  const TAB = [
    'tw:h-full tw:rounded-none tw:border-0 tw:border-b-2 tw:border-transparent',
    'tw:text-sm tw:font-medium tw:tracking-[0.0892em] tw:text-black/87 tw:hover:bg-black/4',
    'tw:max-[960px]:text-base tw:data-[state=active]:shadow-none',
    'tw:data-[state=active]:border-brand tw:data-[state=active]:bg-[#C33C3B]/8',
    'tw:data-[state=active]:text-brand',
  ]
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
  <form class="tw:mx-auto tw:max-w-[26rem]" novalidate @submit.prevent="submit">
    <div class="tw:px-1 tw:pt-1">
      <div class="tw:py-[0.6rem]">
        <TextInput
          v-model="name"
          v-bind="nameProps"
          autocomplete="name"
          :content="{
            label: $t('user.register.full_name'),
          }"
        />
      </div>
      <div class="tw:py-[0.6rem]">
        <EmailInput v-model="email" v-bind="emailProps" autocomplete="email" />
      </div>
      <div class="tw:py-[0.6rem]">
        <PasswordInput
          v-model="password"
          v-bind="passwordProps"
          autocomplete="new-password"
        />
      </div>
      <div class="tw:py-[0.6rem]">
        <PasswordInput
          v-model="passwordConfirmation"
          :error-messages="confirmErrors"
          autocomplete="new-password"
          confirm-password
        />
      </div>
      <DietInput v-model="dietaryRestrictions" />
    </div>
    <Tabs v-model="userType" class="tw:mt-5 tw:gap-0">
      <TabsList
        class="tw:h-12 tw:w-full tw:rounded-none tw:bg-transparent tw:p-0"
      >
        <TabsTrigger value="student" :class="TAB">
          {{ $t('user.register.user_type.student') }}
        </TabsTrigger>
        <TabsTrigger value="company" :class="TAB">
          {{ $t('user.register.user_type.company') }}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="student" class="tw:py-4">
        <div class="tw:py-[0.6rem]">
          <div class="tw:py-[0.6rem]">
            <SelectInput
              v-model="studyProgram"
              v-bind="studyProgramProps"
              :content="{
                label: $t('user.register.study_program'),
                options: programmeOptions,
              }"
            />
          </div>
          <div class="tw:py-[0.6rem]">
            <SelectInput
              v-model="currentYear"
              v-bind="currentYearProps"
              :content="{
                label: $t('user.register.year'),
                options: years,
              }"
            />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="company" class="tw:py-4">
        <div class="tw:py-[0.6rem]">
          <p
            class="tw:text-sm tw:leading-[1.375rem] tw:tracking-[0.0178571429em]"
          >
            {{ $t('signup.company.lead') }}
          </p>
          <FormButton
            as-child
            tone="brand"
            look="outlined"
            :class="['tw:mt-4', BUTTON]"
          >
            <NuxtLink :to="localePath('/company/join')">
              {{ $t('signup.join_company') }}
            </NuxtLink>
          </FormButton>
        </div>
      </TabsContent>
    </Tabs>
    <FormButton
      v-if="userType === 'student'"
      tone="success"
      type="submit"
      :loading="isRegistering"
      :class="BUTTON"
    >
      {{ $t('user.sign_up') }}
    </FormButton>
  </form>
</template>
