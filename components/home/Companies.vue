<script setup lang="ts">
  import { ArrowRight, ArrowUpRight } from '@lucide/vue'
  import Logo from '@/components/home/Logo.vue'
  import { fillerCount, type Company } from '@/lib/site/companies'

  const props = defineProps<{
    mainPartner: Company | null
    partners: Company[]
    sponsors: Company[]
    /** The companies are the last fair's */
    last: boolean
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
      rest.value.base ? 'block' : 'hidden',
      [
        'sm:hidden',
        'sm:block',
        'sm:block sm:col-span-2',
        'sm:block sm:col-span-3',
      ][rest.value.sm],
      [
        'lg:hidden',
        'lg:block lg:col-span-1',
        'lg:block lg:col-span-2',
        'lg:block lg:col-span-3',
        'lg:block lg:col-span-4',
        'lg:block lg:col-span-5',
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
    class="scroll-mt-20 border-t"
  >
    <div class="mx-auto max-w-screen-2xl px-4 py-20 lg:px-8 lg:py-28">
      <h2
        id="home-companies"
        class="text-3xl font-black tracking-tight lg:text-4xl"
      >
        {{ $t(last ? 'home.companies_last' : 'home.companies') }}
      </h2>

      <!-- one wall of logo cells; the grid lines are the gaps over the border colour -->
      <ul
        v-if="mainPartner || partners.length"
        :aria-label="$t('home.partners')"
        class="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-4 lg:grid-cols-6"
      >
        <li v-if="mainPartner" class="col-span-2 bg-card sm:row-span-2">
          <component
            :is="linkOf(mainPartner).is"
            v-bind="linkOf(mainPartner)"
            class="group relative flex size-full flex-col p-5 transition-colors hover:bg-muted/40 lg:p-6"
          >
            <span
              class="flex items-center justify-between gap-3 text-sm font-bold"
            >
              {{ $t('home.main_partner') }}
              <ArrowUpRight
                v-if="mainPartner.webpage"
                class="size-4 text-muted-foreground transition-colors group-hover:text-brand"
                aria-hidden="true"
              />
            </span>
            <span
              class="relative grid min-h-32 flex-1 place-items-center sm:min-h-0"
            >
              <Logo
                :src="mainPartner.logo"
                :name="mainPartner.name"
                class="p-4 text-2xl sm:p-10"
              />
            </span>
          </component>
        </li>
        <li v-for="company in partners" :key="company.name" class="bg-card">
          <component
            :is="linkOf(company).is"
            v-bind="linkOf(company)"
            class="relative grid aspect-[3/2] place-items-center transition-colors hover:bg-muted/40"
          >
            <Logo
              :src="company.logo"
              :name="company.name"
              class="p-5 text-sm sm:p-7 sm:text-base"
            />
          </component>
        </li>
        <li class="bg-card" :class="restClass">
          <NuxtLink
            :to="localePath('/for-companies')"
            class="group flex size-full min-h-24 flex-col justify-end gap-1 p-5 transition-colors hover:bg-muted/40"
          >
            <span class="text-sm text-muted-foreground">
              {{ $t('home.join') }}
            </span>
            <span
              class="inline-flex items-center gap-1 font-bold underline decoration-border decoration-2 underline-offset-4 group-hover:decoration-brand"
            >
              {{ $t('nav.for-companies') }}
              <ArrowRight class="size-4" aria-hidden="true" />
            </span>
          </NuxtLink>
        </li>
      </ul>

      <div v-if="sponsors.length" class="mt-16">
        <h3 class="text-xl font-extrabold tracking-tight">
          {{ $t('home.sponsors') }}
        </h3>
        <ul class="mt-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
          <li v-for="company in sponsors" :key="company.name" class="sm:w-44">
            <component
              :is="linkOf(company).is"
              v-bind="linkOf(company)"
              class="relative grid aspect-[2/1] place-items-center rounded-md border bg-card transition-colors hover:bg-muted/40"
            >
              <Logo
                :src="company.logo"
                :name="company.name"
                class="p-3 text-sm"
              />
            </component>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
