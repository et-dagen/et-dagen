<script setup lang="ts">
  import { companyTypes as companyTypeNames } from '~/config/app.config'
  import type { Company } from '~/models/Company'

  // get companies and companies from the API
  const { data: companies, refresh } = await useFetch('/api/company')
  const { data: codes, refresh: refreshCodes } = await useFetch('/api/code')

  // allow copying the company id to the clipboard
  const { text, copy, copied } = useClipboard()

  // process companies
  const companiesWithId = computed(() =>
    embedKeyIntoObjectValues(companies.value)
  )

  // check if company has a code
  const hadCompanyCodes = computed(() => {
    return (companyUID: string) => {
      if (!codes.value) return false
      return Object.values(codes.value)?.some(
        (code: any) => code?.companyUID === companyUID
      )
    }
  })

  // get first code of company
  const companyCode = computed(() => {
    return (companyUID: string) => {
      if (!codes.value) return []
      return Object.values(codes.value)

        ?.filter((code: any) => code?.companyUID === companyUID)

        .map((code: any) => code?.code)[0]
    }
  })

  // filter and sorting options
  const companyTypes = ref([0, 1, 2])
  const filterOrder = ref('ascending')
  const filterType = ref('name')

  // selected companies
  const selected = ref([])

  // list pagination options
  const currentPage = ref(1)
  const pageSizes = [10, 25, 100]
  const pageSize = ref(pageSizes[0])

  // dialog and loading used when deleting companies
  const loading = ref()
  const dialog = ref(false)

  // reset current page and company selection
  watch(currentPage, () => (selected.value = []))
  watch(pageSize, () => (currentPage.value = 1))

  // filter and sort companies based on options selected by company
  const filteredCompanies = computed(() => {
    // map the selected company types to their names
    // eslint-disable-next-line
    const selectedCompanyTypes = companyTypeNames.filter((companyType, index) =>
      companyTypes.value.includes(index)
    )

    // filter out companies with the selectd company types
    const filterByCompanyType = companiesWithId.value?.filter((company) =>
      selectedCompanyTypes.includes(company.type ?? 'sponsor')
    )

    // reset company selection when filters change
    selected.value = []

    // sort the filtered companies
    return (
      filterByCompanyType?.sort((a, b) => {
        /* @ts-ignore */
        const order = a[filterType.value] < b[filterType.value] ? -1 : 1
        return filterOrder.value === 'ascending' ? order : order * -1
      }) ?? []
    )
  })

  // Split companies into pages
  const pages = computed(() =>
    filteredCompanies.value.reduce((resultArray, item, index) => {
      const chunkIndex = Math.floor(index / pageSize.value)
      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = []
      }
      resultArray[chunkIndex].push(item)
      return resultArray
    }, [] as Company[][])
  )

  // Delete seleceted companies
  const deleteCompanies = async () => {
    loading.value = true
    const queries = []

    const selectedCompanies = pages.value[currentPage.value - 1].map(
      (company, index) => (selected.value[index] ? company.uid : undefined)
    )

    for (const uid of selectedCompanies)
      !uid ||
        queries.push(
          $fetch('/api/company', {
            method: 'DELETE',
            body: {
              companyUID: uid,
            },
          })
        )
    try {
      await Promise.all(queries)
    } catch (error) {
      // TODO: handle company deletion error with alerts
    }

    dialog.value = false
    loading.value = false
    currentPage.value = 1

    // refresh company data
    refresh()
  }

  const createNewCode = async (companyUID: string) => {
    await $fetch('/api/code', {
      method: 'POST',
      query: {
        companyUID,
      },
    })
    refreshCodes()
  }

  const formatCompanyType = (companyType: string) => {
    return companyType.replace('-', '_')
  }
</script>

