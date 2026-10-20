import { redirect } from 'next/navigation';

export default function UsersListRedirect() {
  redirect('/admin/directory?tab=users');
}
