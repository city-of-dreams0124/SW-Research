# React state management benchmark

Redux Toolkit, Context API va Zustand'ni bir xil ro'yxat ustida taqqoslaydigan benchmark.
Maqola: *An Empirical Comparison of Redux Toolkit, Context API, and Zustand: Re-render Behavior and Performance in Large Lists*

## 1. Ishga tushirish (VS Code terminalida)

```bash
npm install
npm run build
npm run preview
```

Brauzerda (Chrome tavsiya etiladi) `http://localhost:4173` ni oching.

**Muhim:** `npm run dev` bilan EMAS, aynan production build (`build` + `preview`) bilan o'lchang.
Development rejimida React qo'shimcha tekshiruvlar qiladi va natijalar noto'g'ri bo'ladi.

## 2. O'lchashdan oldin (nazorat o'zgaruvchilari)

- Noutbukni quvvatga ulang, quvvat tejash rejimini o'chiring
- Brauzer kengaytmalarini o'chiring (yoki Incognito oynada oching), DevTools'ni yoping
- Boshqa og'ir dasturlarni yoping
- O'lchash vaqtida tabni oldingi planda saqlang (fon tabda brauzer taymerlarni sekinlashtiradi)
- Xotirani aniqroq o'lchash uchun Chrome'ni `--enable-precise-memory-info` flag bilan ishga tushiring (ixtiyoriy)
- Avval **Quick test** bilan sinab ko'ring, keyin **Full run**
- Full run'ni kamida 3 marta (har safar Chrome'ni qayta ochib) o'tkazing va natijalarni solishtiring

## 3. Nima o'lchanadi

**Omillar (mustaqil o'zgaruvchilar):**

| Omil | Qiymatlar |
|---|---|
| `solution` | Redux Toolkit, Context API, Zustand |
| `listSize` | 1 000, 10 000, 50 000 |
| `scenario` | `mount` (birinchi render), `update` (o'rtadagi bitta elementni o'zgartirish), `add` (yangi element qo'shish) |
| `optimization` | `baseline`, `optimized` |

**Baseline:** ro'yxat komponenti butun state'ga obuna bo'ladi, qatorlar memoizatsiya qilinmagan.
**Optimized:**
- Redux Toolkit va Zustand: har bir qator o'z elementiga `id` bo'yicha selector orqali obuna bo'ladi + `React.memo`
- Context API: faqat `React.memo` (Context'da selector orqali bo'lakka obuna bo'lib bo'lmaydi)

**Bog'liq o'zgaruvchilar (CSV ustunlari):**

| Ustun | Ma'nosi |
|---|---|
| `renderMs` | React render + commit (DOM o'zgarishi) vaqti, ms |
| `layoutMs` | Commit'dan keyin majburiy style/layout hisoblash vaqti, ms |
| `itemRenders` | Shu amal davomida `ItemRow` necha marta render bo'ldi (re-render soni) |
| `listRenders` | Ro'yxat komponenti necha marta render bo'ldi |
| `heapMB` | JS heap hajmi (Chrome'da, taxminiy) |
| `warmup` | 1 bo'lsa, isitish urinishi: **tahlildan chiqarib tashlang** |
| `run` | Urinish raqami |

## 4. Dizayn qarorlari (Methodology bo'limi uchun)

- Uchala yechimda ma'lumot bir xil: normalizatsiya qilingan state (`ids` + `byId`/`entities`), bir xil `ItemRow` komponenti
- Vaqt `flushSync` ichida `performance.now()` bilan o'lchanadi, shuning uchun render sinxron va deterministik
- Re-render soni `ItemRow` ichidagi hisoblagich bilan sanaladi (StrictMode ishlatilmagan)
- Har bir konfiguratsiya uchun 5 ta warm-up + 30 ta o'lchov urinishi
- Konfiguratsiyalar tartibi tasodifiy aralashtiriladi (JIT va GC tartib ta'sirini kamaytirish uchun)
- `update` va `add` stsenariylarida har bir o'lchovdan oldin state asl holatiga qaytariladi (bu qism o'lchanmaydi)
- Redux Toolkit'ning dev-only middleware'lari (`immutableCheck`, `serializableCheck`) o'chirilgan

## 5. SPSS 27'ga import qilish

1. **File → Import Data → CSV Data** (yoki **Read Text Data**)
2. Decimal belgisini **Period (.)** qilib tanlang (nemis/o'zbek regional sozlamalarida vergul chiqishi mumkin)
3. **Variable View**'da: `solution`, `scenario`, `optimization` = Nominal; `listSize` = Ordinal/Nominal; qolganlari Scale
4. **Data → Select Cases → If condition `warmup = 0`**
5. Tahlilni **Data → Split File** (scenario va listSize bo'yicha) yoki **Univariate GLM** orqali bajaring
6. Har bir tahlilda **Paste** tugmasi bilan `.sps` syntax saqlang

## 6. Cheklovlar (Threats to validity uchun)

- Sintetik ilova real ilovani to'liq aks ettirmaydi
- Faqat bitta qurilma va brauzer (Chrome) ishlatilgan bo'lsa, natijalar umumlashtirilmaydi
- `renderMs` foydalanuvchi sezadigan tezlikni (paint, INP) to'liq ifodalamaydi
- `performance.memory` taxminiy

## 7. Kengaytirish g'oyalari

- Filtrlash stsenariysi (`filter`) qo'shish
- Context API uchun bo'lingan context'lar (split contexts) varianti
- Zustand uchun `useShallow` va Redux uchun `createSelector` variantlari
- Boshqa brauzerlar (Firefox) va React Profiler bilan solishtirish
