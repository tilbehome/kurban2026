import { avatarRenk } from "@/modules/hayvanlar/lib/kurban-filtre";
import type { KurbanHissedar } from "@/modules/hayvanlar/lib/kurban.service";

interface Props {
  hissedarlar: KurbanHissedar[];
  maxGorunur?: number;
}

export function HissedarAvatarGrup({ hissedarlar, maxGorunur = 5 }: Props) {
  const dolular = hissedarlar.filter((h) => h.adSoyad);
  const boslar = hissedarlar.filter((h) => !h.adSoyad);
  const gosterilenDolular = dolular.slice(0, maxGorunur);
  const kalanDolu = Math.max(0, dolular.length - gosterilenDolular.length);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-1.5">
        {gosterilenDolular.map((h) => (
          <div
            key={h.hisseNo}
            title={`${h.hisseNo}. ${h.adSoyad}`}
            className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white ring-2 ring-white ${avatarRenk(
              h.adSoyad ?? "?",
            )}`}
          >
            {(h.adSoyad ?? "?").charAt(0)}
          </div>
        ))}
        {kalanDolu > 0 && (
          <div className="bg-slate-200 text-slate-700 flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-white">
            +{kalanDolu}
          </div>
        )}
        {boslar.slice(0, Math.max(0, maxGorunur - gosterilenDolular.length)).map((h) => (
          <div
            key={`bos-${h.hisseNo}`}
            title={`${h.hisseNo}. boş hisse`}
            className="border-amber-400 text-amber-600 flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed bg-white text-[10px] ring-2 ring-white"
          >
            ✕
          </div>
        ))}
      </div>
      <span className="text-muted-foreground ml-1 text-xs">
        {dolular.length}/{hissedarlar.length}
      </span>
    </div>
  );
}
