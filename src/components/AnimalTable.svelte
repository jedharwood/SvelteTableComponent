<script lang="ts">
  import BreedNamesDisplay from 'components/BreedNamesDisplay.svelte'
  import type { Animal } from 'types/Animal'
  export let animals: Animal[]

  const alphabetize = (a: Animal, b: Animal): number => {
    if (a.species < b.species) {
      return -1
    }
    if (a.species > b.species) {
      return 1
    }
    return 0
  }
  animals.sort(alphabetize)
</script>

<style lang="scss">
  table {
    table-layout: fixed;
    border: $border-style;
    width: 100%;
    text-align: left;
  }
  th,
  td {
    border: $border-style;
    padding: 5px 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    height: 34px;
    box-sizing: border-box;
  }
  th {
    &:nth-child(1) {
      width: 20%;
    }
    &:nth-child(2) {
      width: 80%;
    }
    &:nth-child(3) {
      width: 120px;
    }
  }
  tbody:nth-child(even) {
    background-color: #ddd;
  }
  .align-right {
    text-align: right;
  }
</style>

<!--
@component
Table component showing animal information.

- Usage:
  ```tsx
  <AnimalTable {animals} />
  ```
-->
<table cellspacing="0">
  <thead>
    <tr>
      <th>Species</th>
      <th>Breeds</th>
      <th class="align-right"># of breeds</th>
    </tr>
  </thead>
  <tbody>
    {#each animals as { species, breedNames }}
      <tr>
        <td>{species}</td>
        <td>
          <BreedNamesDisplay {breedNames} />
        </td>
        <td class="align-right">{breedNames.length}</td>
      </tr>
    {/each}
  </tbody>
</table>
