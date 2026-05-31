import Foundation
import Security

enum SharedStore {
  static let appGroupId = "group.com.savelyapp.savely"

  private static let collectionsKey = "savely.share.collections"
  private static let pendingQueueKey = "savely.share.pendingQueue"
  private static let openedUrlKey = "savely.share.openedUrl"

  private static let kcAccessToken = "savely.share.accessToken"
  private static let kcUserId = "savely.share.userId"

  // MARK: - Defaults

  private static var defaults: UserDefaults? {
    UserDefaults(suiteName: appGroupId)
  }

  // MARK: - Collections (written by main app, read by extension)

  struct Collection: Codable, Equatable {
    let id: String
    let name: String
    let emoji: String
    let bgColor: String
  }

  static func setCollections(_ cols: [Collection]) {
    guard let d = defaults else { return }
    if let data = try? JSONEncoder().encode(cols) {
      d.set(data, forKey: collectionsKey)
    }
  }

  static func getCollections() -> [Collection] {
    guard let d = defaults, let data = d.data(forKey: collectionsKey) else { return [] }
    return (try? JSONDecoder().decode([Collection].self, from: data)) ?? []
  }

  // MARK: - Session (Keychain, app group)

  static func setSession(accessToken: String, userId: String) {
    setKeychain(key: kcAccessToken, value: accessToken)
    setKeychain(key: kcUserId, value: userId)
  }

  static func clearSession() {
    deleteKeychain(key: kcAccessToken)
    deleteKeychain(key: kcUserId)
  }

  static func accessToken() -> String? {
    getKeychain(key: kcAccessToken)
  }

  static func userId() -> String? {
    getKeychain(key: kcUserId)
  }

  // MARK: - Pending queue (written by extension, drained by main app)

  struct PendingShare: Codable {
    let url: String
    let collectionId: String?
    let createdCollectionName: String?
    let createdCollectionEmoji: String?
    let createdCollectionBgColor: String?
  }

  static func appendPendingShare(_ pending: PendingShare) {
    guard let d = defaults else { return }
    var list: [PendingShare] = []
    if let data = d.data(forKey: pendingQueueKey),
       let decoded = try? JSONDecoder().decode([PendingShare].self, from: data) {
      list = decoded
    }
    list.append(pending)
    if let encoded = try? JSONEncoder().encode(list) {
      d.set(encoded, forKey: pendingQueueKey)
    }
  }

  static func drainPendingShares() -> [PendingShare] {
    guard let d = defaults, let data = d.data(forKey: pendingQueueKey) else { return [] }
    let list = (try? JSONDecoder().decode([PendingShare].self, from: data)) ?? []
    d.removeObject(forKey: pendingQueueKey)
    return list
  }

  // MARK: - Opened share URL (written when extension opens main app)

  static func setOpenedShareUrl(_ url: String) {
    defaults?.set(url, forKey: openedUrlKey)
  }

  static func consumeOpenedShareUrl() -> String? {
    guard let d = defaults else { return nil }
    let val = d.string(forKey: openedUrlKey)
    if val != nil { d.removeObject(forKey: openedUrlKey) }
    return val
  }

  // MARK: - Keychain helpers (app group shared)

  private static func keychainQuery(key: String) -> [String: Any] {
    [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrAccount as String: key,
      kSecAttrService as String: "com.savelyapp.savely.share",
      kSecAttrAccessGroup as String: appGroupId,
      kSecAttrSynchronizable as String: kCFBooleanFalse as Any,
    ]
  }

  private static func setKeychain(key: String, value: String) {
    guard let data = value.data(using: .utf8) else { return }
    var query = keychainQuery(key: key)
    SecItemDelete(query as CFDictionary)
    query[kSecValueData as String] = data
    query[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
    SecItemAdd(query as CFDictionary, nil)
  }

  private static func getKeychain(key: String) -> String? {
    var query = keychainQuery(key: key)
    query[kSecReturnData as String] = kCFBooleanTrue as Any
    query[kSecMatchLimit as String] = kSecMatchLimitOne
    var result: AnyObject?
    let status = SecItemCopyMatching(query as CFDictionary, &result)
    guard status == errSecSuccess, let data = result as? Data else { return nil }
    return String(data: data, encoding: .utf8)
  }

  private static func deleteKeychain(key: String) {
    let query = keychainQuery(key: key)
    SecItemDelete(query as CFDictionary)
  }
}

// MARK: - Supabase config (build-time injection via Info.plist)

enum ShareConfig {
  static func supabaseUrl() -> String {
    Bundle.main.object(forInfoDictionaryKey: "SavelySupabaseUrl") as? String ?? ""
  }

  static func anonKey() -> String {
    Bundle.main.object(forInfoDictionaryKey: "SavelySupabaseAnonKey") as? String ?? ""
  }
}
