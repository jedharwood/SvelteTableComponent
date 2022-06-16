<script>
  import Badge from './Badge.svelte'

  export let breedNames: string[]

  const NON_BREAKING_SPACE = '\xa0'
  const BADGE_PLUS_ELLIPSIS = 47

  let currentWidth = 0,
    hiddenBreeds = 0
  $: breedsToShow = renderBreedNames(currentWidth)

  const appendComma = (array: string[], i: number): string => {
    return array.length < 2 || i === array.length - 1
      ? array[i]
      : `${array[i]},${NON_BREAKING_SPACE}`
  }

  const setHiddenBreeds = (filteredBreeds: string[]): number => {
    return (hiddenBreeds =
      filteredBreeds[filteredBreeds.length - 1] === '...'
        ? breedNames.length - (filteredBreeds.length - 1)
        : 0)
  }

  const renderBreedNames = (currentWidth: number): string[] => {
    let filteredBreeds = [],
      i = 0,
      sumWidth = 0

    while (i < breedNames.length && sumWidth < currentWidth) {
      let span = document.createElement('span')
      span.classList.add('breed')
      span.textContent = appendComma(breedNames, i)
      document.body.appendChild(span)
      sumWidth += span.getBoundingClientRect().width
      document.body.removeChild(span)

      if (sumWidth < currentWidth - BADGE_PLUS_ELLIPSIS) {
        filteredBreeds.push(breedNames[i])
        i++
      }
      if (sumWidth > currentWidth) {
        filteredBreeds.push('...')
        i++
      }
    }

    for (let i = 0; i < filteredBreeds.length; i++) {
      filteredBreeds[i] = appendComma(filteredBreeds, i)
    }

    setHiddenBreeds(filteredBreeds)

    return filteredBreeds
  }
</script>

<style>
  .client {
    overflow: hidden;
  }
  .breed {
    display: inline-block;
    line-height: 22px;
  }
</style>

<!--
@component
Receives a `breedNames` string array prop and renders a div containing the breeds

- Usage:
  ```tsx
  <BreedsNamesDisplay {breedNames} />
  ```
-->

<div class="client" bind:clientWidth={currentWidth}>
  {#each breedsToShow as r}
    <span class="breed">{r}</span>
  {/each}
  <Badge {hiddenBreeds} />
</div>
