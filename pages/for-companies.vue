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

  const sectionHeading = 'tw:text-2xl tw:font-extrabold tw:tracking-tight'
</script>

<template>
  <div class="et-ui">
    <div
      class="tw:mx-auto tw:flex tw:max-w-6xl tw:flex-col tw:gap-16 tw:px-4 tw:py-8 tw:lg:gap-20 tw:lg:px-8 tw:lg:py-12"
    >
      <div class="tw:flex tw:flex-col tw:gap-10">
        <header
          class="tw:grid tw:items-end tw:gap-8 tw:lg:grid-cols-[minmax(0,1fr)_24rem] tw:lg:gap-12"
        >
          <div class="tw:flex tw:flex-col tw:gap-4">
            <h1
              class="tw:max-w-3xl tw:text-4xl tw:leading-[1.08] tw:font-extrabold tw:tracking-tight tw:text-balance tw:lg:text-[2.875rem]"
            >
              {{ $t('forcompanies.heading') }}
            </h1>
            <p class="tw:max-w-[60ch] tw:text-lg tw:text-muted-foreground">
              {{ $t('forcompanies.lead') }}
            </p>
          </div>
          <div
            class="tw:flex tw:flex-col tw:gap-3 tw:rounded-lg tw:border tw:bg-card tw:p-5"
          >
            <div>
              <h2 class="tw:font-extrabold">
                {{ $t('forcompanies.signup.title') }}
              </h2>
              <p class="tw:mt-1 tw:text-sm tw:text-muted-foreground">
                {{ $t('forcompanies.signup.text') }}
              </p>
            </div>
            <SignupActions />
          </div>
        </header>

        <section aria-labelledby="day" class="tw:flex tw:flex-col tw:gap-6">
          <h2 id="day" :class="sectionHeading">
            {{ $t('forcompanies.day.heading') }}
          </h2>
          <DayRoute />
        </section>

        <nav
          :aria-label="$t('forcompanies.index.label')"
          class="tw:flex tw:flex-wrap tw:gap-x-6 tw:gap-y-2 tw:border-t tw:pt-4 tw:text-sm tw:font-bold"
        >
          <a
            v-for="section in SECTIONS"
            :key="section"
            :href="`#${section}`"
            class="tw:text-muted-foreground tw:underline-offset-4 tw:hover:text-foreground tw:hover:underline"
          >
            {{ $t(`forcompanies.index.${section}`) }}
          </a>
        </nav>
      </div>

      <section
        aria-labelledby="audience"
        class="tw:grid tw:scroll-mt-24 tw:gap-8 tw:lg:grid-cols-2 tw:lg:gap-12"
      >
        <div class="tw:flex tw:flex-col tw:gap-4">
          <h2 id="audience" :class="sectionHeading">
            {{ $t('forcompanies.audience.heading') }}
          </h2>
          <p class="tw:max-w-[65ch] tw:text-lg">
            {{ $t('forcompanies.audience.intro') }}
          </p>
          <p class="tw:max-w-[65ch] tw:text-muted-foreground">
            {{ $t('forcompanies.audience.venue') }}
          </p>
          <p class="tw:max-w-[65ch] tw:text-muted-foreground">
            {{ $t('forcompanies.audience.promoted') }}
          </p>
        </div>
        <div
          class="tw:self-start tw:rounded-lg tw:bg-plate tw:px-6 tw:py-5 tw:text-plate-foreground"
        >
          <h3 class="tw:font-bold tw:text-plate-foreground/75">
            {{ $t('forcompanies.audience.fields') }}
          </h3>
          <ul class="tw:mt-2 tw:divide-y tw:divide-plate-foreground/15">
            <li
              v-for="field in FIELDS"
              :key="field"
              class="tw:py-2 tw:text-lg tw:leading-snug tw:font-extrabold"
            >
              {{ $t(`forcompanies.audience.field.${field}`) }}
            </li>
          </ul>
        </div>
      </section>

      <section aria-labelledby="practical" class="tw:scroll-mt-24">
        <h2 id="practical" :class="sectionHeading">
          {{ $t('forcompanies.practical.heading') }}
        </h2>
        <dl class="tw:mt-6 tw:grid tw:gap-8 tw:md:grid-cols-2 tw:lg:gap-12">
          <div
            v-for="question in QUESTIONS"
            :key="question"
            class="tw:border-t-4 tw:border-plate tw:pt-4"
          >
            <dt class="tw:text-lg tw:font-extrabold">
              {{ $t(`forcompanies.practical.${question}.q`) }}
            </dt>
            <dd class="tw:mt-2 tw:text-muted-foreground">
              {{ $t(`forcompanies.practical.${question}.a`) }}
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="tips" class="tw:scroll-mt-24">
        <h2 id="tips" :class="sectionHeading">
          {{ $t('forcompanies.tips.heading') }}
        </h2>
        <ul class="tw:mt-6 tw:grid tw:gap-x-12 tw:gap-y-6 tw:md:grid-cols-2">
          <li v-for="tip in TIPS" :key="tip" class="tw:max-w-[60ch]">
            <h3 class="tw:font-extrabold">
              {{ $t(`forcompanies.tips.${tip}.title`) }}
            </h3>
            <p class="tw:mt-1 tw:text-muted-foreground">
              {{ $t(`forcompanies.tips.${tip}.text`) }}
            </p>
          </li>
        </ul>
      </section>

      <section
        aria-labelledby="closing"
        class="tw:flex tw:flex-col tw:gap-5 tw:rounded-lg tw:border tw:bg-card tw:p-6 tw:lg:flex-row tw:lg:items-center tw:lg:justify-between tw:lg:p-8"
      >
        <div>
          <h2 id="closing" :class="sectionHeading">
            {{ $t('forcompanies.closing.heading') }}
          </h2>
          <p class="tw:mt-2 tw:text-muted-foreground">
            {{ $t('forcompanies.closing.text') }}
          </p>
        </div>
        <SignupActions class="tw:lg:w-80 tw:lg:shrink-0" />
      </section>
    </div>
  </div>
</template>
