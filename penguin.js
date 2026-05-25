document.addEventListener('DOMContentLoaded', () => {
    // Create penguin container
    const penguin = document.createElement('div');
    penguin.id = 'penguin-companion';
    
    // Adorable, custom SVG penguin (side profile)
    penguin.innerHTML = `
        <svg width="36" height="36" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style="transition: transform 0.2s ease; display: block;">
            <!-- Back Foot (darker orange for shadow depth) -->
            <ellipse cx="17" cy="29" rx="4" ry="1.5" fill="#cc8400" />
            <!-- Front Foot -->
            <ellipse cx="12" cy="29" rx="4.5" ry="1.8" fill="#ffa500" />
            <!-- Body -->
            <ellipse cx="15" cy="19" rx="7" ry="10" fill="#222" />
            <!-- Belly (left-aligned for side profile facing left) -->
            <ellipse cx="11" cy="19" rx="4.5" ry="7.5" fill="#fff" />
            <!-- Head -->
            <circle cx="13" cy="9" r="6" fill="#222" />
            <!-- Beak (pointing left) -->
            <polygon points="6,8 10,7 10,10" fill="#ffa500" />
            <!-- Eye (single eye for side profile) -->
            <circle cx="10" cy="7" r="1" fill="#fff" />
            <circle cx="10" cy="7" r="0.5" fill="#000" />
            <!-- Wing / Flipper -->
            <ellipse cx="16" cy="18" rx="2" ry="5" fill="#111" transform="rotate(-10, 16, 18)" />
        </svg>
    `;
    
    document.body.appendChild(penguin);
    
    // Bounded area configurations for bottom left area
    const minX = 15;
    const maxX = 120;
    const minY = 15;
    const maxY = 65;
    
    let currentX = 15;
    let currentY = 15;
    
    // Randomly walk function
    function walk() {
        // Choose target coordinates in the bottom-left area
        const targetX = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
        const targetY = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
        
        // Determine transition speed based on distance (approx. pixel/sec)
        const dx = targetX - currentX;
        const dy = targetY - currentY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const duration = Math.max(1.2, distance * 0.018); // Walk duration in seconds
        
        // Determine facing direction based on horizontal step
        if (targetX > currentX) {
            penguin.classList.add('facing-right');
        } else {
            penguin.classList.remove('facing-right');
        }
        
        // Apply CSS transition dynamically for position
        penguin.style.transition = `left ${duration}s ease-in-out, bottom ${duration}s ease-in-out`;
        
        // Activate waddling animation
        penguin.classList.add('waddling');
        
        // Trigger the move
        penguin.style.left = `${targetX}px`;
        penguin.style.bottom = `${targetY}px`;
        
        currentX = targetX;
        currentY = targetY;
        
        // Stop waddling when destination is reached, then schedule next walk
        setTimeout(() => {
            penguin.classList.remove('waddling');
            
            // Rest at destination for a random interval (3s to 7s) before walking again
            const restDuration = Math.floor(Math.random() * 4000) + 3000;
            setTimeout(walk, restDuration);
        }, duration * 1000);
    }
    
    // Start walking 1.5 seconds after load
    setTimeout(walk, 1500);
});
