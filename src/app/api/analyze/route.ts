import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateTextWithRetry } from '@/lib/llm';
import { extractJson } from '@/lib/mindmap';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SYSTEM =
  'شما یک تحلیلگر داده حرفه‌ای هستید. بر اساس محتوای یک سند، تحلیل ساختاریافته با نمودار و اعداد واقعی استخراج می‌کنید.';

function buildPrompt(doc: string): string {
  return (
    'بر اساس سند زیر، یک تحلیل ساختاریافته تولید کن.\n\n' +
    'قوانین سختگیرانه:\n' +
    '- فقط یک شیء JSON معتبر برگردان. هیچ متن اضافه، هیچ ```json ننویس.\n' +
    '- اعداد باید از خودِ سند استخراج شوند. اگر عدد واقعی وجود ندارد، نمودار نساز.\n' +
    '- همه برچسب‌ها فارسی و کوتاه (حداکثر ۴ کلمه).\n\n' +
    'ساختار دقیق:\n' +
    '{\n' +
    '  "title": "عنوان تحلیلی سند",\n' +
    '  "executiveSummary": "خلاصه اجرایی ۲ تا ۳ جمله‌ای",\n' +
    '  "kpis": [\n' +
    '    {"label": "برچسب", "value": "مقدار با واحد", "trend": "up|down|neutral"}\n' +
    '  ],\n' +
    '  "charts": [\n' +
    '    {\n' +
    '      "type": "pie|bar|line|radar",\n' +
    '      "title": "عنوان نمودار",\n' +
    '      "unit": "واحد (اختیاری)",\n' +
    '      "data": [{"name": "دسته", "value": 30}]\n' +
    '    }\n' +
    '  ],\n' +
    '  "keyFindings": ["یافته ۱", "یافته ۲"],\n' +
    '  "figures": [\n' +
    '    {"title": "شکل ۱", "description": "توضیح کوتاه"}\n' +
    '  ]\n' +
    '}\n\n' +
    'محدودیت‌ها:\n' +
    '- ۳ تا ۴ KPI\n' +
    '- ۲ تا ۴ نمودار با حداقل ۳ و حداکثر ۸ داده در هر نمودار\n' +
    '- ۳ تا ۶ یافته کلیدی\n' +
    '- ۰ تا ۳ شکل/جدول توصیفی\n\n' +
    'متن سند:\n' + doc.slice(0, 14_000)
  );
}

function normalizeAnalysis(raw: any) {
  if (!raw || typeof raw !== 'object') return null;

  const out: any = {
    title: String(raw.title ?? '').slice(0, 200) || 'تحلیل سند',
    executiveSummary: String(raw.executiveSummary ?? '').slice(0, 800),
    kpis: [],
    charts: [],
    keyFindings: [],
    figures: [],
  };

  if (Array.isArray(raw.kpis)) {
    out.kpis = raw.kpis
      .filter((k: any) => k && typeof k.label === 'string' && k.value != null)
      .slice(0, 6)
      .map((k: any) => ({
        label: String(k.label).slice(0, 60),
        value: String(k.value).slice(0, 40),
        trend: ['up', 'down', 'neutral'].includes(k.trend) ? k.trend : 'neutral',
      }));
  }

  if (Array.isArray(raw.charts)) {
    out.charts = raw.charts
      .filter((c: any) => c && ['pie', 'bar', 'line', 'radar'].includes(c.type))
      .slice(0, 5)
      .map((c: any) => ({
        type: c.type,
        title: String(c.title ?? '').slice(0, 120) || 'نمودار',
        unit: c.unit ? String(c.unit).slice(0, 20) : '',
        data: Array.isArray(c.data)
          ? c.data
              .filter((d: any) => d && typeof d.name === 'string' && typeof d.value === 'number')
              .slice(0, 12)
              .map((d: any) => ({ name: String(d.name).slice(0, 40), value: Number(d.value) }))
          : [],
      }))
      .filter((c: any) => c.data.length >= 2);
  }

  if (Array.isArray(raw.keyFindings)) {
    out.keyFindings = raw.keyFindings
      .filter((s: any) => typeof s === 'string' && s.trim().length > 4)
      .slice(0, 8)
      .map((s: string) => s.slice(0, 300));
  }

  if (Array.isArray(raw.figures)) {
    out.figures = raw.figures
      .filter((f: any) => f && typeof f.title === 'string')
      .slice(0, 5)
      .map((f: any) => ({
        title: String(f.title).slice(0, 80),
        description: String(f.description ?? '').slice(0, 200),
      }));
  }

  // Must have at least KPI or chart or findings to be useful
  if (out.kpis.length === 0 && out.charts.length === 0 && out.keyFindings.length === 0) {
    return null;
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { chatId, regenerate } = await req.json();
    if (!chatId) return NextResponse.json({ error: 'Missing chatId' }, { status: 400 });

    const { data: chat } = await supabase
      .from('chats')
      .select('id, document_text, analysis')
      .eq('id', chatId)
      .single();
    if (!chat) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });

    if (!regenerate && chat.analysis && typeof chat.analysis === 'object' && (chat.analysis as any).title) {
      return NextResponse.json({ analysis: chat.analysis, cached: true });
    }

    const doc = chat.document_text || '';
    if (doc.trim().length < 300) {
      return NextResponse.json({ error: 'متن سند برای تحلیل کافی نیست.' }, { status: 400 });
    }

    let parsed: any = null;
    for (let attempt = 0; attempt < 3 && !parsed; attempt++) {
      const { text } = await generateTextWithRetry(
        { systemPrompt: SYSTEM, prompt: buildPrompt(doc), maxTokens: 2000 },
        2
      );
      const json = extractJson(text);
      parsed = normalizeAnalysis(json);
      if (!parsed) console.warn('[analyze] attempt', attempt + 1, 'invalid JSON');
    }

    if (!parsed) {
      return NextResponse.json({ error: 'تحلیل سند ناموفق بود.' }, { status: 502 });
    }

    await supabase.from('chats').update({ analysis: parsed }).eq('id', chatId);
    console.log('[analyze] ✅ saved', {
      chatId,
      kpis: parsed.kpis.length,
      charts: parsed.charts.length,
      findings: parsed.keyFindings.length,
    });

    return NextResponse.json({ analysis: parsed });
  } catch (e: any) {
    console.error('[analyze] error:', e?.message);
    return NextResponse.json({ error: e?.message ?? 'خطا' }, { status: 500 });
  }
}
