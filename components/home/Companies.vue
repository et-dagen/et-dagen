<script setup lang="ts">
  import { ArrowRight, ArrowUpRight } from '@lucide/vue'
  import { fillerCount, type Company } from '@/lib/site/companies'

  const props = defineProps<{
    mainPartner: Company | null
    partners: Company[]
    sponsors: Company[]
  }>()

  // the main partner's tile takes a full row on a phone and two by two from `sm` up
  const mainCells = (columns: number) =>
    props.mainPartner ? Math.min(columns, 4) : 0
  const localePath = useLocalePath()

  // the cells left in the wall's last row become one invitation, so the row never ends in holes
  const rest = computed(() => {
    const taken = (columns: number) =>
      mainCells(columns) + props.partners.length
    return {
      base: fillerCount(taken(2), 2),
      sm: fillerCount(taken(4), 4),
      lg: fillerCount(taken(6), 6),
    }
  })
  const restClass = computed(() =>
    [
      rest.value.base ? 'tw:block' : 'tw:hidden',
      [
        'tw:sm:hidden',
        'tw:sm:block',
        'tw:sm:block tw:sm:col-span-2',
        'tw:sm:block tw:sm:col-span-3',
      ][rest.value.sm],
      [
        'tw:lg:hidden',
        'tw:lg:block tw:lg:col-span-1',
        'tw:lg:block tw:lg:col-span-2',
        'tw:lg:block tw:lg:col-span-3',
        'tw:lg:block tw:lg:col-span-4',
        'tw:lg:block tw:lg:col-span-5',
      ][rest.value.lg],
    ].join(' '),
  )

  const linkOf = (company: Company) =>
    company.webpage
      ? { is: 'a', href: company.webpage, target: '_blank', rel: 'noopener' }
      : { is: 'div' }
</script>

<template>
  <section
    id="bedrifter"
    aria-labelledby="home-companies"
    class="tw:scroll-mt-20 tw:border-t"
  >
    <div
      class="tw:mx-auto tw:max-w-screen-2xl tw:px-4 tw:py-20 tw:lg:px-8 tw:lg:py-28"
    >
      <h2
        id="home-companies"
        class="tw:text-3xl tw:font-black tw:tracking-tight tw:lg:text-4xl"
      >
        {{ $t('home.companies') }}
      </h2>

      <!-- one wall of logo cells; the grid lines are the gaps over the border colour -->
      <ul
        v-if="mainPartner || partners.length"
        :aria-label="$t('home.partners')"
        class="tw:mt-10 tw:grid tw:grid-cols-2 tw:gap-px tw:overflow-hidden tw:rounded-lg tw:border tw:bg-border tw:sm:grid-cols-4 tw:lg:grid-cols-6"
      >
        <li
          v-if="mainPartner"
          class="tw:col-span-2 tw:bg-card tw:sm:row-span-2"
        >
          <component
            :is="linkOf(mainPartner).is"
            v-bind="linkOf(mainPartner)"
            class="tw:group tw:relative tw:flex tw:size-full tw:flex-col tw:p-5 tw:transition-colors tw:hover:bg-muted/40 tw:lg:p-6"
          >
            <span
              class="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:text-sm tw:font-bold"
            >
              {{ $t('home.main_partner') }}
              <ArrowUpRight
                v-if="mainPartner.webpage"
                class="tw:size-4 tw:text-muted-foreground tw:transition-colors tw:group-hover:text-brand"
                aria-hidden="true"
              />
            </span>
            <span
              class="tw:relative tw:grid tw:min-h-32 tw:flex-1 tw:place-items-center tw:sm:min-h-0"
            >
              <HomeLogo
                :src="mainPartner.logo"
                :name="mainPartner.name"
                class="tw:p-4 tw:text-2xl tw:sm:p-10"
              />
            </span>
          </component>
        </li>
        <li v-for="company in partners" :key="company.name" class="tw:bg-card">
          <component
            :is="linkOf(company).is"
            v-bind="linkOf(company)"
            class="tw:relative tw:grid tw:aspect-[3/2] tw:place-items-center tw:transition-colors tw:hover:bg-muted/40"
          >
            <HomeLogo
              :src="company.logo"
              :name="company.name"
              class="tw:p-5 tw:text-sm tw:sm:p-7 tw:sm:text-base"
            />
          </component>
        </li>
        <li class="tw:bg-card" :class="restClass">
          <NuxtLink
            :to="localePath('/faq')"
            class="tw:group tw:flex tw:size-full tw:min-h-24 tw:flex-col tw:justify-end tw:gap-1 tw:p-5 tw:transition-colors tw:hover:bg-muted/40"
          >
            <span class="tw:text-sm tw:text-muted-foreground">
              {{ $t('home.join') }}
            </span>
            <span
              class="tw:inline-flex tw:items-center tw:gap-1 tw:font-bold tw:underline tw:decoration-border tw:decoration-2 tw:underline-offset-4 tw:group-hover:decoration-brand"
            >
              {{ $t('nav.faq') }}
              <ArrowRight class="tw:size-4" aria-hidden="true" />
            </span>
          </NuxtLink>
        </li>
      </ul>

      <div v-if="sponsors.length" class="tw:mt-16">
        <h3 class="tw:text-xl tw:font-extrabold tw:tracking-tight">
          {{ $t('home.sponsors') }}
        </h3>
        <ul
          class="tw:mt-5 tw:grid tw:grid-cols-2 tw:gap-3 tw:sm:flex tw:sm:flex-wrap"
        >
          <li
            v-for="company in sponsors"
            :key="company.name"
            class="tw:sm:w-44"
          >
            <component
              :is="linkOf(company).is"
              v-bind="linkOf(company)"
              class="tw:relative tw:grid tw:aspect-[2/1] tw:place-items-center tw:rounded-md tw:border tw:bg-card tw:transition-colors tw:hover:bg-muted/40"
            >
              <HomeLogo
                :src="company.logo"
                :name="company.name"
                class="tw:p-3 tw:text-sm"
              />
            </component>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
