<script setup lang="ts">
  import { LogIn, LogOut, Menu, X } from '@lucide/vue'
  import LanguageSwitch from './LanguageSwitch.vue'
  import NextUpPill from './NextUpPill.vue'
  import { accountLinks } from '@/lib/site/account'
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
        class="tw:flex tw:h-full tw:flex-col tw:px-5 tw:pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <div class="tw:flex tw:h-16 tw:items-center tw:justify-between">
          <span class="tw:text-xl tw:font-extrabold tw:text-brand"
            >E&amp;T-dagene</span
          >
          <Button
            variant="ghost"
            size="icon"
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
            <p class="tw:font-bold">{{ auth.user?.name }}</p>
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
            <LanguageSwitch />
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
