AOS.init({ duration: 1000, once: true });

// Theme Logic
const toggle = document.getElementById('toggleTheme');
const ico = document.getElementById('themeIco');

function setTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    ico.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('careerTheme', theme);
}

const currentTheme = localStorage.getItem('careerTheme') || 'dark';
setTheme(currentTheme);

toggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
    setTheme(next);
});

// Cycling Loading Messages
const loadingMessages = [
    "🔍 Scanning resume structure...",
    "🤖 Simulating ATS algorithms...",
    "👔 Analyzing from recruiter perspective...",
    "📊 Calculating skill matches...",
    "🎯 Identifying keyword gaps...",
    "💡 Generating career insights...",
    "🚀 Preparing your roadmap...",
    "✨ Polishing recommendations..."
];

let messageIndex = 0;
let messageInterval = null;
let matrixInterval = null;

function cycleLoadingMessages() {
    const msgElement = document.getElementById('loadingMessage');
    if (msgElement) {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        msgElement.style.opacity = '0';
        setTimeout(() => {
            msgElement.textContent = loadingMessages[messageIndex];
            msgElement.style.opacity = '1';
        }, 300);
    }
}

// Loader with cycling messages
const form = document.getElementById('analyzeForm');
// Matrix Digital Rain Effect
function initMatrix() {
    const canvas = document.getElementById('matrix-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const characters = "0123456789ABCDEFHIJKLMNOPQRSTUVWXYZ@#$%^&*()";
    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const drops = [];

    for (let i = 0; i < columns; i++) {
        drops[i] = 1;
    }

    function draw() {
        ctx.fillStyle = "rgba(2, 6, 23, 0.05)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#6366f1"; // Primary color
        ctx.font = fontSize + "px monospace";

        for (let i = 0; i < drops.length; i++) {
            const text = characters.charAt(Math.floor(Math.random() * characters.length));
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    return setInterval(draw, 33);
}

function showLoader() {
    document.getElementById('loading-overlay').style.display = 'flex';
    if (matrixInterval) clearInterval(matrixInterval);
    if (messageInterval) clearInterval(messageInterval);
    matrixInterval = initMatrix();
    messageInterval = setInterval(cycleLoadingMessages, 2000);
}

if (form) {
    form.addEventListener('submit', () => {
        showLoader();
    });
}

const apiForm = document.getElementById('apiKeyForm');
if (apiForm) {
    apiForm.addEventListener('submit', () => {
        // Hide modal
        const modalEl = document.getElementById('apiKeyModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) {
            modal.hide();
        }
        // Show loader
        showLoader();
    });
}

// === HISTORY MANAGEMENT ===
const HISTORY_KEY = 'resumeAnalyzerHistory';
const MAX_HISTORY = 10;

function saveToHistory(data) {
    let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const entry = {
        id: Date.now(),
        name: data.candidate_info?.name || 'Unknown',
        title: data.candidate_info?.title || 'N/A',
        score: data.ats_analysis?.overall_score || 0,
        decision: data.recruiter_review?.decision || 'N/A',
        timestamp: new Date().toLocaleString(),
        data: data
    };
    history.unshift(entry);
    if (history.length > MAX_HISTORY) history.pop();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function showHistory() {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const container = document.getElementById('historyList');
    if (history.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">No history found. Analyze a resume to get started!</p>';
    } else {
        container.innerHTML = history.map(item => `
                    <div class="p-3 mb-3 rounded-4 border border-glass d-flex justify-content-between align-items-center" style="background: var(--glass-bg);">
                        <div>
                            <div class="fw-bold">${item.name}</div>
                            <div class="small text-muted">${item.title} &bull; Score: ${item.score}% &bull; ${item.decision}</div>
                            <div class="small text-muted">${item.timestamp}</div>
                        </div>
                        <button class="btn btn-sm btn-primary" onclick="loadHistoryItem(${item.id})">View</button>
                    </div>
                `).join('');
    }
    new bootstrap.Modal(document.getElementById('historyModal')).show();
}

function clearHistory() {
    if (confirm('Are you sure you want to clear all history?')) {
        localStorage.removeItem(HISTORY_KEY);
        document.getElementById('historyList').innerHTML = '<p class="text-muted text-center">History cleared.</p>';
    }
}

function loadHistoryItem(id) {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const item = history.find(h => h.id === id);
    if (item) {
        console.log('Loaded history item:', item.data);
        // Create a temporary form to submit the saved data
        // Since we can't easily "inject" result into the jinja template client-side without reloading
        // We will alert the user for now, but a better fix is to store the full HTML or use a client-side renderer.
        // For this quick fix, we will just show the JSON in a pretty format in a new window/modal

        // OR better: reload the page with the data in URL params? No, too large.
        // BEST approach for "View": Just show the item.data in a simplified modal view manually constructed

        const data = item.data;
        const modalBody = document.getElementById('historyList');
        // Temporarily replace history list with detailed view
        modalBody.innerHTML = `
                    <div class="text-start">
                         <button class="btn btn-sm btn-secondary mb-3" onclick="showHistory()"><i class="fas fa-arrow-left me-2"></i>Back to List</button>
                         <h4 class="text-primary">${item.name}</h4>
                         <p class="text-muted">${item.title} | ${item.timestamp}</p>
                         <div class="p-3 rounded-3 border border-glass mb-3" style="background: var(--glass-bg);">
                            <div class="h3 fw-bold text-white mb-0">${item.score}% ATS Score</div>
                            <div class="h5 ${item.decision === 'Shortlisted' ? 'text-success' : 'text-warning'}">${item.decision}</div>
                         </div>
                         <div class="alert alert-info border-0 bg-opacity-10 bg-info">
                            <i class="fas fa-info-circle me-2"></i> To view the full graphical report, please re-analyze the resume. History currently saves the key summary data.
                         </div>
                    </div>
                `;
    }
}

// === SHARE CARD GENERATION ===
function generateShareCard() {
    const card = document.getElementById('shareCard');
    if (!resultData) {
        alert('No results to share!');
        return;
    }

    // Populate card
    document.getElementById('shareCardName').textContent = resultData.candidate_info?.name || 'Name';
    document.getElementById('shareCardTitle').textContent = resultData.candidate_info?.title || 'Title';
    document.getElementById('shareCardScore').textContent = resultData.ats_analysis?.overall_score || '0';
    document.getElementById('shareCardDecision').textContent = resultData.recruiter_review?.decision || 'N/A';

    // Make card visible temporarily for rendering
    card.style.position = 'absolute';
    card.style.left = '0';
    card.style.zIndex = '9999';
    document.body.appendChild(card);

    html2canvas(card, { backgroundColor: '#050510', scale: 2 }).then(canvas => {
        card.style.position = 'fixed';
        card.style.left = '-9999px';

        const link = document.createElement('a');
        link.download = `${resultData.candidate_info?.name || 'Resume'}_ShareCard.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        alert('Share card downloaded! You can now upload it to LinkedIn.');
    }).catch(err => {
        console.error('Share card error:', err);
        card.style.position = 'fixed';
        card.style.left = '-9999px';
    });
}

// === COVER LETTER FUNCTIONS ===
function copyCoverLetter() {
    const content = document.getElementById('coverLetterContent').innerText;
    navigator.clipboard.writeText(content).then(() => {
        alert('Cover letter copied to clipboard!');
    });
}

function downloadCoverLetter() {
    const contentElement = document.getElementById('coverLetterContent');
    const content = contentElement ? contentElement.innerText || contentElement.textContent : '';

    if (!content || content.trim() === '') {
        alert('Cover letter content is empty or not yet generated.');
        return;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resultData?.candidate_info?.name || 'Candidate'}_Cover_Letter.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Confetti Celebration Function
function launchConfetti() {
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#6366f1', '#ec4899', '#00f2fe']
        });
        confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#6366f1', '#ec4899', '#00f2fe']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

// Score Ring Animation with Counter and Confetti
const resultData = window.RESUME_DATA || null;

if (resultData && resultData.ats_analysis) {
    // Save to history
    saveToHistory(resultData);

    // Stop cycling messages
    if (messageInterval) clearInterval(messageInterval);

    // Recruiter Verdict Typewriter Effect
    const verdictElement = document.querySelector('.recruiter-verdict p') || document.querySelector('#tab-verdict .h4.lh-base');
    if (verdictElement) {
        const text = verdictElement.innerHTML;
        verdictElement.innerHTML = '';
        let i = 0;
        const type = () => {
            if (i < text.length) {
                verdictElement.innerHTML += text.charAt(i);
                i++;
                setTimeout(type, 15);
            }
        };
        setTimeout(type, 1000);
    }

    setTimeout(() => {
        const ring = document.getElementById('mainScoreRing');
        const counter = document.getElementById('scoreCounter');
        const targetScore = resultData.ats_analysis.overall_score;

        if (ring && counter) {
            // Animate ring
            const offset = 565 - (565 * targetScore / 100);
            ring.style.strokeDashoffset = offset;

            // Animate counter
            let currentScore = 0;
            const duration = 1500;
            const increment = targetScore / (duration / 16);

            const counterInterval = setInterval(() => {
                currentScore += increment;
                if (currentScore >= targetScore) {
                    currentScore = targetScore;
                    clearInterval(counterInterval);

                    // Launch confetti for high scores!
                    if (targetScore >= 80) {
                        launchConfetti();
                    }
                }
                counter.textContent = Math.round(currentScore);
            }, 16);
        }

        // Animate progress bars for breakdown scores
        const breakdown = resultData.ats_analysis.breakdown;
        if (breakdown) {
            setTimeout(() => {
                document.querySelectorAll('.score-progress-bar').forEach(bar => {
                    const key = bar.dataset.key;
                    if (breakdown[key] !== undefined) {
                        bar.style.width = breakdown[key] + '%';
                    }
                });
            }, 500);
        }

        // Animate Skill Radar
        const skillRadar = resultData.advanced_insights.skill_radar;
        if (skillRadar) {
            document.querySelectorAll('.radar-item circle[stroke="var(--primary)"]').forEach((circle, index) => {
                const score = Object.values(skillRadar)[index];
                const offset = 283 - (283 * score / 100);
                circle.style.strokeDashoffset = offset;
            });
        }

        // Animate Readiness Meter
        const readiness = resultData.candidate_info.readiness_score;
        if (readiness !== undefined) {
            const circle = document.getElementById('readinessCircle');
            if (circle) {
                const offset = 283 - (283 * readiness / 100);
                circle.style.strokeDashoffset = offset;
            }
        }

        // Animate Section Progress Bars
        document.querySelectorAll('.section-progress-bar').forEach(bar => {
            const score = bar.dataset.score;
            if (score !== undefined) {
                bar.style.width = score + '%';
            }
        });

        // Animate Skills Gap Bars
        document.querySelectorAll('.gap-bar-possessed').forEach(bar => {
            const width = bar.dataset.width;
            if (width !== undefined) {
                bar.style.width = width + '%';
            }
        });
    }, 500);
}

// High-Fidelity Download Report Function
function downloadReport(btn) {
    // Simple Browser Print - Most Robust
    window.print();
}



// Markdown Parsing Post-Process
function parseAllMarkdown() {
    document.querySelectorAll('.markdown-content').forEach(block => {
        const raw = block.innerHTML.trim();
        if (raw && typeof marked !== 'undefined') {
            // Prevent double parsing
            if (!block.dataset.parsed) {
                block.innerHTML = marked.parse(raw);
                block.dataset.parsed = "true";
            }
        }
    });
}

// Typewriter Effect Function
function typeWriterEffect(elementId, speed = 20) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const text = element.innerHTML.trim();
    element.innerHTML = '';
    element.style.visibility = 'visible';

    let i = 0;
    function type() {
        if (i < text.length) {
            if (text.charAt(i) === '<') {
                // Skip HTML tags
                let tagEnd = text.indexOf('>', i);
                i = tagEnd + 1;
            } else {
                element.innerHTML = text.substring(0, i + 1);
                i++;
            }
            setTimeout(type, speed);
        } else {
            // Final parse to ensure markdown/HTML is correct
            element.innerHTML = marked.parse(text);
        }
    }
    type();
}

// Staggered Animation Observer
const animationObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('appear');
        }
    });
}, { threshold: 0.1 });

// Add staggered animation to elements on load
function initAnimations() {
    document.querySelectorAll('.glass-card, .intel-pill, .roadmap-node, .bullet-box').forEach((el, index) => {
        if (!el.classList.contains('stagger-item')) {
            el.classList.add('stagger-item');
            // Reset delay for each section
            const sectionIndex = Array.from(el.parentElement.children).indexOf(el);
            el.style.transitionDelay = `${sectionIndex * 0.1}s`;
        }
        animationObserver.observe(el);
    });
}

// === UI HELPERS ===
const scrollTopBtn = document.getElementById('scrollTopBtn');
window.onscroll = function () {
    if (document.body.scrollTop > 500 || document.documentElement.scrollTop > 500) {
        scrollTopBtn.style.display = "flex";
    } else {
        scrollTopBtn.style.display = "none";
    }
};

// Populate AI Coach Tips
function updateCoach(data) {
    const welcome = document.getElementById('coachWelcome');
    const insights = document.getElementById('coachInsights');
    const tipsList = document.getElementById('coachTips');

    if (data && data.ats_analysis) {
        welcome.style.display = 'none';
        insights.style.display = 'block';

        const tips = [
            { icon: 'bullseye', text: `Your score is ${data.ats_analysis.overall_score}%. Target 85%+ for top-tier roles.` },
            { icon: 'wand-magic-sparkles', text: `Check the "Tailoring" tab for Google-style bullet points.` },
            { icon: 'linkedin', text: `Use the "Share to LinkedIn" feature to boost your personal brand.` }
        ];

        if (data.recruiter_review?.critical_fail_points?.length > 0) {
            tips.push({ icon: 'triangle-exclamation', text: `Top Issue: ${data.recruiter_review.critical_fail_points[0]}` });
        }

        tipsList.innerHTML = tips.map(tip => `
                    <li class="coach-tip-item">
                        <div class="d-flex align-items-center gap-3">
                            <i class="fas fa-${tip.icon} text-primary"></i>
                            <div class="small fw-500">${tip.text}</div>
                        </div>
                    </li>
                `).join('');
    }
}

window.addEventListener('load', () => {
    parseAllMarkdown();
    initAnimations();

    if (resultData) {
        if (resultData.error === 'RESOURCE_EXHAUSTED') {
            const modal = new bootstrap.Modal(document.getElementById('apiKeyModal'));
            modal.show();
        } else {
            updateCoach(resultData);
        }
    }

    const res = document.getElementById('results');
    if (res) {
        setTimeout(() => {
            res.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // typeWriterEffect removed to fix rendering glitch
        }, 300);
    }
});
