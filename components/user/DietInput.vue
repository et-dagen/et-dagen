<script setup lang="ts">
  import SelectInput from '@/components/form/SelectInput.vue'
  import TextInput from '@/components/form/TextInput.vue'
  import { Label } from '@/components/ui/label'
  import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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

  // a radio's value is a string, so the yes or no travels as one
  const answer = computed({
    get: () => (hasRestrictions.value ? 'yes' : 'no'),
    set: (value) => (hasRestrictions.value = value === 'yes'),
  })
  const id = useId()
  const ANSWERS = [
    { value: 'no', label: 'user.register.dietary_restrictions.norestrictions' },
    { value: 'yes', label: 'user.register.dietary_restrictions.restrictions' },
  ]
</script>

<template>
  <div class="tw:pb-[22px]">
    <p
      :id="`${id}-label`"
      class="tw:ps-4 tw:text-base tw:leading-6 tw:tracking-[0.009375em] tw:text-black/60"
    >
      {{ $t('user.register.dietary_restrictions.name') }}
    </p>
    <RadioGroup
      v-model="answer"
      :aria-labelledby="`${id}-label`"
      class="tw:mt-2 tw:gap-0"
    >
      <div
        v-for="option in ANSWERS"
        :key="option.value"
        class="tw:flex tw:min-h-10 tw:items-center tw:gap-2.5 tw:ps-4"
      >
        <RadioGroupItem
          :id="`${id}-${option.value}`"
          :value="option.value"
          class="tw:relative tw:size-5 tw:border-2 tw:border-black/60 tw:text-black/87 tw:shadow-none tw:data-[state=checked]:border-black/87"
        >
          <span
            class="tw:absolute tw:top-1/2 tw:left-1/2 tw:size-2.5 tw:-translate-1/2 tw:rounded-full tw:bg-current"
          />
        </RadioGroupItem>
        <Label
          :for="`${id}-${option.value}`"
          class="tw:text-base tw:leading-6 tw:font-normal tw:tracking-[0.009375em]"
        >
          {{ $t(option.label) }}
        </Label>
      </div>
    </RadioGroup>
  </div>
  <template v-if="hasRestrictions">
    <SelectInput
      v-model="chosen"
      multiple
      :content="{
        label: $t('user.register.dietary_restrictions.name'),
        options,
      }"
    />
    <TextInput
      v-model="other"
      :content="{
        label: $t('user.register.dietary_restrictions.other'),
      }"
    />
  </template>
</template>
