import Foundation

enum ShareAPIError: Error {
  case notAuthenticated
  case missingConfig
  case http(Int, String)
  case invalidResponse
}

enum ShareAPI {

  // MARK: - Save item

  static func saveItem(
    url: String,
    title: String?,
    description: String?,
    imageUrl: String?,
    platform: String,
    collectionId: String?
  ) async throws {
    guard let accessToken = SharedStore.accessToken(),
          let userId = SharedStore.userId() else {
      throw ShareAPIError.notAuthenticated
    }
    let supabaseUrl = ShareConfig.supabaseUrl()
    let anonKey = ShareConfig.anonKey()
    guard !supabaseUrl.isEmpty, !anonKey.isEmpty else { throw ShareAPIError.missingConfig }

    guard let endpoint = URL(string: "\(supabaseUrl)/rest/v1/saved_items") else {
      throw ShareAPIError.missingConfig
    }

    var body: [String: Any] = [
      "user_id": userId,
      "url": url,
      "title": title ?? "",
      "platform": platform,
      "content_type": "link",
      "aspect_ratio": 1,
      "metadata": [:] as [String: Any],
      "is_enriched": (imageUrl != nil || title != nil),
    ]
    if let collectionId = collectionId { body["collection_id"] = collectionId }
    if let description = description { body["description"] = description }
    if let imageUrl = imageUrl { body["image_url"] = imageUrl }

    var req = URLRequest(url: endpoint, timeoutInterval: 15)
    req.httpMethod = "POST"
    req.setValue("application/json", forHTTPHeaderField: "Content-Type")
    req.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
    req.setValue(anonKey, forHTTPHeaderField: "apikey")
    req.setValue("return=minimal", forHTTPHeaderField: "Prefer")
    req.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])

    let (data, response) = try await URLSession.shared.data(for: req)
    guard let http = response as? HTTPURLResponse else { throw ShareAPIError.invalidResponse }
    if !(200..<300).contains(http.statusCode) {
      let msg = String(data: data, encoding: .utf8) ?? ""
      throw ShareAPIError.http(http.statusCode, msg)
    }
  }

  // MARK: - Create collection (returns the new id)

  static func createCollection(name: String, emoji: String, bgColor: String) async throws -> String {
    guard let accessToken = SharedStore.accessToken(),
          let userId = SharedStore.userId() else {
      throw ShareAPIError.notAuthenticated
    }
    let supabaseUrl = ShareConfig.supabaseUrl()
    let anonKey = ShareConfig.anonKey()
    guard !supabaseUrl.isEmpty, !anonKey.isEmpty else { throw ShareAPIError.missingConfig }

    guard let endpoint = URL(string: "\(supabaseUrl)/rest/v1/collections") else {
      throw ShareAPIError.missingConfig
    }

    let body: [String: Any] = [
      "user_id": userId,
      "name": name,
      "emoji": emoji,
      "bg_color": bgColor,
      "item_count": 0,
    ]

    var req = URLRequest(url: endpoint, timeoutInterval: 15)
    req.httpMethod = "POST"
    req.setValue("application/json", forHTTPHeaderField: "Content-Type")
    req.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
    req.setValue(anonKey, forHTTPHeaderField: "apikey")
    req.setValue("return=representation", forHTTPHeaderField: "Prefer")
    req.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])

    let (data, response) = try await URLSession.shared.data(for: req)
    guard let http = response as? HTTPURLResponse else { throw ShareAPIError.invalidResponse }
    if !(200..<300).contains(http.statusCode) {
      let msg = String(data: data, encoding: .utf8) ?? ""
      throw ShareAPIError.http(http.statusCode, msg)
    }
    let arr = try JSONSerialization.jsonObject(with: data) as? [[String: Any]]
    guard let first = arr?.first, let id = first["id"] as? String else {
      throw ShareAPIError.invalidResponse
    }
    return id
  }
}
