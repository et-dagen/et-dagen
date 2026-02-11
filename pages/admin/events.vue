<script setup lang="ts">
  import type { Event } from '~/models/Event'

  const localePath = useLocalePath()

  // Get events and companies from the API
  const { data: events, refresh } = await useFetch('/api/event')
  const { data: companies } = await useFetch('/api/company')

  // Allow copying the event id to the clipboard
  const { text, copy, copied } = useClipboard()

  // Proces events and retrieve dates
  const eventsWithID = computed(() => addEventIDAsProperty(events.value ?? []))
  const eventDates = computed(() => getEventDates(events.value ?? []))

  // State for filtering and selecting events
  const selectedDates = ref<number[]>(eventDates.value.map((_, i) => i))
  const filterOrder = ref('descending')
  const filterType = ref('updated')

  const selected = ref([])

  // Pagination state
  const currentPage = ref(1)
  const pageSizes = [10, 25, 100]
  const pageSize = ref(pageSizes[0])

  // State for the delete modal
  const loading = ref()
  const dialog = ref(false)

  // Reset selected events when changing the page or page size
  watch(currentPage, () => (selected.value = []))
  watch(pageSize, () => {
    currentPage.value = 1
  })

  // Get the number of attendants for an event
  const eventAttendants = computed(() => {
    return (event: any) => {
      // Object doesn't have attendants property if no attendants
      if (!Object.hasOwn(event, 'attendants')) return 0

      return Object.values(event.attendants).length
    }
  })

  // Filter events by date and sort them
  const filteredEvents = computed(() => {
    // eslint-disable-next-line
    const selectedEventDate = eventDates.value.filter((date, index) =>
      selectedDates.value.includes(index),
    )

    const filteredByEventDate = Object.values(eventsWithID.value)?.filter(
      (event: any) =>
        selectedEventDate.includes(getDateFromDatetime(event.date.start)),
    )

    selected.value = []

    return (
      filteredByEventDate?.sort((a, b) => {
        /* @ts-ignore */
        const order = a[filterType.value] < b[filterType.value] ? -1 : 1
        return filterOrder.value === 'ascending' ? order : order * -1
      }) ?? []
    )
  })

  // Split events into pages
  const pages = computed(() =>
    filteredEvents.value.reduce((resultArray, item, index) => {
      const chunkIndex = Math.floor(index / pageSize.value)
      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = []
      }
      resultArray[chunkIndex].push(item)
      return resultArray
    }, [] as Event[][]),
  )
  // Delete seleceted events
  const deleteEvents = async () => {
    loading.value = true
    const queries = []

    const selectedEvents = pages.value[currentPage.value - 1].map(
      (event, index) => (selected.value[index] ? event.id : undefined),
    )

    for (const uid of selectedEvents)
      !uid ||
        queries.push(
          $fetch('/api/event', {
            method: 'DELETE',
            body: {
              eventUID: uid,
            },
          }),
        )
    try {
      await Promise.all(queries)
    } catch (error) {
      // TODO: #136 handle event deletion error with alerts
    }

    dialog.value = false
    loading.value = false
    currentPage.value = 1

    // refresh user data
    refresh()
  }
</script>

