<script lang="ts">
  export let hiddenBreeds: number

  $: badgeStyle = hiddenBreeds > 0 ? 'badge' : 'hidden'
</script>

<style lang="scss">
  .badge {
    border-radius: 3px;
    background-color: red;
    color: #f0f0f0;
    padding: 2px 5px;
    margin-bottom: 0;
    min-width: $min-badge-width;
    float: right;
  }
  .hidden {
    display: none;
  }
</style>

<!--
@component
Receives a `hiddenBreeds` number prop and renders badge

- Usage:
  ```tsx
  <Badge {hiddenBreeds} />
  ```
-->
<button class={badgeStyle}>+{hiddenBreeds}</button>
