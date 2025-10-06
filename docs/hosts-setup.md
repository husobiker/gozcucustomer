# Hosts Dosyası Ayarları

SaaS modelini test etmek için hosts dosyasına şu satırları ekleyin:

## Windows (C:\Windows\System32\drivers\etc\hosts)

```
127.0.0.1 localhost
127.0.0.1 admin.localhost
127.0.0.1 abcguvenlik.localhost
127.0.0.1 xyzguvenlik.localhost
```

## macOS/Linux (/etc/hosts)

```
127.0.0.1 localhost
127.0.0.1 admin.localhost
127.0.0.1 abcguvenlik.localhost
127.0.0.1 xyzguvenlik.localhost
```

## Test URL'leri

1. **Süper Admin Paneli**: http://admin.localhost:3000
2. **ABC Güvenlik**: http://abcguvenlik.localhost:3000
3. **XYZ Güvenlik**: http://xyzguvenlik.localhost:3000

## URL Formatı

- **Süper Admin**: `admin.localhost` → Senin yönetim panelin
- **Müşteriler**: `{subdomain}.localhost` → Müşteri panelleri
  - `abcguvenlik.localhost` → ABC Güvenlik'in paneli
  - `xyzguvenlik.localhost` → XYZ Güvenlik'in paneli

## Not

- Development için localhost subdomain'leri kullanıyoruz
- Production'da subdomain.safebase.com formatı olacak
- Her URL farklı müşteri deneyimi sunacak
- Müşteri kendi logosunu ve renklerini koyabilir
