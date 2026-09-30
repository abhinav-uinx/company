'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/app/admin/dashboard/header';
import UserManagementPage from '@/app/admin/user/page';
import AttendancePage from '@/app/admin/directory/attendance/page';
import SalaryPage from '@/app/admin/directory/salary/page';
import AddEmployee from '@/app/admin/directory/add_employee/page';

export default function DirectoryPage() {
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'attendance' || tab === 'salary' || tab === 'add_employee' || tab === 'users') {
        setActiveTab(tab);
      }
    }
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/admin/directory?tab=${tab}`);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .vault-container { max-width: 1200px; margin: 40px auto; padding: 0 20px; }
        .vault-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .vault-header h1 { font-size: 2rem; margin: 0; color: #0B1220; }
        .back-btn { text-decoration: none; color: #334155; background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 6px 12px 6px 8px; display: inline-flex; align-items: center; gap: 5px; font-weight: 500; font-size: 0.85rem; transition: all 0.2s; margin-bottom: 10px; }
        .back-btn:hover { background: #f4f5f7; border-color: #d1d5db; }
        .tabs-nav { display: flex; gap: 20px; border-bottom: 1px solid #e2e8f0; margin-bottom: 25px; flex-wrap: wrap; }
        .tab-btn { background: none; border: none; padding: 10px 15px; font-size: 1rem; font-weight: 600; color: #64748b; cursor: pointer; position: relative; transition: color 0.2s; }
        .tab-btn.active { color: #4F5DFF; }
        .tab-btn.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 3px; background: #4F5DFF; border-radius: 3px 3px 0 0; }
        .tab-pane { margin-top: 15px; }
      `}} />

      <Header />

      <main className="vault-container">
        <div className="vault-header">
          <div>
            <Link href="/admin/dashboard" className="back-btn">
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>arrow_back</span> Back to Dashboard
            </Link>
            <h1 style={{ marginTop: '15px' }}>Employee Directory &amp; Records</h1>
          </div>
        </div>

        <div className="tabs-nav">
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} 
            onClick={() => handleTabChange('users')}
          >
            Users List
          </button>
          <button 
            className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`} 
            onClick={() => handleTabChange('attendance')}
          >
            Attendance
          </button>
          <button 
            className={`tab-btn ${activeTab === 'salary' ? 'active' : ''}`} 
            onClick={() => handleTabChange('salary')}
          >
            Payroll / Salary
          </button>
          <button 
            className={`tab-btn ${activeTab === 'add_employee' ? 'active' : ''}`} 
            onClick={() => handleTabChange('add_employee')}
          >
            Add Employee
          </button>
        </div>

        <div className="tab-pane">
          {activeTab === 'users' && <UserManagementPage embedded />}
          {activeTab === 'attendance' && <AttendancePage embedded />}
          {activeTab === 'salary' && <SalaryPage embedded />}
          {activeTab === 'add_employee' && <AddEmployee embedded />}
        </div>
      </main>
    </>
  );
}
