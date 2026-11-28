<template>
  <div class="section not-found">
    <span class="material-symbols-outlined not-found-icon" aria-hidden="true">explore</span>
    <h1>Pagina non trovata</h1>
    <nav class="not-found-links" aria-label="Pagine principali">
      <RouterLink to="/" class="btn outlined">
        <span class="material-symbols-outlined" aria-hidden="true">search</span> Cerca eventi
      </RouterLink>
      <RouterLink to="/orario" class="btn outlined">
        <span class="material-symbols-outlined" aria-hidden="true">view_agenda</span> Orario
      </RouterLink>
    </nav>
  </div>
</template>

<style src="@/assets/css/page.css"></style>
<style scoped>
  .not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 64px 16px;
    text-align: center;
  }
  .not-found-icon {
    font-size: 48px;
    color: var(--on-surface-primary);
  }
  .not-found h1 {
    margin: 0;
  }
  .not-found p {
    margin: 0;
    color: var(--on-surface-variant);
  }
  .not-found-links {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin-top: 16px;
  }
  .not-found-links .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    line-height: 1;
  }
  .not-found-links .material-symbols-outlined {
    font-size: 1.2em;
  }
</style>
