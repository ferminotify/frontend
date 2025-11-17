<template>
  <div class="sub-section info">
    <h2>
      <span class="material-symbols-outlined">person</span>
      Le tue info
    </h2>
    <div class="user-info-container">
      <div>
        <label>Nome</label>
        <div class="flex-y-center">
          <input
            ref="firstnameInput"
            type="text"
            autocomplete="off"
            name="firstname"
            class="dashboard-input"
            :placeholder="store.user?.name || ''"
            :disabled="!editing.firstname.editing || editing.firstname.loading"
            v-model="firstname"
            required
            maxlength="50" />
          <div class="dashboard-edit-btn-container">
            <div class="lds-grid" v-if="editing.firstname.loading">
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
            <div
              class="dashboard-toEdit-btns flex-y-center"
              style="gap: 10px"
              v-if="!editing.firstname.editing && !editing.firstname.loading">
              <a class="btn text" @click="editInfo('firstname')">
                <span class="material-symbols-outlined">edit</span>
              </a>
            </div>
            <div class="dashboard-editing-btns" v-if="editing.firstname.editing && !editing.firstname.loading">
              <button class="btn text" @click.prevent="cancelEdit('firstname')">
                <span class="material-symbols-outlined">close</span>
              </button>
              <button class="btn text" @click.prevent="saveEdit('firstname')">
                <span class="material-symbols-outlined">check</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div>
        <label>Cognome</label>
        <div class="flex-y-center">
          <input
            ref="lastnameInput"
            type="text"
            autocomplete="off"
            name="lastname"
            class="dashboard-input"
            :placeholder="store.user?.surname || ''"
            :disabled="!editing.lastname.editing || editing.lastname.loading"
            v-model="lastname"
            required
            maxlength="50" />
          <div class="dashboard-edit-btn-container">
            <div class="lds-grid" v-if="editing.lastname.loading">
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
            <div
              class="dashboard-toEdit-btns flex-y-center"
              style="gap: 10px"
              v-if="!editing.lastname.editing && !editing.lastname.loading">
              <a class="btn text" @click="editInfo('lastname')">
                <span class="material-symbols-outlined">edit</span>
              </a>
            </div>
            <div
              class="dashboard-editing-btns dashboard-editing-btns-lastname"
              v-if="editing.lastname.editing && !editing.lastname.loading">
              <button class="btn text" @click.prevent="cancelEdit('lastname')">
                <span class="material-symbols-outlined">close</span>
              </button>
              <button class="btn text" @click.prevent="saveEdit('lastname')">
                <span class="material-symbols-outlined">check</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="gender">
        <label for="Gender">Genere</label>
        <div class="flex-y-center">
          <select
            ref="genderSelect"
            class="dashboard-select"
            name="gender"
            v-model="gender"
            :disabled="!editing.gender.editing || editing.gender.loading">
            <option id="F" value="F">Donna (F)</option>
            <option id="M" value="M">Uomo (M)</option>
            <option id="X" value="X">Altro (ǝ)</option>
          </select>
          <div class="dashboard-edit-btn-container">
            <div class="lds-grid" v-if="editing.gender.loading">
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
            <div class="dashboard-toEdit-btns flex-y-center" v-if="!editing.gender.editing && !editing.gender.loading">
              <a class="btn text" @click="editInfo('gender')"><span class="material-symbols-outlined">edit</span></a>
            </div>
            <div class="dashboard-editing-btns" v-if="editing.gender.editing && !editing.gender.loading">
              <button class="btn text" @click.prevent="cancelEdit('gender')">
                <span class="material-symbols-outlined">close</span>
              </button>
              <button class="btn text" @click.prevent="saveEdit('gender')">
                <span class="material-symbols-outlined">check</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div>
        <label>Email</label>
        <div class="flex-y-center">
          <input
            type="text"
            autocomplete="off"
            name="email"
            :placeholder="store.user?.email || ''"
            class="dashboard-input"
            disabled
            required />
          <div class="dashboard-edit-btn-container"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="@/assets/css/dashboard.css"></style>
<style scoped src="@/assets/css/lds-grid.css"></style>

<script setup>
  import { ref, watch, nextTick } from 'vue'
  import { useUserStore } from '@/stores/user'

  const store = useUserStore()

  // local editable fields
  const firstname = ref('')
  const lastname = ref('')
  const gender = ref('')

  // element refs for focusing
  const firstnameInput = ref(null)
  const lastnameInput = ref(null)
  const genderSelect = ref(null)

  // editing state for each field
  const editing = ref({
    firstname: { editing: false, loading: false },
    lastname: { editing: false, loading: false },
    gender: { editing: false, loading: false },
  })

  // initialize local fields when store.user loads/changes
  const initFromStore = (user) => {
    firstname.value = user?.name || ''
    lastname.value = user?.surname || ''
    gender.value = user?.gender || ''
  }

  // watch store.user
  watch(
    () => store.user,
    (u) => {
      initFromStore(u)
    },
    { immediate: true }
  )

  function cancelEdit(field) {
    // reset local value from store and exit edit mode
    if (field === 'firstname') firstname.value = store.user?.name || ''
    if (field === 'lastname') lastname.value = store.user?.surname || ''
    if (field === 'gender') gender.value = store.user?.gender || ''
    editing.value[field].editing = false
  }

  async function saveEdit(field) {
    // prepare payload
    const payload = {}
    if (field === 'firstname') {
      const current = store.user?.name || ''
      const next = firstname.value.trim()
      payload.name = next && next !== current ? next : undefined
    }

    if (field === 'lastname') {
      const current = store.user?.surname || ''
      const next = lastname.value.trim()
      payload.surname = next && next !== current ? next : undefined
    }

    if (field === 'gender') {
      const current = store.user?.gender || ''
      const next = gender.value
      payload.gender = next && next !== current ? next : undefined
    }

    if (payload.name === undefined && payload.surname === undefined && payload.gender === undefined) {
      // nothing to save
      editing.value[field].editing = false
      editing.value[field].loading = false
      return
    }

    editing.value[field].loading = true

    try {
      await store.updateProfile(payload)
      // store.updateProfile updates local store.user on success
      editing.value[field].editing = false
    } catch (err) {
      console.error('Failed to save profile field', field, err)
      // revert local value
      cancelEdit(field)
    } finally {
      editing.value[field].loading = false
    }
  }

  async function editInfo(field) {
    editing.value[field].editing = true
    await nextTick()
    if (field === 'firstname' && firstnameInput.value) {
      firstnameInput.value.focus()
    }
    if (field === 'lastname' && lastnameInput.value) {
      lastnameInput.value.focus()
    }
    if (field === 'gender' && genderSelect.value) {
      genderSelect.value.focus()
    }
  }
</script>
