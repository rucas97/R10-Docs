import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SettingsClient } from './SettingsClient';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).maybeSingle();

  const { data: plans } = await supabase
    .from('plans').select('*').order('storage_limit', { ascending: true });

  const currentPlan = plans?.find((p: any) => p.id === profile?.plan_id);
  const planName = currentPlan?.name || currentPlan?.title || currentPlan?.id || 'رایگان';
  const storageLimitGB = Number(currentPlan?.storage_limit) || 5;

  // Best-effort storage usage — silently 0 if the documents table doesn't exist.
  let storageUsedBytes = 0;
  try {
    const { data: docs } = await supabase
      .from('documents').select('size').eq('user_id', user.id);
    storageUsedBytes = (docs || []).reduce((acc: number, d: any) => acc + (Number(d?.size) || 0), 0);
  } catch { /* ignore */ }

  return (
    <SettingsClient
      email={user.email || ''}
      phone={user.phone || ''}
      planName={planName}
      storageLimitGB={storageLimitGB}
      storageUsedBytes={storageUsedBytes}
    />
  );
}
