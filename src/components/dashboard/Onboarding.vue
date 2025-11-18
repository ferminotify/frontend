<template>
  <div class="bigalert" id="alert_emailBlockSpam_01">
    <div class="bigalert-inner"></div>
  </div>
</template>

<style>
  .bigalert {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  .bigalert-inner {
    max-width: 760px;
    width: 75%;
    padding: 25px 35px;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    background-color: var(--surface);
    color: #fff;
    line-height: 1.5;
  }
  .bigalert-inner p {
    font-size: 16px;
    text-align: justify;
  }
  .two-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style>
