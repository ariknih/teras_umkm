"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { useId, useMemo, useState } from "react";

interface PasswordInputProps extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  showStrength?: boolean;
}

export function PasswordInput({
  value,
  onChange,
  label = "Kata Sandi",
  showStrength = false,
  id: providedId,
  required = false,
  ...props
}: PasswordInputProps) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const toggleVisibility = () => setIsVisible((prevState) => !prevState);

  const checkStrength = (pass: string) => {
    const requirements = [
      { regex: /.{8,}/, text: "Minimal 8 karakter" },
      { regex: /[0-9]/, text: "Minimal 1 angka" },
      { regex: /[a-z]/, text: "Minimal 1 huruf kecil" },
      { regex: /[A-Z]/, text: "Minimal 1 huruf besar" },
    ];

    return requirements.map((req) => ({
      met: req.regex.test(pass),
      text: req.text,
    }));
  };

  const strength = checkStrength(value);

  const strengthScore = useMemo(() => {
    return strength.filter((req) => req.met).length;
  }, [strength]);

  const getStrengthColor = (score: number) => {
    if (score === 0) return "bg-outline-variant";
    if (score <= 1) return "bg-red-500";
    if (score <= 2) return "bg-orange-500";
    if (score === 3) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getStrengthText = (score: number) => {
    if (score === 0) return "Masukkan kata sandi";
    if (score <= 2) return "Kata sandi lemah";
    if (score === 3) return "Kata sandi sedang";
    return "Kata sandi kuat";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor={id} className="text-xs font-semibold text-text-secondary">
          {label}
        </Label>
      </div>
      <div className="relative">
        <Input
          id={id}
          className="pe-10 pl-4 py-3"
          placeholder="••••••••"
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={showStrength && strengthScore < 4}
          aria-describedby={showStrength ? `${id}-description` : undefined}
          required={required}
          {...props}
        />
        <button
          className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center rounded-e-lg text-text-secondary hover:text-text-primary focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary transition-colors disabled:pointer-events-none disabled:opacity-50"
          type="button"
          onClick={toggleVisibility}
          aria-label={isVisible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          aria-pressed={isVisible}
        >
          {isVisible ? (
            <EyeOff size={16} strokeWidth={2} aria-hidden="true" />
          ) : (
            <Eye size={16} strokeWidth={2} aria-hidden="true" />
          )}
        </button>
      </div>

      {showStrength && (
        <div className="animate-in fade-in duration-300">
          {/* Strength Bar */}
          <div
            className="mb-2 mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-container border border-outline-variant/40"
            role="progressbar"
            aria-valuenow={strengthScore}
            aria-valuemin={0}
            aria-valuemax={4}
            aria-label="Kekuatan kata sandi"
          >
            <div
              className={`h-full ${getStrengthColor(strengthScore)} transition-all duration-500 ease-out`}
              style={{ width: `${(strengthScore / 4) * 100}%` }}
            ></div>
          </div>

          <p id={`${id}-description`} className="mb-2 text-xs font-medium text-text-primary">
            {getStrengthText(strengthScore)}. Wajib mengandung:
          </p>

          <ul className="space-y-1.5" aria-label="Persyaratan kata sandi">
            {strength.map((req, index) => (
              <li key={index} className="flex items-center gap-2">
                {req.met ? (
                  <Check size={14} className="text-emerald-500" aria-hidden="true" />
                ) : (
                  <X size={14} className="text-text-secondary/60" aria-hidden="true" />
                )}
                <span className={`text-[11px] ${req.met ? "text-emerald-500 font-medium" : "text-text-secondary"}`}>
                  {req.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
