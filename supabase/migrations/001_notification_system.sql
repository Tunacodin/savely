-- =============================================
-- Savely Push Notification System
-- =============================================

-- 1. Push Tokens
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  device_id TEXT,
  platform TEXT CHECK (platform IN ('ios', 'android')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, expo_push_token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON push_tokens(is_active) WHERE is_active = true;

-- 2. Default Categories
CREATE TABLE IF NOT EXISTS default_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  icon TEXT,
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_default_categories_active ON default_categories(is_active) WHERE is_active = true;

-- 3. Notification Templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_slug TEXT REFERENCES default_categories(slug) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  time_slot TEXT CHECK (time_slot IN ('morning', 'afternoon', 'evening', 'any')) DEFAULT 'any',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_templates_category ON notification_templates(category_slug);
CREATE INDEX IF NOT EXISTS idx_templates_slot ON notification_templates(time_slot);

-- 4. Notification Log
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES notification_templates(id) ON DELETE SET NULL,
  category_slug TEXT,
  collection_id UUID,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  expo_ticket_id TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'clicked')),
  sent_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_log_user ON notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_user_recent ON notification_log(user_id, sent_at DESC);

-- 5. Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  frequency TEXT DEFAULT 'normal' CHECK (frequency IN ('low', 'normal', 'high')),
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  timezone TEXT DEFAULT 'Europe/Istanbul',
  paused_until TIMESTAMPTZ,
  category_opt_outs TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- RLS Policies
-- =============================================

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tokens" ON push_tokens FOR ALL USING (auth.uid() = user_id);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own prefs" ON notification_preferences FOR ALL USING (auth.uid() = user_id);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own logs" ON notification_log FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE default_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read categories" ON default_categories FOR SELECT TO authenticated USING (true);

ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read templates" ON notification_templates FOR SELECT TO authenticated USING (true);

-- =============================================
-- Helper Function: Get Eligible Users
-- =============================================

