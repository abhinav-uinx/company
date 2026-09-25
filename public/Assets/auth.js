// Custom Table Auth Router
const SUPABASE_URL = 'https://umwkgcbfvshsvdpqizyq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtd2tnY2JmdnNoc3ZkcHFpenlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODk3NzIyMSwiZXhwIjoyMTA0NTUzMjIxfQ.NwuDdMbB658MD4x6XVwhmPB_iBjHgfJgj1cPHSrqTr8';

const supabaseAuth = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAuth() {
    const getCookie = (n) => { const v = '; ' + document.cookie; const p = v.split('; ' + n + '='); if (p.length === 2) return p.pop().split(';').shift(); };
    const loggedInUser = getCookie('loggedInUser');
    const role = getCookie('userRole');
    const currentPath = window.location.pathname;
    const isLogin = currentPath.includes('/Login/');
    
    if (isLogin && window.location.search.includes('disabled=true')) {
        showDisabled();
        return;
    }

    if (!loggedInUser) {
        if (!isLogin) {
            if(window.parent !== window) { window.parent.location.href = '/login'; } else { window.location.href = '/login'; }
        }
        return;
    }

    if (isLogin) {
        goDashboard();
        return;
    }

    // Verify session still valid
    if (role === 'admin') {
        const { data: admin } = await supabaseAuth.from('admins').select('*').eq('username', loggedInUser).single();
        populateProfileUI(admin);
        document.body.classList.add('view-admin');
        if (!admin || admin.status === 'disabled') {
            logout();
            return;
        }
    } else {
        const { data: emp } = await supabaseAuth.from('employees').select('*').eq('iqama_number', loggedInUser).single();
        populateProfileUI(emp);
        if (!emp || emp.status === 'disabled') {
            logout();
            return;
        }
        
        if (emp.status === 'view_only') {
            showWarningBanner('⚠️ VIEW ONLY MODE: You cannot save changes.');
            disableAllInputs();
        } else if (emp.status === 'active' && !emp.status_acknowledged) {
            showWhiteBanner('View and Read mode enabled');
            supabaseAuth.from('employees').update({ status_acknowledged: true }).eq('iqama_number', loggedInUser).then();
        }
    }
}

function showDisabled() {
    document.body.innerHTML = '<div style="display:flex; height:100vh; align-items:center; justify-content:center; background:#f4f5f7; font-family:sans-serif;"><div style="background:#fff; padding:40px; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.1); text-align:center;"><h2 style="color:#ef4444;">Account Disabled</h2><p style="color:#64748b;">Please contact your administrator for further details.</p><button onclick="window.location.href=\'../Login/index.html\'" style="margin-top:20px; padding:10px 20px; background:#0B1220; color:#fff; border:none; border-radius:4px; cursor:pointer;">Return to Login</button></div></div>';
}

window.logout = function() {
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('userRole');
    if(window.parent !== window) { window.parent.location.href = '/login'; } else { window.location.href = '/login'; }
}

window.goDashboard = function() {
    const role = (typeof getCookie !== 'undefined' ? getCookie('userRole') : null) || 'employee';
    if (role === 'admin') {
        if(window.parent !== window) { window.parent.location.href = '/dashboard'; } else { window.location.href = '/dashboard'; }
    } else {
        if(window.parent !== window) { window.parent.location.href = '/dashboard'; } else { window.location.href = '/dashboard'; }
    }
}

function showWarningBanner(msg) {
    const banner = document.createElement('div');
    banner.style.cssText = 'position:fixed; top:0; left:0; width:100%; background:#fef08a; color:#854d0e; text-align:center; padding:10px; font-weight:bold; z-index:9999; box-shadow:0 2px 4px rgba(0,0,0,0.1);';
    banner.innerText = msg;
    document.body.prepend(banner);
}

