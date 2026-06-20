"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { login, register } from "@/app/actions/auth";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CUSTOMER" | "MERCHANT" | "AFFILIATE">("CUSTOMER");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [referralCode, setReferralCode] = useState("");
  const [communities, setCommunities] = useState<any[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState("");

  // Pre-fill referral code from URL
  useEffect(() => {
    const ref = searchParams?.get("ref") || searchParams?.get("aff");
    if (ref) {
      setReferralCode(ref);
    }
  }, [searchParams]);

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

    if (tab === "register") {
      if (!name || !email || !password) {
        setError("Semua kolom wajib diisi.");
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
      <DialogContent className="sm:max-w-[420px]">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2 mt-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="sm:text-center text-xl font-extrabold tracking-tight">
              {tab === "login" ? "Masuk ke Saloka.id" : "Gabung Saloka.id"}
            </DialogTitle>
            <DialogDescription className="sm:text-center text-xs text-text-secondary mt-1">
              {tab === "login" 
                ? "Silakan masuk ke akun Anda untuk bertransaksi atau mengelola toko." 
                : "Daftar sekarang untuk mendigitalisasi usaha atau menjadi afiliasi."}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Tab Toggle */}
        <div className="flex p-1 bg-surface-container-low rounded-lg relative my-2 border border-outline-variant/20">
          <button 
            type="button"
            onClick={() => handleTabChange("login")}
            className={`flex-1 py-1.5 text-center text-xs font-bold tracking-wide rounded-md transition-all ${
              tab === "login" 
                ? "bg-surface-dark text-primary shadow" 
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Masuk
          </button>
          <button 
            type="button"
            onClick={() => handleTabChange("register")}
            className={`flex-1 py-1.5 text-center text-xs font-bold tracking-wide rounded-md transition-all ${
              tab === "register" 
                ? "bg-surface-dark text-primary shadow" 
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Daftar
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-[11px] text-red-400 font-medium animate-in fade-in duration-300">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {tab === "register" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label htmlFor="dialog-name" className="text-xs font-semibold text-text-secondary">Nama Lengkap</Label>
              <Input
                id="dialog-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Budi Santoso"
                className="pl-4 py-3"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="dialog-email" className="text-xs font-semibold text-text-secondary">Email Bisnis</Label>
            <Input
              id="dialog-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@tokoanda.id"
              className="pl-4 py-3"
            />
          </div>

          <div className="relative">
            <PasswordInput
              id="dialog-password"
              value={password}
              onChange={setPassword}
              label={tab === "login" ? "Kata Sandi" : "Kata Sandi Baru"}
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
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="dialog-role" className="text-xs font-semibold text-text-secondary">Tipe Keanggotaan</Label>
                <select
                  id="dialog-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-surface-dark border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-text-primary text-xs cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px] bg-[right_16px_center] bg-no-repeat"
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="MERCHANT">Merchant</option>
                </select>
              </div>

              {role === "MERCHANT" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label htmlFor="dialog-community" className="text-xs font-semibold text-text-secondary">Pilih Komunitas Induk</Label>
                  {communities.length === 0 ? (
                    <div className="w-full h-9.5 bg-surface-container-low border border-outline-variant/30 rounded-lg animate-pulse" />
                  ) : (
                    <select
                      id="dialog-community"
                      value={selectedCommunityId}
                      onChange={(e) => setSelectedCommunityId(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-surface-dark border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-text-primary text-xs cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px] bg-[right_16px_center] bg-no-repeat"
                    >
                      {communities.map((comm) => (
                        <option key={comm.id} value={comm.id}>
                          {comm.name} ({comm.type === "KOPERASI" ? "Koperasi - Berbayar" : "Perkumpulan - Gratis"})
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-[10px] text-text-secondary/80">
                    *Merchant wajib terasosiasi dengan salah satu komunitas induk saat pendaftaran.
                  </p>
                </div>
              )}

              {/* Referral Code Block */}
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="dialog-referral" className="text-xs font-semibold text-text-secondary">Kode Referral (Opsional)</Label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/60">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12h9c.621 0 1.125.504 1.125 1.125V17c0 .621-.504 1.125-1.125 1.125h-9A1.125 1.125 0 0 1 3.5 17V7.125C3.5 6.504 4.004 6 4.625 6Z" />
                    </svg>
                  </div>
                  <Input
                    id="dialog-referral"
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="Masukkan kode referral / email"
                    className="pl-10 py-3"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 mt-2 bg-primary hover:bg-primary/95 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                Memproses...
              </>
            ) : (
              tab === "login" 
                ? "Masuk Sekarang" 
                : "Daftar Akun Baru"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-3">
          <div className="flex-grow border-t border-outline-variant/15"></div>
          <span className="px-3 text-[10px] text-text-secondary/60 uppercase tracking-widest font-semibold">Atau</span>
          <div className="flex-grow border-t border-outline-variant/15"></div>
        </div>

        {/* Google Login */}
        <button 
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-2.5 border border-outline-variant rounded-lg bg-surface-dark hover:bg-surface-container transition-colors text-xs font-bold text-text-primary group"
        >
          <img 
            alt="Google" 
            className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDhgk8NQmx9teiIkIspzlrtOLpf2ToJxlCpoLbMAa45Iiicm45_R5_6-baHXNZyiGuY6wuMsaS6XQOk-zml0Arr1u4fiZKp_fWiO18d_v1qB9FVOH6XUn8-hu4y8GNp7UROHGJVve5vbMHVkiqRPhTQlx1TVabzZosxPRM4h1bUGvnUPlElVwd8Om_F-Jp7orpNLvHWbeBkNB9nF3R2EHsOn5TrmhXUB-ypirvAenFrH7DlgN6SMi5ZmEToIxA5W97NK0IMxv7s1i3"
          />
          <span>Lanjutkan dengan Google</span>
        </button>

        <p className="text-center text-[10px] text-text-secondary mt-2">
          Dengan mendaftar, Anda menyetujui <a className="underline hover:no-underline text-primary" href="#">Syarat Layanan</a> dan <a className="underline hover:no-underline text-primary" href="#">Kebijakan Privasi</a> kami.
        </p>
      </DialogContent>
    </Dialog>
  );
}
