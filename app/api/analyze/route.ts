import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Teks jurnal kosong' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY belum disetting di .env.local' }, { status: 500 });
    }

 const prompt = `
    Kamu adalah psikolog ahli yang sangat empatik untuk aplikasi MoodMate.
    Tugasmu membaca teks curhatan pengguna berikut dan menentukan 1 emosi paling dominan dari 8 Emosi Dasar Plutchik.
    
    Pilihan emosi (harus persis salah satu dari ini): Joy, Trust, Fear, Surprise, Sad, Disgust, Anger, Anticipation.
    
    ATURAN KHUSUS DETEKSI:
    - Jika teks berisi tentang rasa cemas, overthinking masa depan, insecure, atau khawatir akan hal yang belum terjadi, MAKA pilih "Fear" atau "Anticipation", JANGAN pilih "Sad".
    - "Sad" hanya untuk kehilangan, patah hati, atau kesedihan mendalam.
    
    Teks curhatan: "${text}"
    
    Balas HANYA dengan format JSON yang valid tanpa tambahan markdown, persis seperti format ini:
    {
      "mood": "NamaEmosi",
      "reason": "Berikan alasan empatik (maksimal 2 kalimat) menyimpulkan perasaan pengguna. Jika ada emosi campuran, sebutkan agar pengguna merasa divalidasi.",
      "advice": "Berikan 1-2 kalimat saran atau solusi praktis (Call to Action) yang sangat menenangkan dan sesuai dengan emosinya. Jika emosinya baik, sarankan cara mempertahankannya. Jika buruk, berikan solusi untuk menenangkan diri. Sebut pengguna dengan kata 'kamu'."
    }
    `;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', 
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Gagal terhubung ke Groq AI');
    }

    const responseText = data.choices[0].message.content;
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const finalData = JSON.parse(cleanJson);

    return NextResponse.json(finalData);
  } catch (error: any) {
    console.error('Error menganalisis:', error);
    return NextResponse.json({ error: 'Gagal menganalisis emosi', detail: error.message }, { status: 500 });
  }
}