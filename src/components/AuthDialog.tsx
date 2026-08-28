"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { login, register, getReferralCookie } from "@/app/actions/auth";
import { getIndukCommunities } from "@/app/actions/community";

interface AuthDialogProps {
  trigger: React.ReactNode;
  defaultTab?: "login" | "register";
}

export function AuthDialog({ trigger, defaultTab = "login" }: AuthDialogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(false);
  const [usernameMsg, setUsernameMsg] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CUSTOMER" | "MERCHANT" | "AFFILIATE">("CUSTOMER");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [referralCode, setReferralCode] = useState("");
  const [communities, setCommunities] = useState<any[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState("");

  // Pre-fill referral code from URL or cookie
  useEffect(() => {
    getReferralCookie().then((cookieVal) => {
      if (cookieVal) {
        setReferralCode(cookieVal);
      } else {
        const ref = searchParams?.get("ref") || searchParams?.get("aff");
        if (ref) {
          setReferralCode(ref);
        }
      }
    });
  }, [searchParams]);

  // Debounced check username
  useEffect(() => {
    if (!username) {
      setIsUsernameAvailable(false);
      setUsernameMsg("");
      return;
    }
    
    if (username.length < 3) {
      setIsUsernameAvailable(false);
      setUsernameMsg("Min. 3 karakter");
      return;
    }

    const cleaned = username.toLowerCase().trim();
    const valid = /^[a-z0-9_.-]{3,30}$/.test(cleaned);
    if (!valid) {
      setIsUsernameAvailable(false);
      setUsernameMsg("Format tidak valid");
      return;
    }
    
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(cleaned)}`);
        const data = await res.json();
        setIsUsernameAvailable(data.available);
        setUsernameMsg(data.message);
      } catch (err) {
        setIsUsernameAvailable(false);
        setUsernameMsg("Gagal memeriksa username");
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [username]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/\s/g, "").replace(/[^a-z0-9_.-]/g, "");
    setUsername(val);
  };

  // Load communities for merchant registration
  useEffect(() => {
    if (tab === "register" && role === "MERCHANT") {
      getIndukCommunities().then((data) => {
        if (Array.isArray(data)) {
          setCommunities(data);
          if (data.length > 0) {
            setSelectedCommunityId(data[0].id);
          }
        }
      });
    }
  }, [tab, role]);

  const handleGoogleLogin = () => {
    setError(null);
    const clientId = "802477107090-ic2c0no4o5rtib7b9moph4a3ri0ch19h.apps.googleusercontent.com";
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/google/callback`);
    const state = encodeURIComponent(`role=${role}`);
    const scope = encodeURIComponent("openid profile email");
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}`;
    window.location.href = authUrl;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Strict email regex validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email.trim())) {
      setError("Masukkan email yang valid (contoh: nama@domain.com)");
      return;
    }

    if (tab === "register") {
      if (!name || !username || !email || !password) {
        setError("Semua kolom wajib diisi.");
        return;
      }
      if (!isUsernameAvailable) {
        setError("Username tidak tersedia atau tidak valid.");
        return;
      }
      if (role === "MERCHANT" && !selectedCommunityId) {
        setError("Merchant wajib memilih Komunitas Induk.");
        return;
      }
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      
      if (tab === "register") {
        formData.append("name", name);
        formData.append("username", username);
        formData.append("role", role);
        if (role === "MERCHANT" && selectedCommunityId) {
          formData.append("communityId", selectedCommunityId);
        }
        if (referralCode) {
          formData.append("referralCode", referralCode);
        }
        const result = await register(formData);
        if (result.error) {
          setError(result.error);
        } else {
          setOpen(false);
          router.push("/");
          router.refresh();
        }
      } else {
        const result = await login(formData);
        if (result.error) {
          setError(result.error);
        } else {
          setOpen(false);
          if (result.user?.role === "ADMIN") {
            router.push("/admin");
          } else if (result.user?.role === "CUSTOMER_SERVICE") {
            router.push("/cs");
          } else {
            router.push("/");
          }
          router.refresh();
        }
      }
    });
  };

  // Reset state when tab changes
  const handleTabChange = (newTab: "login" | "register") => {
    setTab(newTab);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setTab(defaultTab); setError(null); }}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px] bg-white rounded-3xl p-6 sm:p-7 border-none shadow-2xl">
        
        {/* Brand Header (Figma spec) */}
        <div className="flex flex-col items-center gap-1 mt-1">
          <img 
            src="/images/Variant=Icon.webp" 
            alt="Saloka Icon" 
            className="w-12 h-12 object-contain mb-1" 
          />
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="sm:text-center text-xl font-black tracking-tight text-slate-900">
              {tab === "login" ? (
                <>Masuk ke <span className="text-slate-900">Saloka</span><span className="text-primary">.id</span></>
              ) : (
                <>Daftar ke <span className="text-slate-900">Saloka</span><span className="text-primary">.id</span></>
              )}
            </DialogTitle>
            <DialogDescription className="sm:text-center text-xs text-slate-500 mt-1 font-medium leading-relaxed">
              Gunakan akunmu untuk mulai bertransaksi dan bergabung dengan komunitas!
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Tab Toggle (Figma Green Active Tab) */}
        <div className="flex p-1 bg-slate-100 rounded-xl relative my-3 border border-slate-200/60">
          <button 
            type="button"
            onClick={() => handleTabChange("login")}
            className={`flex-1 py-2 text-center text-xs font-bold tracking-wide rounded-lg transition-all ${
              tab === "login" 
                ? "bg-primary text-white shadow-sm" 
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Masuk
          </button>
          <button 
            type="button"
            onClick={() => handleTabChange("register")}
            className={`flex-1 py-2 text-center text-xs font-bold tracking-wide rounded-lg transition-all ${
              tab === "register" 
                ? "bg-primary text-white shadow-sm" 
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Daftar
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium animate-in fade-in duration-300">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 mt-1">
          {tab === "register" && (
            <>
              <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="dialog-name" className="text-xs font-bold text-slate-700">Nama Lengkap</Label>
                <Input
                  id="dialog-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Anda"
                  className="pl-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/20 text-xs"
                />
              </div>

              <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center">
                  <Label htmlFor="dialog-username" className="text-xs font-bold text-slate-700">Username</Label>
                  {username && (
                    <span className={`text-[10px] font-semibold ${isUsernameAvailable ? 'text-primary' : 'text-red-500'}`}>
                      {usernameMsg}
                    </span>
                  )}
                </div>
                <Input
                  id="dialog-username"
                  type="text"
                  required
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="budi_santoso22"
                  className={`pl-4 py-2.5 rounded-xl text-xs border ${username ? (isUsernameAvailable ? 'border-primary focus:border-primary' : 'border-red-500 focus:border-red-500') : 'border-slate-200 focus:border-primary'}`}
                />
                <p className="text-[10px] text-slate-400">
                  Gunakan huruf kecil, angka, 106, underscore, dan dash. Contoh: user.number23.
                </p>
              </div>
            </>
          )}

          <div className="space-y-1">
            <Label htmlFor="dialog-email" className="text-xs font-bold text-slate-700">Email</Label>
            <Input
              id="dialog-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="penya-user.id@gmail.com"
              className="pl-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/20 text-xs"
            />
          </div>

          <div className="relative space-y-1">
            <PasswordInput
              id="dialog-password"
              value={password}
              onChange={setPassword}
              label={tab === "login" ? "Kata Sandi" : "Kata Sandi"}
              showStrength={tab === "register"}
              required
            />
            {tab === "login" && (
              <a href="#" className="absolute right-0 top-0 text-[10px] text-primary hover:underline font-semibold">
                Lupa sandi?
              </a>
            )}
          </div>

          {tab === "register" && (
            <>
              <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="dialog-role" className="text-xs font-bold text-slate-700">Tipe Akun</Label>
                <select
                  id="dialog-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-slate-800 text-xs cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px] bg-[right_16px_center] bg-no-repeat"
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="MERCHANT">Merchant</option>
                </select>
              </div>

              {role === "MERCHANT" && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label htmlFor="dialog-community" className="text-xs font-bold text-slate-700">Komunitas Induk</Label>
                  {communities.length === 0 ? (
                    <div className="w-full h-9.5 bg-slate-100 border border-slate-200 rounded-xl animate-pulse" />
                  ) : (
                    <select
                      id="dialog-community"
                      value={selectedCommunityId}
                      onChange={(e) => setSelectedCommunityId(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-slate-800 text-xs cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px] bg-[right_16px_center] bg-no-repeat"
                    >
                      {communities.map((comm) => (
                        <option key={comm.id} value={comm.id}>
                          {comm.name} ({comm.type === "KOPERASI" ? "Koperasi" : comm.category === "PAID" ? "Perkumpulan - Berbayar" : "Perkumpulan - Gratis"})
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-[10px] text-slate-400">
                    *Merchant wajib berada di bawah komunitas induk.
                  </p>
                </div>
              )}

              {/* Referral Code Block */}
              <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="dialog-referral" className="text-xs font-bold text-slate-700">Kode Referral (Opsional)</Label>
                <Input
                  id="dialog-referral"
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  placeholder="Masukkan kode referral"
                  className="pl-4 py-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 mt-2 bg-primary hover:bg-[#24943E] text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-none outline-none"
          >
            {isPending ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                Memproses...
              </>
            ) : (
              tab === "login" 
                ? "Masuk" 
                : "Daftar Akun Baru"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-3">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="px-3 text-[10px] text-slate-400 uppercase tracking-widest font-bold">Atau</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Google Login (Figma matching style) */}
        <button 
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors text-xs font-bold text-slate-700 shadow-sm cursor-pointer"
        >
          <img 
            alt="Google" 
            className="w-4 h-4 object-contain shrink-0" 
            src="/images/google icon.svg"
          />
          <span>Gunakan akun Google</span>
        </button>

        <p className="text-center text-[10px] text-slate-400 mt-3 leading-tight">
          Dengan mendaftar, Anda menyetujui <a className="underline text-primary font-semibold" href="#">Syarat Layanan</a> dan <a className="underline text-primary font-semibold" href="#">Kebijakan Privasi</a> kami.
        </p>
      </DialogContent>
    </Dialog>
  );
}