<template>
  <div>
    <div class="d-flex flex-wrap filters align-end">
      <!-- Dates -->
      <div>
        <p>{{ $t('admin.events.dates') }}</p>
        <VChipGroup v-model="selectedDates" multiple mandatory>
          <VChip
            v-for="(date, index) in eventDates"
            :key="index"
            :class="`bg-neutral-lighten-4 ${
              Object.values(selectedDates).includes(index)
                ? 'v-chip--selected'
                : ''
            }`"
          >
            {{ getNumericDayAndMonthString(date) }}
          </VChip>
        </VChipGroup>
      </div>

      <!-- Filter type -->
      <div>
        <p>{{ $t('admin.events.filtertypes.name') }}</p>
        <VChipGroup v-model="filterType" mandatory>
          <VChip
            :class="`bg-neutral-lighten-4 ${
              filterType === 'updated' ? 'v-chip--selected' : ''
            }`"
            value="updated"
          >
            {{ $t('admin.events.filtertypes.updated') }}
          </VChip>
          <VChip
            :class="`bg-neutral-lighten-4 ${
              filterType === 'company' ? 'v-chip--selected' : ''
            }`"
            value="company"
          >
            {{ $t('admin.events.filtertypes.company') }}
          </VChip>
        </VChipGroup>
      </div>

      <!-- filer order -->
      <div>
        <p>{{ $t('admin.events.filterorder.name') }}</p>
        <VChipGroup v-model="filterOrder" mandatory>
          <VChip
            :class="`bg-neutral-lighten-4 ${
              filterOrder === 'descending' ? 'v-chip--selected' : ''
            }`"
            value="descending"
          >
            {{ $t('admin.events.filterorder.descending') }}
          </VChip>
          <VChip
            :class="`bg-neutral-lighten-4 ${
              filterOrder === 'ascending' ? 'v-chip--selected' : ''
            }`"
            value="ascending"
          >
            {{ $t('admin.events.filterorder.ascending') }}
          </VChip>
        </VChipGroup>
      </div>

      <VSpacer />

      <div class="d-flex flex-wrap" style="gap: 0.5rem">
        <!-- select all button -->
        <VBtn
          color="primary"
          size="large"
          rounded="lg"
          flat
          @click="
            () => {
              /* @ts-ignore */
              filteredEvents.forEach((event, index) => (selected[index] = true))
            }
          "
        >
          {{ $t('admin.events.selectall') }}
        </VBtn>
        <!-- TODO: Add deselect all button which renders instead if all entries on page are selected -->

        <!-- delete users modal -->
        <VDialog v-model="dialog" width="500">
          <template #activator="{ props }">
            <VBtn
              v-bind="props"
              :disabled="!selected.find((val) => val)"
              color="primary"
              size="large"
              rounded="lg"
              flat
            >
              {{ $t('admin.events.delete.selected') }}
            </VBtn>
          </template>

          <template #default="{ isActive }">
            <VCard rounded="lg" class="text-center pa-6">
              <h6>{{ $t('admin.events.delete.confirmtext') }}</h6>

              <div
                class="d-flex justify-center flex-wrap mt-6"
                style="gap: 1.5rem"
              >
                <VBtn
                  size="large"
                  variant="outlined"
                  color="primary"
                  :loading="loading"
                  @click="deleteEvents"
                >
                  {{ $t('admin.events.delete.confirm') }}
                </VBtn>
                <VBtn
                  size="large"
                  flat
                  color="success"
                  @click="isActive.value = false"
                >
                  {{ $t('admin.events.delete.abort') }}
                </VBtn>
              </div>
            </VCard>
          </template>
        </VDialog>

        <!-- Create new event -->
        <VBtn
          color="success"
          size="large"
          rounded="lg"
          class="add_event"
          flat
          icon="mdi-plus"
          @click="navigateTo(localePath('/event/edit'))"
        >
        </VBtn>

        <!-- shortcut to see the company event overview page -->
        <VBtn
          color="info"
          size="large"
          rounded="lg"
          flat
          append-icon="mdi-open-in-new"
          @click="navigateTo(localePath('/company/admin'))"
        >
          {{ $t('admin.events.overview') }}
        </VBtn>
      </div>
    </div>

    <VDivider class="mb-5 mt-2" />

    <!-- Pagination -->
    <div class="d-flex align-center justify-space-between flex-wrap">
      <VPagination
        v-model="currentPage"
        :ripple="false"
        :length="pages.length"
        :total-visible="4"
        density="comfortable"
      />

      <div class="d-flex align-center">
        <p class="text-subtitle-1 mr-4 font-weight-medium">
          {{ $t('admin.events.pagesize') }}
        </p>
        <VSelect
          v-model="pageSize"
          density="compact"
          variant="outlined"
          :items="pageSizes"
          :hide-details="true"
        />
      </div>
    </div>

    <!-- Event table -->
    <VTable hover style="overflow: hidden" class="mb-5">
      <thead>
        <tr>
          <th>{{ $t('admin.events.attributes.select') }}</th>
          <th>{{ $t('admin.events.attributes.title') }}</th>
          <th>{{ $t('admin.events.attributes.company') }}</th>
          <th>{{ $t('admin.events.attributes.capacity') }}</th>
          <th>{{ $t('admin.events.attributes.date') }}</th>
          <th>{{ $t('admin.events.attributes.location') }}</th>
          <th class="text-center">UID</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(event, index) in pages[currentPage - 1]" :key="index">
          <!-- select user -->
          <td>
            <VCheckbox v-model="selected[index]" :hide-details="true" />
          </td>

          <td id="title" class="truncate">{{ event.title }}</td>
          <td>{{ companies[event.companyUID]?.name ?? '-' }}</td>
          <td v-if="event.capacity">
            {{ eventAttendants(event) }}/{{ event.capacity }}
          </td>
          <td v-else>-</td>
          <td>
            {{ getNumericDayAndMonthString(event.date.start) }}
          </td>
          <td id="location" class="truncate">{{ event.location.name }}</td>

          <!-- copy user id -->
          <td>
            <VTooltip location="top" color="primary">
              <template #activator="{ props }">
                <VBtn
                  v-bind="props"
                  size="small"
                  variant="text"
                  icon="mdi-content-copy"
                  color="primary"
                  @click="copy(event.id)"
                />
              </template>

              {{
                copied && text === event.id
                  ? $t('admin.events.copied')
                  : event.id
              }}
            </VTooltip>
          </td>

          <!-- Attendant emails -->
          <td>
            <VTooltip location="top" color="primary">
              <template #activator="{ props }">
                <VBtn
                  v-bind="props"
                  size="small"
                  variant="text"
                  color="primary"
                  icon="mdi-email-outline"
                  @click="
                    navigateTo(`/api/event/attendants?eventUID=${event.id}`, {
                      open: { target: '_blank' },
                    })
                  "
                />
              </template>

              {{ $t('admin.events.attendant_emails') }}
            </VTooltip>
          </td>

          <!-- Edit event -->
          <td>
            <VTooltip location="top" color="primary">
              <template #activator="{ props }">
                <VBtn
                  v-bind="props"
                  size="small"
                  variant="text"
                  color="primary"
                  icon="mdi-pencil"
                  @click="navigateTo(localePath(`/event/edit/${event.id}`))"
                />
              </template>

              {{ $t('admin.events.edit') }}
            </VTooltip>
          </td>
        </tr>
      </tbody>
    </VTable>
  </div>
</template>

<style scoped lang="scss">
  .filters {
    gap: 0.5rem;
  }

  .add_event {
    max-height: 44px !important;
  }

  td,
  th {
    text-wrap: nowrap;
    min-width: fit-content;
  }

  .v-chip {
    transition: 0.25s;
    user-select: none;
  }
  .v-chip--selected {
    background-color: rgb(var(--v-theme-accent)) !important;
    color: rgb(var(--v-theme-background)) !important;
  }

  .truncate {
    // Add ellipsis to long location names
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &#title {
      max-width: 225px;
    }

    &#location {
      max-width: 150px;
    }
  }
</style>
