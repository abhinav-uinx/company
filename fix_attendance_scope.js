const fs = require('fs');
let c = fs.readFileSync('src/app/admin/directory/attendance/page.tsx', 'utf8');

c = c.replace(/  const confirmCheckout = async \(\) => \{[\s\S]*?setIqamaInput\(''\);\n    \}\n  \};/, '');

const properPlacement = `
  const confirmCheckout = async () => {
    setShowConfirmModal(false);
    if (!checkoutData) return;
    const { error: updateErr } = await supabaseAuth
      .from('employee_attendance')
      .update({ check_out: checkoutData.time })
      .eq('id', checkoutData.id);
    if (updateErr) {
      setAlertMessage("Error checking out: " + updateErr.message);
      setShowAlertModal(true);
    } else {
      fetchData();
      setIqamaInput('');
    }
  };

  if (loading) return <LoadingIcon />;
`;

c = c.replace(/  if \(loading\) return <LoadingIcon \/>;/, properPlacement.trim());

fs.writeFileSync('src/app/admin/directory/attendance/page.tsx', c);
console.log('Fixed attendance scope');
