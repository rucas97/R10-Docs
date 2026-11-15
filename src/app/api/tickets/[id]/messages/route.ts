import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { sendSms } from '@/lib/sms';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { message, role } = await req.json();
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = role === 'admin' 
    ? createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    : supabase;

  const { data, error } = await db.from('ticket_messages').insert({
    ticket_id: id,
    sender_id: role === 'admin' ? null : user!.id,
    sender_role: role || 'user',
    message
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  const { data: ticket } = await supabase.from('tickets').select('user_id, subject').eq('id', id).single();

  if (role !== 'admin') {
    await supabase.from('tickets').update({ status: 'progress', updated_at: new Date().toISOString() }).eq('id', id);
    
    // User Replied -> Notify Admins
    if (ticket) {
      const adminPhones = (process.env.ADMIN_PHONE_NUMBERS || '').split(',').map(p => p.trim()).filter(Boolean);
      for (const phone of adminPhones) {
        sendSms(phone, process.env.FARAZSMS_PATTERN_ADMIN, { 
          phone: user!.phone || user!.email || 'نامشخص', 
          subject: ticket.subject 
        });
      }
    }
  } else {
    // Admin Replied -> Notify User
    if (ticket) {
      const { data: userData } = await supabase.auth.admin.getUserById(ticket.user_id);
      if (userData?.user?.phone) {
        sendSms(userData.user.phone, process.env.FARAZSMS_PATTERN_USER_STATUS, { 
          subject: ticket.subject, 
          status: 'پاسخ جدید' 
        });
      }
    }
  }

  return NextResponse.json({ message: data });
}
