import * as THREE from 'three';

let camera, scene, renderer;
let raycaster, mouse;
const books = []; // Array for books

let bookData = []; // Hold JSON info

const notificationStyle = document.createElement('style');
notificationStyle.type = 'text/css';
notificationStyle.innerHTML = `
  .notification-container {
    position: fixed;
    top: 10px;
    right: 10px;
    width: 500px;
  }
  .notification {
    background-color: rgba(25, 25, 25, 0.5);
    color: #fff;
    padding: 10px;
    margin-top: 5px;
    border-radius: 5px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    transition: opacity 0.5s ease, right 0.5s ease-out; 
    opacity: 0; 
    right: -500px; 
  }
  .bottom-title {
    position: fixed;
    bottom: 0;
    width: 100%;
    text-align: center;
    padding: 25px;
    background-color: rgba(25, 25, 25, 0.8); 
    color: white;
    font-size: 1.75em;
    z-index: 1001;
  }
  .notification a:hover {
    outline: 1px solid white;
    background-color: rgba(255, 255, 255, 0.1); 
    transition: background-color 0.3s ease; 
  }

  .notification a {
    display: block; 
    padding: 5px; 
    transition: background-color 0.3s ease, outline 0.3s ease; 
    border-radius: 5px;
}
`;

let bannedBooksCount = 0; 

const bannedBooksCounter = document.createElement('div');
bannedBooksCounter.className = 'banned-books-counter';
bannedBooksCounter.textContent = `no bans on books`;
bannedBooksCounter.style.position = 'fixed';
bannedBooksCounter.style.top = '10px';
bannedBooksCounter.style.left = '10px';
bannedBooksCounter.style.color = 'white';
bannedBooksCounter.style.backgroundColor = 'rgba(25, 25, 25, 0.5)';
bannedBooksCounter.style.padding = '10px';
bannedBooksCounter.style.borderRadius = '5px';
bannedBooksCounter.style.zIndex = '1001';

document.body.appendChild(bannedBooksCounter);
document.head.appendChild(notificationStyle);

const bottomTitle = document.createElement('div');
bottomTitle.className = 'bottom-title';
bottomTitle.textContent = 'End media censorship. Gain diverse perspectives.';
document.body.appendChild(bottomTitle);

const notificationContainer = document.createElement('div');
notificationContainer.className = 'notification-container';
document.body.appendChild(notificationContainer);

// Create the fade overlay
const fadeOverlay = document.createElement('div');
fadeOverlay.style.position = 'fixed';
fadeOverlay.style.top = '0';
fadeOverlay.style.left = '0';
fadeOverlay.style.width = '100%';
fadeOverlay.style.height = '100%';
fadeOverlay.style.backgroundColor = 'black';
fadeOverlay.style.transition = 'opacity 3s';
fadeOverlay.style.zIndex = '1002'; // Ensure it's above everything else
document.body.appendChild(fadeOverlay);

import music from '/Music.wav'

let notifications = [];

fetch('/BannedBooks.json')
  .then(response => response.json())
  .then(data => {
    console.log(data);
    bookData = data;
  })
  .catch(error => {
    console.error('Error loading book data:', error);
  });

init();
animate();

function playSound() {
  const audio = new Audio(music);
  audio.type = 'audio/wav';

  // Set the properties of the audio if needed
  audio.autoplay = true; // play automatically
  audio.loop = true; // loop the sound

  // Play the sound
  audio.play().catch(e => console.error('Error playing sound:', e));
}

function addNotification(message, bookTitle) {
    if (notifications.length >= 5) {
      removeNotification(notifications[notifications.length - 1].element);
    }
  
    const notificationElement = document.createElement('div');
    notificationElement.className = 'notification';
  
    const notificationLink = document.createElement('a');
    notificationLink.href = `https://www.google.com/search?q=${encodeURIComponent(bookTitle)}`;
    notificationLink.target = '_blank'; 
    notificationLink.textContent = message;
    notificationLink.style.color = '#fff';
    notificationLink.style.textDecoration = 'none';
  
    notificationElement.appendChild(notificationLink);
  
    notificationContainer.prepend(notificationElement); 
  
    setTimeout(() => {
      notificationElement.style.right = '10px'; 
      notificationElement.style.opacity = '1';
    }, 5);
  
    const notification = { element: notificationElement, timeout: null };
    notification.timeout = setTimeout(() => removeNotification(notificationElement), 10000); 
    notifications.unshift(notification);
  
    updateNotificationPositions();
  }
  
  function removeNotification(notificationElement) {
    clearTimeout(notificationElement.timeout);
  
    notificationElement.style.opacity = '0';
    notificationElement.style.right = '-500px'; 

    setTimeout(() => {
      if (notificationContainer.contains(notificationElement)) { 
        notificationContainer.removeChild(notificationElement);
      }
      notifications = notifications.filter(notification => notification.element !== notificationElement);
      updateNotificationPositions(); 
    }, 2000); 
  }
  
  
  function updateNotificationPositions() {
    notifications.forEach((notification, index) => {
      notification.element.style.top = `${index * 60}px`;
    });
  }

