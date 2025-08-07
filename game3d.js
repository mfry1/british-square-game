class BritishSquare3D extends BritishSquareGame {
  constructor() {
    // Call parent constructor first
    super();

    // Initialize 3D properties after super()
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.boardMesh = null;
    this.squares = [];
    this.pieces = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredSquare = null;
    this.is3DReady = false;

    // Initialize 3D after parent is ready
    this.init3D();
  }

  init3D() {
    const canvas = document.getElementById("game-canvas");
    const container = document.querySelector(".game-board-container");

    // Scene setup
    this.scene = new THREE.Scene();
    // Make scene background transparent to blend with app background
    this.scene.background = null;

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      1, // Will be updated in resize
      0.1,
      1000
    );
    this.camera.position.set(0, 4, 4);
    this.camera.lookAt(0, 0, 0);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true, // Enable transparency
    });
    this.renderer.setClearColor(0x000000, 0); // Transparent background
    this.renderer.setSize(500, 500);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Orbit controls - with fallback for manual controls
    if (typeof THREE.OrbitControls !== "undefined") {
      this.controls = new THREE.OrbitControls(
        this.camera,
        this.renderer.domElement
      );
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2.2; // Limit vertical rotation
      this.controls.minDistance = 5;
      this.controls.maxDistance = 15;
    } else {
      // Manual camera controls
      this.setupManualControls();
    }

    // Lighting
    this.setupLighting();

    // Create the game board
    this.create3DBoard();

    // Event listeners for both mouse and touch
    canvas.addEventListener("click", (event) => this.on3DClick(event));
    canvas.addEventListener("mousemove", (event) => this.on3DMouseMove(event));

    // Touch event listener for mobile tile selection - use touchstart for better iOS compatibility
    canvas.addEventListener("touchstart", (event) => {
      // Only handle single touch for tile selection
      if (event.touches.length === 1) {
        this.handleTouchSelection(event);
      }
    });

    // Start render loop
    this.animate();

    // Hide loading message
    document.getElementById("loading-message").style.display = "none";

    // Mark 3D as ready
    this.is3DReady = true;

    // Update display now that 3D is ready
    this.updateValidMoves();
  }

  setupManualControls() {
    // Manual camera control variables
    this.cameraControls = {
      mouseDown: false,
      mouseX: 0,
      mouseY: 0,
      phi: 0.5, // vertical rotation
      theta: 0, // horizontal rotation
      radius: 5, // distance from center
      touchStartTime: 0,
      touchMoved: false,
      touchStartX: 0,
      touchStartY: 0,
    };

    const canvas = this.renderer.domElement;

    // Mouse events for camera control
    canvas.addEventListener("mousedown", (event) => {
      if (event.button === 0) {
        // Left mouse button
        this.cameraControls.mouseDown = true;
        this.cameraControls.mouseX = event.clientX;
        this.cameraControls.mouseY = event.clientY;
        canvas.style.cursor = "grabbing";
      }
    });

    canvas.addEventListener("mousemove", (event) => {
      if (this.cameraControls && this.cameraControls.mouseDown) {
        const deltaX = event.clientX - this.cameraControls.mouseX;
        const deltaY = event.clientY - this.cameraControls.mouseY;

        this.cameraControls.theta -= deltaX * 0.01;
        this.cameraControls.phi += deltaY * 0.01;

        // Limit vertical rotation
        this.cameraControls.phi = Math.max(
          0.1,
          Math.min(Math.PI - 0.1, this.cameraControls.phi)
        );

        this.updateCameraPosition();

        this.cameraControls.mouseX = event.clientX;
        this.cameraControls.mouseY = event.clientY;
      }
    });

    canvas.addEventListener("mouseup", () => {
      if (this.cameraControls) {
        this.cameraControls.mouseDown = false;
        canvas.style.cursor = "grab";
      }
    });

    // Touch events for mobile camera control
    canvas.addEventListener("touchstart", (event) => {
      if (event.touches.length === 1 && this.cameraControls) {
        // Only prevent default if we're sure this is for camera control
        // Don't prevent default immediately to allow tile selection to work
        this.cameraControls.mouseDown = true;
        this.cameraControls.mouseX = event.touches[0].clientX;
        this.cameraControls.mouseY = event.touches[0].clientY;
        this.cameraControls.touchStartTime = Date.now();
        this.cameraControls.touchMoved = false;
        this.cameraControls.touchStartX = event.touches[0].clientX;
        this.cameraControls.touchStartY = event.touches[0].clientY;
      }
    });

    canvas.addEventListener("touchmove", (event) => {
      if (
        this.cameraControls &&
        this.cameraControls.mouseDown &&
        event.touches.length === 1
      ) {
        // Now we know it's camera movement, so prevent default
        event.preventDefault();

        const deltaX = event.touches[0].clientX - this.cameraControls.mouseX;
        const deltaY = event.touches[0].clientY - this.cameraControls.mouseY;

        // Check if this is a significant movement (not just a tap)
        const totalMoveX = Math.abs(
          event.touches[0].clientX - this.cameraControls.touchStartX
        );
        const totalMoveY = Math.abs(
          event.touches[0].clientY - this.cameraControls.touchStartY
        );

        if (totalMoveX > 5 || totalMoveY > 5) {
          this.cameraControls.touchMoved = true;
        }

        this.cameraControls.theta -= deltaX * 0.01;
        this.cameraControls.phi += deltaY * 0.01;

        // Limit vertical rotation
        this.cameraControls.phi = Math.max(
          0.1,
          Math.min(Math.PI - 0.1, this.cameraControls.phi)
        );

        this.updateCameraPosition();

        this.cameraControls.mouseX = event.touches[0].clientX;
        this.cameraControls.mouseY = event.touches[0].clientY;
      }
    });

    canvas.addEventListener("touchend", () => {
      if (this.cameraControls) {
        this.cameraControls.mouseDown = false;
      }
    });

    // Mouse wheel for zoom
    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      this.cameraControls.radius += event.deltaY * 0.01;
      this.cameraControls.radius = Math.max(
        3,
        Math.min(15, this.cameraControls.radius)
      );
      this.updateCameraPosition();
    });

    // Set initial camera position
    this.updateCameraPosition();
  }

  updateCameraPosition() {
    if (this.cameraControls) {
      const x =
        this.cameraControls.radius *
        Math.sin(this.cameraControls.phi) *
        Math.cos(this.cameraControls.theta);
      const y = this.cameraControls.radius * Math.cos(this.cameraControls.phi);
      const z =
        this.cameraControls.radius *
        Math.sin(this.cameraControls.phi) *
        Math.sin(this.cameraControls.theta);

      this.camera.position.set(x, y, z);
      this.camera.lookAt(0, 0, 0);
    }
  }

  setupLighting() {
    // Ambient light - increased for transparent background
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    this.scene.add(ambientLight);

    // Main directional light - adjusted for better visibility on transparent background
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    this.scene.add(directionalLight);

    // Fill light - warmer tone to complement the blue gradient background
    const fillLight = new THREE.DirectionalLight(0xffd700, 0.4);
    fillLight.position.set(-5, 3, -5);
    this.scene.add(fillLight);
  }

  create3DBoard() {
    // Board base
    const boardGeometry = new THREE.BoxGeometry(5.5, 0.3, 5.5);
    const boardMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    this.boardMesh = new THREE.Mesh(boardGeometry, boardMaterial);
    this.boardMesh.position.y = -0.15;
    this.boardMesh.receiveShadow = true;
    this.scene.add(this.boardMesh);

    // Create squares
    this.squares = [];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const index = row * 5 + col;
        const squareGeometry = new THREE.BoxGeometry(0.9, 0.05, 0.9);
        const squareMaterial = new THREE.MeshLambertMaterial({
          color: 0xf5deb3,
          transparent: true,
        });

        const square = new THREE.Mesh(squareGeometry, squareMaterial);
        square.position.set((col - 2) * 1.1, 0.025, (row - 2) * 1.1);
        square.receiveShadow = true;
        square.userData = { index: index, row: row, col: col };

        this.squares.push(square);
        this.scene.add(square);
      }
    }

    // Initialize pieces array
    this.pieces = new Array(25).fill(null);
  }

  createBoard() {
    // Override parent method - board is created in 3D
    this.create3DBoard();
  }

  updateSquareDisplay(index) {
    // Skip if 3D elements aren't ready yet
    if (!this.is3DReady || !this.pieces || !this.squares || !this.scene) {
      return;
    }

    // Remove existing piece if any
    if (this.pieces[index]) {
      this.scene.remove(this.pieces[index]);
    }

    const square = this.squares[index];
    if (!square) {
      return;
    }

    const player = this.board[index];

    if (player === 1) {
      // Player 1 - Sphere (red to match 2D)
      const geometry = new THREE.SphereGeometry(0.3, 16, 16);
      const material = new THREE.MeshLambertMaterial({ color: 0xff6b6b });
      const piece = new THREE.Mesh(geometry, material);
      piece.position.copy(square.position);
      piece.position.y = 0.3;
      piece.castShadow = true;
      piece.userData = { player: 1, index: index };

      this.pieces[index] = piece;
      this.scene.add(piece);

      // Animate piece drop
      piece.position.y = 2;
      this.animatePieceDrop(piece, 0.3);
    } else if (player === 2) {
      // Player 2/AI - Cube (teal to match 2D)
      const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const material = new THREE.MeshLambertMaterial({ color: 0x4ecdc4 });
      const piece = new THREE.Mesh(geometry, material);
      piece.position.copy(square.position);
      piece.position.y = 0.35;
      piece.castShadow = true;
      piece.userData = { player: 2, index: index };

      this.pieces[index] = piece;
      this.scene.add(piece);

      // Animate piece drop
      piece.position.y = 2;
      this.animatePieceDrop(piece, 0.35);
    }
  }

  animatePieceDrop(piece, targetY) {
    const startY = piece.position.y;
    const duration = 500; // ms
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (bounce)
      const easeOutBounce = (t) => {
        if (t < 1 / 2.75) {
          return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
          return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        } else if (t < 2.5 / 2.75) {
          return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        } else {
          return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
      };

      const easedProgress = easeOutBounce(progress);
      piece.position.y = startY + (targetY - startY) * easedProgress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  updateValidMoves() {
    // Skip if 3D elements aren't ready yet
    if (!this.is3DReady || !this.squares || this.squares.length === 0) {
      return;
    }

    // Reset all square colors to default
    this.squares.forEach((square) => {
      square.material.color.setHex(0xf5deb3);
      square.material.opacity = 1.0;
    });

    // Visual indicators for invalid moves are now hidden for a cleaner 3D look
    // The game still validates moves internally when clicked
  }

  handleTouchSelection(event) {
    if (!this.gameActive) return;

    // In AI mode, only allow human player touches
    if (this.gameMode === "ai" && this.currentPlayer === 2) {
      return;
    }

    // Store touch start info for later comparison
    const touch = event.touches[0];
    const startTime = Date.now();
    const startX = touch.clientX;
    const startY = touch.clientY;

    // Set up a one-time touchend listener to handle the tap
    const handleTouchEnd = (endEvent) => {
      endEvent.preventDefault();

      // Remove the listener
      this.renderer.domElement.removeEventListener("touchend", handleTouchEnd);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Only treat as tap if it was quick and didn't move much
      if (duration < 300 && endEvent.changedTouches.length === 1) {
        const endTouch = endEvent.changedTouches[0];
        const moveDistance = Math.sqrt(
          Math.pow(endTouch.clientX - startX, 2) +
            Math.pow(endTouch.clientY - startY, 2)
        );

        // If the touch didn't move much, treat it as a tile selection
        if (moveDistance < 10) {
          this.processTileSelection(endTouch);
        }
      }
    };

    // Add the touchend listener
    this.renderer.domElement.addEventListener("touchend", handleTouchEnd);
  }

  processTileSelection(touch) {
    const rect = this.renderer.domElement.getBoundingClientRect();

    // Calculate touch position relative to canvas
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Convert to normalized device coordinates
    const mouse = new THREE.Vector2();
    mouse.x = (x / rect.width) * 2 - 1;
    mouse.y = -(y / rect.height) * 2 + 1;

    // Create raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    // Check for intersections with square meshes
    const intersects = raycaster.intersectObjects(this.squares);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;
      const index = clickedMesh.userData.index;

      if (this.board[index] === null && this.isValidMove(index)) {
        this.makeMove(index);
      } else if (this.board[index] !== null) {
        // Square occupied
        return;
      } else {
        // Invalid move
        this.showMessage(
          "Invalid move! Cannot place next to opponent pieces.",
          "error"
        );
      }
    }
  }

  on3DTouch(event) {
    if (!this.gameActive) return;

    // In AI mode, only allow human player touches
    if (this.gameMode === "ai" && this.currentPlayer === 2) {
      return;
    }

    // Only handle single touch tap for tile selection
    if (event.changedTouches.length !== 1) return;

    event.preventDefault();

    // Check if this was a camera drag (movement) rather than a tap
    if (this.cameraControls) {
      const touchDuration = Date.now() - this.cameraControls.touchStartTime;

      // If the touch moved significantly or lasted too long, don't select a tile
      if (this.cameraControls.touchMoved || touchDuration > 300) {
        return;
      }
    }

    const touch = event.changedTouches[0];
    const rect = this.renderer.domElement.getBoundingClientRect();

    // Calculate touch position relative to canvas
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Convert to normalized device coordinates
    const mouse = new THREE.Vector2();
    mouse.x = (x / rect.width) * 2 - 1;
    mouse.y = -(y / rect.height) * 2 + 1;

    // Create raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    // Check for intersections with square meshes
    const intersects = raycaster.intersectObjects(this.squares);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;
      const index = clickedMesh.userData.index;

      if (this.board[index] === null && this.isValidMove(index)) {
        this.makeMove(index);
      } else if (this.board[index] !== null) {
        // Square occupied
        return;
      } else {
        // Invalid move
        this.showMessage(
          "Invalid move! Cannot place next to opponent pieces.",
          "error"
        );
      }
    }
  }

  on3DClick(event) {
    if (!this.gameActive) return;

    // In AI mode, only allow human player clicks
    if (this.gameMode === "ai" && this.currentPlayer === 2) {
      return;
    }

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.squares);

    if (intersects.length > 0) {
      const square = intersects[0].object;
      const index = square.userData.index;

      if (this.board[index] === null && this.isValidMove(index)) {
        this.makeMove(index);
      } else if (this.board[index] !== null) {
        // Square occupied
        return;
      } else {
        // Invalid move
        this.showMessage(
          "Invalid move! Cannot place next to opponent pieces.",
          "error"
        );
      }
    }
  }

  on3DMouseMove(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.squares);

    // Reset previous hover
    if (
      this.hoveredSquare &&
      this.board[this.hoveredSquare.userData.index] === null
    ) {
      if (this.isValidMove(this.hoveredSquare.userData.index)) {
        this.hoveredSquare.material.color.setHex(0xf5deb3);
      }
    }

    // Set new hover
    if (intersects.length > 0) {
      const square = intersects[0].object;
      const index = square.userData.index;

      if (this.board[index] === null && this.isValidMove(index)) {
        if (!(this.gameMode === "ai" && this.currentPlayer === 2)) {
          square.material.color.setHex(0x90ee90); // Light green for valid moves
          this.hoveredSquare = square;
          this.renderer.domElement.style.cursor = "pointer";
        }
      } else {
        this.renderer.domElement.style.cursor = "not-allowed";
      }
    } else {
      this.renderer.domElement.style.cursor = "grab";
      this.hoveredSquare = null;
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Update controls if OrbitControls is available
    if (this.controls && this.controls.update) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }

  newGame() {
    // Remove all pieces from scene
    if (this.pieces && this.pieces.length > 0) {
      this.pieces.forEach((piece) => {
        if (piece) {
          this.scene.remove(piece);
        }
      });
    }

    // Reset pieces array
    this.pieces = new Array(25).fill(null);

    // Call parent newGame
    super.newGame();
  }

  // Override parent method to use 3D canvas sizing
  initializeGame() {
    this.updateDisplay();
    this.updateValidMoves();
  }
}

// Update the mobile responsive styles for 3D
const style3D = document.createElement("style");
style3D.textContent = `
    .game-canvas {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
    }
    
    @media (max-width: 768px) {
        .game-canvas {
            width: 350px !important;
            height: 350px !important;
        }
    }
    
    @media (max-width: 480px) {
        .game-canvas {
            width: 300px !important;
            height: 300px !important;
        }
    }
`;
document.head.appendChild(style3D);
