const fs = require('fs');
let c = fs.readFileSync('src/app/admin/directory/attendance/page.tsx', 'utf8');

const regex = /const markAttendance = async \(\) => \{[\s\S]*?else fetchData\(\);\n  \};/;

const replacement = `const markAttendance = async () => {
    const iqama = prompt("Enter Employee Iqama Number for today's attendance:");
    if (!iqama) return;
    
    const today = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toLocaleTimeString('en-US', { hour12: false });
    
    const { data: existing } = await supabaseAuth
      .from('employee_attendance')
      .select('*')
      .eq('employee_iqama', iqama)
      .eq('date', today)
      .single();
      
    if (existing) {
      if (!existing.check_out) {
        setCheckoutData({ id: existing.id, time: timeNow });
        setShowConfirmModal(true);
      } else {
        setAlertMessage("This employee has already completed their shift (checked in and out) for today.");
        setShowAlertModal(true);
      }
      return;
    }

    const { error } = await supabaseAuth.from('employee_attendance').insert([{
      employee_iqama: iqama,
      date: today,
      check_in: timeNow,
      status: 'Present'
    }]);
    
    if (error) {
      setAlertMessage("Error marking attendance: " + error.message);
      setShowAlertModal(true);
    } else {
      fetchData();
    }
  };`;

c = c.replace(regex, replacement);

c = c.replace("setIqamaInput('');", "");

fs.writeFileSync('src/app/admin/directory/attendance/page.tsx', c);
console.log('Fixed markAttendance');
