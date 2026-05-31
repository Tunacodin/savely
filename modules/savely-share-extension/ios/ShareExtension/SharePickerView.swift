import SwiftUI

@MainActor
final class SharePickerModel: ObservableObject {
  enum Status: Equatable {
    case idle
    case saving(collectionId: String?)
    case saved
    case error(String)
  }

  @Published var status: Status = .idle
  @Published var title: String?
  @Published var imageUrl: String?
  @Published var siteName: String?
  @Published var collections: [SharedStore.Collection]
  @Published var creatingNew: Bool = false
  @Published var newName: String = ""

  let url: String
  let domain: String
  let platform: String

  var onClose: () -> Void = {}
  var onOpenMainApp: (PendingHandoff) -> Void = { _ in }

  struct PendingHandoff {
    let url: String
  }

  init(url: String, collections: [SharedStore.Collection]) {
    self.url = url
    self.collections = collections
    if let host = URL(string: url)?.host { self.domain = host.replacingOccurrences(of: "www.", with: "") }
    else { self.domain = url }
    self.platform = MetadataFetcher.detectPlatform(url)
  }

  func loadMetadata() async {
    let meta = await MetadataFetcher.fetch(url: url)
    self.title = meta.title
    self.imageUrl = meta.imageUrl
    self.siteName = meta.siteName
  }

  func saveTo(collectionId: String?) async {
    status = .saving(collectionId: collectionId)
    do {
      try await ShareAPI.saveItem(
        url: url,
        title: title,
        description: nil,
        imageUrl: imageUrl,
        platform: platform,
        collectionId: collectionId
      )
      status = .saved
      try? await Task.sleep(nanoseconds: 700_000_000)
      onClose()
    } catch ShareAPIError.notAuthenticated {
      handoffToMainApp()
    } catch {
      status = .error("Kaydedilemedi. Tekrar deneyin.")
    }
  }

  func createCollectionAndSave() async {
    let trimmed = newName.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else { return }
    status = .saving(collectionId: nil)
    do {
      let newId = try await ShareAPI.createCollection(name: trimmed, emoji: "📁", bgColor: "#f4f4f5")
      try await ShareAPI.saveItem(
        url: url,
        title: title,
        description: nil,
        imageUrl: imageUrl,
        platform: platform,
        collectionId: newId
      )
      SharedStore.appendPendingShare(SharedStore.PendingShare(
        url: url,
        collectionId: newId,
        createdCollectionName: trimmed,
        createdCollectionEmoji: "📁",
        createdCollectionBgColor: "#f4f4f5"
      ))
      status = .saved
      try? await Task.sleep(nanoseconds: 700_000_000)
      onClose()
    } catch ShareAPIError.notAuthenticated {
      handoffToMainApp()
    } catch {
      status = .error("Koleksiyon oluşturulamadı.")
    }
  }

  func handoffToMainApp() {
    onOpenMainApp(PendingHandoff(url: url))
  }
}

struct SharePickerView: View {
  @StateObject var model: SharePickerModel
  @Environment(\.colorScheme) private var colorScheme

  var body: some View {
    VStack(spacing: 0) {
      handle
        .padding(.top, 8)
        .padding(.bottom, 12)

      previewRow
        .padding(.horizontal, 16)
        .padding(.bottom, 16)

      Divider().opacity(0.3)

      if model.creatingNew {
        newCollectionForm
          .padding(.horizontal, 16)
          .padding(.vertical, 16)
      } else {
        collectionsList
          .padding(.vertical, 16)
      }

      Divider().opacity(0.3)

      bottomRow
        .padding(.horizontal, 16)
        .padding(.vertical, 12)

      if case let .error(msg) = model.status {
        Text(msg)
          .font(.system(size: 13))
          .foregroundColor(.red)
          .padding(.bottom, 8)
      }
    }
    .background(backgroundColor)
    .overlay(savedOverlay)
    .task { await model.loadMetadata() }
  }

  private var backgroundColor: Color {
    colorScheme == .dark ? Color(red: 0.153, green: 0.149, blue: 0.169) : Color(.systemBackground)
  }

  // MARK: - Subviews

  private var handle: some View {
    RoundedRectangle(cornerRadius: 3)
      .fill(Color.gray.opacity(0.4))
      .frame(width: 40, height: 5)
  }

  private var previewRow: some View {
    HStack(spacing: 12) {
      thumbnailView
      VStack(alignment: .leading, spacing: 4) {
        Text(model.title ?? model.domain)
          .font(.system(size: 15, weight: .semibold))
          .lineLimit(2)
          .foregroundColor(.primary)
        Text(model.siteName ?? model.domain)
          .font(.system(size: 12))
          .foregroundColor(.secondary)
          .lineLimit(1)
      }
      Spacer()
    }
  }

  private var thumbnailView: some View {
    Group {
      if let urlString = model.imageUrl, let url = URL(string: urlString) {
        AsyncImage(url: url) { phase in
          switch phase {
          case .success(let img):
            img.resizable().aspectRatio(contentMode: .fill)
          default:
            placeholderThumb
          }
        }
      } else {
        placeholderThumb
      }
    }
    .frame(width: 56, height: 56)
    .clipShape(RoundedRectangle(cornerRadius: 10))
  }

  private var placeholderThumb: some View {
    ZStack {
      RoundedRectangle(cornerRadius: 10)
        .fill(Color.gray.opacity(0.15))
      Text(platformEmoji(model.platform))
        .font(.system(size: 24))
    }
  }

