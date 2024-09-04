<script setup lang="ts">
  import type { User } from '../../models/User'

  import { dietaryFlags } from '~/config/app.config'

  const props = defineProps({
    user: {
      type: Object as PropType<User>,
      required: true,
    },
  })

  const router = useRouter()
  const useAlerts = useAlertStore()

  // get study programmes
  const { data: studyProgrammes } = await useFetch('/api/programme')
  const programmeList = computed(() =>
    studyProgrammes.value.map((prog: any) => prog.name).sort(),
  )
  const yearOptions = computed(() => {
    return (studyProgram: string) => {
      const programme = studyProgrammes.value.find(
        (prog: any) => prog.name === studyProgram,
      )

      if (!programme || programme.type === 'integrated') return [1, 2, 3, 4, 5]

      switch (programme.type) {
        case 'bachelor':
          return [1, 2, 3]
        case 'master':
          return [4, 5]
        default:
          return []
      }
    }
  })

  // get companies
  const { data: companies } = await useFetch('/api/company')
  const companyList = computed(() => {
    return embedKeyIntoObjectValues(companies.value).map((company) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { uid, name, ...remains } = company
      return {
        value: uid,
        title: name,
      }
    })
  })

  // handle user privileges
  const auth = useAuthStore()
  const { hasAccess } = storeToRefs(auth)
  const isAdmin = computed(() => hasAccess.value(['admin']))

  // Set state to user data plus companyUID
  const state = reactive({ companyUID: null, ...props.user })

  const hasDietaryRestrictions = ref(state.dietaryRestrictions)

  const otherRestrictions = ref<null | string>(null)

  // initially assumed to have dietary restrictions
  const hasDietaryRestrictionsBool = ref(true)
  let initialHasDietaryRestrictionsBool = true

  // set dietary restrictions to false if there is none
  if (
    !hasDietaryRestrictions.value ||
    Object.keys(hasDietaryRestrictions.value).length === 0
  ) {
    hasDietaryRestrictionsBool.value = false
    initialHasDietaryRestrictionsBool = false
  }

  const getDietaryRestrictionsOptions = ($t) => {
    const options = dietaryFlags
      .map((flag) => ({
        title: $t(`dietary_restrictions.${flag.name}`),
        value: flag.name,
      }))
      .sort()

    // Check if there are any additional dietary restrictions in state
    if (state.dietaryRestrictions && state.dietaryRestrictions.length > 0) {
      state.dietaryRestrictions.forEach((restriction) => {
        if (!options.some((option) => option.value === restriction)) {
          options.push({
            title: restriction,
            value: restriction,
          })
        }
      })
    }
    return options
  }

  // Reset currentYear if programme doesn't have that year
  watch(
    () => state.studyProgram,
    (program) => {
      if (!yearOptions.value(program).includes(Number(state.currentYear)))
        state.currentYear = ''
    },
  )

  // check if user has changed
  const hasChanged = computed(() => {
    if (otherRestrictions.value && otherRestrictions.value !== '') {
      return true
    } else if (
      initialHasDietaryRestrictionsBool !== hasDietaryRestrictionsBool.value
    ) {
      return true
    } else {
      return !compareObjects(state, { companyUID: null, ...props.user })
    }
  })

  const form = ref()

  // save changes to user
  const saveChanges = async () => {
    // throw error on invalid form
    const { valid } = await form.value.validate()
    try {
      if (!valid) throw new Error('Form is not valid')
    } catch (error) {
      useAlerts.alert(getI18nString('alert.error.form.invalid'), 'error')
      return
    }

    if (state.userType !== 'company') {
      state.companyUID = null
    }

    // check for other dietary restrictions
    if (otherRestrictions.value && otherRestrictions.value !== '') {
      otherRestrictions?.value
        .split(',')
        .map((restriction) => state.dietaryRestrictions?.push(restriction))
    }
    // check if all dietary restrictions should be removed
    if (hasDietaryRestrictionsBool.value === false) {
      state.dietaryRestrictions = []
    }

    // update user
    await useAsyncData('update-user', async () => {
      await Promise.all([
        $fetch('/api/user', {
          method: 'POST',
          body: {
            ...state,
          },
        }),
        $fetch('/api/user', {
          method: 'PUT',
          body: {
            ...state,
          },
        }),
      ])
    })
      .then(async () => {
        useAlerts.alert(getI18nString('alert.success.user.edit'), 'success')

        if (state.uid === auth.user?.uid) {
          // sign out the new user
          await signoutUser()

          // navigate to sign in page
          const localePath = useLocalePath()
          await navigateTo({
            path: localePath('/user/signin'),
            query: {
              registered: 'true',
            },
          })
        } else {
          setTimeout(() => router.back(), 2000)
        }
      })
      .catch((error) => {
        console.error(error)
        getApiResponseAlertContext(error.statusMessage)
      })
  }
