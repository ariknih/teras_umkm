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
      { regex: /.{8,}/, text: "8 character" },
      { regex: /[A-Z]/, text: "uppercase" },
      { regex: /[a-z]/, text: "lowercase" },
      { regex: /[0-9]/, text: "number" },
      { regex: /[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\\/]/, text: "symbol" },
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
    if (score === 0) return "bg-slate-200";
    return "bg-[#2DB24A]";
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <Label htmlFor={id} className="text-xs font-bold text-slate-700">
          {label}
        </Label>
      </div>
      <div className="relative">
        <Input
          id={id}
          className="pe-10 pl-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#2DB24A] text-xs text-slate-800 placeholder:text-slate-400"
          placeholder="••••••••"
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={showStrength && strengthScore < 5}
          required={required}
          {...props}
        />
        <button
          className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center rounded-e-xl text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent outline-none cursor-pointer"
          type="button"
          onClick={toggleVisibility}
          aria-label={isVisible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          aria-pressed={isVisible}
        >
          {isVisible ? (
            <EyeOff size={15} strokeWidth={2} aria-hidden="true" />
          ) : (
            <Eye size={15} strokeWidth={2} aria-hidden="true" />
          )}
        </button>
      </div>

      {showStrength && (
        <div className="animate-in fade-in duration-300 pt-1.5">
          {/* Green Top Strength Bar */}
          <div
            className="mb-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/50"
            role="progressbar"
          >
            <div
              className={`h-full ${getStrengthColor(strengthScore)} transition-all duration-300 ease-out`}
              style={{ width: `${(strengthScore / 5) * 100}%` }}
            ></div>
          </div>

          {/* Figma Criteria Grid (Exact screenshot 1 layout) */}
          <div className="grid grid-cols-3 gap-y-2 gap-x-2 text-xs">
            {strength.map((req, index) => (
              <div key={index} className="flex items-center gap-1.5 whitespace-nowrap">
                {req.met ? (
                  <span className="w-4 h-4 rounded-full bg-[#2DB24A] text-white flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </span>
                ) : (
                  <span className="w-4 h-4 rounded-full bg-slate-300 text-white flex items-center justify-center shrink-0">
                    <X size={10} strokeWidth={3} />
                  </span>
                )}
                <span className={`text-[11px] ${req.met ? "text-slate-600 font-medium" : "text-slate-400 font-medium"}`}>
                  {req.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
