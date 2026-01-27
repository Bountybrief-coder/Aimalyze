import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Convert file to base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    // Determine MIME type
    const mimeType = file.type || 'video/mp4';

    // Call Gemini API with vision capabilities
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a professional gaming analyst. Analyze this gameplay video for signs of cheating or unfair advantages.

Please analyze for:
1. Aimbot or unnatural targeting patterns
2. Recoil control manipulation
3. Unusual reaction times or inhuman tracking
4. Wall hacking or game state manipulation
5. Any other unfair advantages

Respond with a JSON object in this exact format:
{
  "cheatingDetected": true/false,
  "confidence": <0-100>,
  "verdict": "<short verdict like 'Cheating Likely' or 'Clean Gameplay'>",
  "explanation": "<detailed analysis of what you found>"
}

Be thorough but fair in your analysis.`;

    const response = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64
        }
      },
      prompt
    ]);

    const text = response.response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ 
        error: 'Failed to parse Gemini response',
        rawResponse: text 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error analyzing video:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to analyze video',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
