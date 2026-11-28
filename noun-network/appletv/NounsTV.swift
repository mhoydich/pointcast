import SwiftUI
import UIKit

@main
struct NounsTV: App {
    var body: some Scene { WindowGroup { Television() } }
}

private let files = ["01-acid-assembly","04-garden-twenty","06-pink-orbit","10-golden-cosmos"]
private let names = ["Acid Assembly","Garden Twenty","Pink Orbit","Golden Cosmos"]
private let modes = ["Gallery","Note of the Day","Town Map","Local Board"]

private func artwork(_ name: String, _ ext: String) -> Image {
    guard let url = Bundle.main.url(forResource: name, withExtension: ext),
          let image = UIImage(contentsOfFile: url.path) else { return Image(systemName: "photo") }
    return Image(uiImage: image)
}

private struct Television: View {
    @StateObject private var feed = Feed()
    @State private var mode = 0
    @Environment(\.accessibilityReduceMotion) var reduceMotion
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            HStack { Text("Nouns TV").bold(); Spacer(); Text(feed.room).monospaced() }
            Divider()
            Text(modes[mode]).font(.largeTitle.bold())
            if mode < 2 {
                TimelineView(.periodic(from: .now, by: reduceMotion ? 20 : 1)) { tick in
                    let time = tick.date.timeIntervalSince1970
                    let index = Int(time / (mode == 0 ? 20 : 86400)) % files.count
                    HStack {
                        artwork(files[index],"webp").resizable().scaledToFit()
                            .padding(24).offset(x: mode == 0 && !reduceMotion ? CGFloat(sin(time / 7) * 18) : 0)
                        if mode == 1 {
                            VStack {
                                artwork("qr","png").resizable().interpolation(.none).scaledToFit().frame(width: 230)
                                Text("nounsmoney.xyz")
                            }
                        }
                    }.frame(maxWidth: .infinity, maxHeight: .infinity)
                    HStack {
                        Text(names[index]).bold()
                        Spacer()
                        Text("NM-A-00" + files[index].prefix(2) + " · no cash value")
                    }
                }
            } else {
                Text(feed.status).foregroundStyle(.secondary)
                if mode == 2 {
                    TownMap(room: feed.room, points: feed.mapped)
                } else {
                    if feed.lines.isEmpty { Text("No lines to display for this place.") }
                    ForEach(feed.lines.prefix(5)) { line in
                        HStack { Text(line.author).bold().frame(width: 300, alignment: .leading); Text(line.body) }.lineLimit(2)
                        Divider()
                    }
                }
                Spacer()
            }
            HStack {
                ForEach(modes.indices, id: \.self) { index in
                    Button { mode = index } label: { Text(modes[index]).frame(maxWidth: .infinity) }
                        .tint(mode == index ? .yellow : .gray)
                }
            }
        }.padding(50).preferredColorScheme(.dark)
        .onAppear { feed.discover() }
        .task(id: feed.node) {
            while !Task.isCancelled {
                await feed.refresh()
                try? await Task.sleep(nanoseconds: 30_000_000_000)
            }
        }
    }
}

private struct TownMap: View {
    let room: String
    let points: [(String, PostedLine)]
    var body: some View {
        let coords = ([room] + points.map { $0.0 }).compactMap(coordinates)
        let lat = coords.map { $0.0 }, lon = coords.map { $0.1 }
        HStack {
            GeometryReader { geo in
                Canvas { context, size in
                    var grid = Path()
                    for i in 0...10 {
                        let x = size.width * CGFloat(i) / 10
                        let y = size.height * CGFloat(i) / 10
                        grid.move(to: CGPoint(x: x,y: 0)); grid.addLine(to: CGPoint(x: x,y: size.height))
                        grid.move(to: CGPoint(x: 0,y: y)); grid.addLine(to: CGPoint(x: size.width,y: y))
                    }
                    context.stroke(grid, with: .color(.gray), lineWidth: 1)
                }
                ForEach(points.indices, id: \.self) { i in
                    if let coord = coordinates(points[i].0) {
                        Text(String(i+1)).padding(10).background(.yellow, in: Circle()).foregroundStyle(.black)
                            .position(x: geo.size.width * fraction(coord.1,lon),
                                      y: geo.size.height * (1-fraction(coord.0,lat)))
                    }
                }
            }
            VStack(alignment: .leading) {
                Text("North ↑").bold()
                if points.isEmpty { Text("No mapped lines yet.") }
                ForEach(points.indices, id: \.self) { i in Text("\(i+1) · \(points[i].1.body)").lineLimit(2) }
            }.frame(width: 500)
        }
    }
    func fraction(_ v: Double, _ values: [Double]) -> CGFloat {
        guard let lo = values.min(), let hi = values.max(), hi > lo else { return 0.5 }
        return CGFloat(0.1 + 0.8 * (v-lo)/(hi-lo))
    }
}
