var app_fireBase = {};
(function(){

  const firebaseConfig = {
    apiKey: "AIzaSyD9PHphMpgi2LFUjqpiRBTude45NzzZ__M",
    authDomain: "fun-maze.firebaseapp.com",
    projectId: "fun-maze",
    databaseURL : "https://fun-maze-default-rtdb.firebaseio.com/",
    storageBucket: "fun-maze.appspot.com",
    messagingSenderId: "305335812367",
    appId: "1:305335812367:web:12245096e0110b59a67e7a",
    measurementId: "G-T4RD8QBK0X"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  firebase.analytics();

})()