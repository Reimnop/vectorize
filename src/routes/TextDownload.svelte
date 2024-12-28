<script lang="ts">
	import { onDestroy, untrack } from "svelte";
  import IconDownload from "~icons/lucide/download";

  interface Props {
    fileName: string;
    text: string;
    class?: string;
  }

  let { 
    fileName,
    text,
    class: className = ""
  }: Props = $props();

  let url: string | null = $derived.by(() => {
    const encoded = encodeURIComponent(text);
    return `data:text/plain;charset=utf-8,${encoded}`;
  });
</script>

<a download={fileName} href={url} class="rounded-md border text-foreground-sub border-foreground-sub duration-75 hover:text-foreground hover:border-foreground p-2 grid place-items-center {className}">
  <IconDownload class="text-2xl" />
</a>