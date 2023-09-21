<template>
  <div>
    <UserSigninForm />

    <!-- if the user just registered a msg should be displayed in a chip -->
    <p v-if="$route.query.registered === 'true'">
      User successfully registered
    </p>
  </div>
</template>
