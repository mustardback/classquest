// ===== ClassQuest App =====
// Firebase Configuration
const firebaseConfig = {
    projectId: "classquest-app",
    appId: "1:625338904774:web:902f7208749b17542667c7",
    storageBucket: "classquest-app.firebasestorage.app",
    apiKey: "AIzaSyCGUPViap1khfGHLNLY-9NGAH8AsLbRFxw",
    authDomain: "classquest-app-c8dbe.firebaseapp.com",
    messagingSenderId: "625338904774"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ===== Constants =====
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000];
const LEVEL_NAMES = ["Villager", "Apprentice", "Scout", "Knight", "Hero", "Legend", "Mythic"];

const SKIN_TONES = ["#FDEBD0", "#F5C6A0", "#DEB887", "#C68642", "#8D5524", "#5C3317", "#3B1F0B"];
const HAIR_COLORS = ["#4A2C17", "#1A1A1A", "#F4D03F", "#C0392B", "#6B3FA0", "#2980B9", "#E91E8A", "#27AE60", "#95A5A6"];
const ACCENT_COLORS = ["#7C5CFC", "#EF4444", "#10B981", "#F59E0B", "#EC4899", "#06B6D4", "#8B5CF6", "#F97316", "#6366F1", "#14B8A6"];
const HAIR_STYLES = ["short", "medium", "long", "curly", "braids", "ponytail", "bun", "mohawk", "pigtails", "buzz", "wavy", "afro"];
const EYE_STYLES = ["round", "sparkly", "sleepy", "determined", "happy", "cat"];
const OUTFITS = ["knight", "wizard", "archer", "healer", "dragon-rider", "fairy", "bard", "scout"];
const OUTFIT_ICONS = { "knight": "⚔️", "wizard": "🧙", "archer": "🏹", "healer": "💚", "dragon-rider": "🐉", "fairy": "🧚", "bard": "🎵", "scout": "🗺️" };
const ACCESSORIES = ["none", "glasses-round", "glasses-star", "freckles", "headband", "cat-ears", "bunny-ears", "fox-ears", "wings-fairy", "wings-bat", "horns", "bandana", "pet-dragon", "pet-cat", "pet-owl", "pet-frog"];
const ACCESSORY_ICONS = { "none": "❌", "glasses-round": "👓", "glasses-star": "⭐", "freckles": "·", "headband": "👑", "cat-ears": "🐱", "bunny-ears": "🐰", "fox-ears": "🦊", "wings-fairy": "🦋", "wings-bat": "🦇", "horns": "😈", "bandana": "🎀", "pet-dragon": "🐲", "pet-cat": "🐈", "pet-owl": "🦉", "pet-frog": "🐸" };

// ===== State =====
let currentUser = null;
let classId = "default";
let students = [];
let achievements = [];
let currentAvatar = {
    skinTone: SKIN_TONES[2],
    hairStyle: "medium",
    hairColor: HAIR_COLORS[0],
    eyeStyle: "round",
    outfit: "knight",
    accentColor: ACCENT_COLORS[0],
    accessory1: "none",
    accessory2: "none"
};
let editingStudentId = null;
let editingAchievementId = null;
let selectedAwardStudents = new Set();
let selectedAwardAchievement = null;

// ===== Auth =====
auth.onAuthStateChanged(user => {
    currentUser = user;
    document.getElementById('login-btn').style.display = user ? 'none' : 'inline-block';
    document.getElementById('logout-btn').style.display = user ? 'inline-block' : 'none';
    document.getElementById('admin-nav-btn').style.display = user ? 'inline-block' : 'none';
    if (!user) switchView('guild-hall');
});

document.getElementById('login-btn').addEventListener('click', () => {
    document.getElementById('login-modal').classList.add('active');
});

document.getElementById('close-login-modal').addEventListener('click', () => {
    document.getElementById('login-modal').classList.remove('active');
});

document.getElementById('google-login-btn').addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
        document.getElementById('login-modal').classList.remove('active');
        document.getElementById('login-error').textContent = '';
    } catch (err) {
        document.getElementById('login-error').textContent = err.message;
    }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        await auth.signInWithEmailAndPassword(email, password);
        document.getElementById('login-modal').classList.remove('active');
        document.getElementById('login-error').textContent = '';
    } catch (err) {
        document.getElementById('login-error').textContent = err.message;
    }
});

document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());

