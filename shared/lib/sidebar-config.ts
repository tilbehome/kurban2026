/**
 * Sidebar 12 ana menü konfigürasyonu — FAZ 5
 *
 * TEK KAYNAK: Tüm sidebar menü tanımları burada.
 * Sidebar component'ı bu config'i okuyarak render eder.
 *
 * Standartlar:
 *  - 12 ana menü
 *  - Maksimum 10 alt menü per grup
 *  - Akordeon davranış (bir açılınca diğeri kapanır)
 *  - İzin bazlı görünürlük
 *  - Placeholder işareti (henüz yapılmayan sayfalar için)
 *  - Bildirim anahtarı (borçlu sayısı, boş hisse vs.)
 *
 * MIMARI.md §10.2 uyumlu — granular izin sistemi
 */

import type { LucideIcon } from "lucide-react";
import {
  Home,
  Users,
  UserPlus,
  AlertCircle,
  Star,
  Sparkles,
  FileText,
  Tags,
  Upload,
  Download,
  List,
  Beef,
  Plus,
  Truck,
  Target,
  CircleDot,
  Repeat,
  ScrollText,
  Image,
  Tag,
  Package,
  Scissors,
  Tv,
  ClipboardList,
  Stethoscope,
  Scale,
  Slice,
  Box,
  PackageCheck,
  Drumstick,
  BarChart3,
  Wallet,
  Zap,
  Calendar,
  Receipt,
  RotateCcw,
  CalendarClock,
  Percent,
  XCircle,
  TagsIcon,
  Send,
  PiggyBank,
  Coins,
  Landmark,
  CreditCard,
  Activity,
  TrendingDown,
  TrendingUp,
  Sunrise,
  RefreshCw,
  LineChart,
  Map,
  Car,
  UserCog,
  MapPin,
  CheckCircle2,
  Camera,
  MessageSquare,
  MessageCircle,
  LayoutTemplate,
  Clock,
  History,
  Smartphone,
  Mail,
  Phone,
  Bot,
  Plug,
  BarChart,
  PieChart,
  Calculator,
  AlertTriangle,
  CalendarRange,
  TargetIcon,
  Brain,
  FilePlus,
  UserCircle,
  Building2,
  Store,
  ShieldCheck,
  Palette,
  Database,
  Cable,
  Globe,
  Cpu,
  Headphones,
  Award,
  Banknote,
  ScrollText as ScrollTextIcon,
} from "lucide-react";

/** İzin anahtarı (granular: "<modul>.<eylem>") */
export type IzinAnahtari = string;

/** Hangi fazda aktif olacak — placeholder sayfalar için */
export type SayfaFazi = "bayram" | "sonrasi" | "gelecek";

/** Bildirim anahtarı — service'ten gelen sayım */
export type BildirimAnahtari =
  | "borclu"
  | "bosHisse"
  | "eksikVekalet"
  | "bekleyenMesaj"
  | "kasaUyari"
  | "kritikBorc";

/** Alt menü öğesi */
export interface SidebarAltMenu {
  id: string;
  ad: string;
  ikon: LucideIcon;
  rota: string;
  /** true ise PlaceholderSayfa'ya yönlendirilir */
  placeholder?: boolean;
  /** Hangi fazda hazır olacak (placeholder için) */
  faz?: SayfaFazi;
  /** Sayı rozeti için bildirim anahtarı */
  bildirimAnahtari?: BildirimAnahtari;
  /** Gerekli izin (yoksa herkes görür) */
  izin?: IzinAnahtari;
  /** Placeholder sayfası için açıklama */
  aciklama?: string;
  /** Placeholder sayfasında listelenecek özellikler */
  ozellikler?: string[];
  /** TV/dışa açılan sayfalar gibi yeni sekmede açılacak */
  yeniSekme?: boolean;
}

/** Ana menü öğesi (akordeon grubu veya tek sayfa) */
export interface SidebarAnaMenu {
  id: string;
  ad: string;
  ikon: LucideIcon;
  /** Alt menü yoksa tek sayfa link */
  rota?: string;
  altMenuler?: SidebarAltMenu[];
  /** TV ekranı gibi yeni sekmede açılacak */
  yeniSekme?: boolean;
  /** Bu grubun toplam bildirim anahtarı (en kritik alt menü) */
  bildirimAnahtari?: BildirimAnahtari;
  /** Görmek için gereken izin */
  izin?: IzinAnahtari;
  /** Klavye kısayolu (örn. "Ctrl+Shift+M") */
  kisayol?: string;
}

/**
 * 12 ANA MENÜ — Bayram operasyonu için en çok kullanılan yukarıda.
 *
 * KAYNAK: PROMPT-FAZ-5 + SIDEBAR-MENU-YAPISI.md
 * STANDART: Yerli (Kurban360, Bikurbanlık) + Yabancı (inecta, TRAX-IT) yazılım esinli
 */