function onMouseMove(event) {
    // (-1 to +1) for both components !!!!
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

window.addEventListener('mousemove', onMouseMove, false);

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe8e8e8);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 100;

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Lights
    const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(0, 1, 1).normalize();
    scene.add(directionalLight);

    playSound();

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    setInterval(spawnBook, 2000); // Spawn a book every 2000ms (2 seconds.....)
    setTimeout(() => {
        fadeOverlay.style.opacity = '0';

        // After the transition is complete, remove the overlay
        fadeOverlay.addEventListener('transitionend', () => {
            fadeOverlay.parentNode.removeChild(fadeOverlay);
        });
    }, 500);
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function checkHover(book) {
    if (bookData.length === 0) {
        console.log('No book data available');
        return;
    }


    if (book.scale.x < 0.5) {
        return false;
    }

    const ray = new THREE.Raycaster();
    ray.setFromCamera(mouse, camera);

    const point = new THREE.Vector3();
    ray.ray.closestPointToPoint(book.position, point);

    const distance = point.distanceTo(book.position);

    if (distance < 1) {
        // Set the text content of the label to the book's title from userData
        book.label.textContent = book.userData.Title; // Display the title
        return true;
    } else {
        return false;
    }
}


function spawnBook() {
    if (bookData.length === 0) {
        console.log('No book data available');
        return;
    }

    const book = new THREE.Group();
    const bookInfo = bookData.shift();

    bannedBooksCount++;
    bannedBooksCounter.textContent = bannedBooksCount === 1 ? '1 ban on books' : `${bannedBooksCount} bans on books`;

    // Dimensions
    const bookWidth = 1;
    const bookHeight = 0.6;
    let bookDepth = THREE.MathUtils.randFloat(0.05, 0.2); // Random depth between 0.15 and 0.3

    // Mats
    const edgeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff }); // white sides
    const coverMaterial = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }); // colorful cover

    // Front and back covers
    const coverGeometry = new THREE.PlaneGeometry(bookWidth, bookHeight);
    const frontCover = new THREE.Mesh(coverGeometry, coverMaterial);
    frontCover.position.z = bookDepth / 2;
    book.add(frontCover);

    const backCover = new THREE.Mesh(coverGeometry, coverMaterial);
    backCover.position.z = -bookDepth / 2;
    backCover.rotation.y = Math.PI;
    book.add(backCover);

    // Spine (one of the smaller sides)
    const spineGeometry = new THREE.PlaneGeometry(bookDepth, bookHeight);
    const spine = new THREE.Mesh(spineGeometry, edgeMaterial);
    spine.rotation.y = Math.PI / 2;
    spine.position.x = bookWidth / 2;
    book.add(spine);

    // Top edge
    const topEdgeGeometry = new THREE.PlaneGeometry(bookWidth, bookDepth);
    const topEdge = new THREE.Mesh(topEdgeGeometry, coverMaterial);
    topEdge.rotation.x = Math.PI / 2;
    topEdge.position.y = -bookHeight / 2;
    book.add(topEdge);

    // Bottom edge
    const bottomEdge = new THREE.Mesh(topEdgeGeometry, edgeMaterial);
    bottomEdge.rotation.x = -Math.PI / 2;
    bottomEdge.position.y = bookHeight / 2;
    book.add(bottomEdge);

    // Edge opposite the spine
    const oppositeSpine = new THREE.Mesh(spineGeometry, edgeMaterial);
    oppositeSpine.rotation.y = -Math.PI / 2;
    oppositeSpine.position.x = -bookWidth / 2;
    book.add(oppositeSpine);
        
    const vector = new THREE.Vector3(
        (Math.random() * 2 - 1) * (window.innerWidth / 2),
        (Math.random() * 2 - 1) * (window.innerHeight / 2),
        -camera.near
    );

    const rotationSpeed = 0.01;

    book.rotationSpeeds = {
        x: (Math.random() - 0.5) * rotationSpeed, 
        y: (Math.random() - 0.5) * rotationSpeed,
        z: (Math.random() - 0.5) * rotationSpeed
    };

    vector.unproject(camera);

    // Use a smaller distance that puts the book just outside the view
    const direction = vector.sub(camera.position).normalize();
    const distance = camera.near + 1; // Just beyond the near plane
    book.position.copy(camera.position).add(direction.multiplyScalar(distance));

    const label = document.createElement('div');
    label.className = 'book-label';
    label.textContent = 'Book Name';
    document.body.appendChild(label);

    book.label = label;
    book.label.textContent = bookInfo.Title; 
    book.userData = bookInfo;

    scene.add(book);
    books.push(book);

    addNotification(`In ${book.userData.State}, '${book.userData.Title}' has been banned in the ${book.userData.District}.`, book.userData.Title)
}

function animate() {
    requestAnimationFrame(animate);

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(books);

    // Animate books :)
    books.forEach((book, index) => {
        book.position.lerp(new THREE.Vector3(0, 0, 0), 0.0002);

        book.rotation.x += book.rotationSpeeds.x;
        book.rotation.y += book.rotationSpeeds.y;
        book.rotation.z += book.rotationSpeeds.z;

        // Scale down the book (to simulate it getting farther away)
        book.scale.multiplyScalar(0.9991);

        // Update label position
        const vector = new THREE.Vector3();
        book.getWorldPosition(vector);
        vector.project(camera);

        const x = (vector.x *  .5 + .5) * window.innerWidth;
        const y = (-vector.y * .5 + .5) * window.innerHeight;

        book.label.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;
        book.label.style.zIndex = (vector.z < 1) ? '1000' : '-1000'; // Make sure the label is only shown when the book is in front of the camera

        if (checkHover(book)) {
            book.label.style.display = 'block'; // Show label if mouse is close to the book
        } else {
            book.label.style.display = 'none'; // Otherwise, hide it
        }
        // Remove the book if it's too small or too close to the center
        if (book.scale.x < 0.1 || book.position.lengthSq() < 0.1) {
            scene.remove(book);
            document.body.removeChild(book.label); // Remove the label from the DOM
            books.splice(index, 1);
        }
    });

    render();
}

function render() {
    renderer.render(scene, camera);
}
