import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, Globe, ArrowRight, Loader2, History, Info, ExternalLink, Github, Twitter, MessageSquare, User, LogOut, ShieldCheck, Zap, CreditCard, MessageCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { searchDetailed, SearchResult } from './lib/gemini';
import { auth, db } from './lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot, collection, addDoc } from 'firebase/firestore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  isPremium: boolean;
  premiumPlan?: string;
}

export default function App() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Auto-create profile if not exists
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          const newProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'User',
            isPremium: false,
            createdAt: serverTimestamp(),
          };
          await setDoc(userRef, newProfile);
        }

        // Listen for profile changes
        onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            setProfile(doc.data() as UserProfile);
          }
        });
      } else {
        setProfile(null);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    setResult(null);
    
    try {
      const searchResult = await searchDetailed(query);
      setResult(searchResult);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (result && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcfc]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight leading-none">4Kaa AI Pro</span>
              {profile?.isPremium && (
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter">Flash Edition</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {!profile?.isPremium && (
              <button 
                onClick={() => setShowPremiumModal(true)}
                className="hidden md:flex items-center gap-2 text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
              >
                <Zap className="w-3 h-3 fill-current" />
                UPGRADE PRO
              </button>
            )}
            
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:block text-right">
                  <p className="text-xs font-bold text-zinc-900">{profile?.displayName}</p>
                  <p className="text-[10px] text-zinc-400">{profile?.isPremium ? 'Premium User' : 'Free Plan'}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="bg-black text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-zinc-800 transition-all flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Masuk
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12">
        {/* Hero Section */}
        <AnimatePresence mode="wait">
          {!result && !isSearching && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 bg-zinc-100 px-3 py-1 rounded-full text-[10px] font-bold text-zinc-500 mb-6 uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3" />
                Powered by 4Kaa AI Pro Flash
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                Cari informasi <br />
                <span className="text-zinc-400">lebih dalam & rinci.</span>
              </h1>
              <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
                4Kaa AI Pro menggunakan teknologi Gemini terbaru untuk menjelajahi web dan memberikan jawaban yang terstruktur, akurat, dan mendalam.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Bar */}
        <div className={cn(
          "transition-all duration-500 ease-in-out",
          result || isSearching ? "mb-8" : "max-w-3xl mx-auto"
        )}>
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-zinc-400 group-focus-within:text-black transition-colors" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={profile?.isPremium ? "Tanyakan apa saja (Mode Flash Aktif)..." : "Tanyakan apa saja..."}
              className="w-full bg-white border border-zinc-200 rounded-2xl py-5 pl-14 pr-32 text-lg focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all shadow-sm"
            />
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all",
                profile?.isPremium ? "bg-indigo-600 hover:bg-indigo-700" : "bg-black hover:bg-zinc-800",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {profile?.isPremium && <Zap className="w-4 h-4 fill-current" />}
                  Cari
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Area */}
        <div ref={scrollRef}>
          <AnimatePresence>
            {isSearching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 max-w-3xl mx-auto"
              >
                <div className="flex items-center gap-3 text-zinc-500 animate-pulse">
                  <Globe className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {profile?.isPremium ? "Mode Flash: Menganalisis data secara instan..." : "Menjelajahi web untuk mencari informasi rinci..."}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-zinc-100 rounded-full w-full animate-pulse" />
                  <div className="h-4 bg-zinc-100 rounded-full w-5/6 animate-pulse" />
                  <div className="h-4 bg-zinc-100 rounded-full w-4/6 animate-pulse" />
                </div>
              </motion.div>
            )}

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Main Content */}
                <div className="lg:col-span-8 space-y-8">
                  <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 text-zinc-400">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">Hasil Analisis 4Kaa AI Pro</span>
                    </div>
                    <div className="markdown-body">
                      <Markdown>{result.text}</Markdown>
                    </div>
                  </div>
                </div>

                {/* Sidebar / Sources */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Sumber Terkait
                    </h3>
                    <div className="space-y-3">
                      {result.sources.length > 0 ? (
                        result.sources.map((source, i) => (
                          <a
                            key={i}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block p-3 rounded-xl border border-zinc-100 hover:border-black hover:bg-zinc-50 transition-all"
                          >
                            <div className="text-sm font-medium text-zinc-900 group-hover:text-black line-clamp-1">
                              {source.title}
                            </div>
                            <div className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                              <span className="truncate">{new URL(source.uri).hostname}</span>
                              <ExternalLink className="w-3 h-3" />
                            </div>
                          </a>
                        ))
                      ) : (
                        <p className="text-sm text-zinc-500 italic">Tidak ada sumber spesifik yang ditemukan.</p>
                      )}
                    </div>
                  </div>

                  {!profile?.isPremium && (
                    <div className="bg-indigo-600 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden group">
                      <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Zap className="w-32 h-32 fill-current" />
                      </div>
                      <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                        <Zap className="w-5 h-5 fill-current" />
                        4Kaa AI Pro Flash
                      </h3>
                      <p className="text-indigo-100 text-sm leading-relaxed mb-4">
                        Dapatkan jawaban instan, tanpa batas, dan fitur eksklusif lainnya hanya dengan Rp 70.000.
                      </p>
                      <button 
                        onClick={() => setShowPremiumModal(true)}
                        className="w-full bg-white text-indigo-600 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors"
                      >
                        Beli Sekarang
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Premium Modal */}
      <AnimatePresence>
        {showPremiumModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPremiumModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="bg-indigo-600 p-8 text-white text-center relative">
                <div className="absolute top-4 right-4">
                  <button onClick={() => setShowPremiumModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <LogOut className="w-5 h-5 rotate-180" />
                  </button>
                </div>
                <Zap className="w-12 h-12 mx-auto mb-4 fill-current" />
                <h2 className="text-2xl font-bold mb-2">4Kaa AI Pro Flash</h2>
                <p className="text-indigo-100 text-sm">Aktivasi Permanen & Kecepatan Maksimal</p>
                <div className="mt-4 text-3xl font-bold">Rp 70.000</div>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center mt-0.5">
                      <ShieldCheck className="w-3 h-3 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Aktivasi Otomatis & Permanen</p>
                      <p className="text-xs text-zinc-500">Akun Anda akan langsung terdaftar di sistem developer.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center mt-0.5">
                      <Zap className="w-3 h-3 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Jawaban Super Cepat</p>
                      <p className="text-xs text-zinc-500">Prioritas server utama untuk hasil pencarian instan.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <CreditCard className="w-3 h-3" />
                    Metode Pembayaran
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-500">E-Money / Rekening</span>
                      <span className="font-mono font-bold">6285863146607</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-500">WhatsApp Developer</span>
                      <a href="https://wa.me/6285863146607" target="_blank" className="text-indigo-600 font-bold flex items-center gap-1 hover:underline">
                        <MessageCircle className="w-4 h-4" />
                        Hubungi
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-[10px] text-amber-800 leading-tight">
                    Setelah melakukan pembayaran, silakan kirim bukti transfer ke nomor WhatsApp di atas untuk aktivasi manual jika sistem otomatis sedang dalam pemeliharaan.
                  </p>
                </div>

                <button 
                  onClick={() => window.open('https://wa.me/6285863146607?text=Halo%20Developer,%20saya%20ingin%20aktivasi%204Kaa%20AI%20Pro%20Flash', '_blank')}
                  className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                >
                  Konfirmasi Pembayaran
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg">4Kaa AI Pro</span>
              </div>
              <p className="text-zinc-500 text-sm max-w-xs">
                Membangun masa depan pencarian informasi dengan kecerdasan buatan yang transparan dan mendalam.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 uppercase tracking-wider">Produk</h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li><a href="#" className="hover:text-black">Pencarian</a></li>
                <li><a href="#" className="hover:text-black">4Kaa AI Pro Flash</a></li>
                <li><a href="#" className="hover:text-black">Enterprise</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 uppercase tracking-wider">Komunitas</h4>
              <div className="flex gap-4">
                <a href="#" className="text-zinc-400 hover:text-black"><Twitter className="w-5 h-5" /></a>
                <a href="#" className="text-zinc-400 hover:text-black"><Github className="w-5 h-5" /></a>
                <a href="#" className="text-zinc-400 hover:text-black"><MessageSquare className="w-5 h-5" /></a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-400">
            <p>© 2026 4Kaa AI Pro. Seluruh hak cipta dilindungi.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-black">Privasi</a>
              <a href="#" className="hover:text-black">Ketentuan</a>
              <a href="#" className="hover:text-black">Developer: 6285863146607</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

