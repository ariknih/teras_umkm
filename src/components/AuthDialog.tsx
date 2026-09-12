"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AuthForm } from "@/components/AuthForm";

interface AuthDialogProps {
  trigger: React.ReactNode;
  defaultTab?: "login" | "register";
}

export function AuthDialog({ trigger, defaultTab = "login" }: AuthDialogProps) {
  const [open, setOpen] = useState(false);

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
