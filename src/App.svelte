<script lang="ts">
  import AnimalTable from 'components/AnimalTable.svelte'
  import { mockData, appData } from './mock-data'

  const animals = mockData
</script>

<style lang="scss">
  main {
    text-align: center;
    padding: 1em;
    margin: 0 auto;
  }
  h1 {
    color: $color-primary;
    font-size: 4em;
    font-weight: 100;
  }
  h3 {
    color: $color-primary;
    font-weight: 100;
  }
</style>

<main>
  <h1>{appData.appName}</h1>
  <h3>{appData.subTitle}</h3>
  <AnimalTable {animals} />
</main>
