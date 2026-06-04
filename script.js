document.addEventListener('DOMContentLoaded', () => {
    const flightPath = document.getElementById('flight-path');
    const airplane = document.getElementById('airplane');
    const timelineItems = document.querySelectorAll('.timeline-item');
    const revealContent = document.querySelector('.reveal-content');
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');

    let pathLength = 0;
    let scrollYMax = 0;

    // 1. INITIAL SCROLL TO BOTTOM
    // We use a small timeout to ensure layout is complete
    setTimeout(() => {
        window.scrollTo(0, document.documentElement.scrollHeight);
        document.body.style.opacity = '1';
    }, 100);

    // 2. GENERATE SVG PATH
    function updatePath() {
        const width = window.innerWidth;
        const height = document.documentElement.scrollHeight;
        document.getElementById('flight-path-svg').setAttribute('viewBox', `0 0 ${width} ${height}`);
        
        // Collect points from bottom to top
        const points = [];
        
        // Start point (below the last item)
        const lastItem = timelineItems[timelineItems.length - 1];
        const lastRect = lastItem.getBoundingClientRect();
        const scrollOffset = window.scrollY;
        
        // Add points from each timeline item
        for (let i = timelineItems.length - 1; i >= 0; i--) {
            const item = timelineItems[i];
            const polaroid = item.querySelector('.polaroid');
            const pRect = polaroid.getBoundingClientRect();
            
            // Bepaal het punt naast de polaroid zodat het vliegtuig er niet doorheen vliegt
            // Voor een item links, vliegen we er rechts langs (+ marge)
            // Voor een item rechts, vliegen we er links langs (- marge)
            const isLeft = item.classList.contains('left');
            const x = isLeft ? pRect.right + 20 : pRect.left - 20;

            points.push({
                x: x,
                y: pRect.top + pRect.height / 2 + scrollOffset
            });
        }

        // Add final reveal point
        const revealRect = document.getElementById('reveal-section').getBoundingClientRect();
        points.push({
            x: width / 2,
            y: revealRect.top + revealRect.height / 4 + scrollOffset
        });

        // Create a smooth path using Cubic Bezier
        let d = `M ${points[0].x} ${points[0].y}`;
        
        for (let i = 0; i < points.length - 1; i++) {
            const curr = points[i];
            const next = points[i + 1];
            
            const mx = (curr.x + next.x) / 2;
            const my = (curr.y + next.y) / 2;
            
            // Subtiele extra "swing" voor een speels effect
            const swing = (i % 2 === 0) ? 30 : -30;
            
            const cp1x = curr.x + swing;
            const cp1y = curr.y + (next.y - curr.y) * 0.4;
            const cp2x = next.x + swing;
            const cp2y = curr.y + (next.y - curr.y) * 0.6;
            
            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
        }

        flightPath.setAttribute('d', d);
        pathLength = flightPath.getTotalLength();
        scrollYMax = document.documentElement.scrollHeight - window.innerHeight;
    }

    // 3. ANIMATE AIRPLANE ON SCROLL
    function onScroll() {
        const scrollY = window.scrollY;
        // Progress: 0 at bottom, 1 at top
        let progress = 1 - (scrollY / scrollYMax);
        progress = Math.max(0, Math.min(1, progress));

        const point = flightPath.getPointAtLength(progress * pathLength);
        
        // Calculate angle for rotation
        const nextPoint = flightPath.getPointAtLength(Math.min(pathLength, progress * pathLength + 1));
        const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180 / Math.PI;

        airplane.style.left = `${point.x}px`;
        airplane.style.top = `${point.y - scrollY}px`;
        airplane.style.transform = `translate(-50%, -50%) rotate(${angle + 90}deg)`;

        // Trigger Reveal Content (Ticket)
        if (progress > 0.98) {
            document.querySelector('.reveal-content').style.opacity = '1';
            document.querySelector('.reveal-content').style.transform = 'scale(1)';
        }
    }

    // 4. TICKET REVEAL LOGIC
    const revealBtn = document.getElementById('reveal-btn');
    const finalDest = document.getElementById('final-destination');
    const revealFooter = document.getElementById('reveal-footer');
    const maskContent = document.querySelector('.mask-content');

    revealBtn.addEventListener('click', () => {
        maskContent.classList.add('hidden');
        finalDest.classList.remove('hidden');
        revealFooter.classList.remove('hidden');
        startConfetti();
    });

    // 4. INTERSECTION OBSERVER FOR POLAROIDS
    const observerOptions = {
        threshold: 0.2
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.querySelector('.polaroid').classList.add('visible');
            }
        });
    }, observerOptions);

    timelineItems.forEach(item => observer.observe(item));

    // 5. CONFETTI EFFECT
    let confettiActive = false;
    const particles = [];
    const colors = ['#ff4d6d', '#ffb3c1', '#ffccd5', '#fff0f3', '#ff758f'];

    function startConfetti() {
        if (confettiActive) return;
        confettiActive = true;
        resizeCanvas();
        for (let i = 0; i < 100; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                speed: Math.random() * 3 + 2,
                angle: Math.random() * 6.28,
                rotation: Math.random() * 0.2 - 0.1
            });
        }
        requestAnimationFrame(updateConfetti);
    }

    function updateConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.y += p.speed;
            p.x += Math.sin(p.angle) * 1;
            p.angle += p.rotation;
            
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);

            if (p.y > canvas.height) {
                p.y = -20;
                p.x = Math.random() * canvas.width;
            }
        });
        if (confettiActive) requestAnimationFrame(updateConfetti);
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // Initialize and Listeners
    window.addEventListener('resize', () => {
        updatePath();
        onScroll();
        resizeCanvas();
    });

    window.addEventListener('scroll', onScroll);

    // Wait for images/fonts if any, then init path
    window.addEventListener('load', () => {
        updatePath();
        onScroll();
    });
    
    // Quick init for path as well
    updatePath();
});