/**
 * Modüler mimari için ortak tipler.
 *
 * Her modül module.config.ts dosyasında ModuleConfig tipini implement eder.
 * Modül sayfaları Next.js app/ klasöründe gerçek route dosyaları olarak yaşar;
 * burada tutulan sayfa metadata'sı sidebar/permissions/navigation içindir.
 */

export type Rol = "admin" | "kasiyer" | "misafir";

export type HttpMetod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type WidgetBoyut = "small" | "medium" | "large";

export type SayfaLayout = "default" | "fullscreen" | "tv" | "login";

export interface ModulSayfa {
  /** URL yolu — Next.js dynamic segments [id] desteklenir */
  yol: string;
  /** Sidebar'da ve sayfa başlığında gösterilen ad */
  ad: string;
  layout?: SayfaLayout;
  izin?: Rol[];
  /** Sidebar'da gösterilsin mi? Detay/yeni sayfaları false yapar */
  sidebarGoster?: boolean;
}

export interface ModulAPI {
  yol: string;
  methods: HttpMetod[];
  izin?: Rol[];
}

export interface ModulWidget {
  id: string;
  ad: string;
  boyut: WidgetBoyut;
  izin?: Rol[];
}

export interface ModulOlay {
  yayinla?: string[];
  dinle?: string[];
}

export interface ModuleConfig {
  id: string;
  ad: string;
  aciklama: string;
  versiyon: string;
  aktif: boolean;
  sira: number;
  /** lucide-react ikon adı (örn. "Wallet", "Users") */
  ikon: string;
  anaRota: string;
  izinler: Rol[];
  bagimliliklar?: string[];
  sayfalar: ModulSayfa[];
  api?: ModulAPI[];
  widgets?: ModulWidget[];
  olaylar?: ModulOlay;
  /** Modül sidebar'da hiç gösterilmesin (örn. _core) */
  sidebarGoster?: boolean;
}

export interface AuthOturum {
  kullaniciId: number;
  kullaniciAdi: string;
  adSoyad: string;
  rol: Rol;
  girisTarihi: string;
}
