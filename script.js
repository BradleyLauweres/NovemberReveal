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
    setTimeout(() => {
        window.scrollTo(0, document.documentElement.scrollHeight);
        document.body.style.opacity = '1';
    }, 100);

    // 2. GENERATE SVG PATH
    function updatePath() {
        const width = window.innerWidth;
        const height = document.documentElement.scrollHeight;
        document.getElementById('flight-path-svg').setAttribute('viewBox', `0 0 ${width} ${height}`);
        
        const points = [];
        const scrollOffset = window.scrollY;
        
        for (let i = timelineItems.length - 1; i >= 0; i--) {
            const item = timelineItems[i];
            const isSplit = item.classList.contains('split');
            const polaroid = item.querySelector('.polaroid');
            if (!polaroid) continue;
            
            const pRect = polaroid.getBoundingClientRect();
            let x;
            
            if (isSplit) {
                // Voor split items vliegen we door het midden
                x = width / 2;
            } else {
                const isLeft = item.classList.contains('left');
                x = isLeft ? pRect.right + 25 : pRect.left - 25;
            }

            points.push({
                x: x,
                y: pRect.top + pRect.height / 2 + scrollOffset
            });
        }

        const revealRect = document.getElementById('reveal-section').getBoundingClientRect();
        points.push({
            x: width / 2,
            y: revealRect.top + revealRect.height / 4 + scrollOffset
        });

        let d = `M ${points[0].x} ${points[0].y}`;
        
        for (let i = 0; i < points.length - 1; i++) {
            const curr = points[i];
            const next = points[i + 1];
            
            const cp1x = curr.x;
            const cp1y = curr.y + (next.y - curr.y) * 0.5;
            const cp2x = next.x;
            const cp2y = curr.y + (next.y - curr.y) * 0.5;
            
            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
        }

        flightPath.setAttribute('d', d);
        pathLength = flightPath.getTotalLength();
        scrollYMax = document.documentElement.scrollHeight - window.innerHeight;
    }

    // 3. ANIMATE AIRPLANE ON SCROLL
    function onScroll() {
        const scrollY = window.scrollY;
        let progress = 1 - (scrollY / scrollYMax);
        progress = Math.max(0, Math.min(1, progress));

        const point = flightPath.getPointAtLength(progress * pathLength);
        const nextPoint = flightPath.getPointAtLength(Math.min(pathLength, progress * pathLength + 1));
        const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180 / Math.PI;

        airplane.style.left = `${point.x}px`;
        airplane.style.top = `${point.y - scrollY}px`;
        airplane.style.transform = `translate(-50%, -50%) rotate(${angle + 90}deg)`;

        if (progress > 0.98) {
            document.querySelector('.reveal-content').style.opacity = '1';
            document.querySelector('.reveal-content').style.transform = 'scale(1)';
        }
    }

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

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.polaroid').forEach(p => observer.observe(p));

    // CONFETTI
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

    window.addEventListener('resize', () => {
        updatePath();
        onScroll();
        resizeCanvas();
    });

    window.addEventListener('scroll', onScroll);
    window.addEventListener('load', () => {
        updatePath();
        onScroll();
    });
    updatePath();
});