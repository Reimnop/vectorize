<script lang="ts">
  import IconUpload from '~icons/lucide/upload';

  interface Props {
    name: string;
    accept?: string;
    onChange?: (value: File | null) => void;
    class?: string;
  }

  let {
    name,
    accept,
    onChange,
    class: className = ""
  }: Props = $props();

  let selectedFiles: FileList | null = $state<FileList | null>(null);
  let selectedFile: File | null = $derived(selectedFiles && selectedFiles.length > 0 ? selectedFiles[0] : null);

  $effect(() => {
    if (selectedFile) {
      onChange?.(selectedFile);
    }
  });
</script>

<div class="border border-foreground-sub duration-75 hover:border-foreground hover:border-solid text-foreground-sub hover:text-foreground rounded-md flex flex-col justify-center items-center gap-1 h-24 cursor-pointer {className}">
  <input type="file" {name} {accept} class="hidden" bind:files={selectedFiles} />
  <IconUpload class="text-2xl" />
  {#if selectedFile}
    <p class="select-none">{selectedFile.name}</p>
  {/if}
</div>