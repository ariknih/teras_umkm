"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AuthForm } from "@/components/AuthForm";

interface AuthDialogProps {
  trigger: React.ReactNode;
  defaultTab?: "login" | "register";
}

export function AuthDialog({ trigger, defaultTab = "login" }: AuthDialogProps) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const hasAutoOpenedRef = useRef(false);

  useEffect(() => {
    const authParam = searchParams?.get("auth")?.toLowerCase();
    if (authParam === "register" && defaultTab === "register" && !hasAutoOpenedRef.current) {
      hasAutoOpenedRef.current = true;
      setOpen(true);
    } else if (authParam === "login" && defaultTab === "login" && !hasAutoOpenedRef.current) {
      hasAutoOpenedRef.current = true;
      setOpen(true);
    }
  }, [searchParams, defaultTab]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-105 bg-white rounded-3xl p-6 sm:p-7 border-none shadow-2xl">
        <DialogTitle className="sr-only">{defaultTab === "login" ? "Masuk ke Saloka.id" : "Daftar ke Saloka.id"}</DialogTitle>
        {open && <AuthForm key={defaultTab} defaultTab={defaultTab} onSuccess={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}
