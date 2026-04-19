export default {
  // Common
  common: {
    save: "Kaydet",
    cancel: "İptal",
    delete: "Sil",
    edit: "Düzenle",
    close: "Kapat",
    back: "Geri",
    search: "Ara...",
    none: "Yok",
    error: "Hata",
    continue: "Devam et",
    or: "veya",
  },

  // Tabs
  tabs: {
    home: "Anasayfa",
    collections: "Koleksiyonlar",
    search: "Ara",
    profile: "Profil",
  },

  // Home
  home: {
    title: "Anasayfa",
    emptyTitle: "Henüz içerik yok",
    emptyDesc: "Bir uygulamadan paylaş veya + butonuna dokun",
  },

  // Search
  search: {
    placeholder: "Ara...",
    noResults: "Sonuç bulunamadı",
    emptyTitle: "Bir şey ara",
    emptySubtitle: "Kaydettiğin içeriklerde arama yap",
  },

  // Collections
  collections: {
    title: "Koleksiyonlar",
    emptyTitle: "Koleksiyon yok",
    emptyDesc: "İçeriklerini düzenlemek için koleksiyon oluştur",
    itemCount: "{{count}} içerik",
    empty: "Bu koleksiyonda henüz içerik yok",
    fallbackTitle: "Koleksiyon",
    newCollection: "Yeni Koleksiyon",
    editCollection: "Koleksiyonu Düzenle",
    deleteCollection: "Koleksiyonu Sil",
    deleteConfirm: "Bu koleksiyonu silmek istediğine emin misin? İçerikler silinmez.",
    name: "İsim",
    namePlaceholder: "Koleksiyon adı",
    icon: "İkon",
    bgColor: "Arka Plan Rengi",
    tapToChange: "Değiştirmek için dokun",
    searchPlaceholder: "Koleksiyon ara...",
    selectEmoji: "Emoji Seç",
    selectColor: "Renk Seç",
    create: "Oluştur",
    giveName: "Koleksiyonuna isim ver..",
    limitReached: "Koleksiyon Limiti",
    limitReachedDesc: "Ücretsiz planda en fazla 3 koleksiyon oluşturabilirsin. Daha fazlası için Premium'a geç.",
  },

  // Profile
  profile: {
    user: "Kullanıcı",
    savedContent: "Kayıt edilen içerik",
    collection: "Koleksiyon",
    theme: "Tema",
    darkMode: "Karanlık Mod",
    language: "Dil",
    goPremium: "Premium'a Geç",
    accountSettings: "Hesap Ayarları",
    privacyPolicy: "Gizlilik Politikası",
    termsOfService: "Kullanım Koşulları",
    logout: "Çıkış Yap",
    changePhoto: "Fotoğraf Değiştir",
  },

  // Account Settings
  accountSettings: {
    title: "Hesap Ayarları",
    fullName: "Ad, Soyad",
    email: "Eposta",
    password: "Şifre",
    logoutConfirm: "Hesabından çıkmak istediğine emin misin?",
    deleteAccount: "Hesabı Sil",
  },

  // Item Detail (Bottom Sheet)
  itemDetail: {
    watch: "İzle",
    open: "Aç",
    share: "Paylaş",
    deleteItem: "İçeriği Sil",
    deleteConfirm: "Bu içeriği silmek istediğine emin misin?",
    addTitle: "Başlık ekle",
    showMore: "daha fazla göster",
  },

  // Save Item Form
  saveForm: {
    title: "Yeni içerik",
    link: "Link",
    linkPlaceholder: "https://...",
    itemTitle: "Başlık",
    titlePlaceholder: "Bir başlık ekle (isteğe bağlı)",
    collection: "Koleksiyon",
  },

  // Auth
  auth: {
    loginTitle: "Giriş Yap",
    registerTitle: "Hesap Oluştur",
    registerSubtitle: "Kütüphaneni oluşturmak için bir hesap aç.",
    loginSubtitle: "E-posta ve şifrenle devam et.",
    registerFormSubtitle: "Hesap oluşturmak için bilgilerini gir.",
    welcomeMessage: "Dijital dünyanı yönetmeye ve her şeye tek noktadan erişmeye hazır mısın?",
    continueWithGoogle: "Google ile devam et",
    continueWithApple: "Apple ile devam et",
    continueWithEmail: "E-posta ile devam et",
    fullName: "Ad Soyad",
    fullNamePlaceholder: "Adın Soyadın",
    fullNameRequired: "Ad soyad gerekli",
    fullNameMin: "En az 2 karakter olmalı",
    email: "E-Posta",
    emailPlaceholder: "ornek@email.com",
    emailRequired: "E-posta gerekli",
    emailInvalid: "Geçerli bir e-posta girin",
    password: "Şifre",
    passwordPlaceholder: "En az 6 karakter",
    passwordRequired: "Şifre gerekli",
    passwordMin: "Şifre en az 6 karakter olmalı",
    register: "Kayıt Ol",
    login: "Giriş Yap",
    alreadyHaveAccount: "Zaten hesabın var mı?",
    noAccount: "Hesabın yok mu?",
    loginFailed: "Giriş Başarısız",
    loginFailedMessage: "E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.",
    emailAlreadyRegistered: "Bu e-posta kayıtlı",
    emailAlreadyRegisteredMessage: "Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.",
    genericError: "Bir hata oluştu.",
    loginError: "Giriş yapılamadı.",
    // OTP
    verifyEmail: "E-postanı Doğrula",
    verifyEmailDesc: "{{email}} adresine 6 haneli bir kod gönderdik.",
    enterCode: "Kodu gir",
    verify: "Doğrula",
    resendCode: "Kodu tekrar gönder",
    resendIn: "{{seconds}} sn sonra tekrar gönder",
    invalidCode: "Geçersiz Kod",
    invalidCodeMessage: "Girdiğin kod hatalı. Lütfen tekrar dene.",
    codeSent: "Kod gönderildi",
    codeSentMessage: "Yeni doğrulama kodu e-postana gönderildi.",
    // Forgot password
    forgotPassword: "Şifremi Unuttum",
    forgotPasswordDesc: "E-posta adresini gir, şifre sıfırlama kodu gönderelim.",
    sendResetCode: "Sıfırlama Kodu Gönder",
    // Reset password
    resetPassword: "Şifre Sıfırla",
    resetPasswordDesc: "{{email}} adresine gönderilen kodu gir.",
    newPassword: "Yeni Şifre",
    newPasswordPlaceholder: "En az 6 karakter",
    confirmPassword: "Şifre Tekrar",
    confirmPasswordPlaceholder: "Şifreyi tekrar gir",
    passwordsDoNotMatch: "Şifreler eşleşmiyor",
    resetSuccess: "Şifre Güncellendi",
    resetSuccessMessage: "Şifren başarıyla güncellendi. Giriş yapabilirsin.",
    resetFailed: "Sıfırlama Başarısız",
    resetFailedMessage: "Kod hatalı veya süresi dolmuş. Lütfen tekrar dene.",
  },

  // Onboarding
  onboarding: {
    page1Title: "Dağınıklığa Son Ver",
    page1Desc: "Sosyal mecralarda kaybolan tüm o gönderileri, videoları ve yazıları Savely ile tek bir güvenli noktada birleştirin.",
    page2Title: "Dijital Arşivini Oluştur",
    page2Desc: "Favori içeriklerinizi kendi zevkinize göre kategorize edin. Karmaşayı bırakın ve size özel kütüphanenin tadını çıkarın.",
    page3Title: "Aradığını Hemen Bul",
    page3Desc: "'Nereye kaydetmiştim?' diye düşünmeyi bırakın. Gelişmiş arama ile binlerce içerik arasından istediğinize anında ulaşın.",
    page4Title: "Kontrol Sende Olsun",
    page4Desc: "Dijital dünyanı yönetmeye ve her şeye tek noktadan erişmeye hazırsan, kütüphaneni oluşturmaya hemen başla.",
    letsStart: "Hadi başlayalım!",
    collectionsTitle: "İlgi Alanlarını Seç",
    collectionsDesc: "Sana özel koleksiyonlar oluşturalım. En az 3 tane seç.",
    collectionsSelected: "{{count}}/3 seçildi",
    collectionsMin: "En az 3 koleksiyon seç",
  },

  // Premium
  premium: {
    currentPlan: "Geçerli Plan",
    features: "Premium Özellikleri",
    managePlan: "Plan Yönet",
    goPremium: "Premium'a Geç",
    autoRenew: "Abonelik otomatik olarak yenilenir. İstediğiniz zaman iptal edebilirsiniz.",
    choosePlan: "Planınızı seçin",
    yearly: "Yıllık",
    monthly: "Aylık",
    freeDesc: "Dijital düzeninizi temel düzeyde oluşturun. Kütüphanenizi ücretsiz olarak oluşturun.",
    proDesc: "Kütüphanenizdeki tüm sınırları kaldırın. Binlerce içeriği kolayca gruplandırın.",
    alreadyPremium: "Zaten Premium'sun",
    upgradeToPremium: "Premiuma Geç",
    moreEconomical: "Daha ekonomik",
    flexiblePricing: "Esnek fiyatlandırma",
    perYear: "yıl",
    perMonth: "ay",
  },

  // Notifications
  notifications: {
    title: "Bildirim Ayarları",
    enabled: "Bildirimler",
    frequency: "Bildirim Sıklığı",
    frequencyLow: "Az (haftada en fazla 2)",
    frequencyNormal: "Normal (günde en fazla 1)",
    frequencyHigh: "Sık (günde en fazla 2)",
    categoryNotifications: "Koleksiyon Bildirimleri",
    pauseNotifications: "Bildirimleri Duraklat",
    pause1Day: "1 gün",
    pause3Days: "3 gün",
    pause1Week: "1 hafta",
    pauseActive: "{{date}} tarihine kadar duraklatıldı",
    resume: "Devam Ettir",
  },

  // Emoji Picker
  emojiPicker: {
    search: "Emoji ara...",
    food: "Yemek",
    movies: "Filmler",
    books: "Kitaplar",
    shopping: "Alışveriş",
    travel: "Seyahat",
    sports: "Spor",
    music: "Müzik",
    health: "Sağlık",
    other: "Diğer",
  },

  // Splash
  splash: {
    motto: "Save it. Find it. Keep it.",
  },
} as const;
