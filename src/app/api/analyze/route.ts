import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateTextWithRetry } from '@/lib/llm';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SYSTEM = 'شما یک تحلیلگر داده حرفه‌ای هستید. دقیقاً طبق قالب درخواستی پاسخ می‌دهید.';

function buildPrompt(doc: string): string {
  return (
    'بر اساس سند زیر، یک تحلیل ساختاریافته تولید کن.\n\n' +
    '⚠️ خروجی باید **فقط** به این قالب باشد. هیچ متن اضافه، هیچ توضیح، هیچ ``` ننویس.\n' +
    '⚠️ هر خط با یکی از این کلیدها شروع می‌شود، با ": " جدا می‌شود.\n\n' +
    'TITLE: عنوان تحلیلی کوتاه سند\n' +
    'SUMMARY: خلاصه اجرایی در ۲ تا ۳ جمله\n' +
    'KPI: برچسب | مقدار | up\n' +
    'KPI: برچسب | مقدار | down\n' +
    'KPI: برچسب | مقدار | neutral\n' +
    'CHART: pie | عنوان نمودار | واحد\n' +
    'DATA: دسته اول | 30\n' +
    'DATA: دسته دوم | 45\n' +
    'DATA: دسته سوم | 25\n' +
    'CHART: bar | عنوان نمودار دوم | واحد\n' +
    'DATA: نام | عدد\n' +
    'DATA: نام | عدد\n' +
    'FINDING: یافته اول به فارسی کامل\n' +
    'FINDING: یافته دوم به فارسی کامل\n' +
    'FIGURE: عنوان شکل | توضیح کوتاه\n\n' +
    'قوانین:\n' +
    '- ۳ تا ۴ خط KPI (trend یکی از: up، down، neutral)\n' +
    '- ۲ تا ۳ خط CHART (type یکی از: pie، bar، line، radar)\n' +
    '- بعد از هر CHART حداقل ۲ و حداکثر ۶ خط DATA قرار می‌دهد\n' +
    '- اعداد DATA باید عدد صحیح یا اعشاری باشند (نه متن)\n' +
    '- ۳ تا ۵ خط FINDING\n' +
    '- ۰ تا ۲ خط FIGURE (اختیاری)\n' +
    '- همه برچسب‌ها فارسی و کوتاه\n\n' +
    'متن سند:\n' + doc.slice(0, 14_000)
  );
}

type Chart = {
  type: 'pie' | 'bar' | 'line' | 'radar';
  title: string;
  unit: string;
  data: { name: string; value: number }[];
};

function parseAnalysis(raw: string) {
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);

  const out = {
    title: '',
    executiveSummary: '',
    kpis: [] as { label: string; value: string; trend: 'up' | 'down' | 'neutral' }[],
    charts: [] as Chart[],
    keyFindings: [] as string[],
    figures: [] as { title: string; description: string }[],
  };

  let currentChart: Chart | null = null;

  const closeChart = () => {
    if (currentChart && currentChart.data.length >= 2) {
      out.charts.push(currentChart);
    }
    currentChart = null;
  };

  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx < 1) continue;
    const key = line.slice(0, idx).trim().toUpperCase();
    const rest = line.slice(idx + 1).trim();
    if (!rest) continue;

    switch (key) {
      case 'TITLE':
        out.title = rest.slice(0, 200);
        break;
      case 'SUMMARY':
        out.executiveSummary = rest.slice(0, 800);
        break;
      case 'KPI': {
        const parts = rest.split('|').map((p) => p.trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
          const trend = (parts[2] || 'neutral').toLowerCase();
          out.kpis.push({
            label: parts[0].slice(0, 60),
            value: parts[1].slice(0, 40),
            trend: ['up', 'down', 'neutral'].includes(trend) ? (trend as any) : 'neutral',
          });
        }
        break;
      }
      case 'CHART': {
        closeChart();
        const parts = rest.split('|').map((p) => p.trim());
        const type = (parts[0] || '').toLowerCase() as any;
        if (!['pie', 'bar', 'line', 'radar'].includes(type)) break;
        currentChart = {
          type,
          title: (parts[1] || 'نمودار').slice(0, 120),
          unit: (parts[2] || '').slice(0, 20),
          data: [],
        };
        break;
      }
      case 'DATA': {
        if (!currentChart) break;
        const parts = rest.split('|').map((p) => p.trim());
        if (parts.length < 2) break;
        const numeric = parseFloat(
          parts[1].replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^\d.\-]/g, '')
        );
        if (!isNaN(numeric)) {
          currentChart.data.push({ name: parts[0].slice(0, 40), value: numeric });
        }
        break;
      }
      case 'FINDING':
        if (out.keyFindings.length < 8) {
          out.keyFindings.push(rest.slice(0, 300));
        }
        break;
      case 'FIGURE': {
        const parts = rest.split('|').map((p) => p.trim());
        if (parts[0] && out.figures.length < 5) {
          out.figures.push({
            title: parts[0].slice(0, 80),
            description: (parts[1] || '').slice(0, 200),
          });
        }
        break;
      }
    }
  }
  closeChart();

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

    // Try up to 3 times — but each attempt uses the SAME deterministic parser
    let parsed: ReturnType<typeof parseAnalysis> | null = null;
    for (let attempt = 0; attempt < 3 && !parsed; attempt++) {
      const { text } = await generateTextWithRetry(
        { systemPrompt: SYSTEM, prompt: buildPrompt(doc), maxTokens: 2000 },
        2
      );
      console.log(`[analyze] attempt ${attempt + 1} raw output (first 400 chars):\n${text.slice(0, 400)}`);

      const candidate = parseAnalysis(text);
      const score = candidate.kpis.length + candidate.charts.length * 2 + candidate.keyFindings.length;

      console.log(`[analyze] parsed: title=${!!candidate.title} kpis=${candidate.kpis.length} charts=${candidate.charts.length} findings=${candidate.keyFindings.length}`);

      if (candidate.title && score >= 4) {
        parsed = candidate;
      }
    }

    if (!parsed) {
      return NextResponse.json(
        { error: 'تحلیل ناموفق بود. لطفاً دوباره تلاش کنید یا سند دیگری امتحان کنید.' },
        { status: 502 }
      );
    }

    await supabase.from('chats').update({ analysis: parsed }).eq('id', chatId);
    console.log('[analyze] ✅ saved');

    return NextResponse.json({ analysis: parsed });
  } catch (e: any) {
    console.error('[analyze] error:', e?.message);
    return NextResponse.json({ error: e?.message ?? 'خطا' }, { status: 500 });
  }
}
