const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// Fix imports - remove js-cookie, add getSession/logout
c = c.replace(/import Cookies from 'js-cookie';\r?\n/, '');
c = c.replace(
  "import Link from 'next/link';",
  "import Link from 'next/link';\nimport { getSession, logout } from '@/app/actions/auth';"
);

// Fix useEffect - replace Cookies.get with getSession
c = c.replace(
  /const loggedInUser = Cookies\.get\('loggedInUser'\);\r?\n\s*const role = Cookies\.get\('userRole'\);\r?\n\s*setUserRole\(role \|\| ''\);\r?\n\r?\n\s*const fetchUser = async \(\) => \{[\s\S]*?fetchUser\(\);/,
  `const init = async () => {
      const session = await getSession();
      if (!session) { router.replace('/login'); return; }
      const role = session.role as string;
      const loggedInUser = session.username as string;
      setUserRole(role);
      const table = role === 'admin' ? 'admins' : 'employees';
      const idField = role === 'admin' ? 'username' : 'iqama_number';
      const { data } = await supabaseAuth.from(table).select('*').eq(idField, loggedInUser).single();
      if (data) setUserName(data.name || data.username || loggedInUser);`
);

// Close the init function before medif query
c = c.replace(
  /supabaseAuth\.from\('medif_records'\)\.select\('\*', \{ count: 'exact', head: true \}\)\.then\(\(\{ count \}\) => \{\r?\n\s*setMedifCount\(count \|\| 0\);\r?\n\s*\}\);\r?\n\s*\}, \[router\]\);/,
  `supabaseAuth.from('medif_records').select('*', { count: 'exact', head: true }).then(({ count }) => {
        setMedifCount(count || 0);
      });
    };
    init();
  }, [router]);`
);

// Fix logout handler
c = c.replace(
  /const handleLogout = \(\) => \{[\s\S]*?Cookies\.remove\('loggedInUser'\);[\s\S]*?Cookies\.remove\('userRole'\);[\s\S]*?router\.replace\('\/login'\);[\s\S]*?\};/,
  `const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };`
);

fs.writeFileSync('src/app/dashboard/page.tsx', c);
console.log('Done');
