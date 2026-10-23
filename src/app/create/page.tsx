import { redirect } from 'next/navigation';

export default function CreateRedirectPage() {
  redirect('/customers/new');
}
