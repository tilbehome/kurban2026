# Çoklu Ajan, Worktree ve Devir Protokolü

```yaml
id: GOV-015
status: PLANNED
owner: Engineering
source_role: multi_agent_worktree_integration_handoff_protocol
source_of_truth: true
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
```

## Sınırlar

- Her ajan yalnız kendisine atanmış worktree, dal ve dosya kapsamında çalışır.
- Başlangıçta dal, HEAD, upstream farkı ve çalışma ağacı kaydedilir; uyumsuzlukta yazma yapılmaz.
- Aynı dosyanın eşzamanlı yazma sahipliği verilmez. Salt-okunur analiz ajanı commit, dosya veya dış sistem değiştirmez.
- Reset, force-push, history rewrite, başka worktree temizliği ve kullanıcı değişikliğini ezme yasaktır.
- Dizin taşıma ile davranış değişikliği, doküman kararı ile runtime değişikliği ayrı teslim paketleridir.

## Devir paketi

Her ajan; başlangıç/son HEAD, değişen veya incelenen dosyalar, REQ/issue kapsamı, varsayım/açık karar, test komutu ve sonucu, atlanan test, risk, önerilen entegrasyon sırası ile conflict ihtimalini raporlar. Satır kanıtı olmayan “tamamlandı” beyanı kabul edilmez.

## Entegrasyon

Birincil entegrasyon sahibi raporları gerçek dosya ve değişmez commit ile yeniden doğrular. Çakışan öneriler [GOV-003](GOV-003-KAYNAK-ONCELIGI-VE-KANIT-STANDARDI.md) uyarınca çözülür; kod mevcut hedef kararı sessizce değiştirmez. Entegrasyon sonrası kapsam testleri ve doküman envanteri birincil worktree’de yeniden çalıştırılır. Push/merge yalnız açık yetkiyle yapılır.

GitHub branch/ruleset ve Project ayarları [GOV-013](GOV-013-TESLIM-IZLENEBILIRLIK-VE-GITHUB-HEDEFI.md) içinde `PLANNED` hedeftir; bu protokol bunların etkin olduğunu iddia etmez.
