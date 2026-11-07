<script setup lang="ts">
  import SelectInput from '@/components/form/SelectInput.vue'
  import TextInput from '@/components/form/TextInput.vue'
  import { dietOf, typedOf } from '@/lib/forms/diet'
  import { dietaryFlags } from '@/config/app.config'

  const diet = defineModel<string[]>({ default: () => [] })

  const { t } = useI18n()
  const KNOWN = dietaryFlags.map((flag) => flag.name)
  const options = computed(() =>
    KNOWN.map((name) => ({
      title: t(`dietary_restrictions.${name}`),
      value: name,
    })).sort((a, b) => a.title.localeCompare(b.title)),
  )

  const hasRestrictions = ref(diet.value.length > 0)
  const chosen = ref(diet.value.filter((value) => KNOWN.includes(value)))
  const other = ref(typedOf(diet.value, KNOWN))

  watch([hasRestrictions, chosen, other], () => {
    diet.value = hasRestrictions.value
      ? dietOf(chosen.value, other.value ?? '')
      : []
  })
</script>

<template>
  <VRow>
    <VRadioGroup
      v-model="hasRestrictions"
      :label="$t('user.register.dietary_restrictions.name')"
    >
      <VRadio
        :label="$t('user.register.dietary_restrictions.norestrictions')"
        :value="false"
      />
      <VRadio
        :label="$t('user.register.dietary_restrictions.restrictions')"
        :value="true"
      />
    </VRadioGroup>
  </VRow>
  <VRow v-if="hasRestrictions">
    <SelectInput
      v-model="chosen"
      multiple
      :content="{
        label: $t('user.register.dietary_restrictions.name'),
        options,
      }"
    />
  </VRow>
  <VRow v-if="hasRestrictions" class="mt-3 pt-0">
    <TextInput
      v-model="other"
      :content="{
        label: $t('user.register.dietary_restrictions.other'),
      }"
    />
  </VRow>
</template>
