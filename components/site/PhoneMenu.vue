<script setup lang="ts">
  import { LogIn, LogOut, Menu, X } from '@lucide/vue'
  import NextUpPill from './NextUpPill.vue'
  import { useAuthStore } from '@/stores/authStore'
  import { signoutUser } from '@/composables/auth/session'
  import { accountLinks, initialsOf } from '@/lib/site/account'
  import { LANGUAGES as languages } from '@/lib/site/languages'
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
  const links = computed(() => accountLinks(auth.allows))
  const { locale } = useI18n()
  const switchLocalePath = useSwitchLocalePath()

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
      class="size-11"
      :aria-label="$t('site.menu.open')"
      @click="sheet?.showModal()"
    >
      <Menu aria-hidden="true" />
    </Button>
    <dialog
      ref="sheet"
      class="et-ui m-0 h-dvh max-h-none w-dvw max-w-none bg-card p-0 backdrop:bg-transparent"
      :aria-label="$t('site.menu.label')"
    >
      <div
        class="flex h-full flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <!-- the bar's own lockup, so the close button takes the menu button's place -->
        <div class="flex h-16 items-center justify-between">
          <span class="flex items-center gap-2.5">
            <img
              src="/images/logo-small.webp"
              alt=""
              width="26"
              height="30"
              class="h-[30px] w-auto"
            />
            <span class="text-xl font-extrabold tracking-tight text-brand"
              >E&amp;T-dagene</span
            >
          </span>
          <Button
            variant="ghost"
            size="icon"
            class="size-11"
            :aria-label="$t('site.menu.close')"
            @click="close"
          >
            <X aria-hidden="true" />
          </Button>
        </div>

        <nav :aria-label="$t('site.menu.pages')" class="mt-4">
          <ul class="flex flex-col gap-1">
            <li v-for="page in pages" :key="page.name">
              <NuxtLink
                :to="localePath(page.route)"
                :aria-current="page.route === current ? 'page' : undefined"
                class="block py-2 text-3xl font-extrabold tracking-tight aria-[current=page]:text-brand"
              >
                {{ $t(`nav.${page.name}`) }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <NextUpPill v-if="next" :next="next" large class="mt-6" />

        <div class="mt-auto flex flex-col gap-3 border-t pt-4">
          <template v-if="auth.isLoggedIn">
            <p class="flex items-center gap-3 font-bold">
              <span
                class="grid size-9 shrink-0 place-items-center rounded-full bg-plate text-sm font-extrabold text-plate-foreground"
                aria-hidden="true"
              >
                {{ initialsOf(auth.user?.name) || '?' }}
              </span>
              {{ auth.user?.name }}
            </p>
            <ul class="flex flex-col gap-1">
              <li v-for="link in links" :key="link.route">
                <NuxtLink
                  :to="localePath(link.route)"
                  class="block py-1.5 text-lg font-semibold"
                >
                  {{ $t(link.label) }}
                </NuxtLink>
              </li>
            </ul>
          </template>
          <div class="flex items-center justify-between">
            <ul
              class="flex items-center gap-4"
              :aria-label="$t('site.language.label')"
            >
              <li v-for="language in languages" :key="language.code">
                <span
                  v-if="language.code === locale"
                  :lang="language.lang"
                  aria-current="true"
                  class="flex items-center gap-2 font-bold"
                >
                  <img
                    :src="language.flag"
                    alt=""
                    width="20"
                    height="15"
                    class="h-[15px] w-5 rounded-[2px] object-cover"
                  />
                  {{ language.name }}
                </span>
                <NuxtLink
                  v-else
                  :to="switchLocalePath(language.code)"
                  :lang="language.lang"
                  class="flex items-center gap-2 text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  <img
                    :src="language.flag"
                    alt=""
                    width="20"
                    height="15"
                    class="h-[15px] w-5 rounded-[2px] object-cover"
                  />
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
