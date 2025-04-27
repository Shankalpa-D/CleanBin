const stores = {
  "HeadHouse": "0101",
  "Mobile": "0000",
  "D": "1010",
  "Baggage": "1111",
  "Departures": "1110",
  "Connector": "0001"
};

let store = "";
let today = new Date().toISOString().split('T')[0];

function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const remember = document.getElementById('rememberMe').checked;

  if (stores[username] && stores[username] === password) {
    if (remember) {
      localStorage.setItem('store', username);
    }
    sessionStorage.setItem('store', username);
    window.location.href = "stations.html";
  } else {
    document.getElementById('error-message').innerText = "Invalid Credentials";
  }
}

function adminLogin() {
  const password = document.getElementById('password').value.trim();
  if (password === "March") {
    window.location.href = "admin.html";
  } else {
    document.getElementById('error-message').innerText = "Wrong Admin Password";
  }
}

function loadStore() {
  store = sessionStorage.getItem('store') || localStorage.getItem('store');
  if (!store) {
    window.location.href = "index.html";
    return;
  }
  document.getElementById('storeName').innerText = store;
  today = new Date().toISOString().split('T')[0];
  document.getElementById('changeDate').value = today;
  loadStations();
}

function loadStations() {
  const stationsList = ['Hot Bar', 'Cold Bar', 'Warming', 'FOH', 'BOH'];
  const container = document.getElementById('stations-container');
  container.innerHTML = '';

  stationsList.forEach(station => {
    const section = document.createElement('div');
    section.className = 'station-section';
    section.innerHTML = `<h3 class="station-title">${station}</h3><div class="pictures-grid" id="grid-${station.replace(/\s/g, '')}"></div>`;
    container.appendChild(section);

    const grid = document.getElementById(`grid-${station.replace(/\s/g, '')}`);
    for (let i = 1; i <= 4; i++) {
      const slot = document.createElement('div');
      slot.className = 'picture-slot';
      slot.innerHTML = `
        <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Camera_icon.svg" class="camera-placeholder">
        <input type="file" accept="image/*" capture="camera" class="upload-input" onchange="uploadImage('${station}', ${i}, event)">
      `;
      grid.appendChild(slot);
    }
  });

  loadExistingPhotos();
}

async function uploadImage(station, slotNumber, event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async function(e) {
    const imgData = e.target.result;
    const path = `logs/${store}/${today}/${station.replace(/\s/g, '')}_pic${slotNumber}`;
    await firebaseSet(path, imgData);

    // Update the preview
    const slot = event.target.parentElement;
    const img = slot.querySelector('img');
    img.src = imgData;
    img.classList.remove('camera-placeholder');

    // Show popup after successful save
    showPopup("Photo Saved!");
  };
  reader.readAsDataURL(file);
}

// New small helper function
function showPopup(message) {
  const popup = document.getElementById('popup');
  popup.textContent = message;
  popup.classList.add('show');
  setTimeout(() => {
    popup.classList.remove('show');
  }, 1500); // Popup lasts for 1.5 seconds
}


async function loadExistingPhotos() {
  const dbRef = firebase.database().ref(`logs/${store}/${today}`);
  dbRef.once('value').then(snapshot => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      for (const key in data) {
        const parts = key.split('_pic');
        if (parts.length === 2) {
          const station = parts[0];
          const slotNumber = parseInt(parts[1]);
          const grid = document.getElementById(`grid-${station}`);
          if (grid && grid.children[slotNumber - 1]) {
            const slot = grid.children[slotNumber - 1];
            const img = slot.querySelector('img');
            img.src = data[key];
            img.classList.remove('camera-placeholder');
          }
        }
      }
    }
  });
}

function loadDateLogs() {
  today = document.getElementById('changeDate').value;
  loadStations();
}

function logout() {
  localStorage.removeItem('store');
  sessionStorage.removeItem('store');
  window.location.href = "index.html";
}

async function firebaseSet(path, value) {
  return firebase.database().ref(path).set(value);
}

async function loadLogs() {
  const date = document.getElementById('dateSelector').value;
  const dbRef = firebase.database().ref('logs');
  const snapshot = await dbRef.once('value');
  const container = document.getElementById('logsContainer');
  container.innerHTML = '';

  if (snapshot.exists()) {
    const logs = snapshot.val();
    for (const storeName in logs) {
      if (logs[storeName][date]) {
        const storeLogs = logs[storeName][date];
        const div = document.createElement('div');
        div.className = 'admin-log';
        div.innerHTML = `<h2>${storeName}</h2>`;
        for (const stationKey in storeLogs) {
          div.innerHTML += `<h4>${stationKey.replace(/([A-Z])/g, ' $1')}</h4><img src="${storeLogs[stationKey]}" class="admin-img" />`;
        }
        container.appendChild(div);
      }
    }
  } else {
    container.innerHTML = "No logs found.";
  }
}
