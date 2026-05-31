import Foundation

struct ContentMetadata {
  let url: String
  let title: String?
  let description: String?
  let imageUrl: String?
  let siteName: String?
  let platform: String
}

enum MetadataFetcher {
  private static let timeout: TimeInterval = 8
  private static let maxHeadBytes = 24_000

  static func detectPlatform(_ url: String) -> String {
    let u = url.lowercased()
    if u.contains("youtube.com") || u.contains("youtu.be") { return "youtube" }
    if u.contains("instagram.com") { return "instagram" }
    if u.contains("tiktok.com") { return "tiktok" }
    if u.contains("twitter.com") || u.contains("x.com") { return "twitter" }
    if u.contains("reddit.com") { return "reddit" }
    if u.contains("pinterest.com") { return "pinterest" }
    if u.contains("linkedin.com") { return "linkedin" }
    if u.contains("facebook.com") || u.contains("fb.com") { return "facebook" }
    if u.contains("threads.net") { return "threads" }
    if u.contains("spotify.com") { return "spotify" }
    if u.contains("maps.google") || u.contains("google.com/maps") { return "maps" }
    return "link"
  }

  static func fetch(url: String) async -> ContentMetadata {
    let platform = detectPlatform(url)

    if platform == "youtube" {
      if let oembed = await fetchYouTubeOembed(url: url) { return oembed }
      if let id = extractYouTubeId(url) {
        return ContentMetadata(
          url: url, title: nil, description: nil,
          imageUrl: "https://img.youtube.com/vi/\(id)/hqdefault.jpg",
          siteName: "YouTube", platform: platform
        )
      }
    }

    let blockedByAuth: Set<String> = ["instagram", "twitter", "tiktok", "linkedin", "facebook", "threads"]
    if blockedByAuth.contains(platform) {
      if let m = await fetchMicrolink(url: url, platform: platform) { return m }
      return ContentMetadata(url: url, title: nil, description: nil, imageUrl: nil, siteName: nil, platform: platform)
    }

    let og = await fetchOgTags(url: url, platform: platform)
    if let og = og, og.imageUrl != nil { return og }

    if let m = await fetchMicrolink(url: url, platform: platform) { return m }
    return og ?? ContentMetadata(url: url, title: nil, description: nil, imageUrl: nil, siteName: nil, platform: platform)
  }

  // MARK: - YouTube oEmbed

  private static func fetchYouTubeOembed(url: String) async -> ContentMetadata? {
    guard let encoded = url.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
          let oembedUrl = URL(string: "https://www.youtube.com/oembed?url=\(encoded)&format=json") else { return nil }
    guard let json = await getJson(url: oembedUrl) else { return nil }
    let title = (json["title"] as? String).flatMap { $0.isEmpty ? nil : $0 }
    let image = (json["thumbnail_url"] as? String).flatMap { $0.isEmpty ? nil : $0 }
    return ContentMetadata(url: url, title: title, description: nil, imageUrl: image, siteName: "YouTube", platform: "youtube")
  }

  // MARK: - OG tags

  private static func fetchOgTags(url: String, platform: String) async -> ContentMetadata? {
    guard let pageUrl = URL(string: url) else { return nil }
    var req = URLRequest(url: pageUrl, timeoutInterval: timeout)
    req.setValue("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", forHTTPHeaderField: "User-Agent")
    req.setValue("text/html,application/xhtml+xml", forHTTPHeaderField: "Accept")
    do {
      let (data, response) = try await URLSession.shared.data(for: req)
      guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else { return nil }
      let limited = data.prefix(maxHeadBytes)
      guard let html = String(data: Data(limited), encoding: .utf8) else { return nil }
      let title = firstMatch(html: html, primary: ogRegex("og:title"), alt: ogRegexAlt("og:title")) ?? titleTag(html: html)
      let desc = firstMatch(html: html, primary: ogRegex("og:description"), alt: ogRegexAlt("og:description"))
      let image = firstMatch(html: html, primary: ogRegex("og:image"), alt: ogRegexAlt("og:image"))
      let site = firstMatch(html: html, primary: ogRegex("og:site_name"), alt: ogRegexAlt("og:site_name"))
      return ContentMetadata(url: url, title: title, description: desc, imageUrl: image, siteName: site, platform: platform)
    } catch {
      return nil
    }
  }

  // MARK: - Microlink fallback

  private static func fetchMicrolink(url: String, platform: String) async -> ContentMetadata? {
    guard let encoded = url.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
          let apiUrl = URL(string: "https://api.microlink.io/?url=\(encoded)") else { return nil }
    guard let json = await getJson(url: apiUrl) else { return nil }
    guard (json["status"] as? String) == "success",
          let data = json["data"] as? [String: Any] else { return nil }
    let image = (data["image"] as? [String: Any])?["url"] as? String
      ?? (data["logo"] as? [String: Any])?["url"] as? String
    return ContentMetadata(
      url: url,
      title: (data["title"] as? String).flatMap { $0.isEmpty ? nil : $0 },
      description: (data["description"] as? String).flatMap { $0.isEmpty ? nil : $0 },
      imageUrl: image?.isEmpty == false ? image : nil,
      siteName: (data["publisher"] as? String).flatMap { $0.isEmpty ? nil : $0 },
      platform: platform
    )
  }

  // MARK: - Helpers

  private static func getJson(url: URL) async -> [String: Any]? {
    var req = URLRequest(url: url, timeoutInterval: timeout)
    req.setValue("Savely/1.0", forHTTPHeaderField: "User-Agent")
    do {
      let (data, response) = try await URLSession.shared.data(for: req)
      guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else { return nil }
      return try JSONSerialization.jsonObject(with: data) as? [String: Any]
    } catch {
      return nil
    }
  }

  private static func ogRegex(_ property: String) -> String {
    return "<meta[^>]+property=[\"']\(property)[\"'][^>]+content=[\"']([^\"'<]+)[\"']"
  }

  private static func ogRegexAlt(_ property: String) -> String {
    return "<meta[^>]+content=[\"']([^\"'<]+)[\"'][^>]+property=[\"']\(property)[\"']"
  }

  private static func firstMatch(html: String, primary: String, alt: String) -> String? {
    if let m = matchFirst(pattern: primary, in: html) { return m.trimmingCharacters(in: .whitespacesAndNewlines) }
    if let m = matchFirst(pattern: alt, in: html) { return m.trimmingCharacters(in: .whitespacesAndNewlines) }
    return nil
  }

  private static func titleTag(html: String) -> String? {
    matchFirst(pattern: "<title[^>]*>([^<]+)</title>", in: html)?.trimmingCharacters(in: .whitespacesAndNewlines)
  }

  private static func matchFirst(pattern: String, in text: String) -> String? {
    guard let re = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) else { return nil }
    let range = NSRange(text.startIndex..<text.endIndex, in: text)
    guard let m = re.firstMatch(in: text, options: [], range: range), m.numberOfRanges >= 2 else { return nil }
    guard let r = Range(m.range(at: 1), in: text) else { return nil }
    return String(text[r])
  }

  private static func extractYouTubeId(_ url: String) -> String? {
    let patterns = [
      "youtube\\.com/watch\\?v=([A-Za-z0-9_-]+)",
      "youtu\\.be/([A-Za-z0-9_-]+)",
      "youtube\\.com/shorts/([A-Za-z0-9_-]+)",
    ]
    for p in patterns {
      if let id = matchFirst(pattern: p, in: url) { return id }
    }
    return nil
  }
}
