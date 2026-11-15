import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSms } from '@/lib/sms';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await req.json();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data: ticket } = await supabase.from('tickets').select('user_id, subject').eq('id', id).single();
  
  await supabase.from('tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  
  if (ticket) {
    const { data: userData } = await supabase.auth.admin.getUserById(ticket.user_id);
    if (userData?.user?.phone) {
      const statusFa = status === 'progress' ? 'در حال بررسی' : status === 'awaiting' ? 'منتظر پاسخ شما' : 'بسته شده';
      sendSms(userData.user.phone, process.env.FARAZSMS_PATTERN_USER_STATUS, { 
        subject: ticket.subject, 
        status: statusFa 
      });
    }
  }

  return NextResponse.json({ success: true });
}
