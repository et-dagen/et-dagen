<script setup lang="ts">
  import { ArrowUpRight } from '@lucide/vue'
  import type { Company } from '@/lib/site/companies'

  const props = defineProps<{
    mainPartner: Company | null
    partners: Company[]
    sponsors: Company[]
  }>()

  // sponsors get smaller plates than partners, so the tiers read apart at a glance
  const groups = computed(() => [
    {
      key: 'partners',
      list: props.partners,
      cols: 'tw:grid-cols-2 tw:sm:grid-cols-3 tw:lg:grid-cols-5',
      aspect: 'tw:aspect-[3/2]',
      pad: 'tw:p-6',
    },
    {
      key: 'sponsors',
      list: props.sponsors,
      cols: 'tw:grid-cols-3 tw:sm:grid-cols-4 tw:lg:grid-cols-7',
      aspect: 'tw:aspect-[2/1]',
      pad: 'tw:p-4',
    },
  ])
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

      <article
        v-if="mainPartner"
        class="tw:mt-12 tw:grid tw:gap-8 tw:rounded-lg tw:border tw:bg-card tw:p-6 tw:md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] tw:md:items-center tw:md:gap-14 tw:lg:p-12"
      >
        <div
          class="tw:relative tw:grid tw:aspect-[3/2] tw:place-items-center tw:rounded-md tw:border tw:bg-card"
        >
          <HomeLogo
            :src="mainPartner.logo"
            :name="mainPartner.name"
            fill
            class="tw:p-8"
          />
        </div>
        <div>
          <p class="tw:font-semibold tw:text-brand">
            {{ $t('home.main_partner') }}
          </p>
          <h3
            class="tw:mt-1 tw:text-2xl tw:font-black tw:tracking-tight tw:lg:text-3xl"
          >
            {{ mainPartner.name }}
          </h3>
          <p
            v-if="mainPartner.description"
            class="tw:mt-4 tw:max-w-[65ch] tw:leading-relaxed tw:text-muted-foreground"
          >
            {{ mainPartner.description }}
          </p>
          <a
            v-if="mainPartner.webpage"
            :href="mainPartner.webpage"
            target="_blank"
            rel="noopener"
            class="tw:mt-6 tw:inline-flex tw:items-center tw:gap-1 tw:font-bold tw:underline tw:decoration-border tw:decoration-2 tw:underline-offset-[6px] tw:hover:decoration-brand"
          >
            {{ $t('home.visit', { name: mainPartner.name }) }}
            <ArrowUpRight class="tw:size-4" aria-hidden="true" />
          </a>
        </div>
      </article>

      <template v-for="group in groups" :key="group.key">
        <div v-if="group.list.length" class="tw:mt-20">
          <h3 class="tw:text-xl tw:font-extrabold tw:tracking-tight">
            {{ $t(`home.${group.key}`) }}
          </h3>
          <ul class="tw:mt-6 tw:grid tw:gap-4" :class="group.cols">
            <li v-for="company in group.list" :key="company.name">
              <component
                :is="company.webpage ? 'a' : 'div'"
                :href="company.webpage"
                :target="company.webpage ? '_blank' : undefined"
                :rel="company.webpage ? 'noopener' : undefined"
                class="tw:relative tw:grid tw:place-items-center tw:rounded-md tw:border tw:bg-card tw:transition-colors tw:hover:border-foreground/30"
                :class="group.aspect"
              >
                <HomeLogo
                  :src="company.logo"
                  :name="company.name"
                  fill
                  :class="group.pad"
                />
              </component>
            </li>
          </ul>
        </div>
      </template>
    </div>
  </section>
</template>
