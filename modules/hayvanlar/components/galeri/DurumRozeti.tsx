import type { KurbanOzet } from "@/modules/hayvanlar/lib/kurban.service";
import { kurbanDurumRozeti } from "@/modules/hayvanlar/lib/kurban-filtre";

interface Props {
  kurban: KurbanOzet;
}

export function DurumRozeti({ kurban }: Props) {
  const { etiket, renkSinif } = kurbanDurumRozeti(kurban);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${renkSinif}`}
    >
      {etiket}
    </span>
  );
}