export const sidebarMenuleri: SidebarAnaMenu[] = [
  // 1) ANA SAYFA
  {
    id: "ana-sayfa",
    ad: "Ana Sayfa",
    ikon: Home,
    rota: "/",
    kisayol: "Ctrl+Shift+D",
  },

  // 2) MÜŞTERİLER / CARİ — 9 alt
  {
    id: "musteriler",
    ad: "Müşteriler / Cari",
    ikon: Users,
    izin: "musteriler.goruntule",
    bildirimAnahtari: "borclu",
    kisayol: "Ctrl+Shift+M",
    altMenuler: [
      {
        id: "tum-musteriler",
        ad: "Tüm Müşteriler",
        ikon: List,
        rota: "/musteriler",
        izin: "musteriler.goruntule",
      },
      {
        id: "yeni-musteri",
        ad: "Yeni Müşteri",
        ikon: UserPlus,
        rota: "/musteriler/yeni",
        izin: "musteriler.olustur",
      },
      {
        id: "borclular",
        ad: "Borçlular",
        ikon: AlertCircle,
        rota: "/musteriler/borclular",
        bildirimAnahtari: "borclu",
        izin: "musteriler.goruntule",
      },
      {
        id: "vip",
        ad: "VIP Müşteriler",
        ikon: Star,
        rota: "/musteriler/vip",
        placeholder: true,
        faz: "sonrasi",
        izin: "musteriler.goruntule",
        aciklama:
          "Premium ve sadık müşterilerinizi tek bakışta görün, özel kampanyalar yönetin.",
        ozellikler: [
          "Otomatik VIP sınıflandırma (hisse sayısı + tahsilat)",
          "Özel etiket ve renk kodlama",
          "VIP'lere özel hatırlatma ve mesajlar",
          "Yıllık VIP raporu",
        ],
      },
      {
        id: "yeni-sezon",
        ad: "Bu Sezon Yeni",
        ikon: Sparkles,
        rota: "/musteriler/yeni-sezon",
        placeholder: true,
        faz: "sonrasi",
        izin: "musteriler.goruntule",
        aciklama:
          "Bu bayram döneminde kaydolmuş müşterilerinizi listeleyin ve özel karşılama yapın.",
        ozellikler: [
          "Dönemsel filtre (bu yıl / geçen yıl / özel tarih)",
          "Hoş geldin mesajı şablonu",
          "Yeni müşteri raporu Excel'e aktar",
        ],
      },
      {
        id: "hesap-ekstresi",
        ad: "Hesap Ekstresi",
        ikon: FileText,
        rota: "/musteriler/ekstre",
        izin: "musteriler.goruntule",
      },
      {
        id: "etiket-yonetimi",
        ad: "Etiket Yönetimi",
        ikon: Tags,
        rota: "/musteriler/etiketler",
        placeholder: true,
        faz: "sonrasi",
        izin: "musteriler.etiket",
        aciklama:
          "Tüm etiketleri merkezi olarak yönetin, renkler atayın, segment raporu çıkarın.",
        ozellikler: [
          "Etiket renk ve simge yönetimi",
          "Etiket bazlı toplu işlem (mesaj/Excel)",
          "Etiket kullanım raporu",
        ],
      },
      {
        id: "excel-import",
        ad: "Excel İçe Aktar",
        ikon: Upload,
        rota: "/musteriler/excel-import",
        placeholder: true,
        faz: "sonrasi",
        izin: "musteriler.olustur",
        aciklama:
          "Excel dosyasından toplu müşteri kaydı oluşturun, hatalı satırları gözden geçirin.",
        ozellikler: [
          "Şablon Excel indirme",
          "Önizleme + doğrulama",
          "Hatalı satır raporu",
          "Mükerrer kontrolü (TC + telefon)",
        ],
      },
      {
        id: "excel-export",
        ad: "Excel Dışa Aktar",
        ikon: Download,
        rota: "/musteriler/excel-export",
        placeholder: true,
        faz: "sonrasi",
        izin: "musteriler.goruntule",
        aciklama:
          "Filtreli müşteri listesini Excel olarak indirin. Sütunları siz seçin.",
        ozellikler: [
          "Sütun seçici",
          "Filtre + sıralama Excel'e aynı yansır",
          "Çoklu sayfa (özet + detay)",
        ],
      },
    ],
  },

  // 3) KURBAN YÖNETİMİ — 10 alt (rota: /hayvanlar mevcut)
  {
    id: "kurbanlar",
    ad: "Kurban Yönetimi",
    ikon: Beef,
    izin: "hayvanlar.goruntule",
    bildirimAnahtari: "bosHisse",
    kisayol: "Ctrl+Shift+K",
    altMenuler: [
      {
        id: "tum-kurbanlar",
        ad: "Tüm Kurbanlar",
        ikon: List,
        rota: "/hayvanlar",
        izin: "hayvanlar.goruntule",
      },
      {
        id: "yeni-kurban",
        ad: "Yeni Kurban Ekle",
        ikon: Plus,
        rota: "/hayvanlar/yeni",
        izin: "hayvanlar.olustur",
      },
      {
        id: "hayvan-tedarik",
        ad: "Hayvan Tedariği",
        ikon: Truck,
        rota: "/hayvanlar/tedarik",
        placeholder: true,
        faz: "sonrasi",
        izin: "hayvanlar.olustur",
        aciklama:
          "Tedarikçi kaydı, alım faturaları ve hayvan giriş takibi tek panelde.",
        ozellikler: [
          "Tedarikçi rehberi",
          "Alım faturası girişi",
          "Küpe doğrulama (TRAX-IT esinli)",
          "Sevkiyat takibi",
        ],
      },
      {
        id: "hisse-atama",
        ad: "Hisse Atama",
        ikon: Target,
        rota: "/hayvanlar/hisse-atama",
        izin: "hisseler.ata",
      },
      {
        id: "bos-hisseler",
        ad: "Boş Hisseler",
        ikon: CircleDot,
        rota: "/hayvanlar/bos-hisseler",
        bildirimAnahtari: "bosHisse",
        izin: "hayvanlar.goruntule",
      },
      {
        id: "hisse-transfer",
        ad: "Hisse Transfer",
        ikon: Repeat,
        rota: "/hayvanlar/hisse-transfer",
        placeholder: true,
        faz: "sonrasi",
        izin: "hisseler.transfer",
        aciklama:
          "Bir müşteriden diğerine hisse devri yapın. Tahsilat geçmişi korunur.",
        ozellikler: [
          "İki taraflı onay (devreden + devralan)",
          "Tahsilat geçmişi taşıma",
          "Audit log entegrasyonu",
          "Vekalet otomatik yeniden talebi",
        ],
      },
      {
        id: "vekalet",
        ad: "Vekalet Yönetimi",
        ikon: ScrollText,
        rota: "/hayvanlar/vekalet",
        bildirimAnahtari: "eksikVekalet",
        izin: "musteriler.vekalet.oku",
      },
      {
        id: "galeri",
        ad: "Hayvan Galerisi",
        ikon: Image,
        rota: "/hayvanlar/galeri",
        placeholder: true,
        faz: "sonrasi",
        izin: "hayvanlar.goruntule",
        aciklama:
          "Her hayvanın fotoğraflarını yükleyin, müşteriye link gönderin (Kurban360 esinli).",
        ozellikler: [
          "Çoklu fotoğraf yükleme",
          "Müşteriye paylaşım linki",
          "Sırasal görüntüleme",
          "Karşılaştırma modu",
        ],
      },
      {
        id: "etiket-yazdirma",
        ad: "Etiket Yazdırma",
        ikon: Tag,
        rota: "/hayvanlar/etiket-yazdirma",
        placeholder: true,
        faz: "bayram",
        izin: "hayvanlar.guncelle",
        aciklama:
          "6x9 cm hisse etiketleri otomatik oluştur, termal yazıcıdan bas (Bikurbanlık esinli).",
        ozellikler: [
          "Şablon seçimi (hisse / kurban / paket)",
          "QR kod entegrasyonu",
          "Toplu yazdırma",
          "Termal yazıcı desteği",
        ],
      },
      {
        id: "stok-durumu",
        ad: "Stok Durumu",
        ikon: Package,
        rota: "/hayvanlar/stok",
        placeholder: true,
        faz: "sonrasi",
        izin: "hayvanlar.goruntule",
        aciklama:
          "Anlık doluluk, kalan hisse, uyarılar (inecta tarzı slaughterhouse stoğu).",
        ozellikler: [
          "Canlı doluluk %",
          "Düşük stok uyarısı",
          "Kategori bazlı görünüm (büyükbaş / küçükbaş)",
        ],
      },
    ],
  },

  // 4) KESİM TAKİP EKRANI — tüm operasyon merkezi (canlı + kontrol + saha)
  {
    id: "kesim-takip",
    ad: "Kesim Takip Ekranı",
    ikon: Scissors,
    izin: "hayvanlar.goruntule",
    altMenuler: [
      {
        id: "kontrol-paneli",
        ad: "Kontrol Paneli",
        ikon: LayoutTemplate,
        rota: "/tv/kontrol",
        izin: "tv.kontrol",
        aciklama: "Operasyon sırasını yönet, aşama başlat/bitir",
      },
      {
        id: "personel-paneli",
        ad: "Personel Saha Paneli",
        ikon: Smartphone,
        rota: "/tv/personel",
        izin: "tv.kontrol",
        aciklama: "Saha personeli için mobil görev paneli (swipe + geri al)",
      },
      {
        id: "tv-canli",
        ad: "TV Canlı Ekran",
        ikon: Tv,
        rota: "/tv",
        yeniSekme: true,
        aciklama: "Kesim alanı TV ekranında gösterilen 4 sütunlu canlı yayın",
      },
      {
        id: "vekalet-yonetim",
        ad: "Vekalet Yönetimi",
        ikon: ScrollText,
        rota: "/hayvanlar/vekalet",
        bildirimAnahtari: "eksikVekalet",
        aciklama: "Hisse bazlı vekalet kayıt ve takip",
      },
      {
        id: "tartim-keypad",
        ad: "Tartım Girişi",
        ikon: Scale,
        rota: "/kesim/tartim",
        izin: "tv.kontrol",
        aciklama: "Karkas kg girişi (büyük keypad, eldivenle dokunmaya uygun)",
      },
      {
        id: "teslim-paneli",
        ad: "Teslim Paneli",
        ikon: PackageCheck,
        rota: "/kesim/teslim",
        izin: "tv.kontrol",
        aciklama: "Paketlenen hisseleri müşteriye teslim et + WhatsApp ile haber",
      },
      {
        id: "tv-musteri",
        ad: "Müşteri Giriş Ekranı",
        ikon: Users,
        rota: "/tv/m",
        yeniSekme: true,
        aciklama: "Müşterilerin telefon/küpe ile kendi kurbanını bulduğu ekran",
      },
      {
        id: "tv-ayarlar",
        ad: "TV Ayarları",
        ikon: Plug,
        rota: "/tv/ayarlar",
        izin: "tv.kontrol",
        aciklama: "Yayın kaynakları, alan adları, sesli anons ayarları",
      },
      {
        id: "sira-yonetim",
        ad: "Sıra Yönetimi",
        ikon: ClipboardList,
        rota: "/kesim/sira",
        placeholder: true,
        faz: "sonrasi",
        aciklama: "Drag-drop ile kesim sırasını yeniden düzenle.",
        ozellikler: [
          "Drag-drop sıralama",
          "Acil sıra atlama",
          "WhatsApp ile çağrı",
        ],
      },
      {
        id: "operasyon-raporu",
        ad: "Operasyon Raporu",
        ikon: BarChart3,
        rota: "/kesim/rapor",
        placeholder: true,
        faz: "sonrasi",
        aciklama:
          "Saatlik kesim grafiği, personel performansı, kapasite analizi.",
        ozellikler: [
          "Saatlik kesim grafiği",
          "Personel performansı",
          "Aşama bazlı süre",
        ],
      },
    ],
  },

  // 5) TAHSİLAT & ÖDEME — 10 alt
  {
    id: "tahsilat",
    ad: "Tahsilat & Ödeme",
    ikon: Wallet,
    izin: "tahsilat.goruntule",
    kisayol: "Ctrl+Shift+T",
    altMenuler: [
      {
        id: "hizli-tahsilat",
        ad: "Hızlı Tahsilat",
        ikon: Zap,
        rota: "/tahsilat",
        izin: "tahsilat.olustur",
      },
      {
        id: "tum-tahsilatlar",
        ad: "Tüm Tahsilatlar",
        ikon: List,
        rota: "/tahsilat/tum",
        izin: "tahsilat.goruntule",
      },
      {
        id: "bugun",
        ad: "Bugünkü Tahsilatlar",
        ikon: Calendar,
        rota: "/tahsilat/bugun",
        izin: "tahsilat.goruntule",
      },
      {
        id: "dekontlar",
        ad: "Dekontlar (TKR)",
        ikon: Receipt,
        rota: "/tahsilat/dekontlar",
        izin: "tahsilat.goruntule",
      },
      {
        id: "iadeler",
        ad: "İadeler",
        ikon: RotateCcw,
        rota: "/tahsilat/iadeler",
        placeholder: true,
        faz: "sonrasi",
        izin: "tahsilat.olustur",
        aciklama:
          "Müşteriye geri ödeme işlemleri. Tam izlenebilirlik + onay akışı.",
        ozellikler: [
          "Onay akışı (admin onayı)",
          "İade nedeni kategorize",
          "Otomatik bakiye düşüşü",
          "Audit log + dekont",
        ],
      },
      {
        id: "taksit",
        ad: "Taksit Takibi",
        ikon: CalendarClock,
        rota: "/tahsilat/taksit",
        placeholder: true,
        faz: "sonrasi",
        izin: "tahsilat.goruntule",
        aciklama:
          "Ödeme planları ve taksit hatırlatmaları (Türk pazarı için kritik).",
        ozellikler: [
          "Esnek taksit planı tanımlama",
          "Otomatik hatırlatma (3 gün kala)",
          "Geciken taksit uyarısı",
        ],
      },
      {
        id: "indirim",
        ad: "İndirim & Mahsup",
        ikon: Percent,
        rota: "/tahsilat/indirim",
        placeholder: true,
        faz: "sonrasi",
        izin: "tahsilat.olustur",
        aciklama:
          "Müşteri bakiyesinden indirim, kupon, kredi mahsubu (Kurban360 esinli).",
        ozellikler: [
          "Yüzde/tutar indirim",
          "Kupon kodları",
          "Kredi mahsubu (alacak/borç eşleşme)",
        ],
      },
      {
        id: "iptal",
        ad: "İptal İşlemleri",
        ikon: XCircle,
        rota: "/tahsilat/iptal",
        izin: "tahsilat.olustur",
      },
      {
        id: "fiyat-yonetimi",
        ad: "Fiyat Yönetimi",
        ikon: TagsIcon,
        rota: "/tahsilat/fiyat",
        placeholder: true,
        faz: "sonrasi",
        izin: "tahsilat.olustur",
        aciklama:
          "Hisse fiyatlarını toplu güncelle, kategori bazlı fiyatlama.",
        ozellikler: [
          "Toplu fiyat güncelleme",
          "Kategori bazlı fiyat (büyükbaş/küçükbaş)",
          "Tarihsel fiyat geçmişi",
        ],
      },
      {
        id: "toplu-tahsilat",
        ad: "Toplu Tahsilat",
        ikon: Send,
        rota: "/tahsilat/toplu",
        placeholder: true,
        faz: "sonrasi",
        izin: "tahsilat.olustur",
        aciklama:
          "Birden çok müşteriye tek seferde tahsilat (kurumsal ödeme).",
        ozellikler: [
          "Excel'den müşteri-tutar listesi yükle",
          "Tek dekont, çoklu müşteri dağılımı",
          "Önizleme + onay",
        ],
      },
    ],
  },

  // 6) KASA & FİNANS — 10 alt
  {
    id: "kasa",
    ad: "Kasa & Finans",
    ikon: PiggyBank,
    izin: "kasa.goruntule",
    altMenuler: [
      {
        id: "kasa-ozet",
        ad: "Kasa Özeti",
        ikon: PiggyBank,
        rota: "/kasa",
        izin: "kasa.goruntule",
      },
      {
        id: "nakit",
        ad: "Nakit Kasa",
        ikon: Coins,
        rota: "/kasa/nakit",
        izin: "kasa.goruntule",
      },
      {
        id: "banka",
        ad: "Banka Hesapları",
        ikon: Landmark,
        rota: "/kasa/havale",
        izin: "kasa.goruntule",
      },
      {
        id: "pos",
        ad: "POS / Kart",
        ikon: CreditCard,
        rota: "/kasa/pos",
        izin: "kasa.goruntule",
      },
      {
        id: "hareketler",
        ad: "Kasa Hareketleri",
        ikon: Activity,
        rota: "/kasa/hareketler",
        izin: "kasa.goruntule",
      },
      {
        id: "giderler",
        ad: "Giderler",
        ikon: TrendingDown,
        rota: "/kasa/gider",
        izin: "kasa.gider",
      },
      {
        id: "gelir-gider",
        ad: "Gelir-Gider Analiz",
        ikon: TrendingUp,
        rota: "/kasa/gelir-gider",
        placeholder: true,
        faz: "sonrasi",
        izin: "kasa.goruntule",
        aciklama:
          "Gelir-gider grafiği, kategori bazlı analiz, dönemsel karşılaştırma.",
        ozellikler: [
          "Kategori bazlı pasta grafik",
          "Aylık/yıllık trend",
          "Bütçe karşılaştırma",
        ],
      },
      {
        id: "gun-acilis-kapanis",
        ad: "Gün Açılış / Kapanış",
        ikon: Sunrise,
        rota: "/kasa/acilis",
        izin: "kasa.acilis",
      },
      {
        id: "banka-mutabakat",
        ad: "Banka Mutabakat",
        ikon: RefreshCw,
        rota: "/kasa/banka-mutabakat",
        placeholder: true,
        faz: "sonrasi",
        izin: "kasa.goruntule",
        aciklama:
          "Banka ekstresi import, otomatik eşleşme (bank reconciliation).",
        ozellikler: [
          "CSV/Excel ekstre yükleme",
          "Otomatik eşleşme",
          "Manuel eşleştirme paneli",
        ],
      },
      {
        id: "karlilik",
        ad: "Karlılık Analizi",
        ikon: LineChart,
        rota: "/kasa/karlilik",
        placeholder: true,
        faz: "sonrasi",
        izin: "kasa.goruntule",
        aciklama:
          "Hisse başı kâr/zarar analizi (inecta cost-per-head esinli).",
        ozellikler: [
          "Hayvan başı maliyet",
          "Hisse başı kâr marjı",
          "Dönemsel ROI",
        ],
      },
    ],
  },

  // 7) LOJİSTİK & TESLİMAT — 9 alt (TÜMÜ PLACEHOLDER, Faz 2)
  {
    id: "lojistik",
    ad: "Lojistik & Teslimat",
    ikon: Truck,
    izin: "hayvanlar.goruntule",
    altMenuler: [
      {
        id: "aktif-teslimat",
        ad: "Aktif Teslimatlar",
        ikon: Package,
        rota: "/lojistik",
        placeholder: true,
        faz: "sonrasi",
        aciklama:
          "Şu anda yolda olan teslimatlar, şoför ve müşteri durumu.",
        ozellikler: [
          "Canlı harita",
          "Şoför iletişim",
          "Müşteri bilgilendirme SMS",
        ],
      },
      {
        id: "teslim-program",
        ad: "Teslim Programı",
        ikon: ClipboardList,
        rota: "/lojistik/program",
        placeholder: true,
        faz: "sonrasi",
        aciklama: "Günlük/haftalık teslim programı, kapasite planlama.",
        ozellikler: [
          "Drag-drop teslim atama",
          "Bölge bazlı gruplama",
          "Pazar/cumartesi planı",
        ],
      },
      {
        id: "soforler",
        ad: "Şoför Yönetimi",
        ikon: UserCog,
        rota: "/lojistik/soforler",
        placeholder: true,
        faz: "sonrasi",
        aciklama: "Şoför kayıtları, ehliyet süresi, performans takibi.",
        ozellikler: [
          "Ehliyet/SRC son tarih uyarısı",
          "Teslim sayısı/başarı %",
          "Müşteri puanlama",
        ],
      },
      {
        id: "araclar",
        ad: "Araç Yönetimi",
        ikon: Car,
        rota: "/lojistik/araclar",
        placeholder: true,
        faz: "sonrasi",
        aciklama: "Filo yönetimi, muayene tarihleri, yakıt takibi.",
        ozellikler: [
          "Muayene/sigorta hatırlatma",
          "Yakıt/km log",
          "Bakım takvimi",
        ],
      },
      {
        id: "rota",
        ad: "Rota Optimizasyonu",
        ikon: Map,
        rota: "/lojistik/rota",
        placeholder: true,
        faz: "gelecek",
        aciklama: "AI ile en kısa/ekonomik rota planlama (logistics standardı).",
        ozellikler: [
          "OSRM / Google Maps entegrasyon",
          "Trafik bazlı optimizasyon",
          "Yakıt tasarrufu raporu",
        ],
      },
      {
        id: "gps",
        ad: "Canlı Takip (GPS)",
        ikon: MapPin,
        rota: "/lojistik/gps",
        placeholder: true,
        faz: "gelecek",
        aciklama: "Araçların canlı konum takibi, müşteriye paylaşım linki.",
        ozellikler: [
          "Canlı harita",
          "Müşteriye paylaşım linki",
          "Geofence uyarıları",
        ],
      },
      {
        id: "teslim-onay",
        ad: "Teslim Onayları",
        ikon: CheckCircle2,
        rota: "/lojistik/onaylar",
        placeholder: true,
        faz: "sonrasi",
        aciklama: "Müşteri imzası, foto onay, eksik teslim raporu.",
        ozellikler: [
          "Dijital imza",
          "Foto onay",
          "Müşteri puanlama formu",
        ],
      },
      {
        id: "teslim-foto",
        ad: "Teslim Fotoğrafları",
        ikon: Camera,
        rota: "/lojistik/fotograflar",
        placeholder: true,
        faz: "sonrasi",
        aciklama: "Teslim anı fotoğraf arşivi (kanıt + müşteriye gönderim).",
        ozellikler: [
          "Otomatik müşteri WhatsApp gönderim",
          "Tarihsel arşiv",
          "Yıllık galeri raporu",
        ],
      },
      {
        id: "lojistik-rapor",
        ad: "Lojistik Raporu",
        ikon: BarChart3,
        rota: "/lojistik/rapor",
        placeholder: true,
        faz: "sonrasi",
        aciklama: "Teslim süreleri, başarı oranı, maliyet analizi.",
        ozellikler: [
          "Ortalama teslim süresi",
          "Bölge bazlı maliyet",
          "Şoför performans karşılaştırma",
        ],
      },
    ],
  },

  // 8) İLETİŞİM & WHATSAPP — 10 alt
  {
    id: "whatsapp",
    ad: "İletişim & WhatsApp",
    ikon: MessageSquare,
    izin: "musteriler.iletisim",
    bildirimAnahtari: "bekleyenMesaj",
    kisayol: "Ctrl+Shift+W",
    altMenuler: [
      {
        id: "mesaj-merkezi",
        ad: "Mesaj Merkezi",
        ikon: MessageCircle,
        rota: "/whatsapp",
        placeholder: true,
        faz: "bayram",
        bildirimAnahtari: "bekleyenMesaj",
        aciklama:
          "Gelen-giden mesajlar tek panelde, müşteri konuşmaları izlenebilir.",
        ozellikler: [
          "WhatsApp Business API entegrasyon",
          "Konuşma geçmişi",
          "Hızlı yanıt şablonları",
        ],
      },
      {
        id: "sablonlar",
        ad: "Mesaj Şablonları",
        ikon: LayoutTemplate,
        rota: "/whatsapp/sablonlar",
        placeholder: true,
        faz: "bayram",
        aciklama: "Önceden onaylı şablonlar (borç hatırlatma, teslim haberi).",
        ozellikler: [
          "WhatsApp şablon onayı",
          "Değişken alanlar ({{musteri}}, {{tutar}})",
          "Çoklu dil desteği",
        ],
      },
      {
        id: "toplu-gonderim",
        ad: "Toplu Gönderim",
        ikon: Send,
        rota: "/whatsapp/toplu",
        placeholder: true,
        faz: "bayram",
        aciklama: "Filtreli müşteri grubuna toplu mesaj (borçlulara hatırlatma).",
        ozellikler: [
          "Müşteri filtreleme",
          "Gönderim önizleme",
          "İlerleme takibi",
        ],
      },
      {
        id: "zamanli",
        ad: "Zamanlanmış Mesajlar",
        ikon: Clock,
        rota: "/whatsapp/zamanli",
        placeholder: true,
        faz: "sonrasi",
        aciklama: "İleri tarihli gönderim planı (bayram 1 hafta önce).",
        ozellikler: [
          "Tek/tekrarlayan plan",
          "Müşteri segmenti seçimi",
          "Gönderim raporu",
        ],
      },
      {
        id: "gecmis",
        ad: "Gönderim Geçmişi",
        ikon: History,
        rota: "/whatsapp/gecmis",
        placeholder: true,
        faz: "bayram",
        aciklama: "Tüm gönderim logu, teslim/okundu durumu.",
        ozellikler: [
          "Filtrele (kanal, durum, tarih)",
          "Excel'e aktar",
          "Yeniden gönder",
        ],
      },
      {
        id: "sms",
        ad: "SMS Yönetimi",
        ikon: Smartphone,
        rota: "/whatsapp/sms",
        placeholder: true,
        faz: "sonrasi",
        aciklama: "SMS gönderim, kredi takibi, başarı oranı.",
        ozellikler: [
          "Netgsm/Vatansms entegrasyonu",
          "Kredi bakiyesi",
          "İYS uyumlu",
        ],
      },
      {
        id: "email",
        ad: "E-mail Yönetimi",
        ikon: Mail,
        rota: "/whatsapp/email",
        placeholder: true,
        faz: "sonrasi",
        aciklama: "E-mail kampanya, otomatik dekont gönderimi.",
        ozellikler: [
          "Resend/SMTP entegrasyonu",
          "Dekont otomatik mail",
          "HTML şablon",
        ],
      },
      {
        id: "arama",
        ad: "Arama Logu",
        ikon: Phone,
        rota: "/whatsapp/arama",
        placeholder: true,
        faz: "sonrasi",
        aciklama: "Müşteri görüşme kayıtları, notlar, sonraki adımlar.",
        ozellikler: [
          "Çağrı not formu",
          "Sonraki adım atama",
          "Müşteri detayında görünüm",
        ],
      },
      {
        id: "otomatik",
        ad: "Otomatik Hatırlatma",
        ikon: Bot,
        rota: "/whatsapp/otomatik",
        placeholder: true,
        faz: "sonrasi",
        aciklama: "Borçluya 7/3 gün kala otomatik mesaj, kampanya otomasyonu.",
        ozellikler: [
          "Tetikleyici tanımlama (X gün kala)",
          "Şablon seçimi",
          "İlerleme/sonuç raporu",
        ],
      },
      {
        id: "entegrasyon-ayar",
        ad: "Entegrasyon Ayarları",
        ikon: Plug,
        rota: "/whatsapp/entegrasyon",
        placeholder: true,
        faz: "sonrasi",
        aciklama: "API anahtarları, webhook'lar, sağlayıcı seçimi.",
        ozellikler: [
          "WhatsApp Business API kurulumu",
          "Webhook test",
          "Sağlayıcı değiştirme",
        ],
      },
    ],
  },

  // 9) RAPORLAR & ANALİZ — 10 alt
  {
    id: "raporlar",
    ad: "Raporlar & Analiz",
    ikon: BarChart,
    izin: "raporlar.goruntule",
    kisayol: "Ctrl+Shift+R",
    altMenuler: [
      {
        id: "rapor-merkezi",
        ad: "Rapor Merkezi",
        ikon: BarChart,
        rota: "/raporlar",
        izin: "raporlar.goruntule",
      },
      {
        id: "musteri-analiz",
        ad: "Müşteri Analizi",
        ikon: Users,
        rota: "/raporlar/musteri",
        izin: "raporlar.goruntule",
      },
      {
        id: "kurban-analiz",
        ad: "Kurban Analizi",
        ikon: Beef,
        rota: "/raporlar/kurban",
        izin: "raporlar.goruntule",
      },
      {
        id: "finansal",
        ad: "Finansal Raporlar",
        ikon: PieChart,
        rota: "/raporlar/tahsilat",
        izin: "raporlar.goruntule",
      },
      {
        id: "borc-raporu",
        ad: "Borç Raporu",
        ikon: AlertCircle,
        rota: "/raporlar/borc",
        izin: "raporlar.goruntule",
      },
      {
        id: "operasyon-rapor",
        ad: "Operasyon Raporu",
        ikon: Activity,
        rota: "/raporlar/operasyon",
        placeholder: true,
        faz: "sonrasi",
        izin: "raporlar.goruntule",
        aciklama: "Kesim verimliliği, aşama bazlı süre, kapasite analizi.",
        ozellikler: [
          "Saatlik kesim grafiği",
          "Personel performansı",
          "Pad doluluk %",
        ],
      },
      {
        id: "donemsel",
        ad: "Dönemsel Karşılaştırma",
        ikon: CalendarRange,
        rota: "/raporlar/donemsel",
        placeholder: true,
        faz: "sonrasi",
        izin: "raporlar.goruntule",
        aciklama: "Bu yıl vs geçen yıl, ay/hafta bazlı karşılaştırma.",
        ozellikler: [
          "Yıllar arası karşılaştırma",
          "Büyüme % hesaplama",
          "Trend grafikleri",
        ],
      },
      {
        id: "karlilik-roi",
        ad: "Karlılık & ROI",
        ikon: Award,
        rota: "/raporlar/roi",
        placeholder: true,
        faz: "sonrasi",
        izin: "raporlar.goruntule",
        aciklama: "Yatırım geri dönüş, hisse başı kâr marjı (Folio3 esinli).",
        ozellikler: [
          "ROI hesaplama",
          "Hayvan başı kâr",
          "Maliyet kalemleri detay",
        ],
      },
      {
        id: "ai-tahmin",
        ad: "AI Tahminler",
        ikon: Brain,
        rota: "/raporlar/ai",
        placeholder: true,
        faz: "gelecek",
        izin: "raporlar.goruntule",
        aciklama: "Sezon tahminleri, talep öngörüsü (predictive analytics).",
        ozellikler: [
          "Gelecek sezon hisse tahmini",
          "Borçluluk risk skoru",
          "Fiyat optimizasyonu önerisi",
        ],
      },
      {
        id: "ozel-rapor",
        ad: "Özel Rapor Oluştur",
        ikon: FilePlus,
        rota: "/raporlar/ozel",
        placeholder: true,
        faz: "sonrasi",
        izin: "raporlar.excel",
        aciklama: "Sütunları siz seçin, filtreleri ayarlayın, Excel/PDF olarak indirin.",
        ozellikler: [
          "Sütun seçici",
          "Filtre builder",
          "PDF/Excel export",
        ],
      },
    ],
  },

  // 10) PERSONEL & EKİP — 10 alt (Faz 2 için altyapı)
  {
    id: "personel",
    ad: "Personel & Ekip",
    ikon: UserCog,
    izin: "ayarlar.degistir",
    altMenuler: [
      {
        id: "personel-liste",
        ad: "Personel Listesi",
        ikon: List,
        rota: "/personel",
        placeholder: true,
        faz: "sonrasi",
        aciklama: "Tüm personel kayıtları, rol/şube/durum görünümü.",
        ozellikler: [
          "Detaylı filtreleme",
          "Personel kartı",
          "Toplu işlem",
        ],
      },
      {
        id: "personel-yeni",
        ad: "Yeni Personel",
        ikon: UserPlus,
        rota: "/personel/yeni",
        placeholder: true,
        faz: "sonrasi",
        aciklama: "Yeni personel kaydı, rol atama, şube ilişkilendirme.",
        ozellikler: [
          "Hızlı form",
          "SGK bilgi entegrasyonu",
          "Otomatik kullanıcı hesabı",
        ],
      },
      {
        id: "vardiya",
        ad: "Vardiya & Görev",
        ikon: Calendar,
        rota: "/personel/vardiya",
        placeholder: true,
        faz: "sonrasi",
        aciklama: "Vardiya planlama, görev atama, çakışma uyarısı.",
        ozellikler: [
          "Drag-drop vardiya editörü",
          "İzin yönetimi",
          "Çakışma uyarısı",
        ],
      },
      {
        id: "sohbet",
        ad: "Ekip Sohbeti",
        ikon: MessageSquare,
        rota: "/personel/sohbet",
        placeholder: true,
        faz: "gelecek",
        aciklama: "Slack tarzı yazılı sohbet, kanal/DM, dosya paylaşımı.",
        ozellikler: [
          "Kanal sistemi",
          "DM",
          "Dosya/foto paylaşım",
          "Bildirimler",
        ],
      },
      {
        id: "sesli",
        ad: "Sesli Mesajlaşma",
        ikon: Headphones,
        rota: "/personel/sesli",
        placeholder: true,
        faz: "gelecek",
        aciklama: "Walkie-talkie tarzı anlık sesli iletişim (saha için).",
        ozellikler: [
          "Push-to-talk",
          "Kanal seçimi",
          "Mobil destek",
        ],
      },
      {
        id: "konum-takip",
        ad: "Konum Takibi",
        ikon: MapPin,
        rota: "/personel/konum",
        placeholder: true,
        faz: "gelecek",
        aciklama: "Saha personeli anlık konum (mobil uygulama gerekir).",
        ozellikler: [
          "Canlı harita",
          "Geçmiş rota",
          "Geofence",
        ],
      },
      {
        id: "performans",
        ad: "Performans Raporu",
        ikon: TrendingUp,
        rota: "/personel/performans",
        placeholder: true,
        faz: "sonrasi",
        aciklama: "Personel başı tahsilat, müşteri sayısı, başarı oranı.",
        ozellikler: [
          "Liderlik tablosu",
          "Aylık karşılaştırma",
          "Prim hesaplama",
        ],
      },
      {
        id: "personel-odemeler",
        ad: "Personel Ödemeleri",
        ikon: Banknote,
        rota: "/personel/odemeler",
        placeholder: true,
        faz: "sonrasi",
        aciklama: "Maaş, prim, avans, masraf takibi.",
        ozellikler: [
          "Maaş bordrosu",
          "Prim hesaplama",
          "Avans takibi",
        ],
      },
      {
        id: "yetki-yonetimi",
        ad: "Yetki Yönetimi",
        ikon: ShieldCheck,
        rota: "/ayarlar/kullanicilar",
        izin: "ayarlar.degistir",
      },
      {
        id: "aktivite-log",
        ad: "Aktivite Logu",
        ikon: ScrollTextIcon,
        rota: "/personel/aktivite",
        placeholder: true,
        faz: "sonrasi",
        izin: "ayarlar.degistir",
        aciklama: "Sistem kullanım logu — kim, ne zaman, ne yaptı.",
        ozellikler: [
          "Tarih/kullanıcı filtresi",
          "Audit log entegrasyonu",
          "Excel'e aktar",
        ],
      },
    ],
  },

  // 11) AYARLAR & SİSTEM — 10 alt
  // (TV Ekranı menüsü 4. sıraya "Kesim Takip Ekranı" altına taşındı)
  {
    id: "ayarlar",
    ad: "Ayarlar & Sistem",
    ikon: Plug,
    izin: "ayarlar.degistir",
    altMenuler: [
      {
        id: "profil",
        ad: "Profil Ayarları",
        ikon: UserCircle,
        rota: "/ayarlar/profil",
        placeholder: true,
        faz: "sonrasi",
        aciklama: "Kendi profil bilgileriniz, şifre, bildirim tercihleri.",
        ozellikler: [
          "Şifre değiştirme",
          "Bildirim tercihleri",
          "Tema seçimi",
        ],
      },
      {
        id: "sirket",
        ad: "Şirket Bilgileri",
        ikon: Building2,
        rota: "/ayarlar",
        izin: "ayarlar.degistir",
      },
      {
        id: "sube",
        ad: "Şube Yönetimi",
        ikon: Store,
        rota: "/ayarlar/sube",
        placeholder: true,
        faz: "gelecek",
        izin: "ayarlar.degistir",
        aciklama: "Çoklu şube yönetimi (SaaS için).",
        ozellikler: [
          "Şube ekleme",
          "Şube bazlı raporlama",
          "Çapraz şube transfer",
        ],
      },
      {
        id: "kullanici",
        ad: "Kullanıcı Yönetimi",
        ikon: Users,
        rota: "/ayarlar/kullanicilar",
        izin: "ayarlar.degistir",
      },
      {
        id: "roller",
        ad: "Roller & İzinler",
        ikon: ShieldCheck,
        rota: "/ayarlar/roller",
        placeholder: true,
        faz: "sonrasi",
        izin: "ayarlar.degistir",
        aciklama: "Özel rol oluşturma, izin matrisi düzenleme.",
        ozellikler: [
          "Rol şablonları",
          "İzin matrisi görsel",
          "Toplu rol değiştirme",
        ],
      },
      {
        id: "tema",
        ad: "Tema & Görünüm",
        ikon: Palette,
        rota: "/ayarlar/tema",
        placeholder: true,
        faz: "sonrasi",
        izin: "ayarlar.degistir",
        aciklama: "Tema rengi, logo, font seçimi (white-label).",
        ozellikler: [
          "Renk paleti",
          "Logo yükleme",
          "Font seçimi",
        ],
      },
      {
        id: "yedek",
        ad: "Yedekleme & Geri Yükleme",
        ikon: Database,
        rota: "/ayarlar/yedekleme",
        izin: "ayarlar.degistir",
      },
      {
        id: "entegrasyon",
        ad: "Entegrasyonlar",
        ikon: Cable,
        rota: "/ayarlar/entegrasyon",
        placeholder: true,
        faz: "sonrasi",
        izin: "ayarlar.degistir",
        aciklama: "Üçüncü taraf servisler (POS, banka, muhasebe).",
        ozellikler: [
          "Servis kataloğu",
          "API anahtar yönetimi",
          "Webhook test",
        ],
      },
      {
        id: "multi-tenant",
        ad: "Multi-tenant (SaaS)",
        ikon: Globe,
        rota: "/ayarlar/saas",
        placeholder: true,
        faz: "gelecek",
        izin: "ayarlar.degistir",
        aciklama: "TilbeCore SaaS — birden çok çiftlik tek panelde (Faz 2).",
        ozellikler: [
          "Tenant yönetimi",
          "Fatura/abonelik",
          "Tenant izolasyon",
        ],
      },
      {
        id: "sistem-durum",
        ad: "Sistem Durumu",
        ikon: Cpu,
        rota: "/ayarlar/sistem",
        izin: "ayarlar.degistir",
      },
    ],
  },
];

