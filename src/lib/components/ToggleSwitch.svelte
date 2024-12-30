<script lang="ts">
  interface Props {
    name: string;
    value: boolean;
    class?: string;
  }

  let {
    name,
    value = $bindable(false),
    class: className = ""
  }: Props = $props();
</script>

<span class="relative cursor-pointer w-10 h-6 rounded-full border border-foreground-sub duration-75 {value ? "" : "[&>span]:hover:bg-foreground"} hover:border-foreground {value ? "bg-foreground-sub hover:bg-foreground" : ""} {className}">
  <input type="checkbox" {name} bind:checked={value} class="opacity-0 w-0 h-0">
  <span class="absolute w-4 h-4 {value ? "bg-background" : "bg-foreground-sub"} top-1/2 -translate-y-1/2 rounded-full {value ? "left-4" : "left-1"} duration-75"></span>
</span>
