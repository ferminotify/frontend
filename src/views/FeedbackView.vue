<template>
    <div class="iframe-container">
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

const onFormLoad = () => {
	loadCounter.value += 1

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
			width: 100%;
		}
		#form{
			width: 100%;
			min-height: 288.33px;
		}
		.form-iframe{height:1900px;color:#fff}@media screen and (max-width:600px){.form-iframe{height:1930px}}@media screen and (max-width:560px){.form-iframe{height:1970px}}@media screen and (max-width:495px){.form-iframe{height:2000px}}@media screen and (max-width:386px){.form-iframe{height:2100px}}@media screen and (max-width:340px){.form-iframe{height:2150px}}@media screen and (max-width:323px){.form-iframe{height:2200px}}@media screen and (max-width:306px){.form-iframe{height:2300px}}@media screen and (max-width:289px){.form-iframe{height:2400px}}@media screen and (max-width:270px){.form-iframe{display:none}}
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
	</style>