/**
 * Verilen rolün izinlerine göre menüyü filtreler.
 * Her ana menüde alt menüler de filtrelenir.
 */
export function gorunecekMenuler(
  oturum: { rol: string } | null | undefined,
  izinKontrol: (
    oturum: { rol: string } | null | undefined,
    izin: IzinAnahtari,
  ) => boolean,
): SidebarAnaMenu[] {
  if (!oturum) return [];

  return sidebarMenuleri
    .filter((menu) => !menu.izin || izinKontrol(oturum, menu.izin))
    .map((menu) => {
      if (!menu.altMenuler) return menu;
      const filtreliAlt = menu.altMenuler.filter(
        (alt) => !alt.izin || izinKontrol(oturum, alt.izin),
      );
      return { ...menu, altMenuler: filtreliAlt };
    })
    .filter((menu) => !menu.altMenuler || menu.altMenuler.length > 0);
}

/**
 * Verilen yol hangi ana menüye ait? localStorage'tan
 * "son açık menü" hatırlama ve otomatik akordeon için.
 */
export function aktifAnaMenuId(
  pathname: string,
  menuler: SidebarAnaMenu[] = sidebarMenuleri,
): string | null {
  for (const menu of menuler) {
    if (menu.rota === pathname) return menu.id;
    if (
      menu.altMenuler?.some(
        (alt) => alt.rota === pathname || pathname.startsWith(alt.rota + "/"),
      )
    ) {
      return menu.id;
    }
  }
  return null;
}

/**
 * Bir alt menünün tam objesini bul (placeholder sayfaları için).
 */
export function altMenuyuBul(
  rota: string,
  menuler: SidebarAnaMenu[] = sidebarMenuleri,
): SidebarAltMenu | null {
  for (const menu of menuler) {
    if (!menu.altMenuler) continue;
    const bulunan = menu.altMenuler.find((alt) => alt.rota === rota);
    if (bulunan) return bulunan;
  }
  return null;
}
