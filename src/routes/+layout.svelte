<script lang="ts">
	import '../app.pcss';
	import Footer from './Footer.svelte';
	import Header from './Header.svelte';

	let { children } = $props();
</script>

<svelte:head>
    <meta property="og:title" content="Vectorize" />
    <meta property="og:description" content=" THE tool to convert SVG files to Project Arrhythmia prefabs" />
    <meta property="og:url" content="https://vectorize.reimnop.com/" />
</svelte:head>

<div class="w-screen min-h-screen p-4 flex flex-col gap-4">
	<header>
		<Header />
	</header>
	<main>
		{@render children()}
	</main>
	<footer class="mt-auto">
		<Footer />
	</footer>
</div>