<template>
  <div>
    <div class="d-flex flex-wrap filters align-end">
      <!-- Company types -->
      <div>
        <p>{{ $t('admin.company.attributes.type.name') }}</p>
        <VChipGroup v-model="companyTypes" multiple mandatory>
          <VChip
            v-for="(companyType, index) in companyTypeNames"
            :key="index"
            :class="`bg-neutral-lighten-4 ${
              companyTypes.includes(index) ? 'v-chip--selected' : ''
            }`"
          >
            {{
              $t(
                `admin.company.attributes.type.${formatCompanyType(
                  companyType
                )}`
              )
            }}
          </VChip>
        </VChipGroup>
      </div>

      <!-- Filter type -->
      <div>
        <p>{{ $t('admin.company.filtertypes.name') }}</p>
        <VChipGroup v-model="filterType" mandatory>
          <VChip
            :class="`bg-neutral-lighten-4 ${
              filterType === 'name' ? 'v-chip--selected' : ''
            }`"
            value="name"
          >
            {{ $t('admin.company.filtertypes.companyname') }}
          </VChip>
          <VChip
            :class="`bg-neutral-lighten-4 ${
              filterType === 'updated' ? 'v-chip--selected' : ''
            }`"
            value="updated"
          >
            {{ $t('admin.company.filtertypes.updated') }}
          </VChip>
        </VChipGroup>
      </div>

      <!-- filer order -->
      <div>
        <p>{{ $t('admin.company.filterorder.name') }}</p>
        <VChipGroup v-model="filterOrder" mandatory>
          <VChip
            :class="`bg-neutral-lighten-4 ${
              filterOrder === 'descending' ? 'v-chip--selected' : ''
            }`"
            value="descending"
          >
            {{ $t('admin.company.filterorder.descending') }}
          </VChip>
          <VChip
            :class="`bg-neutral-lighten-4 ${
              filterOrder === 'ascending' ? 'v-chip--selected' : ''
            }`"
            value="ascending"
          >
            {{ $t('admin.company.filterorder.ascending') }}
          </VChip>
        </VChipGroup>
      </div>

      <VSpacer />

      <div>
        <!-- select all button -->
        <VBtn
          color="primary"
          size="large"
          rounded="lg"
          class="mr-2"
          flat
          @click="
            () => {
              /* @ts-ignore */
              filteredCompanies.forEach(
                (company, index) => (selected[index] = true)
              )
            }
          "
        >
          {{ $t('admin.company.selectall') }}
        </VBtn>
        <!-- TODO: Add deselect all button which renders instead if all entries on page are selected -->

        <!-- delete companies modal -->
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
              {{ $t('admin.company.delete.selected') }}
            </VBtn>
          </template>

          <template #default="{ isActive }">
            <VCard rounded="lg" class="text-center pa-6">
              <h6>{{ $t('admin.company.delete.confirmtext') }}</h6>

              <div
                class="d-flex justify-center flex-wrap mt-6"
                style="gap: 1.5rem"
              >
                <VBtn
                  size="large"
                  variant="outlined"
                  color="primary"
                  :loading="loading"
                  @click="deleteCompanies"
                >
                  {{ $t('admin.company.delete.confirm') }}
                </VBtn>
                <VBtn
                  size="large"
                  flat
                  color="success"
                  @click="isActive.value = false"
                >
                  {{ $t('admin.company.delete.abort') }}
                </VBtn>
              </div>
            </VCard>
          </template>
        </VDialog>

        <!-- Create new company -->
        <VBtn
          color="success"
          size="large"
          rounded="lg"
          class="ml-2 add_company"
          flat
          icon="mdi-plus"
          @click="navigateTo('/company/edit')"
        >
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
          {{ $t('admin.company.pagesize') }}
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

    <!-- company table -->
    <VTable hover style="overflow: hidden" class="mb-5">
      <thead>
        <tr>
          <th>{{ $t('admin.company.attributes.select') }}</th>
          <th>{{ $t('admin.company.attributes.name') }}</th>
          <th>{{ $t('admin.company.attributes.type.name') }}</th>
          <th>{{ $t('admin.company.attributes.logo') }}</th>
          <th>{{ $t('admin.company.attributes.webpage') }}</th>
          <th>{{ $t('admin.company.attributes.code') }}</th>
          <th class="text-center">UID</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(company, index) in pages[currentPage - 1]" :key="index">
          <!-- select company -->
          <td>
            <VCheckbox v-model="selected[index]" :hide-details="true" />
          </td>

          <td>{{ company.name }}</td>

          <!-- company type -->
          <td>
            {{
              $t(
                `admin.company.attributes.type.${formatCompanyType(
                  company.type
                )}`
              )
            }}
          </td>

          <!-- company logo -->
          <td v-if="company.logo" class="truncate">
            {{ company.logo.split('/').pop() }}
          </td>
          <td v-else>-</td>

          <!-- company webpage -->
          <td class="truncate">
            {{ company.webpage.replace('https://', '') }}
          </td>

          <!-- company code -->
          <td v-if="hadCompanyCodes(company.uid)">
            <!-- copy existing code -->
            <VTooltip location="top" color="primary">
              <template #activator="{ props }">
                <VBtn
                  v-bind="props"
                  size="small"
                  variant="text"
                  icon="mdi-content-copy"
                  color="primary"
                  @click="copy(companyCode(company.uid))"
                />
              </template>

              {{
                copied && text === companyCode(company.uid)
                  ? $t('admin.company.copiedcode')
                  : companyCode(company.uid)
              }}
            </VTooltip>
          </td>
          <td v-else>
            <!-- create new code -->
            <VTooltip location="top" color="primary">
              <template #activator="{ props }">
                <VBtn
                  v-bind="props"
                  size="small"
                  variant="text"
                  icon="mdi-plus"
                  color="primary"
                  @click="createNewCode(company.uid)"
                />
              </template>

              {{ $t('admin.company.createcode') }}
            </VTooltip>
          </td>

          <!-- copy company UID -->
          <td>
            <VTooltip location="top" color="primary">
              <template #activator="{ props }">
                <VBtn
                  v-bind="props"
                  size="small"
                  variant="text"
                  icon="mdi-content-copy"
                  color="primary"
                  @click="copy(company.uid)"
                />
              </template>

              {{
                copied && text === company.uid
                  ? $t('admin.company.copied')
                  : company.uid
              }}
            </VTooltip>
          </td>

          <!-- Edit company -->
          <td>
            <VTooltip location="top" color="primary">
              <template #activator="{ props }">
                <VBtn
                  v-bind="props"
                  size="small"
                  variant="text"
                  color="primary"
                  icon="mdi-pencil"
                  @click="
                    navigateTo(localePath(`/company/edit/${company.uid}`))
                  "
                />
              </template>

              {{ $t('admin.company.edit') }}
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

  .add_company {
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
    // Add ellipsis to long entries
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 190px;
  }
</style>
models/RegistrationCode
