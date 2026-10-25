<script setup lang="ts">
  import { toTypedSchema } from '@vee-validate/zod'
  import { useForm } from 'vee-validate'
  import FieldError from '@/components/admin/form/FieldError.vue'
  import { Button } from '@/components/ui/button'
  import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
  } from '@/components/ui/form'
  import { Input } from '@/components/ui/input'
  import PasswordInput from '@/components/user/signup/PasswordInput.vue'
  import { CompanyJoin } from '@/contracts/user'

  const form = useForm({ validationSchema: toTypedSchema(CompanyJoin) })
  const pending = ref(false)
  const error = ref('')
  const submit = form.handleSubmit(async ({ code, ...account }) => {
    pending.value = true
    error.value = ''
    try {
      await registerUser({ ...account, dietaryRestrictions: [] }, code)
    } catch (cause) {
      const failed = cause as { code?: string; statusCode?: number }
      if (failed.code === 'auth/email-already-in-use') {
        form.setFieldError('email', 'email_taken')
      } else if (failed.statusCode === 401) {
        form.setFieldError('code', 'code_invalid')
      } else {
        error.value = getErrorAlertContext(cause).message
      }
    } finally {
      pending.value = false
    }
  })

  const inputClass = [
    'tw:h-11 tw:focus-visible:border-plate tw:focus-visible:ring-plate/15',
    'tw:aria-invalid:focus-visible:border-destructive',
  ].join(' ')
</script>

<template>
  <form
    novalidate
    class="tw:flex tw:flex-col tw:gap-8 tw:rounded-lg tw:border tw:bg-card tw:p-6 tw:sm:p-8"
    @submit="submit"
  >
    <div class="tw:flex tw:flex-col tw:gap-2">
      <h1 class="tw:text-3xl tw:font-extrabold tw:tracking-tight">
        {{ $t('signup.company.title') }}
      </h1>
      <p class="tw:text-muted-foreground">{{ $t('signup.company.lead') }}</p>
    </div>

    <FormField v-slot="{ componentField }" name="code">
      <FormItem>
        <FormLabel>{{ $t('signup.company.code') }}</FormLabel>
        <FormControl>
          <Input
            v-bind="componentField"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            :class="inputClass"
          />
        </FormControl>
        <FieldError />
      </FormItem>
    </FormField>

    <fieldset class="tw:flex tw:flex-col tw:gap-5">
      <legend class="tw:mb-4 tw:font-extrabold">
        {{ $t('signup.you') }}
      </legend>
      <FormField v-slot="{ componentField }" name="name">
        <FormItem>
          <FormLabel>{{ $t('signup.name') }}</FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              autocomplete="name"
              :class="inputClass"
            />
          </FormControl>
          <FieldError />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="email">
        <FormItem>
          <FormLabel>{{ $t('signup.company.email') }}</FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              type="email"
              autocomplete="email"
              inputmode="email"
              :class="inputClass"
            />
          </FormControl>
          <FieldError />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="password">
        <FormItem>
          <FormLabel>{{ $t('signup.password') }}</FormLabel>
          <FormControl>
            <PasswordInput v-bind="componentField" :class="inputClass" />
          </FormControl>
          <p class="tw:text-sm tw:text-muted-foreground">
            {{ $t('signup.password_hint') }}
          </p>
          <FieldError />
        </FormItem>
      </FormField>
    </fieldset>

    <div class="tw:flex tw:flex-col tw:gap-3">
      <p
        v-if="error"
        role="alert"
        class="tw:text-sm tw:font-semibold tw:text-destructive"
      >
        {{ error }}
      </p>
      <Button type="submit" size="lg" class="tw:h-11" :disabled="pending">
        {{ $t(pending ? 'signup.pending' : 'signup.company.submit') }}
      </Button>
    </div>
  </form>
</template>
