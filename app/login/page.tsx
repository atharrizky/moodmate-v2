'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true); // True = Halaman Login, False = Halaman Register
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // Hanya dipakai saat Register

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        // PROSES LOGIN
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Kalau sukses, lempar ke Dashboard
        router.push('/dashboard');
        
      } else {
        // PROSES REGISTER
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username, // Ini akan ditangkap oleh Robot Trigger kita tadi!
            },
          },
        });
        if (error) throw error;
        
        alert('Registrasi berhasil! Silakan login sekarang.');
        setIsLogin(true); // Pindah ke mode login setelah sukses daftar
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-700">
        
        {/* Tombol Kembali ke Home */}
        <Link href="/" className="text-slate-400 hover:text-white text-sm mb-6 inline-block">
          &larr; Kembali
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2 text-center">
          {isLogin ? 'Selamat Datang Kembali' : 'Buat Akun Baru'}
        </h1>
        <p className="text-slate-400 mb-8 text-center">
          {isLogin ? 'Masuk untuk melanjutkan jurnalmu.' : 'Mulai perjalanan jurnalmu hari ini.'}
        </p>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Form Username (Hanya Muncul Saat Register) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Username (Nama Panggilan)</label>
              <input
                type="text"
                required={!isLogin}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                placeholder="Misal: Athar"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
              placeholder="email@contoh.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
              placeholder="Minimal 6 karakter"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-slate-900 font-bold rounded-lg transition-all mt-4 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : isLogin ? 'Masuk' : 'Daftar Sekarang'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg('');
            }}
            className="text-green-400 hover:text-green-300 font-medium"
          >
            {isLogin ? 'Daftar di sini' : 'Login di sini'}
          </button>
        </div>

      </div>
    </div>
  );
}