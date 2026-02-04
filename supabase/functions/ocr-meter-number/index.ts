import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Max file size: 10MB
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Nicht autorisiert' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Ungültige Anfrage' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { file, fileType } = body;
    
    // Validate file exists and is a string
    if (!file || typeof file !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Ungültige Datei' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate file format (images and PDFs)
    const validFormats = /^data:(image\/(jpeg|jpg|png|webp)|application\/pdf);base64,/;
    if (!validFormats.test(file)) {
      return new Response(
        JSON.stringify({ error: 'Nur JPEG, PNG, WebP und PDF werden unterstützt' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check file size
    const base64Data = file.split(',')[1];
    const sizeInBytes = (base64Data.length * 3) / 4;
    if (sizeInBytes > MAX_FILE_SIZE_BYTES) {
      return new Response(
        JSON.stringify({ error: 'Datei zu groß. Maximum 10MB.' }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: 'Die Verarbeitung ist fehlgeschlagen. Bitte versuchen Sie es später erneut.' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isPdf = file.startsWith('data:application/pdf');
    
    const systemPrompt = `Du bist ein OCR-Spezialist für die Erkennung von Zählernummern aus Dokumenten und Fotos.

AUFGABE:
Analysiere das ${isPdf ? 'Dokument' : 'Bild'} und finde die Zählernummer.

WO FINDET MAN ZÄHLERNUMMERN:
- Auf dem Zähler selbst (Typenschild, Barcode-Bereich)
- In Verträgen und Dokumenten (als "Zählernummer", "Zähler-Nr.", "Meter ID", "Gerätenummer")
- Auf Ablesebelegen und Rechnungen
- Auf Einbauprotokollen

TYPISCHE FORMATE:
- Reine Zahlen: 12345678
- Mit Buchstaben-Präfix: DE-12345678, E-1234567
- Mit Sonderzeichen: 1-234-567-890

REGELN:
1. Suche nach einer eindeutigen Geräte-/Zählernummer
2. Ignoriere Zählerstände (die aktuellen Verbrauchswerte)
3. Ignoriere Kundennummern und Vertragsnummern
4. Gib die Nummer exakt wie gefunden zurück (inkl. Bindestriche, Buchstaben)
5. Wenn mehrere Nummern gefunden werden, wähle die wahrscheinlichste Zählernummer

WICHTIG: Antworte NUR mit einem JSON-Objekt im Format:
{"meterNumber": "<nummer>", "confidence": <0-100>}

Falls keine Zählernummer gefunden wird:
{"meterNumber": null, "confidence": 0}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: file },
              },
              {
                type: "text",
                text: "Bitte finde und extrahiere die Zählernummer aus diesem Dokument/Bild.",
              },
            ],
          },
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit erreicht. Bitte versuchen Sie es später erneut." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Die Verarbeitung ist fehlgeschlagen. Bitte versuchen Sie es erneut." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No response content from AI");
      return new Response(
        JSON.stringify({ error: "Die Verarbeitung ist fehlgeschlagen. Bitte versuchen Sie es erneut." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON response
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse OCR response:", content);
      return new Response(
        JSON.stringify({ error: "Die Verarbeitung ist fehlgeschlagen. Bitte versuchen Sie es erneut." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!result.meterNumber) {
      return new Response(
        JSON.stringify({ 
          error: "Keine Zählernummer gefunden",
          meterNumber: null,
          confidence: 0 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        meterNumber: String(result.meterNumber).trim(),
        confidence: Number(result.confidence) || 85,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("OCR meter number error:", error);
    return new Response(
      JSON.stringify({ error: "Die Verarbeitung ist fehlgeschlagen. Bitte versuchen Sie es erneut." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
