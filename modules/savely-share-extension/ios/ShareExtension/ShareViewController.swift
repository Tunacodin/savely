import UIKit
import SwiftUI
import MobileCoreServices
import UniformTypeIdentifiers

@objc(ShareViewController)
class ShareViewController: UIViewController {

  private var hostingController: UIHostingController<SharePickerView>?

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .clear
  }

  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    Task { await loadAndPresent() }
  }

  private func loadAndPresent() async {
    guard let url = await extractSharedUrl() else {
      await closeWithCancel()
      return
    }
    let collections = SharedStore.getCollections()
    let model = await SharePickerModel(url: url, collections: collections)
    await MainActor.run {
      model.onClose = { [weak self] in
        self?.closeNormally()
      }
      model.onOpenMainApp = { [weak self] handoff in
        self?.openMainApp(url: handoff.url)
      }
      let view = SharePickerView(model: model)
      let host = UIHostingController(rootView: view)
      host.view.translatesAutoresizingMaskIntoConstraints = false
      host.view.backgroundColor = .clear

      addChild(host)
      self.view.addSubview(host.view)
      NSLayoutConstraint.activate([
        host.view.leadingAnchor.constraint(equalTo: self.view.leadingAnchor),
        host.view.trailingAnchor.constraint(equalTo: self.view.trailingAnchor),
        host.view.bottomAnchor.constraint(equalTo: self.view.bottomAnchor),
        host.view.topAnchor.constraint(greaterThanOrEqualTo: self.view.topAnchor),
      ])
      host.didMove(toParent: self)
      self.hostingController = host
    }
  }

  // MARK: - Extract URL

  private func extractSharedUrl() async -> String? {
    guard let items = extensionContext?.inputItems as? [NSExtensionItem] else { return nil }
    for item in items {
      guard let providers = item.attachments else { continue }
      for provider in providers {
        if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
          if let value = try? await provider.loadItem(forTypeIdentifier: UTType.url.identifier),
             let url = value as? URL {
            return url.absoluteString
          }
        }
      }
      for provider in providers {
        if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
          if let value = try? await provider.loadItem(forTypeIdentifier: UTType.plainText.identifier),
             let text = value as? String {
            if let url = extractUrlFromText(text) { return url }
          }
        }
      }
    }
    return nil
  }

  private func extractUrlFromText(_ text: String) -> String? {
    let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue)
    let range = NSRange(text.startIndex..<text.endIndex, in: text)
    guard let match = detector?.firstMatch(in: text, options: [], range: range),
          let r = Range(match.range, in: text) else { return nil }
    return String(text[r])
  }

  // MARK: - Close + handoff

  private func closeNormally() {
    extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
  }

  private func closeWithCancel() async {
    await MainActor.run {
      extensionContext?.cancelRequest(withError: NSError(domain: "Savely", code: 0))
    }
  }

  private func openMainApp(url: String) {
    var components = URLComponents()
    components.scheme = "savely"
    components.host = "save"
    components.queryItems = [URLQueryItem(name: "url", value: url)]
    guard let deepLink = components.url else {
      closeNormally()
      return
    }
    extensionContext?.open(deepLink) { _ in
      self.closeNormally()
    }
  }
}
