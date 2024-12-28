<script lang="ts">
	import type { Snippet } from "svelte";

  interface Props {
    class?: string;
    children?: Snippet;
  }

  let { 
    class: className = "",
    children 
  }: Props = $props();
</script>

<div class="border border-foreground-sub rounded-lg p-4 bg-background {className}">
  {#if children}
    {@render children()}
  {/if}
</div>