CREATE OR REPLACE FUNCTION get_eligible_notification_users(min_hours_since_last INT DEFAULT 8)
RETURNS TABLE (
  user_id UUID,
  expo_push_token TEXT,
  timezone TEXT,
  frequency TEXT,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  display_name TEXT,
  category_opt_outs TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pt.user_id,
    pt.expo_push_token,
    COALESCE(np.timezone, 'Europe/Istanbul'),
    COALESCE(np.frequency, 'normal'),
    COALESCE(np.quiet_hours_start, '22:00'::TIME),
    COALESCE(np.quiet_hours_end, '08:00'::TIME),
    p.display_name,
    COALESCE(np.category_opt_outs, '{}')
  FROM push_tokens pt
  JOIN profiles p ON p.id = pt.user_id
  LEFT JOIN notification_preferences np ON np.user_id = pt.user_id
  WHERE pt.is_active = true
    AND COALESCE(np.enabled, true) = true
    AND COALESCE(np.paused_until, '1970-01-01'::TIMESTAMPTZ) < now()
    AND NOT EXISTS (
      SELECT 1 FROM notification_log nl
      WHERE nl.user_id = pt.user_id
        AND nl.sent_at > now() - (min_hours_since_last || ' hours')::INTERVAL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Seed: Default Categories
-- =============================================

INSERT INTO default_categories (slug, display_name, keywords, icon, priority) VALUES
  ('recipes', 'Tarifler', ARRAY['tarif','yemek','recipe','cooking','food','mutfak','cook','meal','kahvaltı','tatlı','dessert','dinner','lunch'], '🍳', 10),
  ('movies', 'Film & Dizi', ARRAY['film','dizi','movie','series','tv','netflix','izle','watch','sinema','anime','imdb'], '🎬', 10),
  ('design', 'Tasarım', ARRAY['tasarım','design','ui','ux','figma','grafik','graphic','logo','branding','behance','dribbble'], '✨', 8),
  ('realestate', 'Emlak', ARRAY['emlak','ev','daire','kiralık','satılık','house','apartment','sahibinden','airbnb','konut','villa'], '🏠', 9),
  ('cars', 'Araba', ARRAY['araba','car','araç','oto','otomobil','arabam','vehicle','motor','motorsiklet','bike'], '🚗', 9),
  ('fashion', 'Moda', ARRAY['moda','fashion','kıyafet','outfit','giyim','style','stil','elbise','ayakkabı','shoe','kombin'], '👗', 8),
  ('fitness', 'Fitness', ARRAY['fitness','spor','workout','egzersiz','antrenman','gym','koşu','run','yoga','diyet','diet','pilates'], '💪', 8),
  ('travel', 'Seyahat', ARRAY['seyahat','travel','gezi','trip','tatil','vacation','otel','hotel','uçuş','flight','tur','tour'], '✈️', 8),
  ('tech', 'Teknoloji', ARRAY['teknoloji','tech','kod','code','programlama','programming','tutorial','yazılım','software','ai','yapay zeka','dev'], '💻', 7),
  ('music', 'Müzik', ARRAY['müzik','music','şarkı','song','playlist','çalma listesi','spotify','albüm','album','konser','concert'], '🎵', 7),
  ('sports', 'Spor', ARRAY['futbol','football','basketbol','basketball','maç','match','takım','team','fifa','nba','voleybol','tenis','tennis'], '⚽', 8),
  ('study', 'Eğitim', ARRAY['eğitim','ders','study','ödev','sınav','exam','not','note','okul','school','üniversite','university','kurs','course'], '📚', 9),
  ('language', 'Dil Öğrenme', ARRAY['ingilizce','english','kelime','vocabulary','dil','language','öğren','learn','vocab','gramer','grammar','almanca','fransızca'], '🌍', 8),
  ('shopping', 'Alışveriş', ARRAY['alışveriş','shopping','wishlist','satın','buy','ürün','product','fiyat','price','indirim','sale','sepet'], '🛍️', 7),
  ('homedecor', 'Dekorasyon', ARRAY['dekorasyon','decor','ev dekor','home decor','interior','mobilya','furniture','dekor','iç mimari','ev tasarım'], '🏡', 7),
  ('books', 'Kitap', ARRAY['kitap','book','okuma','reading','roman','novel','yazar','author','kütüphane','library','pdf'], '📖', 7),
  ('podcasts', 'Podcast', ARRAY['podcast','bölüm','episode','dinle','listen','yayın','broadcast','radyo'], '🎧', 6),
  ('jobs', 'İş & Kariyer', ARRAY['iş','job','kariyer','career','mülakat','interview','cv','özgeçmiş','resume','maaş','salary','ilan'], '💼', 8),
  ('finance', 'Finans', ARRAY['finans','finance','yatırım','invest','borsa','stock','kripto','crypto','para','money','bütçe','budget','dolar','euro'], '📈', 7),
  ('gaming', 'Oyun', ARRAY['oyun','game','gaming','ps5','xbox','steam','twitch','gamer','espor','esport','nintendo'], '🎮', 7),
  ('art', 'Sanat', ARRAY['sanat','art','illüstrasyon','illustration','çizim','draw','resim','paint','heykel','sculpture','galeri'], '🎨', 6),
  ('photography', 'Fotoğraf', ARRAY['fotoğraf','photo','photography','kamera','camera','çekim','lens','portrait','landscape'], '📸', 6),
  ('diy', 'DIY & El İşi', ARRAY['diy','kendin yap','craft','el işi','handmade','proje','project','makrome','örgü','knitting'], '🔨', 6),
  ('pets', 'Evcil Hayvan', ARRAY['evcil','pet','kedi','cat','köpek','dog','hayvan','animal','mama','veteriner','papağan'], '🐾', 6),
  ('garden', 'Bahçe', ARRAY['bahçe','garden','bitki','plant','çiçek','flower','saksı','pot','tohum','seed','sera'], '🌱', 5),
  ('wedding', 'Düğün', ARRAY['düğün','wedding','gelin','bride','nişan','engagement','nikah','davet','invitation','gelinlik'], '💍', 7),
  ('parenting', 'Anne & Bebek', ARRAY['bebek','baby','anne','mom','çocuk','child','hamile','pregnant','emzir','doğum','birth','oyuncak'], '👶', 7)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- Seed: Notification Templates
-- =============================================

-- recipes
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('recipes', 'Savely', 'Bugün ne pişirsem? 🍳 {{collection_name}} koleksiyonundaki {{item_count}} tarife göz at!', 'morning'),
  ('recipes', 'Savely', 'Akşam yemeği için ilham lazım mı? {{collection_name}} koleksiyonun seni bekliyor 🍽️', 'afternoon'),
  ('recipes', 'Savely', 'Yarın denemek için güzel bir tarif seç! {{collection_name}} koleksiyonuna bak.', 'evening'),
  ('recipes', 'Savely', 'Kaydettiğin o tarifi hatırlıyor musun? {{collection_name}} koleksiyonuna bir bak!', 'any'),
  ('recipes', 'Savely', 'Yeni bir şey pişirmenin tam zamanı! {{collection_name}} koleksiyonuna göz at 👨‍🍳', 'any');

-- movies
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('movies', 'Savely', 'Bu akşam ne izlesem? 🎬 {{collection_name}} koleksiyonunda {{item_count}} içerik bekliyor.', 'evening'),
  ('movies', 'Savely', 'Film gecesi için hazır mısın? {{collection_name}} listenden birini seç! 🍿', 'evening'),
  ('movies', 'Savely', 'Hafta sonu ne izleyeceğini seçemedin mi? {{collection_name}} koleksiyonuna göz at.', 'afternoon'),
  ('movies', 'Savely', 'Kaydettiğin o diziyi hâlâ izlemedin mi? {{collection_name}} koleksiyonun doluyor!', 'any'),
  ('movies', 'Savely', 'İzleme listen büyüyor! {{collection_name}} koleksiyonunda {{item_count}} içerik var.', 'any');

-- design
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('design', 'Savely', 'Sabah ilhamı! ✨ {{collection_name}} koleksiyonundaki tasarımlara göz at.', 'morning'),
  ('design', 'Savely', 'Yaratıcılığını besle! {{collection_name}} koleksiyonunda {{item_count}} ilham kaynağı var.', 'any'),
  ('design', 'Savely', 'Kaydettiğin tasarımları tekrar incelemenin tam zamanı. {{collection_name}} koleksiyonuna bak!', 'any'),
  ('design', 'Savely', 'Yeni proje fikirleri mi arıyorsun? {{collection_name}} koleksiyonun ilhamla dolu 🎨', 'afternoon');

-- realestate
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('realestate', 'Savely', 'Hayalindeki evi buldun mu? 🏠 {{collection_name}} koleksiyonundaki {{item_count}} ilana göz at.', 'morning'),
  ('realestate', 'Savely', 'Kaydettiğin ilanlardan biri hâlâ müsait mi? {{collection_name}} koleksiyonunu kontrol et.', 'any'),
  ('realestate', 'Savely', 'Ev arayışın devam ediyor mu? {{collection_name}} koleksiyonunu tekrar gözden geçir.', 'any');

-- cars
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('cars', 'Savely', 'Hayalindeki araba seni bekliyor! 🚗 {{collection_name}} koleksiyonundaki {{item_count}} ilana göz at.', 'any'),
  ('cars', 'Savely', 'Kaydettiğin araç ilanlarını tekrar incelemenin zamanı geldi. {{collection_name}} koleksiyonuna bak.', 'any'),
  ('cars', 'Savely', 'Test sürüşüne çıkmanın tam zamanı! {{collection_name}} koleksiyonundaki araçlara bir bak 🏎️', 'morning');

-- fashion
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('fashion', 'Savely', 'Bugün ne giysem? 👗 {{collection_name}} koleksiyonundan ilham al!', 'morning'),
  ('fashion', 'Savely', 'Stil ilhamı lazım mı? {{collection_name}} koleksiyonunda {{item_count}} fikir bekliyor.', 'any'),
  ('fashion', 'Savely', 'Gardırobunu yenilemenin zamanı geldi mi? {{collection_name}} koleksiyonuna göz at.', 'any'),
  ('fashion', 'Savely', 'Kaydettiğin o kombini denedin mi? {{collection_name}} koleksiyonunu kontrol et! 👠', 'afternoon');

-- fitness
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('fitness', 'Savely', 'Güne enerjik başla! 💪 {{collection_name}} koleksiyonundaki antrenmanlardan birini dene.', 'morning'),
  ('fitness', 'Savely', 'Spor rutinine yeni bir hareket ekle! {{collection_name}} koleksiyonunda {{item_count}} içerik var.', 'any'),
  ('fitness', 'Savely', 'Hedeflerine ulaşmak için bir adım daha at! {{collection_name}} koleksiyonuna göz at 🏋️', 'any');

-- travel
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('travel', 'Savely', 'Bir sonraki tatilin nereye? ✈️ {{collection_name}} koleksiyonundaki {{item_count}} destinasyona göz at.', 'any'),
  ('travel', 'Savely', 'Seyahat planların hazır mı? {{collection_name}} koleksiyonundaki yerlere bir bak!', 'any'),
  ('travel', 'Savely', 'Bugün hayal kur, yarın keşfet! {{collection_name}} koleksiyonun seni bekliyor 🌍', 'morning');

-- tech
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('tech', 'Savely', 'Bugün yeni bir şey öğren! 💻 {{collection_name}} koleksiyonundaki makalelere göz at.', 'morning'),
  ('tech', 'Savely', 'Kaydettiğin o teknik makaleyi okudun mu? {{collection_name}} koleksiyonunda {{item_count}} içerik var.', 'any'),
  ('tech', 'Savely', 'Kendini geliştirmenin tam zamanı! {{collection_name}} koleksiyonuna bir bak 🚀', 'any');

-- music
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('music', 'Savely', 'Bugünün müziği hazır! 🎵 {{collection_name}} koleksiyonundaki şarkılara kulak ver.', 'any'),
  ('music', 'Savely', 'Akşam keyfi için bir playlist seç! {{collection_name}} koleksiyonuna göz at 🎶', 'evening'),
  ('music', 'Savely', 'Kaydettiğin müzikleri dinledin mi? {{collection_name}} koleksiyonunda {{item_count}} parça var.', 'any');

-- sports
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('sports', 'Savely', 'Maç özetlerini kaçırma! ⚽ {{collection_name}} koleksiyonuna göz at.', 'any'),
  ('sports', 'Savely', 'Spor dünyasından kaydettiğin içeriklere bir bak. {{collection_name}} koleksiyonunda {{item_count}} içerik var.', 'any'),
  ('sports', 'Savely', 'Bugünün spor gündemini takip ettin mi? {{collection_name}} koleksiyonunu kontrol et 🏆', 'evening');

-- study
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('study', 'Savely', 'Bugün ders çalışmanın tam zamanı! 📚 {{collection_name}} koleksiyonundaki notlarına göz at.', 'morning'),
  ('study', 'Savely', 'Sınava hazırlık devam ediyor mu? {{collection_name}} koleksiyonunda {{item_count}} kaynak var.', 'any'),
  ('study', 'Savely', 'Biraz çalışmaya ne dersin? {{collection_name}} koleksiyonundaki materyallere bak ✏️', 'afternoon');

-- language
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('language', 'Savely', 'Günlük kelime çalışmanı yaptın mı? 🌍 {{collection_name}} koleksiyonuna göz at!', 'morning'),
  ('language', 'Savely', 'Her gün 5 dakika bile fark yaratır! {{collection_name}} koleksiyonunda {{item_count}} içerik bekliyor.', 'any'),
  ('language', 'Savely', 'Yeni kelimeler öğrenmenin tam zamanı! {{collection_name}} koleksiyonuna bak 📝', 'any');

-- shopping
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('shopping', 'Savely', 'Alışveriş listende neler var? 🛍️ {{collection_name}} koleksiyonundaki {{item_count}} ürüne göz at.', 'any'),
  ('shopping', 'Savely', 'Kaydettiğin o ürün hâlâ indirimde mi? {{collection_name}} koleksiyonunu kontrol et.', 'any'),
  ('shopping', 'Savely', 'Kendine bir hediye almanın zamanı geldi mi? {{collection_name}} koleksiyonuna bak! 🎁', 'afternoon');

-- homedecor
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('homedecor', 'Savely', 'Evine yeni bir dokunuş katmaya hazır mısın? 🏡 {{collection_name}} koleksiyonuna göz at.', 'any'),
  ('homedecor', 'Savely', 'İlham arıyorsan doğru yerdesin! {{collection_name}} koleksiyonunda {{item_count}} dekorasyon fikri var.', 'any'),
  ('homedecor', 'Savely', 'Evini yenilemenin tam zamanı! {{collection_name}} koleksiyonundaki fikirlere bir bak 🪴', 'morning');

-- books
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('books', 'Savely', 'Bu akşam hangi kitabı okuyacaksın? 📖 {{collection_name}} koleksiyonuna göz at.', 'evening'),
  ('books', 'Savely', 'Okuma listen büyüyor! {{collection_name}} koleksiyonunda {{item_count}} kitap önerisi var.', 'any'),
  ('books', 'Savely', 'Kaydettiğin o kitabı okumaya başladın mı? {{collection_name}} koleksiyonunu kontrol et 📚', 'any');

-- podcasts
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('podcasts', 'Savely', 'Yolda dinleyecek bir şeyler mi arıyorsun? 🎧 {{collection_name}} koleksiyonuna göz at.', 'morning'),
  ('podcasts', 'Savely', 'Kaydettiğin podcast bölümlerini dinledin mi? {{collection_name}} koleksiyonunda {{item_count}} bölüm var.', 'any'),
  ('podcasts', 'Savely', 'Yeni bölümler seni bekliyor! {{collection_name}} koleksiyonuna bir bak 🎙️', 'any');

-- jobs
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('jobs', 'Savely', 'Kariyer fırsatlarını kaçırma! 💼 {{collection_name}} koleksiyonundaki {{item_count}} ilana göz at.', 'morning'),
  ('jobs', 'Savely', 'Hayalindeki işe bir adım daha yaklaş! {{collection_name}} koleksiyonunu kontrol et.', 'any'),
  ('jobs', 'Savely', 'İş arayışın devam ediyor mu? {{collection_name}} koleksiyonundaki ilanları gözden geçir 🎯', 'any');

-- finance
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('finance', 'Savely', 'Piyasaları takip etmeyi unutma! 📈 {{collection_name}} koleksiyonundaki içeriklere göz at.', 'morning'),
  ('finance', 'Savely', 'Finansal hedeflerine ulaşmak için araştırmaya devam! {{collection_name}} koleksiyonunda {{item_count}} kaynak var.', 'any'),
  ('finance', 'Savely', 'Kaydettiğin yatırım fikirlerini tekrar değerlendir. {{collection_name}} koleksiyonuna bak 💰', 'any');

-- gaming
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('gaming', 'Savely', 'Oyun vakti! 🎮 {{collection_name}} koleksiyonundaki {{item_count}} içeriğe göz at.', 'evening'),
  ('gaming', 'Savely', 'Kaydettiğin o oyunu denedin mi? {{collection_name}} koleksiyonunu kontrol et.', 'any'),
  ('gaming', 'Savely', 'Yeni oyun önerileri seni bekliyor! {{collection_name}} koleksiyonuna bir bak 🕹️', 'any');

-- art
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('art', 'Savely', 'Sanatsal ilham zamanı! 🎨 {{collection_name}} koleksiyonuna göz at.', 'morning'),
  ('art', 'Savely', 'Yaratıcılığını ateşle! {{collection_name}} koleksiyonunda {{item_count}} eser var.', 'any'),
  ('art', 'Savely', 'Kaydettiğin sanat eserlerini tekrar keşfet. {{collection_name}} koleksiyonuna bak 🖼️', 'any');

-- photography
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('photography', 'Savely', 'Fotoğraf ilhamı! 📸 {{collection_name}} koleksiyonundaki karelere göz at.', 'any'),
  ('photography', 'Savely', 'Kaydettiğin fotoğrafları tekrar incele. {{collection_name}} koleksiyonunda {{item_count}} kare var.', 'any'),
  ('photography', 'Savely', 'Bir sonraki çekiminde kullanabileceğin fikirler {{collection_name}} koleksiyonunda! 📷', 'morning');

-- diy
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('diy', 'Savely', 'Kendin yap projelerine göz at! 🔨 {{collection_name}} koleksiyonunda {{item_count}} fikir var.', 'any'),
  ('diy', 'Savely', 'Hafta sonu projesi mi arıyorsun? {{collection_name}} koleksiyonuna bak!', 'afternoon'),
  ('diy', 'Savely', 'Yaratıcı olmanın tam zamanı! {{collection_name}} koleksiyonunu kontrol et ✂️', 'any');

-- pets
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('pets', 'Savely', 'Minik dostun için kaydettiğin içeriklere bak! 🐾 {{collection_name}} koleksiyonuna göz at.', 'any'),
  ('pets', 'Savely', '{{collection_name}} koleksiyonunda {{item_count}} içerik var. Patili dostun için bir şeyler keşfet!', 'any'),
  ('pets', 'Savely', 'Evcil hayvanın için faydalı bilgiler {{collection_name}} koleksiyonunda! 🐶', 'morning');

-- garden
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('garden', 'Savely', 'Bahçende neler yapabilirsin? 🌱 {{collection_name}} koleksiyonuna göz at.', 'morning'),
  ('garden', 'Savely', 'Yeşil parmağını konuştur! {{collection_name}} koleksiyonunda {{item_count}} fikir var 🌿', 'any'),
  ('garden', 'Savely', 'Bitkilerin seni bekliyor! {{collection_name}} koleksiyonunu kontrol et.', 'any');

-- wedding
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('wedding', 'Savely', 'Düğün hazırlıkları devam ediyor mu? 💍 {{collection_name}} koleksiyonuna göz at.', 'any'),
  ('wedding', 'Savely', 'Kaydettiğin düğün fikirlerini tekrar incele. {{collection_name}} koleksiyonunda {{item_count}} ilham var.', 'any'),
  ('wedding', 'Savely', 'Büyük gün için planlaman tamam mı? {{collection_name}} koleksiyonunu kontrol et 💐', 'morning');

-- parenting
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  ('parenting', 'Savely', 'Minik ailen için kaydettiğin içeriklere bak! 👶 {{collection_name}} koleksiyonuna göz at.', 'any'),
  ('parenting', 'Savely', '{{collection_name}} koleksiyonunda {{item_count}} faydalı içerik var. Bir göz at!', 'any'),
  ('parenting', 'Savely', 'Anne-baba rehberin hazır! {{collection_name}} koleksiyonunu kontrol et 🍼', 'morning');

-- Generic templates (NULL category_slug — for custom/unmatched collections)
INSERT INTO notification_templates (category_slug, title, body, time_slot) VALUES
  (NULL, 'Savely', '{{collection_name}} koleksiyonunu son zamanlarda kontrol ettin mi? {{item_count}} içerik seni bekliyor!', 'any'),
  (NULL, 'Savely', 'Günaydın! {{collection_name}} koleksiyonuna bir göz atmaya ne dersin? ☀️', 'morning'),
  (NULL, 'Savely', '{{collection_name}} koleksiyonundaki içeriklere bakmak için harika bir zaman!', 'afternoon'),
  (NULL, 'Savely', 'Bu akşam {{collection_name}} koleksiyonunu keşfetmeye ne dersin? 🌙', 'evening'),
  (NULL, 'Savely', 'Kaydettin ama unuttun mu? {{collection_name}} koleksiyonunda {{item_count}} içerik var.', 'any'),
  (NULL, 'Savely', '{{collection_name}} koleksiyonun büyüyor! Şu ana kadar {{item_count}} içerik kaydettin 📌', 'any'),
  (NULL, 'Savely', 'Dijital arşivini düzenlemeye ne dersin? {{collection_name}} koleksiyonuna bir bak.', 'any'),
  (NULL, 'Savely', 'Kaydettiğin içerikler seni bekliyor! {{collection_name}} koleksiyonuna göz at ✨', 'any');
