<script setup lang="ts">
  import {
    Bean,
    Carrot,
    Citrus,
    Egg,
    Fish,
    Leaf,
    Milk,
    Nut,
    Shrimp,
    Snail,
    Sprout,
    Utensils,
    Vegan,
    Wheat,
  } from '@lucide/vue'
  import type { Component } from 'vue'

  const props = defineProps<{ restriction: string }>()

  const ICONS: Record<string, Component> = {
    gluten: Wheat,
    shellfish: Shrimp,
    citrus: Citrus,
    egg: Egg,
    fish: Fish,
    peanuts: Nut,
    soy: Bean,
    milk: Milk,
    nuts: Nut,
    celery: Carrot,
    sesame_seeds: Sprout,
    lupine: Bean,
    mollusc: Snail,
    vegetarian: Leaf,
    vegan: Vegan,
    lactose: Milk,
  }
  // a restriction typed by hand, or one without a picture of its own, gets the plate
  const icon = computed(() => ICONS[props.restriction] ?? Utensils)
</script>

<template>
  <component :is="icon" aria-hidden="true" />
</template>
