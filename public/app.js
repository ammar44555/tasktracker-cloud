// ====== Background Animation logic ======
const bgAnim = document.getElementById('bgAnim');
const symbols = ['^', '>', '<', 'v', '{', '}']; // Carat styles

function createSymbol() {
    const el = document.createElement('div');
    el.className = 'carat';
    el.innerText = symbols[Math.floor(Math.random() * symbols.length)];
    
    // Random horizontal position
    el.style.left = Math.random() * 100 + "vw";
    
    // Random size aur speed taake natural lage
    const duration = Math.random() * 5 + 7; // 7s to 12s
    el.style.animationDuration = duration + "s";
    el.style.fontSize = (Math.random() * 15 + 15) + "px";
    
    bgAnim.appendChild(el);
    
    // Memory clean karne ke liye element remove karein
    setTimeout(() => {
        el.remove();
    }, duration * 1000);
}

// Har 400ms mein ek naya symbol generate karein
setInterval(createSymbol, 400);
