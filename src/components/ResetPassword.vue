<template>
  <div class="section flex-center-y">
    <img src="@/assets/icons/logo-long.svg" alt="Fermi Notify Logo" class="form-logo logo" />
    <div class="rounded-container" style="margin: 25px; width: min(100%, 475px)">
      <div class="rounded-inner">
        <form
          class="basic-form"
          id="form"
          method="POST"
          onsubmit="loading(0)"
          action="/user/request-change-password"
          autocomplete="off">
          <h1 class="firstTitle flex-center-x">Reset password</h1>
          <div class="input-container">
            <p class="firstSubtitle mb-10px">Inserisci la email che hai utilizzato per registrarti</p>
            <div class="material-textfield">
              <input placeholder="" type="email" required name="user_email" />
              <label>Email</label>
            </div>
          </div>
          <button class="btn filled submit-btn">Continua</button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped src="@/assets/css/page.css"></style>
