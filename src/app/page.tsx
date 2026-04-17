import { redirect } from 'next/navigation';

export default function Home() {
  // Par défaut, on redirige vers le login
  redirect('/login');
}
