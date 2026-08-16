import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GOOGLE_VISION_API_KEY = Deno.env.get("GOOGLE_VISION_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!GOOGLE_VISION_API_KEY) {
      return jsonResponse(
        { error: "Server misconfiguration: missing Vision API key" },
        500
      );
    }

 const { base64Image, documentType } = await req.json();

if (!base64Image || !documentType) {
  return jsonResponse({ error: "Missing image or document type" }, 400);
}

    // --- Action 1: Forward to Google Vision ---
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Image },
              features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
            },
          ],
        }),
      }
    );

    const visionData = await visionResponse.json();

    if (visionData.responses?.[0]?.error) {
      return jsonResponse(
        { error: "AI processing failed. Please try again." },
        502
      );
    }

    const fullText: string =
      visionData.responses?.[0]?.fullTextAnnotation?.text ?? "";

    if (!fullText.trim()) {
      return jsonResponse(
        {
          error:
            "Could not read any text from this image. Please upload a clearer photo.",
        },
        422
      );
    }

    // --- Action 2: Validation logic ---
   const validationResult = validateDocument(fullText, documentType);
if (!validationResult.valid) {
  return jsonResponse({ error: validationResult.reason }, 422);
}

    // --- Action 3: Extraction logic ---
const extracted = extractFields(fullText, documentType);

    return jsonResponse({
      success: true,
      data: extracted,
      confidence: extracted.confidence,
    });
  } catch (err) {
    console.error("verify-document error:", err);
    return jsonResponse({ error: "Unexpected server error" }, 500);
  }
});

// ---------- Helpers ----------

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function validateDocument(
  text: string,
  documentType: string
): { valid: boolean; reason?: string } {
  const normalized = text.toUpperCase();

  const keywordsByType: Record<string, string[]> = {
    birth_certificate: [
      "PSA", "BIRTH CERTIFICATE", "CERTIFICATE OF LIVE BIRTH",
      "REPUBLIC OF THE PHILIPPINES", "CIVIL REGISTRAR",
    ],
    medical: ["MEDICAL", "CERTIFICATE", "PHYSICIAN", "FIT TO PLAY", "CLEARANCE"],
    transcript: ["TRANSCRIPT", "RECORDS", "SCHOOL", "GRADE", "ACADEMIC"],
    consent: ["CONSENT", "PARENT", "GUARDIAN", "AUTHORIZE", "SIGNATURE"],
  };

  const expectedKeywords = keywordsByType[documentType];

  if (!expectedKeywords) {
    return { valid: false, reason: "Unknown document type." };
  }

  const matchesExpected = expectedKeywords.some((kw) => normalized.includes(kw));

  if (matchesExpected) {
    return { valid: true };
  }

  // Check if it actually matches a DIFFERENT type — gives a clearer error
  for (const [otherType, otherKeywords] of Object.entries(keywordsByType)) {
    if (otherType === documentType) continue;
    const matchesOther = otherKeywords.some((kw) => normalized.includes(kw));
    if (matchesOther) {
      return {
        valid: false,
        reason: `This looks like a ${otherType.replace("_", " ")}, not a ${documentType.replace("_", " ")}. Please upload the correct document.`,
      };
    }
  }

  return {
    valid: false,
    reason: `This doesn't look like a valid ${documentType.replace("_", " ")}. Please upload a clearer photo.`,
  };
}


function extractFields(text: string, documentType: string) {
  if (documentType === "birth_certificate") {
    // Only attempt DOB extraction, not name — birth certificate OCR is
    // reliable enough for the numbered "3. DATE OF BIRTH" field, but the
    // "1. NAME" field has proven too noisy given the security paper glare.
    const dob = extractDOB(text);
    return {
      name: "",
      dateOfBirth: dob ?? "",
      dobSource: dob ? "birth_certificate" : null,
      verified: !!dob, // birth-certificate-sourced DOB is the one source we treat as authoritative
      confidence: dob ? "medium" : "n/a",
    };
  }

  if (documentType === "id") {
    const name = extractNameFromID(text);
    const dob = extractDOB(text);
    return {
      name: name ?? "",
      dateOfBirth: dob ?? "",
      dobSource: dob ? "id" : null,
      verified: false, // ID-sourced DOB always needs coach confirmation
      confidence: name && dob ? "high" : name || dob ? "medium" : "low",
    };
  }

  if (documentType === "transcript") {
    const dob = extractDOB(text);
    return {
      name: "",
      dateOfBirth: dob ?? "",
      dobSource: dob ? "transcript" : null,
      verified: false,
      confidence: dob ? "medium" : "low",
    };
  }

  return {
    name: "",
    dateOfBirth: "",
    dobSource: null,
    verified: false,
    confidence: "n/a",
  };
}
function extractName(text: string): string | null {
  // PSA certificates typically have a "Name" or "Child's Name" field
  const nameMatch = text.match(
    /(?:CHILD'?S?\s*NAME|NAME OF CHILD|NAME)\s*[:\-]?\s*\n?\s*([A-Z][A-Za-z.\s]{2,60})/i
  );
  return nameMatch ? nameMatch[1].trim().replace(/\s+/g, " ") : null;
}

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array(b.length + 1).fill(0).map((_, j) => (i === 0 ? j : 0))
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function fuzzyMatchMonth(token: string): string | null {
  const lower = token.toLowerCase();
  let best: string | null = null;
  let bestDist = 3; // allow up to 2 character typos
  for (const month of MONTHS) {
    const dist = levenshtein(lower, month);
    if (dist < bestDist) {
      bestDist = dist;
      best = month;
    }
  }
  return best;
}

function extractDOB(text: string): string | null {
  // Numeric formats first
  const numericPatterns = [
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
  ];
  for (const pattern of numericPatterns) {
    const match = text.match(pattern);
    if (match) {
      const parsed = new Date(match[1]);
      if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
    }
  }


  const wordDatePattern = /\b(\d{1,2})\s+([A-Za-z]{4,10})\s+(\d{4})\b/g;
  let match: RegExpExecArray | null;
  while ((match = wordDatePattern.exec(text)) !== null) {
    const [, day, monthRaw, year] = match;
    const month = fuzzyMatchMonth(monthRaw);
    if (month) {
      const parsed = new Date(`${month} ${day}, ${year}`);
      if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
    }
  }

  return null;
}

function extractNameFromID(text: string): string | null {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Look for a line that's ALL CAPS, 2-5 words, only letters/periods/spaces
  // (typical format: "KEEN DRAYLIN S. SURILLA")
  const namePattern = /^[A-Z][A-Z.]*(?:\s+[A-Z][A-Z.]*){1,4}$/;

  for (const line of lines) {
    if (namePattern.test(line) && line.length >= 6 && line.length <= 50) {
      // Skip lines that are clearly not names (school name, course codes, addresses)
      const excludeWords = [
        "COLLEGE", "INSTITUTE", "UNIVERSITY", "SCHOOL", "STREET", "ST.",
        "CITY", "ENGINEERING", "TECHNOLOG",
      ];
      const isExcluded = excludeWords.some((w) => line.includes(w));
      if (!isExcluded) {
        return line;
      }
    }
  }

  return null;
}