// ===== Navigation =====
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-view="${viewId}"]`)?.classList.add('active');
}

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
});

document.getElementById('back-to-guild').addEventListener('click', () => switchView('guild-hall'));

// Admin tabs
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

// ===== Firestore Listeners =====
function initListeners() {
    // Listen to students
    db.collection('classes').doc(classId).collection('students')
        .orderBy('name')
        .onSnapshot(snapshot => {
            students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderGuildHall();
            renderAdminStudents();
            renderAwardStudents();
        });

    // Listen to achievements
    db.collection('classes').doc(classId).collection('achievements')
        .onSnapshot(snapshot => {
            achievements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderAdminAchievements();
            renderAwardAchievements();
        });

    // Listen to class settings
    db.collection('classes').doc(classId).onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('class-name').textContent = `⚔️ ${data.name || 'The Guild Hall'}`;
            document.getElementById('settings-class-name').value = data.name || '';
        }
    });
}

// ===== Rendering =====
function getLevel(xp) {
    let level = 0;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
        if (xp >= LEVEL_THRESHOLDS[i]) level = i;
        else break;
    }
    return level;
}

function getLevelProgress(xp) {
    const level = getLevel(xp);
    const currentThreshold = LEVEL_THRESHOLDS[level];
    const nextThreshold = LEVEL_THRESHOLDS[level + 1] || LEVEL_THRESHOLDS[level] + 1000;
    return ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
}

function renderAvatar(avatar, size = 80) {
    const a = avatar || {};
    const skinTone = a.skinTone || SKIN_TONES[2];
    const hairColor = a.hairColor || HAIR_COLORS[0];
    const accentColor = a.accentColor || ACCENT_COLORS[0];
    const eyeStyle = a.eyeStyle || "round";
    const outfit = a.outfit || "knight";
    const accessory1 = a.accessory1 || "none";
    const accessory2 = a.accessory2 || "none";

    let eyeClass = "eye";
    if (eyeStyle === "sparkly") eyeClass = "eye sparkly";
    else if (eyeStyle === "sleepy") eyeClass = "eye sleepy";
    else if (eyeStyle === "cat") eyeClass = "eye cat";

    let accessoryHtml = '';
    if (accessory1 !== "none") {
        const icon = ACCESSORY_ICONS[accessory1] || '';
        const posClass = accessory1.includes('ears') ? 'animal-ears' : accessory1.includes('glasses') ? 'glasses' : accessory1.includes('wings') ? 'wings' : accessory1.includes('pet') ? 'pet' : '';
        accessoryHtml += `<div class="accessory ${posClass}">${icon}</div>`;
    }
    if (accessory2 !== "none") {
        const icon = ACCESSORY_ICONS[accessory2] || '';
        const posClass = accessory2.includes('ears') ? 'animal-ears' : accessory2.includes('glasses') ? 'glasses' : accessory2.includes('wings') ? 'wings' : accessory2.includes('pet') ? 'pet' : '';
        accessoryHtml += `<div class="accessory ${posClass}">${icon}</div>`;
    }

    return `<div class="avatar" style="--avatar-skin:${skinTone};--avatar-hair:${hairColor};--avatar-accent:${accentColor};width:${size}px;height:${size}px;font-size:${size/80}em;">
        <div class="hair-front"></div>
        <div class="head">
            <div class="eyes"><div class="${eyeClass}"></div><div class="${eyeClass}"></div></div>
        </div>
        <div class="body"></div>
        <div class="outfit-detail">${OUTFIT_ICONS[outfit] || '⚔️'}</div>
        ${accessoryHtml}
    </div>`;
}

function renderGuildHall() {
    const grid = document.getElementById('student-grid');
    grid.innerHTML = students.map(s => {
        const level = getLevel(s.xp || 0);
        const progress = getLevelProgress(s.xp || 0);
        return `<div class="student-card" data-student-id="${s.id}">
            <div class="avatar-container">${renderAvatar(s.avatar)}</div>
            <div class="student-name">${s.name}</div>
            <div class="student-level">Lv.${level} ${LEVEL_NAMES[level]}</div>
            <div class="xp-bar"><div class="xp-fill" style="width:${progress}%"></div></div>
        </div>`;
    }).join('');

    grid.querySelectorAll('.student-card').forEach(card => {
        card.addEventListener('click', () => showHeroProfile(card.dataset.studentId));
    });
}

async function showHeroProfile(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const level = getLevel(student.xp || 0);
    const progress = getLevelProgress(student.xp || 0);
    const currentThreshold = LEVEL_THRESHOLDS[level];
    const nextThreshold = LEVEL_THRESHOLDS[level + 1] || LEVEL_THRESHOLDS[level] + 1000;

    document.getElementById('hero-avatar-large').innerHTML = renderAvatar(student.avatar, 120);
    document.getElementById('hero-name').textContent = student.name;
    document.getElementById('hero-level').textContent = `Level ${level} — ${LEVEL_NAMES[level]}`;
    document.getElementById('hero-xp-fill').style.width = `${progress}%`;
    document.getElementById('hero-xp-text').textContent = `${student.xp || 0} / ${nextThreshold} XP`;

    // Fetch awards
    const awardsSnap = await db.collection('classes').doc(classId)
        .collection('students').doc(studentId)
        .collection('awards').orderBy('awardedAt', 'desc').get();

    const badges = awardsSnap.docs.map(doc => {
        const award = doc.data();
        const achievement = achievements.find(a => a.id === award.achievementId);
        return { ...award, achievement };
    });

    document.getElementById('hero-badges').innerHTML = badges.map(b => {
        const a = b.achievement;
        const date = b.awardedAt?.toDate?.() ? b.awardedAt.toDate().toLocaleDateString() : '';
        return `<div class="badge-card">
            <div class="badge-icon">${a?.icon || '⭐'}</div>
            <div class="badge-name">${a?.name || 'Unknown'}</div>
            <div class="badge-date">${date}</div>
        </div>`;
    }).join('') || '<p style="color:var(--text-muted)">No quests completed yet!</p>';

    switchView('hero-profile');
}

// ===== Admin: Students =====
function renderAdminStudents() {
    document.getElementById('admin-student-list').innerHTML = students.map(s => {
        return `<div class="list-item">
            <div class="list-item-info">
                <span>${renderAvatar(s.avatar, 32)}</span>
                <span>${s.name}</span>
                <span style="color:var(--text-muted);font-size:0.8rem">${s.xp || 0} XP</span>
            </div>
            <div class="list-item-actions">
                <button class="btn btn-small" onclick="editStudent('${s.id}')">✏️</button>
                <button class="btn btn-small btn-danger" onclick="deleteStudent('${s.id}')">🗑️</button>
            </div>
        </div>`;
    }).join('') || '<p style="color:var(--text-muted)">No students yet. Add your first adventurer!</p>';
}

document.getElementById('add-student-btn').addEventListener('click', () => {
    editingStudentId = null;
    document.getElementById('student-modal-title').textContent = '🗡️ New Adventurer';
    document.getElementById('student-name').value = '';
    currentAvatar = { skinTone: SKIN_TONES[2], hairStyle: "medium", hairColor: HAIR_COLORS[0], eyeStyle: "round", outfit: "knight", accentColor: ACCENT_COLORS[0], accessory1: "none", accessory2: "none" };
    renderAvatarBuilder();
    document.getElementById('student-modal').classList.add('active');
});

document.getElementById('close-student-modal').addEventListener('click', () => {
    document.getElementById('student-modal').classList.remove('active');
});

window.editStudent = function(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;
    editingStudentId = id;
    document.getElementById('student-modal-title').textContent = '✏️ Edit Adventurer';
    document.getElementById('student-name').value = student.name;
    currentAvatar = { ...student.avatar } || { skinTone: SKIN_TONES[2], hairStyle: "medium", hairColor: HAIR_COLORS[0], eyeStyle: "round", outfit: "knight", accentColor: ACCENT_COLORS[0], accessory1: "none", accessory2: "none" };
    renderAvatarBuilder();
    document.getElementById('student-modal').classList.add('active');
};

window.deleteStudent = async function(id) {
    if (!confirm('Remove this adventurer from the guild?')) return;
    await db.collection('classes').doc(classId).collection('students').doc(id).delete();
};

document.getElementById('student-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('student-name').value.trim();
    if (!name) return;

    const data = { name, avatar: { ...currentAvatar } };

    try {
        if (editingStudentId) {
            await db.collection('classes').doc(classId).collection('students').doc(editingStudentId).update(data);
        } else {
            data.xp = 0;
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('classes').doc(classId).collection('students').add(data);
        }
        document.getElementById('student-modal').classList.remove('active');
    } catch (err) {
        console.error('Save student error:', err);
        alert('Error saving: ' + err.message);
    }
});

// ===== Admin: Achievements =====
function renderAdminAchievements() {
    document.getElementById('admin-achievement-list').innerHTML = achievements.map(a => {
        return `<div class="list-item">
            <div class="list-item-info">
                <span style="font-size:1.5rem">${a.icon}</span>
                <span>${a.name}</span>
                <span style="color:var(--text-muted);font-size:0.8rem">+${a.xpValue} XP</span>
            </div>
            <div class="list-item-actions">
                <button class="btn btn-small" onclick="editAchievement('${a.id}')">✏️</button>
                <button class="btn btn-small btn-danger" onclick="deleteAchievement('${a.id}')">🗑️</button>
            </div>
        </div>`;
    }).join('') || '<p style="color:var(--text-muted)">No achievements defined yet. Create your first quest!</p>';
}

document.getElementById('add-achievement-btn').addEventListener('click', () => {
    editingAchievementId = null;
    document.getElementById('achievement-modal-title').textContent = '🎖️ New Achievement';
    document.getElementById('achievement-name').value = '';
    document.getElementById('achievement-desc').value = '';
    document.getElementById('achievement-icon').value = '';
    document.getElementById('achievement-xp').value = 50;
    document.getElementById('achievement-category').value = 'academic';
    document.getElementById('achievement-modal').classList.add('active');
});

document.getElementById('close-achievement-modal').addEventListener('click', () => {
    document.getElementById('achievement-modal').classList.remove('active');
});

window.editAchievement = function(id) {
    const a = achievements.find(x => x.id === id);
    if (!a) return;
    editingAchievementId = id;
    document.getElementById('achievement-modal-title').textContent = '✏️ Edit Achievement';
    document.getElementById('achievement-name').value = a.name;
    document.getElementById('achievement-desc').value = a.description || '';
    document.getElementById('achievement-icon').value = a.icon;
    document.getElementById('achievement-xp').value = a.xpValue;
    document.getElementById('achievement-category').value = a.category || 'academic';
    document.getElementById('achievement-modal').classList.add('active');
};

window.deleteAchievement = async function(id) {
    if (!confirm('Delete this achievement?')) return;
    await db.collection('classes').doc(classId).collection('achievements').doc(id).delete();
};

document.getElementById('achievement-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        name: document.getElementById('achievement-name').value.trim(),
        description: document.getElementById('achievement-desc').value.trim(),
        icon: document.getElementById('achievement-icon').value.trim(),
        xpValue: parseInt(document.getElementById('achievement-xp').value),
        category: document.getElementById('achievement-category').value
    };

    if (editingAchievementId) {
        await db.collection('classes').doc(classId).collection('achievements').doc(editingAchievementId).update(data);
    } else {
        await db.collection('classes').doc(classId).collection('achievements').add(data);
    }

    document.getElementById('achievement-modal').classList.remove('active');
});

// ===== Award Panel =====
function renderAwardStudents() {
    document.getElementById('award-student-grid').innerHTML = students.map(s => {
        const sel = selectedAwardStudents.has(s.id) ? 'selected' : '';
        return `<div class="award-chip ${sel}" data-student-id="${s.id}">${s.name}</div>`;
    }).join('');

    document.querySelectorAll('#award-student-grid .award-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const id = chip.dataset.studentId;
            if (selectedAwardStudents.has(id)) selectedAwardStudents.delete(id);
            else selectedAwardStudents.add(id);
            renderAwardStudents();
            updateAwardButton();
        });
    });
}

function renderAwardAchievements() {
    document.getElementById('award-achievement-grid').innerHTML = achievements.map(a => {
        const sel = selectedAwardAchievement === a.id ? 'selected' : '';
        return `<div class="award-chip ${sel}" data-achievement-id="${a.id}">${a.icon} ${a.name}</div>`;
    }).join('');

    document.querySelectorAll('#award-achievement-grid .award-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            selectedAwardAchievement = chip.dataset.achievementId;
            renderAwardAchievements();
            updateAwardButton();
        });
    });
}

function updateAwardButton() {
    const btn = document.getElementById('award-btn');
    btn.disabled = !(selectedAwardStudents.size > 0 && selectedAwardAchievement);
}

document.getElementById('select-all-students').addEventListener('click', () => {
    if (selectedAwardStudents.size === students.length) {
        selectedAwardStudents.clear();
    } else {
        students.forEach(s => selectedAwardStudents.add(s.id));
    }
    renderAwardStudents();
    updateAwardButton();
});

document.getElementById('award-btn').addEventListener('click', async () => {
    if (!selectedAwardAchievement || selectedAwardStudents.size === 0) return;

    const achievement = achievements.find(a => a.id === selectedAwardAchievement);
    if (!achievement) return;

    const batch = db.batch();

    for (const studentId of selectedAwardStudents) {
        const awardRef = db.collection('classes').doc(classId)
            .collection('students').doc(studentId)
            .collection('awards').doc();
        batch.set(awardRef, {
            achievementId: selectedAwardAchievement,
            awardedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        const studentRef = db.collection('classes').doc(classId).collection('students').doc(studentId);
        batch.update(studentRef, { xp: firebase.firestore.FieldValue.increment(achievement.xpValue) });
    }

    await batch.commit();
    fireConfetti();
    selectedAwardStudents.clear();
    selectedAwardAchievement = null;
    renderAwardStudents();
    renderAwardAchievements();
    updateAwardButton();
});

// ===== Class Settings =====
document.getElementById('save-settings-btn').addEventListener('click', async () => {
    const name = document.getElementById('settings-class-name').value.trim();
    await db.collection('classes').doc(classId).set({ name }, { merge: true });
});

// ===== Avatar Builder =====
function renderAvatarBuilder() {
    // Skin tones
    document.getElementById('skin-tone-swatches').innerHTML = SKIN_TONES.map(color => {
        const sel = currentAvatar.skinTone === color ? 'selected' : '';
        return `<div class="swatch ${sel}" style="background:${color}" data-type="skinTone" data-value="${color}"></div>`;
    }).join('');

    // Hair colors
    document.getElementById('hair-color-swatches').innerHTML = HAIR_COLORS.map(color => {
        const sel = currentAvatar.hairColor === color ? 'selected' : '';
        return `<div class="swatch ${sel}" style="background:${color}" data-type="hairColor" data-value="${color}"></div>`;
    }).join('');

    // Accent colors
    document.getElementById('accent-color-swatches').innerHTML = ACCENT_COLORS.map(color => {
        const sel = currentAvatar.accentColor === color ? 'selected' : '';
        return `<div class="swatch ${sel}" style="background:${color}" data-type="accentColor" data-value="${color}"></div>`;
    }).join('');

    // Hair styles
    document.getElementById('hair-style-options').innerHTML = HAIR_STYLES.map(style => {
        const sel = currentAvatar.hairStyle === style ? 'selected' : '';
        return `<div class="option-chip ${sel}" data-type="hairStyle" data-value="${style}">${style}</div>`;
    }).join('');

    // Eye styles
    document.getElementById('eye-style-options').innerHTML = EYE_STYLES.map(style => {
        const sel = currentAvatar.eyeStyle === style ? 'selected' : '';
        return `<div class="option-chip ${sel}" data-type="eyeStyle" data-value="${style}">${style}</div>`;
    }).join('');

    // Outfits
    document.getElementById('outfit-options').innerHTML = OUTFITS.map(outfit => {
        const sel = currentAvatar.outfit === outfit ? 'selected' : '';
        return `<div class="option-chip ${sel}" data-type="outfit" data-value="${outfit}">${OUTFIT_ICONS[outfit]} ${outfit}</div>`;
    }).join('');

    // Accessories
    document.getElementById('accessory-options').innerHTML = ACCESSORIES.map(acc => {
        const sel = (currentAvatar.accessory1 === acc || currentAvatar.accessory2 === acc) ? 'selected' : '';
        return `<div class="option-chip ${sel}" data-type="accessory" data-value="${acc}">${ACCESSORY_ICONS[acc] || acc}</div>`;
    }).join('');

    // Update preview
    document.getElementById('avatar-preview').innerHTML = renderAvatar(currentAvatar, 100);

    // Attach events
    document.querySelectorAll('.swatch, .option-chip').forEach(el => {
        el.addEventListener('click', () => {
            const type = el.dataset.type;
            const value = el.dataset.value;
            if (type === 'accessory') {
                if (value === 'none') { currentAvatar.accessory1 = 'none'; currentAvatar.accessory2 = 'none'; }
                else if (currentAvatar.accessory1 === value) { currentAvatar.accessory1 = 'none'; }
                else if (currentAvatar.accessory2 === value) { currentAvatar.accessory2 = 'none'; }
                else if (currentAvatar.accessory1 === 'none') { currentAvatar.accessory1 = value; }
                else { currentAvatar.accessory2 = value; }
            } else {
                currentAvatar[type] = value;
            }
            renderAvatarBuilder();
        });
    });
}

// ===== Confetti =====
function fireConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 100 }, () => ({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 4 + 2,
        color: ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        spin: (Math.random() - 0.5) * 10
    }));

    let frame = 0;
    function animate() {
        if (frame > 120) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.rotation += p.spin;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 2);
            ctx.restore();
        });
        frame++;
        requestAnimationFrame(animate);
    }
    animate();
}

// ===== Init =====
async function init() {
    // Ensure class doc exists
    const classDoc = await db.collection('classes').doc(classId).get();
    if (!classDoc.exists) {
        await db.collection('classes').doc(classId).set({ name: "ClassQuest Guild Hall" });
    }
    initListeners();
}

init();
