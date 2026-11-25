import Combine
import Foundation
import Network

struct PostedLine: Identifiable {
    let id = UUID()
    let author: String
    let body: String
}

func coordinates(_ address: String) -> (Double, Double)? {
    guard address.hasPrefix("geo:") else { return nil }
    let parts = address.dropFirst(4).split(separator: ",")
    guard parts.count == 2, let lat = Double(parts[0]), let lon = Double(parts[1]),
          abs(lat) <= 90, abs(lon) <= 180 else { return nil }
    return (lat, lon)
}

@MainActor
final class Feed: NSObject, ObservableObject, NetServiceDelegate {
    @Published var node: URL?
    @Published var lines: [PostedLine] = []
    @Published var mapped: [(String, PostedLine)] = []
    @Published var status = "Connecting"
    let room = Bundle.main.object(forInfoDictionaryKey: "NounPlace") as? String ?? "geo:33.9192,-118.4165"
    private let browser = NWBrowser(for: .bonjour(type: "_noun._tcp", domain: nil), using: .tcp)
    private var resolver: NetService?

    func discover() {
        browser.browseResultsChangedHandler = { [weak self] results, _ in
            Task { @MainActor in
                guard let self else { return }
                let endpoints = results.map(\.endpoint).sorted { String(describing: $0) < String(describing: $1) }
                guard case let .service(name, type, domain, _)? = endpoints.first else {
                    self.resolver?.stop()
                    self.resolver = nil
                    self.node = nil
                    return
                }
                if self.resolver?.name == name, self.node != nil { return }
                self.resolver?.stop()
                self.node = nil
                let service = NetService(domain: domain, type: type, name: name)
                self.resolver = service
                service.delegate = self
                service.resolve(withTimeout: 5)
            }
        }
        browser.start(queue: .main)
    }

    nonisolated func netServiceDidResolveAddress(_ service: NetService) {
        Task { @MainActor in
            guard resolver === service, let host = service.hostName else { return }
            var parts = URLComponents()
            parts.scheme = "http"
            parts.host = host.trimmingCharacters(in: CharacterSet(charactersIn: "."))
            parts.port = service.port
            node = parts.url
        }
    }

    private func json(_ base: URL, _ path: String, address: String? = nil) async throws -> Any {
        var parts = URLComponents(url: base.appendingPathComponent(path), resolvingAgainstBaseURL: false)!
        if let address {
            parts.queryItems = [URLQueryItem(name: "to", value: address), URLQueryItem(name: "since", value: "0")]
        }
        let (data, response) = try await URLSession.shared.data(for: URLRequest(url: parts.url!, timeoutInterval: 5))
        guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw URLError(.badServerResponse) }
        return try JSONSerialization.jsonObject(with: data)
    }

    private func read(_ address: String, base: URL, local: Bool) async throws -> [PostedLine] {
        let data = try await json(base, local ? "lines" : "api/loom", address: address)
        let envelope = data as? [String: Any]
        guard let rows = (envelope?[local ? "lines" : "messages"] ?? data) as? [[String: Any]] else {
            throw URLError(.cannotParseResponse)
        }
        return rows.compactMap { row in
            guard let body = row["body"] as? String else { return nil }
            let from = row["from"] as? [String: Any]
            return PostedLine(author: row["sender"] as? String ?? from?["name"] as? String ?? "Local node", body: body)
        }
    }

    func refresh() async {
        let base = node
        var nearby: [(String, PostedLine)] = []
        var local = false
        do {
            let rows: [PostedLine]
            if let base, let result = try? await read(room, base: base, local: true) {
                rows = result
                local = true
            } else {
                rows = try await read(room, base: URL(string: "https://pointcast.xyz")!, local: false)
            }
            try Task.checkCancellation()
            lines = rows.reversed()
            status = local ? "Local node" : "Public Loom"
            if let last = rows.last { nearby.append((room, last)) }
            if local, let base, let data = try? await json(base, "have") {
                let index = data as? [String: Any]
                let have = index?["have"] ?? index?["addresses"] ?? data
                let keys = (have as? [String: Any]).map { Array($0.keys) }
                    ?? (have as? [[String: Any]])?.compactMap { $0["address"] as? String }
                    ?? (have as? [String]) ?? []
                for address in keys.filter({ $0 != room && coordinates($0) != nil }).sorted().prefix(4) {
                    if let rows = try? await read(address, base: base, local: true), let line = rows.last {
                        nearby.append((address, line))
                    }
                }
            }
            if !Task.isCancelled { mapped = nearby }
        } catch {
            if !Task.isCancelled { status = "Feed unavailable" }
        }
    }
}
