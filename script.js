const stores = {
  "HeadHouse": "0101",
  "Mobile":    "0000",
  "D":         "1010",
  "Baggage":   "1111",
  "Departures":"1110",
  "Connector": "0001"
};

let store = "";
let today = new Date().toISOString().split('T')[0];

// ─── Barista Login ─────────────────────────────────────────────────────────────
function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const remember = document.getElementById('rememberMe').checked;

  if (stores[username] && stores[username] === password) {
    if (remember) localStorage.setItem('store', username);
    sessionStorage.setItem('store', username);
    window.location.href = "stations.html";
  } else {
    document.getElementById('error-message').innerText = "Invalid Credentials";
  }
}

// ─── Admin Login (modal) ───────────────────────────────────────────────────────
function adminLogin() {
  const adminModal = document.getElementById('adminModal');
  document.getElementById('adminError').innerText = '';
  document.getElementById('adminPasswordInput').value = '';
  adminModal.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  // Modal close
  document.querySelector('.modal-close')
    .addEventListener('click', () => document.getElementById('adminModal').classList.add('hidden'));

  // Modal submit
  document.getElementById('adminSubmitBtn')
    .addEventListener('click', () => {
      const pwd = document.getElementById('adminPasswordInput').value.trim();
      if (pwd === 'March') {
        sessionStorage.setItem('isAdminAuthenticated', 'true');
        window.location.href = 'admin.html';
      } else {
        document.getElementById('adminError').innerText = 'Wrong Admin Password';
      }
    });
});

// ─── Barista Stations View ──────────────────────────────────────────────────────
function loadStore() {
  store = sessionStorage.getItem('store') || localStorage.getItem('store');
  if (!store) return window.location.href = "index.html";
  document.getElementById('storeName').innerText = store;
  today = new Date().toISOString().split('T')[0];
  document.getElementById('changeDate').value = today;
  loadStations();
}

function loadStations() {
  // Added "Others" with 10 slots
  const stationsList = ['Hot Bar', 'Cold Bar', 'Warming', 'FOH', 'BOH', 'Others'];
  const container = document.getElementById('stations-container');
  container.innerHTML = '';

  stationsList.forEach(station => {
    const id = station.replace(/\s/g, '');
    const section = document.createElement('div');
    section.className = 'station-section';
    section.innerHTML = `
      <h3 class="station-title">${station}</h3>
      <div class="pictures-grid" id="grid-${id}"></div>
    `;
    container.appendChild(section);

    const grid = document.getElementById(`grid-${id}`);
    const slotCount = station === 'Others' ? 10 : 4;
    for (let i = 1; i <= slotCount; i++) {
      const slot = document.createElement('div');
      slot.className = 'picture-slot';
      slot.innerHTML = `
        <img src="daily_log_website/images/camera_icon.png" class="camera-placeholder">
        <input type="file" accept="image/*" capture="camera"
               class="upload-input"
               onchange="uploadImage('${station}', ${i}, event)">
      `;
      grid.appendChild(slot);
    }
  });

  loadExistingPhotos();
}

// ─── Upload & Load Helpers ──────────────────────────────────────────────────────
async function uploadImage(station, slotNumber, event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async e => {
    const imgData = e.target.result;
    const path = `logs/${store}/${today}/${station.replace(/\s/g, '')}_pic${slotNumber}`;
    await firebaseSet(path, imgData);
    const slot = event.target.parentElement;
    const img = slot.querySelector('img');
    img.src = imgData;
    img.classList.remove('camera-placeholder');
    showPopup("Photo Saved!");
  };
  reader.readAsDataURL(file);
}

function showPopup(message) {
  const popup = document.getElementById('popup');
  popup.textContent = message;
  popup.classList.add('show');
  setTimeout(() => popup.classList.remove('show'), 1500);
}

async function loadExistingPhotos() {
  const dbRef = firebase.database().ref(`logs/${store}/${today}`);
  dbRef.once('value').then(snapshot => {
    if (!snapshot.exists()) return;
    const data = snapshot.val();
    Object.keys(data).forEach(key => {
      const [stationKey, slotStr] = key.split('_pic');
      const idx = parseInt(slotStr, 10) - 1;
      const grid = document.getElementById(`grid-${stationKey}`);
      if (grid && grid.children[idx]) {
        const img = grid.children[idx].querySelector('img');
        img.src = data[key];
        img.classList.remove('camera-placeholder');
      }
    });
  });
}

function loadDateLogs() {
  today = document.getElementById('changeDate').value;
  loadStations();
}

// ─── Logout ───────────────────────────────────────────────────────────────────
function logout() {
  localStorage.removeItem('store');
  sessionStorage.removeItem('store');
  sessionStorage.removeItem('isAdminAuthenticated');
  window.location.href = "index.html";
}

// ─── Firebase Helper ──────────────────────────────────────────────────────────
async function firebaseSet(path, value) {
  return firebase.database().ref(path).set(value);
}

// ─── Admin Panel View ─────────────────────────────────────────────────────────
function adminInit() {
  if (!sessionStorage.getItem('isAdminAuthenticated')) {
    alert("Not authenticated");
    return window.location.href = "index.html";
  }
  const sel = document.getElementById('storeSelect');
  sel.innerHTML = '<option value="" disabled selected>Select a store</option>';
  Object.keys(stores).forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.innerText = name;
    sel.appendChild(opt);
  });
  document.getElementById('changeDate').value = new Date().toISOString().split('T')[0];
}

function adminLoadStations() {
  const selectedStore = document.getElementById('storeSelect').value;
  const selectedDate  = document.getElementById('changeDate').value;
  if (!selectedStore || !selectedDate) return;

  store = selectedStore;
  today = selectedDate;

  const stationsList = ['Hot Bar', 'Cold Bar', 'Warming', 'FOH', 'BOH', 'Others'];
  const container = document.getElementById('stations-container');
  container.innerHTML = '';

  stationsList.forEach(station => {
    const id = station.replace(/\s/g, '');
    const section = document.createElement('div');
    section.className = 'station-section';
    section.innerHTML = `
      <h3 class="station-title">${station}</h3>
      <div class="pictures-grid" id="grid-${id}"></div>
    `;
    container.appendChild(section);

    const grid = document.getElementById(`grid-${id}`);
    const slotCount = station === 'Others' ? 10 : 4;
    for (let i = 1; i <= slotCount; i++) {
      const slot = document.createElement('div');
      slot.className = 'picture-slot';
      slot.innerHTML = `<div class="no-data">NO DATA</div>`;
      grid.appendChild(slot);
    }
  });

  // load saved images
  const dbRef = firebase.database().ref(`logs/${store}/${today}`);
  dbRef.once('value').then(snapshot => {
    if (!snapshot.exists()) return;
    const data = snapshot.val();
    Object.keys(data).forEach(key => {
      const [stationKey, slotStr] = key.split('_pic');
      const idx = parseInt(slotStr, 10) - 1;
      const grid = document.getElementById(`grid-${stationKey}`);
      if (grid && grid.children[idx]) {
        grid.children[idx].innerHTML =
          `<img src="${data[key]}" class="admin-img" />`;
      }
    });
  });
}
