import { redirect } from 'next/navigation';

export default function DirectoryEditIndex() {
  redirect('/admin/directory?tab=customize');
}
