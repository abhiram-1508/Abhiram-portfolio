const canvas = document.querySelector("#neural-canvas");
const cards = document.querySelectorAll(".project-card, .cert-card");
let pointerX = 0;
let pointerY = 0;

function attachTilt(card) {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateY = (x / rect.width - 0.5) * 9;
    const rotateX = (0.5 - y / rect.height) * 9;
    card.style.transform = `translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
}

function startFallbackNetwork() {
  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let particles = [];

  function resize() {
    width = canvas.width = window.innerWidth * window.devicePixelRatio;
    height = canvas.height = window.innerHeight * window.devicePixelRatio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    const count = Math.min(95, Math.max(44, Math.floor(window.innerWidth / 16)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.42 * window.devicePixelRatio,
      vy: (Math.random() - 0.5) * 0.42 * window.devicePixelRatio,
      r: (Math.random() * 1.8 + 0.7) * window.devicePixelRatio,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(62, 231, 255, 0.72)";
    ctx.strokeStyle = "rgba(183, 255, 87, 0.14)";
    ctx.lineWidth = window.devicePixelRatio;

    for (const particle of particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      if (particle.x < 0 || particle.x > width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > height) particle.vy *= -1;

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const a = particles[i];
        const b = particles[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        const limit = 145 * window.devicePixelRatio;
        if (distance < limit) {
          ctx.globalAlpha = 1 - distance / limit;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  draw();
}

function startThreeScene() {
  if (!window.THREE) throw new Error("Three.js unavailable");
  const THREE = window.THREE;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 12);

  const group = new THREE.Group();
  scene.add(group);

  const geometry = new THREE.IcosahedronGeometry(2.8, 2);
  const material = new THREE.MeshBasicMaterial({
    color: 0x3ee7ff,
    wireframe: true,
    transparent: true,
    opacity: 0.48,
  });
  const core = new THREE.Mesh(geometry, material);
  group.add(core);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xb7ff57,
    wireframe: true,
    transparent: true,
    opacity: 0.24,
  });

  for (let i = 0; i < 3; i += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(4 + i * 0.72, 0.012, 8, 140), ringMaterial);
    ring.rotation.x = Math.PI / (2.4 + i * 0.5);
    ring.rotation.y = Math.PI / (3.2 + i * 0.6);
    group.add(ring);
  }

  const starGeometry = new THREE.BufferGeometry();
  const starCount = 1200;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 42;
    positions[i + 1] = (Math.random() - 0.5) * 28;
    positions[i + 2] = (Math.random() - 0.5) * 22;
  }
  starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.018, transparent: true, opacity: 0.72 })
  );
  scene.add(stars);

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  function animate() {
    const t = performance.now() * 0.00045;
    group.rotation.x = t * 0.55 + pointerY * 0.18;
    group.rotation.y = t + pointerX * 0.28;
    camera.position.x += (pointerX * 1.5 - camera.position.x) * 0.025;
    camera.position.y += (-pointerY * 1.1 - camera.position.y) * 0.025;
    camera.lookAt(0, 0, 0);
    stars.rotation.y = -t * 0.22 + pointerX * 0.08;
    stars.rotation.x = t * 0.08 + pointerY * 0.05;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resize);
  resize();
  animate();
}

cards.forEach(attachTilt);
try {
  startThreeScene();
} catch (error) {
  startFallbackNetwork();
}

const cursorOrb = document.createElement("div");
cursorOrb.className = "cursor-orb";
document.body.appendChild(cursorOrb);

document.body.classList.add("motion-ready");
document.querySelectorAll(".skill-cloud span").forEach((skill, index) => {
  skill.style.setProperty("--i", index);
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.18 });

document.querySelectorAll(".section-shell").forEach((section) => {
  if (!section.classList.contains("hero")) revealObserver.observe(section);
});

document.addEventListener("pointermove", (event) => {
  const x = event.clientX;
  const y = event.clientY;
  document.body.style.setProperty("--mx", `${x}px`);
  document.body.style.setProperty("--my", `${y}px`);
  pointerX = x / window.innerWidth - 0.5;
  pointerY = y / window.innerHeight - 0.5;
  cursorOrb.animate({ transform: `translate(${x}px, ${y}px) translate(-50%, -50%)` }, { duration: 420, fill: "forwards", easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
});

document.querySelectorAll(".project-card, .cert-card, .achievement-card").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--card-x", `${event.clientX - rect.left}px`);
    card.style.setProperty("--card-y", `${event.clientY - rect.top}px`);
  });
});

document.addEventListener("scroll", () => {
  const y = window.scrollY;
  document.querySelector(".hero-copy")?.style.setProperty("transform", `translateY(${y * 0.045}px)`);
  document.querySelector(".hero-visual")?.style.setProperty("transform", `translateY(${y * -0.035}px)`);
}, { passive: true });





