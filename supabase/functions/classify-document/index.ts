

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Keyword sets per category. Matching is case-insensitive substring search
// against the full OCR text block. Keep these low-risk: false negatives
// (falls back to "unknown", coach picks manually) are much safer than false
// positives (wrong slot guessed confidently).
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  birth_certificate: [
    'certificate of live birth',
    'psa',
    'philippine statistics authority',
    'noa',
    'municipal registrar',
  ],
  transcript: [
    'transcript of records',
    'scholastic record',
    'units earned',
    'grade point average',
    'gpa',
  ],
  medical: [
    'medical certificate',
    'medical clearance',
    'physician',
    'fit to play',
    'physical examination',
  ],
  consent: [
    'waiver',
    'consent form',
    'data privacy',
    'parental consent',
    'hold harmless',
  ],
};

function scoreCategories(text: string): { category: string | null; confidence: 'high' | 'medium' | 'low' } {
  const lowerText = text.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[category] = keywords.filter((kw) => lowerText.includes(kw)).length;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topCategory, topScore] = sorted[0];

  if (topScore === 0) return { category: null, confidence: 'low' };

  if (topCategory === 'birth_certificate') return { category: null, confidence: 'low' };

  if (topScore >= 2) return { category: topCategory, confidence: 'high' };
  return { category: topCategory, confidence: 'medium' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { base64Image } = await req.json();

    if (!base64Image) {
      return new Response(JSON.stringify({ success: false, error: 'No image provided.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const visionApiKey = Deno.env.get('GOOGLE_VISION_API_KEY');
    if (!visionApiKey) {
      console.error('GOOGLE_VISION_API_KEY is not set.');
      return new Response(
        JSON.stringify({ success: false, error: 'Classification service is not configured.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Image },
              features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
            },
          ],
        }),
      }
    );

    if (!visionResponse.ok) {
      const errText = await visionResponse.text();
      console.error('Vision API error:', errText);
      return new Response(
        JSON.stringify({ success: false, error: 'Could not read this document.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const visionData = await visionResponse.json();
    const fullText: string = visionData?.responses?.[0]?.fullTextAnnotation?.text ?? '';

    if (!fullText.trim()) {
      // No readable text — most likely a blank/blurry/non-document image.
      return new Response(
        JSON.stringify({ success: true, category: null, confidence: 'low', fullText: '' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { category, confidence } = scoreCategories(fullText);

    return new Response(JSON.stringify({ success: true, category, confidence, fullText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('classify-document error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Classification failed.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});