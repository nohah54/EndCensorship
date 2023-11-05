import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

let camera, scene, renderer;
let raycaster, mouse;
const books = []; // Array for books

let bookData = []; // Hold JSON info

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

function onMouseMove(event) {
    // Calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

window.addEventListener('mousemove', onMouseMove, false);

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e0e0e);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 100;

    renderer = new THREE.WebGLRenderer();
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

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    setInterval(spawnBook, 750); // Spawn a book every 1000ms (1 second) ???
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

    return distance < 1;
}


function spawnBook() {
    if (bookData.length === 0) {
        console.log('No book data available');
        return;
    }

    const book = new THREE.Group();

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

    // Create a div element for the book label
    const label = document.createElement('div');
    label.className = 'book-label'; // Add a class for CSS styling
    label.textContent = 'Book Name'; // Replace with your dynamic book name
    document.body.appendChild(label);

    // Add a property to your book mesh to keep track of the label element
    book.label = label;

    scene.add(book);
    books.push(book);
}

function animate() {
    requestAnimationFrame(animate);

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(books);

    // Animate books
    books.forEach((book, index) => {
        book.position.lerp(new THREE.Vector3(0, -20, 0), 0.0002);

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