function showWhiteBanner(msg) {
    const banner = document.createElement('div');
    banner.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#fff; color:#000; border:1px solid #ccc; padding:15px 25px; border-radius:8px; font-weight:bold; z-index:9999; box-shadow:0 4px 12px rgba(0,0,0,0.15);';
    banner.innerText = msg;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 5000);
}

function disableAllInputs() {
    setTimeout(() => {
        document.querySelectorAll('input, select, textarea').forEach(el => {
            el.disabled = true;
        });
        document.querySelectorAll('.submit-btn, button[type="submit"]').forEach(btn => {
            btn.style.display = 'none';
        });
    }, 500); 
}

document.addEventListener('DOMContentLoaded', checkAuth);

// PROFILE DROPDOWN LOGIC
window.toggleProfileMenu = function(e) {
    if(e) e.stopPropagation();
    const menu = document.getElementById('profile_dropdown');
    if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('click', (e) => {
    const menu = document.getElementById('profile_dropdown');
    if (menu && !e.target.closest('.user-info')) {
        menu.style.display = 'none';
    }
});

window.openEditProfile = function() {
    const role = getCookie('userRole');
    const user = window.currentUserProfile;
    if(!user) return;
    
    // Inject modal
    const modalHtml = `
    <div id="editProfileModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:10000; display:flex; align-items:center; justify-content:center;">
        <div style="background:#fff; padding:30px; border-radius:8px; width:400px; box-shadow:0 4px 12px rgba(0,0,0,0.2);">
            <h2 style="margin-top:0;">Edit Profile</h2>
            <div style="margin-bottom:15px;">
                <label style="display:block; font-weight:bold; margin-bottom:5px;">Name</label>
                <input type="text" id="edit_name" value="${user.name || ''}" style="width:100%; padding:8px; box-sizing:border-box;">
            </div>
            <div style="margin-bottom:15px;">
                <label style="display:block; font-weight:bold; margin-bottom:5px;">Photo URL</label>
                <input type="text" id="edit_photo" value="${user.photo_url || ''}" style="width:100%; padding:8px; box-sizing:border-box;">
            </div>
            <div style="margin-bottom:20px;">
                <label style="display:block; font-weight:bold; margin-bottom:5px;">Password</label>
                <input type="text" id="edit_pass" value="${user.password || ''}" style="width:100%; padding:8px; box-sizing:border-box;">
            </div>
            <div style="display:flex; justify-content:flex-end; gap:10px;">
                <button onclick="document.getElementById('editProfileModal').remove()" style="padding:8px 16px; cursor:pointer;">Cancel</button>
                <button onclick="saveProfile()" style="padding:8px 16px; background:#4F5DFF; color:#fff; border:none; border-radius:4px; cursor:pointer;">Save Changes</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('profile_dropdown').style.display = 'none';
}

window.saveProfile = async function() {
    const newName = document.getElementById('edit_name').value;
    const newPhoto = document.getElementById('edit_photo').value;
    const newPass = document.getElementById('edit_pass').value;
    const role = localStorage.getItem('userRole');
    const table = role === 'admin' ? 'admins' : 'employees';
    const pkCol = role === 'admin' ? 'username' : 'iqama_number';
    const pkVal = window.currentUserProfile[pkCol];

    const { error } = await supabaseAuth.from(table).update({
        name: newName,
        photo_url: newPhoto,
        password: newPass
    }).eq(pkCol, pkVal);

    if(error) {
        alert("Error updating profile: " + error.message);
    } else {
        alert("Profile updated!");
        if(window.parent !== window) { window.parent.location.reload(); } else { window.location.reload(); }
    }
}

// Helper to populate UI
function populateProfileUI(profile) {
    window.currentUserProfile = profile;
    const nameEl = document.getElementById('display_user_name');
    const photoEl = document.getElementById('display_user_photo');
    if(nameEl) nameEl.innerText = profile.name || profile.username || profile.iqama_number;
    if(photoEl) {
        if(profile.photo_url) photoEl.src = profile.photo_url;
        else photoEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=0B1220&color=fff`;
    }
}
