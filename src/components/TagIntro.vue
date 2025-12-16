<template>
    <div class="rounded-container">
      <div class="rounded-inner">
          <div class="container-title">
              <div class="container-mid">
                  <div class="container-subtitle">
                      <p class="main-subtitle1 mono">
                          &gt; inserisci il tag <br>
                      </p>
                  </div>
                  <div class="container-subtitle">
                      <p class="main-subtitle2 mono">
                          &gt; ricevi la notifica <br>
                      </p>
                  </div>
                  <div class="container-subtitle">
                      <p class="main-subtitle3 mono">
                          &gt; rimani aggiornato <br>
                      </p>
                  </div>
                  <div class="container-subtitle">
                      <p class="main-subtitle4 mono">
                          &gt <span class="primary-text mono">sempre</span>.
                      </p>
                  </div>
              </div>
          </div>
      </div>
  </div>
</template>
<style scoped>
    /***** text typing *****/
.rounded-container:nth-child(1){
    background-image: url("/img/banner/faq.png");
    background-image: url("/img/banner/faq.png"), linear-gradient(55deg, #1f1f1f 0%, #1f1f1f 45%, #323232 calc(45% + 1px), #323232 65%, #71bdec calc(65% + 1px), #71bdec 75%, #c2e7ff calc(75% + 1px), #c2e7ff 100%);
    background-size:contain;
    background-repeat: no-repeat;
    background-position: right;
}

.rounded-container:has(.container-title) {
	background-color: var(--surface);
}
.rounded-inner:has(.container-title) {
	margin: 15px 0;
	padding: 25px 0;
}

.container-title {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.5s ease-in-out;
}

.container-subtitle p {
    color: var(--on-surface);
    text-align: center;
    width: 100%;
	line-height: 2;
    font-weight: 600;
    font-size: 25px;
    float: left;
    position: relative;
}

.container-subtitle {
    float: left;
    height: 100%;
    width: fit-content;
    height: auto;
}

.container-subtitle p {
    text-align: left;
}

.container-mid {
    width: 100%;
    display: grid;
    place-items: left;
    max-width: 980px;
    padding-left: min(11%, 200px);
}

@media only screen and (max-width: 520px) {

    .container-subtitle p {
        font-size: 6vw;
    }

    .container-mid {
        padding: 0;
    }

    .container-subtitle {
        padding: 0;
    }
}

p.main-subtitle1::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    height: 100%;
    width: 100%;
    border-left: 2px solid transparent;
    background-color:var(--surface);
    animation:
        typing 0.75s steps(18) forwards;
}

p.main-subtitle2::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    height: 100%;
    width: 100%;
    border-left: 2px solid transparent;
    background-color:var(--surface);
    animation:
        typing 0.75s steps(20) forwards;
    animation-delay: 1s;
}

p.main-subtitle3::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    height: 100%;
    width: 100%;
    border-left: 2px solid transparent;
    background-color:var(--surface);
    animation:
        typing 0.75s steps(19) forwards;
    animation-delay: 2s;
}

p.main-subtitle4::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    height: 100%;
    width: 100%;
    border-left: 2px solid transparent;
    background-color:var(--surface);
    animation:
        typing 0.75s steps(9) forwards;
    animation-delay: 3s;
}

p.main-subtitle5::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    height: 100%;
    width: 100%;
    border-left: 2px solid transparent;
    background-color:var(--surface);
    animation:
        typing 0.03s steps(1) forwards;
    animation-delay: 4s;
}

@keyframes typing {
    0% {
        border-color: var(--on-surface);
    }

    99.9% {
        border-color: var(--on-surface);
    }

    100% {
        left: 100%;
        margin: 0 -15px 0 0px;
        border-color: transparent;
        width: 0%;
    }
}

/******/
</style>