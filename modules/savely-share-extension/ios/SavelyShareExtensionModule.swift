import ExpoModulesCore
import Intents
import UIKit

public class SavelyShareExtensionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SavelyShareExtension")

    AsyncFunction("setSession") { (session: [String: String]) in
      let accessToken = session["accessToken"] ?? ""
      let userId = session["userId"] ?? ""
      guard !accessToken.isEmpty, !userId.isEmpty else { return }
      SharedStore.setSession(accessToken: accessToken, userId: userId)
    }

    AsyncFunction("clearSession") {
      SharedStore.clearSession()
    }

    AsyncFunction("setCollections") { (collections: [[String: String]]) in
      let cols: [SharedStore.Collection] = collections.compactMap { dict in
        guard let id = dict["id"], let name = dict["name"] else { return nil }
        return SharedStore.Collection(
          id: id,
          name: name,
          emoji: dict["emoji"] ?? "📁",
          bgColor: dict["bgColor"] ?? "#f4f4f5"
        )
      }
      SharedStore.setCollections(cols)
    }

    // Donates the top 4 collections as INSendMessageIntent interactions so iOS
    // shows them as direct-share circular shortcuts in the share sheet.
    AsyncFunction("donateCollectionShortcuts") { (collections: [[String: String]]) in
      for dict in collections.prefix(4) {
        guard let id = dict["id"], let name = dict["name"] else { continue }
        let emoji = dict["emoji"] ?? "📁"
        let bgColor = dict["bgColor"] ?? "#6366f1"

        let handle = INPersonHandle(value: id, type: .unknown)
        let imageData = makeCollectionImage(emoji: emoji, bgHex: bgColor)
        let image = imageData.flatMap { INImage(imageData: $0) }

        let person = INPerson(
          personHandle: handle,
          nameComponents: nil,
          displayName: "\(emoji) \(name)",
          image: image,
          contactIdentifier: nil,
          customIdentifier: id
        )

        let intent = INSendMessageIntent(
          recipients: [person],
          content: nil,
          speakableGroupName: nil,
          conversationIdentifier: id,
          serviceName: "Savely",
          sender: nil
        )

        let interaction = INInteraction(intent: intent, response: nil)
        interaction.identifier = "savely.collection.\(id)"
        interaction.groupIdentifier = "savely.collections"
        interaction.direction = .outgoing
        interaction.donate(completion: nil)
      }
    }

    AsyncFunction("drainPendingShares") { () -> [[String: Any?]] in
      let pending = SharedStore.drainPendingShares()
      return pending.map { p in
        [
          "url": p.url,
          "collectionId": p.collectionId,
          "createdCollectionName": p.createdCollectionName,
          "createdCollectionEmoji": p.createdCollectionEmoji,
          "createdCollectionBgColor": p.createdCollectionBgColor,
        ]
      }
    }

    AsyncFunction("consumeOpenedShareUrl") { () -> String? in
      SharedStore.consumeOpenedShareUrl()
    }
  }
}

// MARK: - Helpers

private func makeCollectionImage(emoji: String, bgHex: String, size: CGFloat = 64) -> Data? {
  let renderer = UIGraphicsImageRenderer(size: CGSize(width: size, height: size))
  let image = renderer.image { _ in
    let bg = UIColor(hexString: bgHex) ?? UIColor(red: 0.39, green: 0.40, blue: 0.95, alpha: 1)
    bg.setFill()
    UIBezierPath(ovalIn: CGRect(x: 0, y: 0, width: size, height: size)).fill()

    let font = UIFont.systemFont(ofSize: size * 0.50)
    let attrs: [NSAttributedString.Key: Any] = [.font: font]
    let s = emoji as NSString
    let sz = s.size(withAttributes: attrs)
    s.draw(
      at: CGPoint(x: (size - sz.width) / 2, y: (size - sz.height) / 2),
      withAttributes: attrs
    )
  }
  return image.pngData()
}

private extension UIColor {
  convenience init?(hexString: String) {
    var h = hexString.trimmingCharacters(in: .whitespacesAndNewlines)
    if h.hasPrefix("#") { h = String(h.dropFirst()) }
    guard h.count == 6, let val = UInt64(h, radix: 16) else { return nil }
    self.init(
      red:   CGFloat((val >> 16) & 0xFF) / 255,
      green: CGFloat((val >> 8)  & 0xFF) / 255,
      blue:  CGFloat( val        & 0xFF) / 255,
      alpha: 1
    )
  }
}
