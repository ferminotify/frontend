<template>
    <div class="iframe-container">
		<div v-if="isFormLoading" class="iframe-loader" aria-live="polite" aria-busy="true">
			<div class="loading-content">
				<div class="lds-grid">
					<div></div>
					<div></div>
					<div></div>
					<div></div>
					<div></div>
					<div></div>
					<div></div>
					<div></div>
					<div></div>
				</div>
			</div>
		</div>
		<iframe
			src="https://docs.google.com/forms/d/e/1FAIpQLSdRUuXVmbj8sLsTMl_UrQwO2Dt5AKm3XzjC5R_0OOiahKYRXg/viewform?embedded=true"
			frameborder="0"
			marginheight="0"
			marginwidth="0"
			scrolling="no"
			id="form"
			:class="{ 'form-iframe': hasFormIframeClass }"
			@load="onFormLoad"
		>
			Caricamento…
		</iframe>
	</div>
    <div style="margin-bottom: 50px;">
		<p class="msg">Ci sono problemi a visualizzare il form? Clicca <a href="https://forms.gle/d9vvAFXg4ESGX6128" class="link">qui</a>.</p>
	</div>
</template>
<script setup>
import { onMounted, ref } from 'vue'

const FEEDBACK_URL = 'https://forms.gle/d9vvAFXg4ESGX6128'
const MOBILE_BREAKPOINT = 270
const loadCounter = ref(0)
const hasFormIframeClass = ref(true)
const isFormLoading = ref(true)

const onFormLoad = () => {
	loadCounter.value += 1

	if (loadCounter.value >= 1) {
		isFormLoading.value = false
	}

	if (loadCounter.value === 2) {
		hasFormIframeClass.value = false
	}

	if (loadCounter.value === 3) {
		hasFormIframeClass.value = true
		loadCounter.value = 1
	}
}

onMounted(() => {
	const width =
		window.innerWidth ||
		document.documentElement.clientWidth ||
		document.body.clientWidth

	if (width <= MOBILE_BREAKPOINT) {
		window.location.replace(FEEDBACK_URL)
	}
})
</script>

<style scoped>
		.iframe-container{
			position: relative;
			width: 100%;
			min-height: calc(100dvh - 100px);
		}
		#form{
			width: 100%;
			min-height: calc(100dvh - 100px);
		}
		.iframe-loader{
			position: absolute;
			inset: 0;
            margin-left: auto;
            margin-right: auto;
			background: var(--surface);
			color: var(--on-surface);
			z-index: 2;
		}
		.loading-content {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 24px;
		}
		.lds-grid {
			display: inline-block;
			position: relative;
			width: 80px;
			height: 80px;
		}
		.lds-grid div {
			position: absolute;
			width: 16px;
			height: 16px;
			border-radius: 50%;
			background: var(--on-surface-primary);
			animation: lds-grid 1.2s linear infinite;
		}
		.lds-grid div:nth-child(1) {
			left: 8px;
			top: 8px;
			animation-delay: 0s;
		}
		.lds-grid div:nth-child(2) {
			left: 32px;
			top: 8px;
			animation-delay: -0.4s;
		}
		.lds-grid div:nth-child(3) {
			left: 56px;
			top: 8px;
			animation-delay: -0.8s;
		}
		.lds-grid div:nth-child(4) {
			left: 8px;
			top: 32px;
			animation-delay: -0.4s;
		}
		.lds-grid div:nth-child(5) {
			left: 32px;
			top: 32px;
			animation-delay: -0.8s;
		}
		.lds-grid div:nth-child(6) {
			left: 56px;
			top: 32px;
			animation-delay: -1.2s;
		}
		.lds-grid div:nth-child(7) {
			left: 8px;
			top: 56px;
			animation-delay: -0.8s;
		}
		.lds-grid div:nth-child(8) {
			left: 32px;
			top: 56px;
			animation-delay: -1.2s;
		}
		.lds-grid div:nth-child(9) {
			left: 56px;
			top: 56px;
			animation-delay: -1.6s;
		}
		.form-iframe{height:2550px;color:#fff}@media screen and (max-width:600px){.form-iframe{height:2580px}}@media screen and (max-width:560px){.form-iframe{height:2620px}}@media screen and (max-width:495px){.form-iframe{height:2700px}}@media screen and (max-width:386px){.form-iframe{height:2900px}}@media screen and (max-width:340px){.form-iframe{height:3000px}}@media screen and (max-width:323px){.form-iframe{height:3100px}}@media screen and (max-width:306px){.form-iframe{height:3200px}}@media screen and (max-width:270px){.form-iframe{display:none}}
		.msg{
			margin: 25px 0 25px 0;
			text-align: center;
			line-height: 1.5;
		}
		.card-textfaderight .fas{
			font-size: 20px;
		}
		.grid-center-2col{
			gap: 15px;
		}

		@keyframes fadeInOut {
			0%, 100% {
				opacity: 0.8;
			}
			50% {
				opacity: 1;
			}
		}

		@keyframes lds-grid {
			0%, 100% {
				opacity: 1;
			}
			33.33% {
				opacity: 0.5;
			}
			66.66% {
				opacity: 0.1;
			}
		}
	</style>