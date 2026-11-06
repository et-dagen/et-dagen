<script setup lang="ts">
  import DayRoute from '@/components/forcompanies/DayRoute.vue'
  import SignupActions from '@/components/forcompanies/SignupActions.vue'

  const { t } = useI18n()
  useHead(() => ({ title: t('forcompanies.title') }))

  const SECTIONS = ['audience', 'practical', 'tips'] as const
  const FIELDS = [
    'acoustics',
    'analog',
    'digital',
    'quantum',
    'signal',
    'space',
  ] as const
  const QUESTIONS = ['help', 'equipment'] as const
  const TIPS = ['talk', 'jobs', 'space', 'remembered', 'follow'] as const

  const sectionHeading = 'text-2xl font-extrabold tracking-tight'
</script>

<template>
  <div class="et-ui">
    <div
      class="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-8 lg:gap-20 lg:px-8 lg:py-12"
    >
      <div class="flex flex-col gap-10">
        <header
          class="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12"
        >
          <div class="flex flex-col gap-4">
            <h1
              class="max-w-3xl text-4xl leading-[1.08] font-extrabold tracking-tight text-balance lg:text-[2.875rem]"
            >
              {{ $t('forcompanies.heading') }}
            </h1>
            <p class="max-w-[60ch] text-lg text-muted-foreground">
              {{ $t('forcompanies.lead') }}
            </p>
          </div>
          <div class="flex flex-col gap-3 rounded-lg border bg-card p-5">
            <div>
              <h2 class="font-extrabold">
                {{ $t('forcompanies.signup.title') }}
              </h2>
              <p class="mt-1 text-sm text-muted-foreground">
                {{ $t('forcompanies.signup.text') }}
              </p>
            </div>
            <SignupActions />
          </div>
        </header>

        <section aria-labelledby="day" class="flex flex-col gap-6">
          <h2 id="day" :class="sectionHeading">
            {{ $t('forcompanies.day.heading') }}
          </h2>
          <DayRoute />
        </section>

        <nav
          :aria-label="$t('forcompanies.index.label')"
          class="flex flex-wrap gap-x-6 gap-y-2 border-t pt-4 text-sm font-bold"
        >
          <a
            v-for="section in SECTIONS"
            :key="section"
            :href="`#${section}`"
            class="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {{ $t(`forcompanies.index.${section}`) }}
          </a>
        </nav>
      </div>

      <section
        aria-labelledby="audience"
        class="grid scroll-mt-24 gap-8 lg:grid-cols-2 lg:gap-12"
      >
        <div class="flex flex-col gap-4">
          <h2 id="audience" :class="sectionHeading">
            {{ $t('forcompanies.audience.heading') }}
          </h2>
          <p class="max-w-[65ch] text-lg">
            {{ $t('forcompanies.audience.intro') }}
          </p>
          <p class="max-w-[65ch] text-muted-foreground">
            {{ $t('forcompanies.audience.venue') }}
          </p>
          <p class="max-w-[65ch] text-muted-foreground">
            {{ $t('forcompanies.audience.promoted') }}
          </p>
        </div>
        <div
          class="self-start rounded-lg bg-plate px-6 py-5 text-plate-foreground"
        >
          <h3 class="font-bold text-plate-foreground/75">
            {{ $t('forcompanies.audience.fields') }}
          </h3>
          <ul class="mt-2 divide-y divide-plate-foreground/15">
            <li
              v-for="field in FIELDS"
              :key="field"
              class="py-2 text-lg leading-snug font-extrabold"
            >
              {{ $t(`forcompanies.audience.field.${field}`) }}
            </li>
          </ul>
        </div>
      </section>

      <section aria-labelledby="practical" class="scroll-mt-24">
        <h2 id="practical" :class="sectionHeading">
          {{ $t('forcompanies.practical.heading') }}
        </h2>
        <dl class="mt-6 grid gap-8 md:grid-cols-2 lg:gap-12">
          <div
            v-for="question in QUESTIONS"
            :key="question"
            class="border-t-4 border-plate pt-4"
          >
            <dt class="text-lg font-extrabold">
              {{ $t(`forcompanies.practical.${question}.q`) }}
            </dt>
            <dd class="mt-2 text-muted-foreground">
              {{ $t(`forcompanies.practical.${question}.a`) }}
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="tips" class="scroll-mt-24">
        <h2 id="tips" :class="sectionHeading">
          {{ $t('forcompanies.tips.heading') }}
        </h2>
        <ul class="mt-6 grid gap-x-12 gap-y-6 md:grid-cols-2">
          <li v-for="tip in TIPS" :key="tip" class="max-w-[60ch]">
            <h3 class="font-extrabold">
              {{ $t(`forcompanies.tips.${tip}.title`) }}
            </h3>
            <p class="mt-1 text-muted-foreground">
              {{ $t(`forcompanies.tips.${tip}.text`) }}
            </p>
          </li>
        </ul>
      </section>

      <section
        aria-labelledby="closing"
        class="flex flex-col gap-5 rounded-lg border bg-card p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8"
      >
        <div>
          <h2 id="closing" :class="sectionHeading">
            {{ $t('forcompanies.closing.heading') }}
          </h2>
          <p class="mt-2 text-muted-foreground">
            {{ $t('forcompanies.closing.text') }}
          </p>
        </div>
        <SignupActions class="lg:w-80 lg:shrink-0" />
      </section>
    </div>
  </div>
</template>
