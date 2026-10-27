<script setup lang="ts">
  import { ArrowUpRight } from '@lucide/vue'
  import type { Company } from '@/lib/site/companies'

  defineProps<{
    mainPartner: Company | null
    partners: Company[]
    sponsors: Company[]
  }>()
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

      <div v-if="mainPartner" class="tw:mt-14">
        <h3 class="tw:text-xl tw:font-extrabold tw:tracking-tight">
          {{ $t('home.main_partner') }}
        </h3>
        <div
          class="tw:mt-6 tw:grid tw:gap-8 tw:md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] tw:md:items-center tw:md:gap-14"
        >
          <div
            class="tw:relative tw:grid tw:aspect-[3/2] tw:place-items-center tw:rounded-md tw:bg-card"
          >
            <HomeLogo
              :src="mainPartner.logo"
              :name="mainPartner.name"
              fill
              class="tw:p-8"
            />
          </div>
          <div>
            <p
              class="tw:text-2xl tw:font-black tw:tracking-tight tw:lg:text-3xl"
            >
              {{ mainPartner.name }}
            </p>
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
        </div>
      </div>

      <div v-if="partners.length" class="tw:mt-20">
        <h3 class="tw:text-xl tw:font-extrabold tw:tracking-tight">
          {{ $t('home.partners') }}
        </h3>
        <ul
          class="tw:mt-6 tw:grid tw:grid-cols-3 tw:gap-x-4 tw:gap-y-4 tw:sm:grid-cols-4 tw:lg:grid-cols-5 tw:lg:gap-x-10 tw:lg:gap-y-8"
        >
          <li v-for="company in partners" :key="company.name">
            <component
              :is="company.webpage ? 'a' : 'div'"
              :href="company.webpage"
              :target="company.webpage ? '_blank' : undefined"
              :rel="company.webpage ? 'noopener' : undefined"
              class="tw:relative tw:grid tw:aspect-[3/2] tw:place-items-center tw:rounded-md tw:bg-card tw:outline-offset-2 tw:transition-shadow tw:hover:shadow-[0_0_0_1px_var(--border)]"
            >
              <HomeLogo
                :src="company.logo"
                :name="company.name"
                fill
                class="tw:p-3 tw:text-sm tw:sm:p-6 tw:sm:text-base"
              />
            </component>
          </li>
        </ul>
      </div>

      <!-- sponsors sit on the ground without plates, so the tiers read apart by treatment -->
      <div v-if="sponsors.length" class="tw:mt-20">
        <h3 class="tw:text-xl tw:font-extrabold tw:tracking-tight">
          {{ $t('home.sponsors') }}
        </h3>
        <ul
          class="tw:mt-8 tw:flex tw:flex-wrap tw:items-center tw:gap-x-12 tw:gap-y-8"
        >
          <li v-for="company in sponsors" :key="company.name">
            <component
              :is="company.webpage ? 'a' : 'span'"
              :href="company.webpage"
              :target="company.webpage ? '_blank' : undefined"
              :rel="company.webpage ? 'noopener' : undefined"
              class="tw:flex tw:h-10 tw:items-center"
            >
              <HomeLogo
                :src="company.logo"
                :name="company.name"
                class="tw:h-10 tw:w-auto tw:max-w-40 tw:mix-blend-multiply"
              />
            </component>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
