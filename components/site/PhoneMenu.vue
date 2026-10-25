<script setup lang="ts">
  import { LogIn, LogOut, Menu, X } from '@lucide/vue'
  import NextUpPill from './NextUpPill.vue'
  import { accountLinks, initialsOf } from '@/lib/site/account'
  import { Button } from '@/components/ui/button'
  import type { NextUp } from '@/lib/site/nextUp'

  defineProps<{
    pages: readonly { name: string; route: string }[]
    /** The route of the page the visitor is on, or null */
    current: string | null
    next: NextUp | null
  }>()

  const auth = useAuthStore()
  const localePath = useLocalePath()
  const links = computed(() => accountLinks(auth.user?.userType))
  const { locale } = useI18n()
  const switchLocalePath = useSwitchLocalePath()
  const languages = [
    { code: 'no', lang: 'nb', name: 'Norsk' },
    { code: 'en', lang: 'en', name: 'English' },
  ] as const

  // a native modal: it traps focus, Escape closes it, and focus returns to the button
  const sheet = ref<HTMLDialogElement | null>(null)
  const close = () => sheet.value?.close()
  watch(() => useRoute().fullPath, close)

  async function signOut() {
    close()
    await signoutUser()
  }
</script>

<template>
  <div>
    <Button
      variant="ghost"
      size="icon"
      class="tw:size-11"
      :aria-label="$t('site.menu.open')"
      @click="sheet?.showModal()"
    >
      <Menu aria-hidden="true" />
    </Button>
    <dialog
      ref="sheet"
      class="et-ui tw:m-0 tw:h-dvh tw:max-h-none tw:w-dvw tw:max-w-none tw:bg-card tw:p-0 tw:backdrop:bg-transparent"
      :aria-label="$t('site.menu.label')"
    >
      <div
        class="tw:flex tw:h-full tw:flex-col tw:px-4 tw:pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <!-- the bar's own lockup, so the close button takes the menu button's place -->
        <div class="tw:flex tw:h-16 tw:items-center tw:justify-between">
          <span class="tw:flex tw:items-center tw:gap-2.5">
            <img
              src="/images/logo.png"
              alt=""
              width="26"
              height="30"
              class="tw:h-[30px] tw:w-auto"
            />
            <span
              class="tw:text-xl tw:font-extrabold tw:tracking-tight tw:text-brand"
              >E&amp;T-dagene</span
            >
          </span>
          <Button
            variant="ghost"
            size="icon"
            class="tw:size-11"
            :aria-label="$t('site.menu.close')"
            @click="close"
          >
            <X aria-hidden="true" />
          </Button>
        </div>

        <nav :aria-label="$t('site.menu.pages')" class="tw:mt-4">
          <ul class="tw:flex tw:flex-col tw:gap-1">
            <li v-for="page in pages" :key="page.name">
              <NuxtLink
                :to="localePath(page.route)"
                :aria-current="page.route === current ? 'page' : undefined"
                class="tw:block tw:py-2 tw:text-3xl tw:font-extrabold tw:tracking-tight tw:aria-[current=page]:text-brand"
              >
                {{ $t(`nav.${page.name}`) }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <NextUpPill v-if="next" :next="next" large class="tw:mt-6" />

        <div
          class="tw:mt-auto tw:flex tw:flex-col tw:gap-3 tw:border-t tw:pt-4"
        >
          <template v-if="auth.isLoggedIn">
            <p class="tw:flex tw:items-center tw:gap-3 tw:font-bold">
              <span
                class="tw:grid tw:size-9 tw:shrink-0 tw:place-items-center tw:rounded-full tw:bg-plate tw:text-sm tw:font-extrabold tw:text-plate-foreground"
                aria-hidden="true"
              >
                {{ initialsOf(auth.user?.name) || '?' }}
              </span>
              {{ auth.user?.name }}
            </p>
            <ul class="tw:flex tw:flex-col tw:gap-1">
              <li v-for="link in links" :key="link.route">
                <NuxtLink
                  :to="localePath(link.route)"
                  class="tw:block tw:py-1.5 tw:text-lg tw:font-semibold"
                >
                  {{ $t(link.label) }}
                </NuxtLink>
              </li>
            </ul>
          </template>
          <div class="tw:flex tw:items-center tw:justify-between">
            <ul
              class="tw:flex tw:items-center tw:gap-4"
              :aria-label="$t('site.language.label')"
            >
              <li v-for="language in languages" :key="language.code">
                <span
                  v-if="language.code === locale"
                  :lang="language.lang"
                  aria-current="true"
                  class="tw:font-bold"
                >
                  {{ language.name }}
                </span>
                <NuxtLink
                  v-else
                  :to="switchLocalePath(language.code)"
                  :lang="language.lang"
                  class="tw:text-muted-foreground tw:underline tw:underline-offset-4 tw:hover:text-foreground"
                >
                  {{ language.name }}
                </NuxtLink>
              </li>
            </ul>
            <Button v-if="auth.isLoggedIn" variant="outline" @click="signOut">
              <LogOut aria-hidden="true" />
              {{ $t('user.sign_out') }}
            </Button>
            <Button v-else as-child>
              <NuxtLink :to="localePath('/user/signin')">
                <LogIn aria-hidden="true" />
                {{ $t('user.sign_in') }}
              </NuxtLink>
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  </div>
</template>
