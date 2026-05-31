import ExpoModulesCore

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
