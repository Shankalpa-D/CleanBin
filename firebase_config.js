// Firebase Config
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA3itDVKrmlVayloMN2ayqLiKbeWRLfbrc",
  authDomain: "dailylogs-1b687.firebaseapp.com",
  projectId: "dailylogs-1b687",
  storageBucket: "dailylogs-1b687.appspot.com",
  messagingSenderId: "89866807252",
  appId: "1:89866807252:web:cecd87a9eb3d88633e5841",
  measurementId: "G-SZXXQE82HS"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
window.db = db; // make globally accessible