</script>

<template>
  <!-- Header -->
  <h4 class="text-sm-h3 text-h4 font-weight-bold text-center pt-16 pb-4">
    {{ $t('edit.user.title') }}
  </h4>

  <!-- Edit Form -->
  <VForm ref="form" @submit.prevent="saveChanges">
    <VContainer>
      <!-- Name -->
      <VRow>
        <FormTextInput
          v-model="state.name"
          :content="{
            label: $t('edit.user.attributes.name'),
          }"
          :rules="[useRequiredInput]"
        />
      </VRow>

      <!-- email -->
      <VRow>
        <FormEmailInput
          v-model="state.email"
          :content="{
            label: $t('edit.user.attributes.email'),
          }"
          :rules="[useRequiredInput, useValidateEmail]"
        />
      </VRow>

      <!-- user type -->
      <VRow v-if="isAdmin">
        <FormSelectInput
          v-model="state.userType"
          :content="{
            label: $t('edit.user.attributes.type.name'),
            options: [
              { title: $t('edit.user.attributes.type.admin'), value: 'admin' },
              {
                title: $t('edit.user.attributes.type.company'),
                value: 'company',
              },
              { title: $t('edit.user.attributes.type.basic'), value: 'basic' },
            ],
          }"
          :rules="[useRequiredInput]"
        />
      </VRow>

      <!-- company affiliation -->
      <VRow v-if="isAdmin && state.userType === 'company'">
        <FormSelectInput
          v-model="state.companyUID"
          :content="{
            label: $t('edit.user.attributes.company'),
            options: companyList,
          }"
          :rules="[useRequiredInput]"
        />
      </VRow>

      <!-- study programme -->
      <VRow v-if="isAdmin && state.userType !== 'company'">
        <FormSelectInput
          v-model="state.studyProgram"
          :content="{
            label: $t('edit.user.attributes.studyprogram'),
            options: programmeList,
          }"
          :rules="[useRequiredInput]"
        />
      </VRow>

      <!-- current year -->
      <VRow v-if="isAdmin && state.userType !== 'company'">
        <FormSelectInput
          v-model="state.currentYear"
          :content="{
            label: $t('edit.user.attributes.currentyear'),
            options: yearOptions(state.studyProgram),
          }"
          :rules="[useRequiredInput]"
        />
      </VRow>

      <!-- dietary restrictions -->

      <VRow>
        <VRadioGroup
          v-model="hasDietaryRestrictionsBool"
          :label="$t('user.register.dietary_restrictions.name')"
        >
          <VRadio
            :label="$t('user.register.dietary_restrictions.norestrictions')"
            :value="false"
          ></VRadio>
          <VRadio
            :label="$t('user.register.dietary_restrictions.restrictions')"
            :value="true"
          ></VRadio>
        </VRadioGroup>
      </VRow>

      <VRow v-if="hasDietaryRestrictionsBool">
        <FormSelectInput
          v-model="state.dietaryRestrictions"
          multiple
          :content="{
            label: $t('user.register.dietary_restrictions.name'),
            options: getDietaryRestrictionsOptions($t),
          }"
          :rules="[hasDietaryRestrictions ? useRequiredInput : null]"
        />
      </VRow>

      <VRow v-if="hasDietaryRestrictionsBool" class="mt-3 pt-0">
        <FormTextInput
          v-model="otherRestrictions"
          :content="{
            label: $t('user.register.dietary_restrictions.other'),
          }"
        />
      </VRow>
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
            :disabled="!hasChanged"
            @click="saveChanges"
          >
            {{ $t('edit.user.save') }}
          </VBtn>
        </VCol>
      </VRow>
    </VContainer>
  </VForm>
</template>

<style scoped lang="scss">
  @import 'vuetify/settings';
  .title {
    text-align: center;
  }
  .v-container {
    max-width: 50rem;
  }
  .v-row {
    padding-block: 0.6rem;
  }
</style>
