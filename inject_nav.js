const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const bottomNav = `
      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <Link href="#services" className="bottom-nav-item">
          <span className="material-symbols-outlined">grid_view</span>
          <span>Services</span>
        </Link>
        {userRole === 'admin' && (
          <Link href="/directory" className="bottom-nav-item">
            <span className="material-symbols-outlined">folder_shared</span>
            <span>Directory</span>
          </Link>
        )}
        <Link href="/reports" className="bottom-nav-item">
          <span className="material-symbols-outlined">bar_chart</span>
          <span>Reports</span>
        </Link>
        <Link href="#" className="bottom-nav-item">
          <span className="material-symbols-outlined">help</span>
          <span>Help</span>
        </Link>
      </div>
    </>`;

c = c.replace('</>', bottomNav);
fs.writeFileSync('src/app/dashboard/page.tsx', c);
console.log('Added bottom nav HTML');