  private func platformEmoji(_ p: String) -> String {
    switch p {
    case "youtube": return "▶️"
    case "instagram": return "📷"
    case "tiktok": return "🎵"
    case "twitter": return "🐦"
    case "reddit": return "👽"
    case "pinterest": return "📌"
    case "linkedin": return "💼"
    case "facebook": return "👤"
    case "threads": return "🧵"
    case "spotify": return "🎧"
    case "maps": return "📍"
    default: return "🔗"
    }
  }

  private var collectionsList: some View {
    ScrollView(.horizontal, showsIndicators: false) {
      HStack(spacing: 12) {
        Color.clear.frame(width: 4)
        ForEach(model.collections.prefix(6), id: \.id) { col in
          CollectionChip(
            collection: col,
            isSaving: isSaving(for: col.id)
          ) {
            Task { await model.saveTo(collectionId: col.id) }
          }
        }
        addNewChip
        Color.clear.frame(width: 4)
      }
    }
  }

  private var addNewChip: some View {
    Button {
      withAnimation { model.creatingNew = true }
    } label: {
      VStack(spacing: 6) {
        ZStack {
          RoundedRectangle(cornerRadius: 16)
            .stroke(Color.gray.opacity(0.4), style: StrokeStyle(lineWidth: 1.5, dash: [4, 4]))
            .frame(width: 56, height: 56)
          Image(systemName: "plus")
            .font(.system(size: 22, weight: .semibold))
            .foregroundColor(.secondary)
        }
        Text("Yeni")
          .font(.system(size: 11))
          .foregroundColor(.secondary)
          .lineLimit(1)
      }
    }
    .buttonStyle(.plain)
  }

  private var newCollectionForm: some View {
    VStack(spacing: 12) {
      HStack {
        Text("Yeni koleksiyon")
          .font(.system(size: 14, weight: .semibold))
        Spacer()
        Button {
          withAnimation { model.creatingNew = false; model.newName = "" }
        } label: {
          Image(systemName: "xmark.circle.fill")
            .foregroundColor(.secondary)
        }
        .buttonStyle(.plain)
      }
      HStack(spacing: 8) {
        Text("📁").font(.system(size: 22))
        TextField("Koleksiyon adı", text: $model.newName)
          .textFieldStyle(.roundedBorder)
          .submitLabel(.done)
          .onSubmit {
            Task { await model.createCollectionAndSave() }
          }
      }
      Button {
        Task { await model.createCollectionAndSave() }
      } label: {
        HStack {
          if case .saving = model.status {
            ProgressView().tint(.white)
          }
          Text("Oluştur ve Kaydet")
            .font(.system(size: 15, weight: .semibold))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(model.newName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                    ? Color.gray.opacity(0.3) : Color.accentColor)
        .foregroundColor(.white)
        .cornerRadius(10)
      }
      .buttonStyle(.plain)
      .disabled(model.newName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
    }
  }

  private var bottomRow: some View {
    HStack(spacing: 12) {
      Button {
        Task { await model.saveTo(collectionId: nil) }
      } label: {
        Label("Hızlı kaydet", systemImage: "bookmark.fill")
          .font(.system(size: 13, weight: .medium))
          .padding(.horizontal, 14)
          .padding(.vertical, 8)
          .background(Color.gray.opacity(0.15))
          .cornerRadius(8)
          .foregroundColor(.primary)
      }
      .buttonStyle(.plain)

      Spacer()

      Button {
        model.handoffToMainApp()
      } label: {
        Label("Daha fazla", systemImage: "ellipsis")
          .font(.system(size: 13, weight: .medium))
          .padding(.horizontal, 14)
          .padding(.vertical, 8)
          .foregroundColor(.accentColor)
      }
      .buttonStyle(.plain)
    }
  }

  @ViewBuilder
  private var savedOverlay: some View {
    if model.status == .saved {
      ZStack {
        Color.black.opacity(0.4).ignoresSafeArea()
        VStack(spacing: 12) {
          Image(systemName: "checkmark.circle.fill")
            .font(.system(size: 48))
            .foregroundColor(.green)
          Text("Kaydedildi")
            .font(.system(size: 16, weight: .semibold))
            .foregroundColor(.white)
        }
        .padding(24)
        .background(.ultraThinMaterial)
        .cornerRadius(16)
      }
    }
  }

  private func isSaving(for id: String) -> Bool {
    if case .saving(let cid) = model.status, cid == id { return true }
    return false
  }
}

struct CollectionChip: View {
  let collection: SharedStore.Collection
  let isSaving: Bool
  let onTap: () -> Void

  var body: some View {
    Button(action: onTap) {
      VStack(spacing: 6) {
        ZStack {
          RoundedRectangle(cornerRadius: 16)
            .fill(parseColor(collection.bgColor))
            .frame(width: 56, height: 56)
          if isSaving {
            ProgressView().tint(.primary)
          } else {
            Text(collection.emoji)
              .font(.system(size: 26))
          }
        }
        Text(collection.name)
          .font(.system(size: 11))
          .foregroundColor(.primary)
          .lineLimit(1)
          .frame(maxWidth: 64)
      }
    }
    .buttonStyle(.plain)
    .disabled(isSaving)
  }

  private func parseColor(_ hex: String) -> Color {
    var hex = hex.trimmingCharacters(in: .whitespaces)
    if hex.hasPrefix("#") { hex.removeFirst() }
    guard hex.count == 6, let v = UInt32(hex, radix: 16) else { return Color.gray.opacity(0.15) }
    let r = Double((v >> 16) & 0xff) / 255.0
    let g = Double((v >> 8) & 0xff) / 255.0
    let b = Double(v & 0xff) / 255.0
    return Color(red: r, green: g, blue: b)
  }
}
