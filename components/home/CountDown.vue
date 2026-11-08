<script setup lang="ts">
  import { ArrowRight } from '@lucide/vue'
  import { Button } from '@/components/ui/button'
  import { Card } from '@/components/ui/card'
  import { Instant, type ISO8601String } from '@/domain/time'
  import { timeUntil, type Countdown } from '@/lib/site/fair'

  const localePath = useLocalePath()

  const props = defineProps<{
    /** When the fair starts; null counts nothing */
    start: ISO8601String | null
  }>()

  // null until mounted, so the server and the first client render agree
  const timeDiff = ref<Countdown | null>(null)

  const tick = () => {
    timeDiff.value = props.start ? timeUntil(props.start, Instant.now()) : null
  }

  let timer: ReturnType<typeof setInterval> | undefined
  onMounted(() => {
    tick()
    timer = setInterval(tick, 1000)
  })
  onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="tw:mx-auto tw:w-full tw:max-w-[500px] tw:bg-white">
    <p
      class="tw:px-3 tw:pb-2 tw:text-center tw:text-xl tw:leading-8 tw:font-medium tw:tracking-[0.0125em] tw:min-[600px]:pb-6 tw:min-[600px]:text-[2.125rem] tw:min-[600px]:leading-[1.175] tw:min-[600px]:font-normal tw:min-[600px]:tracking-[0.0073em]"
    >
      {{ $t('event.take_off') }}
    </p>

    <div class="tw:grid tw:grid-cols-4">
      <div
        v-for="{ unit, label } in [
          { unit: 'days', label: $t('datetime.times.days') },
          { unit: 'hours', label: $t('datetime.times.hours') },
          { unit: 'minutes', label: $t('datetime.times.minutes') },
          { unit: 'seconds', label: $t('datetime.times.seconds') },
        ] as const"
        :key="unit"
        class="tw:flex tw:flex-col tw:items-center"
      >
        <Card
          class="tw:min-w-[60px] tw:gap-0 tw:rounded tw:border-0 tw:p-4 tw:text-center tw:text-inherit tw:shadow-[0_2px_1px_-1px_rgba(0,0,0,0.2),0_1px_1px_0_rgba(0,0,0,0.14),0_1px_3px_0_rgba(0,0,0,0.12)] tw:min-[960px]:min-w-[90px]"
        >
          <h4
            class="tw:text-2xl tw:leading-[1.333] tw:min-[600px]:text-[2.125rem] tw:min-[600px]:leading-[1.175] tw:min-[600px]:tracking-[0.0073em]"
          >
            {{ timeDiff?.[unit] ?? 0 }}
          </h4>
        </Card>
        <h6
          class="tw:px-1 tw:pt-4 tw:text-center tw:text-sm tw:leading-[1.6] tw:font-medium tw:tracking-[0.0071em] tw:min-[600px]:px-2 tw:min-[600px]:text-xl tw:min-[600px]:leading-8 tw:min-[600px]:tracking-[0.0125em]"
        >
          {{ label }}
        </h6>
      </div>
    </div>

    <div class="tw:flex tw:p-2 tw:pt-4 tw:min-[600px]:pt-7">
      <Button
        class="tw:mx-auto tw:h-10 tw:w-3/4 tw:gap-2.5 tw:rounded tw:border tw:border-white tw:bg-[#c33c3b] tw:px-2 tw:text-white tw:hover:bg-[#c33c3b]/90 tw:has-[>svg]:px-2 tw:min-[960px]:h-[50px] tw:min-[960px]:w-[95%]"
        @click="navigateTo(localePath('/programme'))"
      >
        <span
          class="tw:text-xl tw:leading-8 tw:font-medium tw:tracking-[0.0125em]"
        >
          {{ $t('nav.program_nav') }}
        </span>
        <ArrowRight class="tw:size-6 tw:min-[960px]:size-8" />
      </Button>
    </div>
  </div>
</template>
