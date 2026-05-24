import { avatarRenk, ilkHarfler } from "../lib/avatar";
import { cn } from "@/lib/utils";

interface MusteriAvatarProps {
  musteriId: number;
  adSoyad: string;
  /** "sm" 28px, "md" 36px, "lg" 56px */
  boyut?: "sm" | "md" | "lg";
  className?: string;
}

const BOYUT_KLASLARI: Record<NonNullable<MusteriAvatarProps["boyut"]>, string> = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-14 w-14 text-base",
};

export function MusteriAvatar({
  musteriId,
  adSoyad,
  boyut = "sm",
  className,
}: MusteriAvatarProps) {
  const renk = avatarRenk(musteriId);
  const harfler = ilkHarfler(adSoyad);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold",
        renk.bg,
        renk.text,
        BOYUT_KLASLARI[boyut],
        className,
      )}
      aria-hidden
      title={adSoyad}
    >
      {harfler}
    </div>
  );
}
