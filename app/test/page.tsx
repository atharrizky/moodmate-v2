'use client';

import { supabase } from '@/lib/supabase';
import { useState } from 'react';

export default function TestPage() {
  const [pesan, setPesan] = useState('Belum dites...');

  const jalankanTest = async () => {
    setPesan('Mencoba menghubungi Supabase...');
    
    // Kita coba ambil data dari tabel 'pets'
    const { data, error } = await supabase.from('pets').select('*');

    if (error) {
      console.error("Error dari Supabase:", error);
      setPesan('Gagal terhubung! ❌ (Cek console log)');
    } else {
      console.log("Data Pets:", data);
      setPesan(`Koneksi Berhasil! ✅ Menemukan ${data.length} peliharaan di database.`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-slate-900 text-white">
      <h1 className="text-3xl font-bold">Uji Coba Koneksi Database</h1>
      <button 
        onClick={jalankanTest}
        className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-bold transition-all"
      >
        Test Koneksi Sekarang!
      </button>
      <p className="text-xl font-mono p-4 bg-slate-800 rounded-md border border-slate-700">
        Status: {pesan}
      </p>
    </div>
  );
}