<template>
  <div class="ma-10">
    <!-- if the user just registered a msg should be displayed in a chip -->
    <p v-if="$route.query.registered === 'true'">
      User successfully registered
    </p>
    <h4 class="text-center pt-4 pb-7">{{ $t('user.sign_in') }}</h4>
    <UserSigninForm />
  </div>
</template>
