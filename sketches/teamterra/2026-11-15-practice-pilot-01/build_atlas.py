#!/usr/bin/env python3
"""Build Team Terra's offline practice packet from its checked source files.

Python standard library only. Run from any directory:
    python3 /path/to/teamterra-atlas/build_atlas.py

The resulting HTML embeds the complete practice research, register-source
inventory, and Natural Earth land geometry. It makes no network requests.
"""

from collections import Counter
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent


def read_json(relative_path):
    return json.loads((ROOT / relative_path).read_text(encoding="utf-8"))


def embedded_json(value):
    # Keep JSON inert inside a script element, even if future source text has HTML.
    return (json.dumps(value, ensure_ascii=False, separators=(",", ":"))
            .replace("&", "\\u0026").replace("<", "\\u003c")
            .replace(">", "\\u003e").replace("\u2028", "\\u2028")
            .replace("\u2029", "\\u2029"))


def to_geojson(research):
    features = []
    for practice in research["practices"]:
        coordinates = practice["coordinates"]
        properties = {key: value for key, value in practice.items()
                      if key != "coordinates"}
        properties["coordinate_metadata"] = {
            key: value for key, value in coordinates.items()
            if key not in ("latitude", "longitude")
        }
        features.append({
            "type": "Feature", "id": practice["id"],
            "geometry": {
                "type": "Point",
                "coordinates": [coordinates["longitude"], coordinates["latitude"]],
            },
            "properties": properties,
        })
    return {
        "type": "FeatureCollection",
        "name": "Team Terra — practice pilot 01",
        "metadata": research["metadata"],
        "features": features,
    }


TEMPLATE = r'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="description" content="Team Terra's integration-ready practice packet: ten sourced architectural practices, city-level map points, and five register-source routes.">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
  <title>Team Terra · World Architects Atlas · Practice pilot 01</title>
  <style>
    :root{--navy:#07152f;--navy2:#102743;--paper:#f4f1e8;--white:#fffdf7;--gold:#ffd15c;--coral:#f24b32;--muted:#586574;--line:#d8d9d1;--soft:#ebece3;--focus:#12677a;--mono:ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",monospace;--sans:Inter,Aptos,"Segoe UI",Arial,sans-serif;--serif:Georgia,"Times New Roman",serif}
    *{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:24px}body{margin:0;color:var(--navy);background:var(--paper);font-family:var(--sans);line-height:1.5}button,input,a{-webkit-tap-highlight-color:transparent}button,input{font:inherit}button,a{touch-action:manipulation}button{cursor:pointer}a{color:inherit;text-underline-offset:4px}button:focus-visible,a:focus-visible,input:focus-visible,summary:focus-visible{outline:3px solid var(--focus);outline-offset:4px}button:disabled{opacity:.4;cursor:not-allowed}button{border:0}h1,h2,h3,p{margin-top:0}h1,h2,h3{line-height:1.13}svg{display:block}::selection{color:var(--navy);background:var(--gold)}
    .skip{position:absolute;z-index:100;left:20px;top:-80px;background:var(--gold);padding:12px 18px}.skip:focus{top:12px}.shell{width:min(1440px,calc(100% - 88px));margin:0 auto}.masthead{background:var(--navy);color:var(--paper);padding:28px 0 43px;overflow:hidden;position:relative}.masthead:after{content:"";height:3px;background:linear-gradient(90deg,var(--gold) 0 68%,var(--coral) 68% 78%,transparent 78%);position:absolute;bottom:0;left:0;right:0}.masthead-top{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:38px}.brand{display:flex;align-items:center;gap:13px;text-decoration:none}.brand-symbol{height:34px;width:34px;color:var(--gold)}.brand-word{font-size:15px;font-weight:800;letter-spacing:.2em}.packet-label{font:11px var(--mono);letter-spacing:.11em;color:#b3bfd0}.nav-links{display:flex;gap:26px;align-items:center;font-size:13px}.nav-links a{color:#d5dce4;text-decoration:none;padding:9px 0}.nav-links a:hover{color:var(--gold)}.hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:30px;align-items:end}.eyebrow{font:11px var(--mono);letter-spacing:.14em;text-transform:uppercase;margin:0 0 14px;color:var(--muted)}.hero .eyebrow{color:var(--gold)}h1{font-size:clamp(36px,4.7vw,65px);font-weight:500;letter-spacing:-.045em;margin:0 0 13px}.hero h1 span{font-family:var(--serif);font-style:italic;color:var(--gold)}.hero-deck{max-width:680px;color:#bac7d6;font-size:15px;margin-bottom:0}.hero-side{min-width:210px;padding-left:30px;border-left:1px solid #3a4960}.pilot-no{font:11px var(--mono);color:#b1bed1;letter-spacing:.12em;margin-bottom:13px}.pilot-no strong{display:block;color:var(--paper);font-family:var(--sans);font-size:22px;letter-spacing:-.025em;font-weight:600;margin-bottom:8px}.checked{font:11px var(--mono);color:#b1bed1;line-height:1.7}.checked span{color:var(--gold)}
    main{padding:30px 0 52px}.overview{display:flex;gap:0;align-items:center;justify-content:space-between;padding:0 0 26px;border-bottom:1px solid var(--line);margin-bottom:26px}.stats{display:flex;gap:38px}.stat{display:flex;align-items:baseline;gap:9px}.stat strong{font:38px var(--serif);letter-spacing:-.04em}.stat span{font-size:12px;color:var(--muted)}.scope-note{max-width:395px;font-size:12px;line-height:1.5;color:var(--muted);margin:0;text-align:right}.scope-note strong{color:var(--navy);font-weight:600}.toolbar{display:flex;gap:16px;align-items:center;justify-content:space-between;margin-bottom:16px}.search-wrap{position:relative;flex:1;max-width:520px}.search-wrap svg{position:absolute;left:16px;top:15px;width:18px;height:18px;color:#617080}.search-input{appearance:none;width:100%;height:49px;border:1px solid #c5cbd0;border-radius:3px;padding:0 46px;background:var(--white);color:var(--navy);font-size:14px}.search-input::placeholder{color:#717c85}.search-key{position:absolute;right:14px;top:12px;font:12px var(--mono);padding:1px 6px;border:1px solid #d3d6d7;border-radius:3px;color:#77808a}.export-buttons{display:flex;gap:9px}.action{border:1px solid #b7c0c9;border-radius:3px;min-height:44px;padding:10px 15px;font-size:12px;font-weight:650;background:transparent;display:inline-flex;align-items:center;justify-content:center;gap:9px;text-decoration:none}.action:hover{background:#e4e8e3;border-color:#7b8a9b}.action.primary{background:var(--navy);color:var(--paper);border-color:var(--navy)}.action.primary:hover{background:#183654}.action svg{width:15px;height:15px}.filter-line{display:flex;flex-wrap:wrap;align-items:center;gap:16px;justify-content:space-between;margin-bottom:19px}.filters{display:flex;gap:7px;flex-wrap:wrap}.filter{padding:8px 13px;min-height:40px;background:transparent;border:1px solid #d2d5cf;border-radius:24px;font-size:12px;color:#4e5d6b}.filter:hover{border-color:#8b97a0;color:var(--navy)}.filter[aria-pressed="true"]{background:var(--navy);border-color:var(--navy);color:var(--paper)}.filter-count{margin-left:5px;font-family:var(--mono);font-size:10px;opacity:.65}.result-status{font:11px var(--mono);color:var(--muted);margin:0}.reset{background:none;border:0;text-decoration:underline;text-underline-offset:3px;font-size:12px;padding:8px;color:var(--muted)}
    .atlas-grid{display:grid;grid-template-columns:minmax(0,1fr) 345px;gap:19px;align-items:start}.map-panel{margin:0;background:var(--navy);border:1px solid #1a304d;border-radius:5px;overflow:hidden;min-width:0;position:relative;color:var(--paper)}.map-topline{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:17px 20px;border-bottom:1px solid rgba(182,201,219,.15);font:10px var(--mono);letter-spacing:.08em;color:#9eb0c5}.map-topline strong{font-weight:400;color:#e5e9ed}.map-stage{position:relative;isolation:isolate}.world-map{width:100%;height:auto;min-height:250px;background:radial-gradient(ellipse at 50% 50%,#142f49 0,#0b1d36 74%)}.land{fill:#2c4357;stroke:#597082;stroke-width:.5;stroke-linejoin:round}.graticule{fill:none;stroke:#8ba1b8;stroke-width:.5;opacity:.17}.map-axis{font:9px var(--mono);fill:#7890a7}.marker{cursor:pointer;outline:none}.marker-hit{fill:transparent}.marker-ring{fill:none;stroke:var(--gold);stroke-width:1.2;opacity:.38}.marker-dot{fill:var(--gold);stroke:#07152f;stroke-width:2}.marker[aria-pressed="true"] .marker-ring{stroke:var(--coral);stroke-width:2;opacity:1}.marker[aria-pressed="true"] .marker-dot{fill:var(--coral)}.marker:focus-visible .marker-ring{stroke:#fff;stroke-width:4;opacity:1}.marker:focus-visible .marker-dot{stroke:#fff;stroke-width:3}.marker-label{font:13px var(--sans);font-weight:600;fill:#fff7dd;paint-order:stroke;stroke:#07152f;stroke-width:4;stroke-linejoin:round;pointer-events:none}.marker:hover .marker-dot{fill:#fff9e7}.marker[hidden]{display:none}.map-bottom{padding:13px 19px 14px;border-top:1px solid rgba(182,201,219,.15);display:flex;flex-wrap:wrap;gap:14px;justify-content:space-between;font-size:10px;color:#a8b9cc;line-height:1.6}.legend{display:flex;align-items:center;gap:7px}.legend-dot{width:6px;height:6px;display:inline-block;border-radius:50%;background:var(--gold)}.map-source-links{display:flex;flex-wrap:wrap;gap:12px}.map-source-links a{color:#d2dce6;text-underline-offset:3px}.map-scope{padding:16px 20px;background:#0b1b33;color:#b8c5d4;font-size:11px;line-height:1.6;border-top:1px solid rgba(182,201,219,.15)}.map-scope b{font-weight:600;color:var(--gold)}
    .detail-card{background:var(--white);border:1px solid #d4d8d3;border-top:3px solid var(--coral);border-radius:4px;padding:23px 23px 22px;min-height:460px;scroll-margin-top:20px}.detail-kicker{font:10px var(--mono);text-transform:uppercase;letter-spacing:.12em;color:#7b604b;margin-bottom:17px;display:flex;gap:7px;align-items:center}.detail-kicker:before{content:"";width:6px;height:6px;border-radius:50%;background:var(--coral)}.detail-card h2{font-family:var(--serif);font-size:31px;font-weight:500;letter-spacing:-.025em;margin-bottom:10px}.detail-place{color:#46596a;font-size:13px;margin-bottom:18px}.detail-discipline{font-size:13px;line-height:1.7;margin-bottom:20px}.detail-row{border-top:1px solid #e0e3dc;padding-top:13px;margin-top:13px}.detail-label{display:block;font:9px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:#73808b;margin-bottom:6px}.detail-value{font-size:12px;line-height:1.65;margin:0}.detail-role{font-size:12px;margin:0;line-height:1.6}.status-pill{display:inline-flex;background:#f0eadd;border:1px solid #ded3c1;border-radius:3px;font-size:10px;font-weight:600;padding:3px 7px;color:#6a553b;margin-bottom:6px}.detail-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:20px}.detail-actions a{font-size:11px;padding:9px 11px;min-height:40px}.source-date{font:10px var(--mono);color:#73808b;margin:15px 0 0;line-height:1.5}.roster-details{margin-top:13px;border-top:1px solid #e0e3dc;padding-top:10px}.roster-details summary{font-size:11px;cursor:pointer;color:#4d6376;padding:4px 0}.roster-details p{font-size:11px;line-height:1.65;color:#5a6875;margin:9px 0 0}.detail-empty{color:var(--muted);font-size:13px;line-height:1.6}.entity-line{font:10px var(--mono);color:#6f7a82;margin-top:18px}
    .section-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin:33px 0 17px}.section-heading h2{font-size:26px;font-family:var(--serif);font-weight:500;letter-spacing:-.02em;margin:0}.section-heading p{margin:6px 0 0;color:var(--muted);font-size:12px;max-width:740px}.section-heading .section-number{font:10px var(--mono);color:#8a939a;letter-spacing:.08em;white-space:nowrap}.practices-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.practice-card{position:relative;text-align:left;background:transparent;border:1px solid #d0d5cf;border-radius:3px;padding:15px 16px 16px;min-height:118px;color:var(--navy);transition:background .15s,border-color .15s}.practice-card:hover{background:var(--white);border-color:#8999a4}.practice-card[aria-pressed="true"]{background:var(--white);border-color:var(--coral);box-shadow:inset 3px 0 0 var(--coral)}.practice-top{display:flex;align-items:center;justify-content:space-between;font:9px var(--mono);letter-spacing:.07em;color:#6c7b86;margin-bottom:8px}.practice-index{color:#919992}.practice-card h3{font-size:17px;font-weight:600;letter-spacing:-.025em;margin:0 0 7px}.practice-card p{font-size:11px;color:#60707c;margin:0}.practice-card .card-arrow{position:absolute;bottom:14px;right:15px;font-size:17px;color:#81908c}.practice-card[aria-pressed="true"] .card-arrow{color:var(--coral)}.no-results{grid-column:1/-1;border:1px dashed #b9c3c1;padding:30px;text-align:center;color:var(--muted)}.no-results p{margin-bottom:8px;font-size:14px}
    .inventory{margin-top:42px;border-top:1px solid #cbd2cb;padding-top:8px}.inventory .section-heading{margin-top:25px}.inventory-note{padding:14px 17px;background:#e8e9df;border-left:3px solid #adbaab;font-size:12px;line-height:1.65;margin-bottom:19px;color:#4e5d62}.inventory-note strong{color:var(--navy)}.source-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}.source-card{border:1px solid #ced5cd;background:#f7f7ef;border-radius:4px;padding:19px 19px 17px;display:flex;flex-direction:column;min-width:0}.source-meta{font:9px var(--mono);letter-spacing:.09em;color:#728076;margin-bottom:11px;text-transform:uppercase}.source-card h3{font-size:18px;letter-spacing:-.02em;margin:0 0 7px}.source-name{font-size:11px;color:#65736b;line-height:1.55;min-height:34px;margin-bottom:13px}.route-state{align-self:flex-start;border:1px solid #d9ceb1;border-radius:3px;font-size:10px;background:#f2ebd9;color:#6b5829;padding:4px 7px;line-height:1.4;margin-bottom:15px}.source-card details{border-top:1px solid #dce1d5;padding-top:9px;margin-bottom:12px}.source-card summary{cursor:pointer;font-size:11px;font-weight:600;padding:5px 0}.source-card details p{font-size:11px;color:#52625d;line-height:1.65;margin:9px 0}.source-card details b{display:block;color:#334d45;font-size:10px;letter-spacing:.04em;margin-bottom:3px}.evidence-list{padding-left:17px;font-size:10px;line-height:1.6;margin:8px 0;overflow-wrap:anywhere}.evidence-list li{margin-bottom:6px}.source-card-actions{display:flex;flex-wrap:wrap;gap:13px;margin-top:auto;padding-top:4px;font-size:11px}.inventory-actions{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:18px;margin-top:19px}.inventory-actions p{margin:0;font-size:11px;color:var(--muted);max-width:620px}.integration{margin-top:38px;border-top:1px solid var(--line);padding-top:27px;display:grid;grid-template-columns:1fr 1fr;gap:35px}.integration h2{font-family:var(--serif);font-size:24px;font-weight:500;margin:0 0 10px}.integration p{font-size:12px;color:#5b6973;line-height:1.75;margin:0}.data-notes{font-size:11px;line-height:1.75;color:#607077}.data-notes a{color:#334f62}.data-notes p+p{margin-top:8px}.footer{margin-top:30px;padding-top:16px;border-top:1px solid var(--line);display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;font:10px var(--mono);color:#7b8588;letter-spacing:.04em}.footer strong{color:#405566;font-weight:400}.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:var(--navy);border:1px solid #516276;box-shadow:0 5px 24px #07152f22;color:var(--paper);font-size:12px;padding:12px 20px;border-radius:5px;z-index:50;max-width:calc(100% - 32px)}.toast[hidden]{display:none}
    @media(min-width:1600px){.world-map{min-height:430px}.detail-card{min-height:530px}}
    @media(max-width:1150px){.shell{width:calc(100% - 48px)}.atlas-grid{grid-template-columns:minmax(0,1fr) 300px}.detail-card{padding:20px}.detail-card h2{font-size:28px}.practices-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.hero-side{min-width:185px;padding-left:23px}.source-cards{grid-template-columns:repeat(2,minmax(0,1fr))}.world-map{min-height:270px}}
    @media(max-width:850px){.atlas-grid{grid-template-columns:1fr}.detail-card{min-height:0;display:grid;grid-template-columns:1fr 1fr;gap:0 24px}.detail-card .detail-kicker,.detail-card h2,.detail-card .detail-place,.detail-card .detail-discipline{grid-column:1}.detail-card .detail-row.location-row{grid-column:2;grid-row:2/5;border:0;margin:0;padding:0}.detail-card .registration-row{grid-column:2;grid-row:5/7}.detail-card .roster-details{grid-column:1/-1}.detail-actions{grid-column:1}.source-date{grid-column:2;align-self:center}.entity-line{grid-column:1/-1;margin-bottom:0}.world-map{min-height:0}.overview{align-items:flex-end}.stats{gap:25px}.scope-note{max-width:300px}.hero-side{display:none}.masthead{padding-bottom:33px}.hero-deck{max-width:620px}.toolbar{align-items:stretch}.search-wrap{max-width:none}.action{padding:10px 12px}.nav-links{gap:20px}.practices-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.integration{gap:24px}}
    @media(max-width:580px){.shell{width:calc(100% - 32px)}.masthead{padding-top:21px;padding-bottom:29px}.masthead-top{margin-bottom:31px}.brand-word{font-size:13px}.brand-symbol{width:29px;height:29px}.packet-label{display:none}.nav-links{gap:14px;font-size:11px}.nav-links .nav-practices{display:none}h1{font-size:41px;max-width:360px;line-height:1.07}.hero-deck{font-size:13px;max-width:380px}.hero .eyebrow{font-size:10px;margin-bottom:14px}main{padding-top:21px}.overview{display:block;margin-bottom:20px;padding-bottom:19px}.stats{justify-content:space-between;gap:10px}.stat{gap:8px}.stat strong{font-size:33px}.stat span{font-size:11px}.scope-note{text-align:left;max-width:none;font-size:11px;margin-top:14px}.toolbar{flex-direction:column;gap:11px}.export-buttons{justify-content:stretch}.export-buttons button{flex:1;min-height:42px}.search-input{height:47px}.filter-line{gap:11px}.filters{gap:6px}.filter{font-size:11px;padding:7px 11px;min-height:37px}.filter-count{font-size:9px}.result-status{font-size:10px}.map-topline{padding:13px 14px;font-size:8px;letter-spacing:.04em}.map-topline .map-projection{display:none}.map-bottom{padding:10px 13px;font-size:9px;gap:7px}.map-source-links{gap:10px}.map-scope{padding:12px 14px;font-size:10px}.detail-card{display:block;padding:20px}.detail-card .detail-row.location-row{border-top:1px solid #e0e3dc;padding-top:13px;margin-top:13px}.detail-card h2{font-size:29px}.detail-kicker{margin-bottom:13px}.detail-discipline{margin-bottom:14px}.detail-card .source-date{margin-top:14px}.practices-grid{gap:8px}.practice-card{padding:13px 12px;min-height:124px}.practice-card h3{font-size:15px}.practice-card p{font-size:10px;padding-right:10px}.practice-top{font-size:8px}.practice-card .card-arrow{font-size:14px;right:12px;bottom:12px}.section-heading h2{font-size:25px}.section-heading .section-number{display:none}.section-heading{margin-top:28px}.section-heading p{font-size:11px}.inventory{margin-top:31px}.source-cards{grid-template-columns:1fr}.source-card{padding:18px}.source-name{min-height:0}.source-card h3{font-size:19px}.inventory-actions{display:block}.inventory-actions .action{margin-bottom:12px;width:100%}.integration{grid-template-columns:1fr;gap:21px;margin-top:28px;padding-top:23px}.footer{font-size:9px;line-height:1.7}.search-key{display:none}.marker-label{font-size:16px}.marker-dot{r:8}.marker-ring{r:13}}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{transition:none!important}}
    @media print{.masthead{print-color-adjust:exact;-webkit-print-color-adjust:exact}.shell{width:100%}.nav-links,.toolbar,.filters,.reset,.toast,.inventory-actions button{display:none}.atlas-grid{grid-template-columns:1fr}.map-panel{print-color-adjust:exact;-webkit-print-color-adjust:exact}.detail-card{break-inside:avoid}.practices-grid{grid-template-columns:repeat(3,1fr)}.source-cards{grid-template-columns:repeat(2,1fr)}.source-card,.practice-card{break-inside:avoid}.source-card details{display:block}main{padding-bottom:0}}
  </style>
</head>
<body>
  <a href="#atlas" class="skip">Skip to the atlas</a>
  <header class="masthead">
    <div class="shell">
      <div class="masthead-top">
        <a class="brand" href="#top" aria-label="Team Terra, back to top">
          <svg class="brand-symbol" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="1.2"/><ellipse cx="20" cy="20" rx="8" ry="17" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M4 14h32M4 26h32M20 3v34" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="27" cy="11" r="4" fill="#f24b32" stroke="#07152f" stroke-width="2"/></svg>
          <span class="brand-word">TEAM TERRA</span>
          <span class="packet-label">/ PRACTICE PACKET</span>
        </a>
        <nav class="nav-links" aria-label="Page sections"><a href="#atlas">Atlas</a><a href="#practices" class="nav-practices">Practices</a><a href="#sources">Sources</a></nav>
      </div>
      <div class="hero" id="top">
        <div><p class="eyebrow">An integration-ready research packet</p><h1>World Architects <span>Atlas</span></h1><p class="hero-deck">A small, sourced beginning. Explore ten architectural practices across five regions, with the evidence and location context kept close.</p></div>
        <div class="hero-side"><div class="pilot-no"><strong>Practice pilot 01</strong>10 PRACTICES / 10 COUNTRIES</div><div class="checked">SOURCES CHECKED<br><span>15 NOVEMBER 2026</span></div></div>
      </div>
    </div>
  </header>
  <main class="shell">
    <section class="overview" aria-label="Pilot scope">
      <div class="stats"><div class="stat"><strong id="total-practices">10</strong><span>practices</span></div><div class="stat"><strong id="total-countries">10</strong><span>countries</span></div><div class="stat"><strong id="total-regions">5</strong><span>regions</span></div></div>
      <p class="scope-note"><strong>Practice pilot 01.</strong> An editorial sample of professional practices. Markers represent approximate cities. Registration is unverified.</p>
    </section>
    <section id="atlas" aria-label="Interactive practice atlas">
      <div class="toolbar">
        <div class="search-wrap"><label for="search" class="visually-hidden">Search practices, cities, countries, or disciplines</label><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input id="search" type="search" class="search-input" placeholder="Find a practice, place, or discipline" autocomplete="off" spellcheck="false"><span class="search-key" aria-hidden="true">/</span></div>
        <div class="export-buttons"><button id="export-json" class="action"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M10 2v10m-4-4 4 4 4-4M3 13v4h14v-4"/></svg>Export JSON</button><button id="export-geojson" class="action primary">Export GeoJSON <span aria-hidden="true">↗</span></button></div>
      </div>
      <div class="filter-line"><div id="region-filters" class="filters" role="group" aria-label="Filter by region"></div><p class="result-status" id="result-status" role="status" aria-live="polite" aria-atomic="true"></p></div>
      <div class="atlas-grid">
        <figure class="map-panel">
          <div class="map-topline"><strong>CITY-LEVEL PRACTICE MAP</strong><span class="map-projection">WORLD VIEW / 1:110M LAND</span><span>01—10</span></div>
          <div class="map-stage"><svg id="world-map" class="world-map" viewBox="0 0 1200 600" role="group" aria-labelledby="map-title map-desc"><title id="map-title">Ten practices, mapped to their cities</title><desc id="map-desc">Approximate city markers on a Natural Earth world land map. Select a marker or a practice card to inspect its sources. Markers do not locate individual offices. The practice cards offer the same selections.</desc><defs><clipPath id="world-clip"><rect width="1200" height="600"/></clipPath></defs><g clip-path="url(#world-clip)"><g id="graticules" aria-hidden="true"></g><g id="land" aria-hidden="true"></g><g id="markers"></g></g></svg></div>
          <figcaption class="map-bottom"><span class="legend"><span class="legend-dot"></span>Approximate city reference · select to inspect</span><span class="map-source-links"><a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer">GeoNames</a><a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">Natural Earth</a></span></figcaption>
          <div class="map-scope"><b>Practices, with context.</b> These records describe professional practices, not individual architects or buildings. City points indicate geography; they do not establish a street address or registration.</div>
        </figure>
        <aside id="practice-detail" class="detail-card" aria-label="Selected practice details" aria-live="polite" aria-atomic="false"></aside>
      </div>
    </section>
    <section id="practices" aria-labelledby="practices-title"><div class="section-heading"><div><h2 id="practices-title">The practice sample</h2><p>Two practices per region. Select a card to read its location, discipline, and source record.</p></div><span class="section-number">01 / PRACTICES</span></div><div class="practices-grid" id="practice-list"></div></section>
    <section id="sources" class="inventory" aria-labelledby="sources-title"><div class="section-heading"><div><p class="eyebrow">A separate source inventory</p><h2 id="sources-title">Where registration can be checked</h2><p>Five jurisdictional source routes for the atlas's next stage.</p></div><span class="section-number">02 / SOURCE ROUTES</span></div><div class="inventory-note"><strong>These are source cards, not additional mapped practices.</strong> No individual registrations have been verified or imported. A professional registration, a practice, and an office are separate records; jurisdiction does not establish office location.</div><div id="source-cards" class="source-cards"></div><div class="inventory-actions"><button id="export-inventory" class="action">Download source inventory JSON <span aria-hidden="true">↗</span></button><p>The linked inventory preserves each authority's status definitions, access and reuse context, evidence URLs, and next research step.</p></div></section>
    <section class="integration" aria-labelledby="integration-title"><div><h2 id="integration-title">Made to join the shared atlas.</h2><p>This portable research preview carries ten practice records, a geographic layer, and five register-source routes for review and integration into Team Terra's shared work. It is an intentionally small sample, with sources retained for the next contributor.</p></div><div class="data-notes"><p><strong>Practice facts:</strong> the official practice and contact pages linked in each record. Sources checked <strong>15 November 2026</strong>; a website listing does not confirm current registration.</p><p><strong>City reference points:</strong> <a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer">GeoNames</a>, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. Approximate populated-place coordinates, not surveyed city centroids or office pins.</p><p><strong>Land geometry:</strong> <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">Natural Earth</a>, 1:110 million; <a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noopener noreferrer">public domain</a>. Land outlines carry no claim about political boundaries.</p></div></section>
    <footer class="footer"><strong>TEAM TERRA / PRACTICE PILOT 01</strong><span>10 SOURCED PRACTICES · 5 REGISTER ROUTES · PORTABLE PREVIEW</span></footer>
  </main>
  <div id="toast" class="toast" role="status" aria-live="polite" hidden></div>
  <noscript><p style="padding:24px">This atlas uses JavaScript to draw its embedded map, display the embedded records, and export data. Its ten-practice dataset and source inventory are embedded in this file. Enable JavaScript to explore them.</p></noscript>
  <script type="application/json" id="practice-data">__PRACTICE_DATA__</script>
  <script type="application/json" id="register-data">__REGISTER_DATA__</script>
  <script type="application/json" id="land-data">__LAND_DATA__</script>
  <script type="application/json" id="geometry-metadata">__GEOMETRY_METADATA__</script>
  <script>
  (() => {
    'use strict';
    const research = JSON.parse(document.getElementById('practice-data').textContent);
    const inventory = JSON.parse(document.getElementById('register-data').textContent);
    const land = JSON.parse(document.getElementById('land-data').textContent);
    const practices = research.practices;
    const regions = ['Europe','Americas','Africa','Asia','Oceania'];
    const ns = 'http://www.w3.org/2000/svg';
    const state = {region:'All',query:'',selected:practices[0].id};
    let visible = practices.slice();
    let toastTimer;
    const $ = id => document.getElementById(id);
    const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const svgElement = (tag, attrs={}) => {const node=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,String(value)));return node;};
    const element = (tag, className, text) => {const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
    const link = (label,url,className='') => {const node=element('a',className,label);node.href=url;node.target='_blank';node.rel='noopener noreferrer';return node;};
    const project = (lon,lat) => [(lon+180)*1200/360,(90-lat)*600/180];
    const humanDate = value => new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
    function pathForRing(ring){return ring.map((point,index)=>{const [x,y]=project(point[0],point[1]);return (index?'L':'M')+x.toFixed(2)+','+y.toFixed(2);}).join('')+'Z';}
    function drawMap(){
      for(let lon=-150;lon<=150;lon+=30){const [x]=project(lon,0);$('graticules').append(svgElement('path',{d:`M${x},0V600`,class:'graticule'}));}
      for(let lat=-60;lat<=60;lat+=30){const [,y]=project(0,lat);$('graticules').append(svgElement('path',{d:`M0,${y}H1200`,class:'graticule'}));const label=svgElement('text',{x:12,y:y-6,class:'map-axis'});label.textContent=lat===0?'0°':Math.abs(lat)+'°'+(lat>0?'N':'S');$('graticules').append(label);}
      for(const feature of land.features){const geometry=feature.geometry;if(!geometry)continue;const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.type==='MultiPolygon'?geometry.coordinates:[];const d=polygons.map(polygon=>polygon.map(pathForRing).join('')).join('');if(d)$('land').append(svgElement('path',{d,class:'land','fill-rule':'evenodd'}));}
      practices.forEach(practice=>{
        const [x,y]=project(practice.coordinates.longitude,practice.coordinates.latitude);
        const group=svgElement('g',{class:'marker',transform:`translate(${x.toFixed(2)} ${y.toFixed(2)})`,tabindex:'0',role:'button','aria-label':`Select ${practice.name}, ${practice.city}, ${practice.country}. Approximate city location.`,'aria-pressed':'false','data-id':practice.id});
        const title=svgElement('title');title.textContent=`${practice.name} · ${practice.city}`;
        group.append(title,svgElement('circle',{r:19,class:'marker-hit'}),svgElement('circle',{r:11,class:'marker-ring'}),svgElement('circle',{r:5.5,class:'marker-dot'}));
        const label=svgElement('text',{x:x>1080?-15:15,y:-13,'text-anchor':x>1080?'end':'start',class:'marker-label','aria-hidden':'true'});label.textContent=practice.city;label.style.display='none';
        group.append(label);group.addEventListener('click',()=>select(practice.id));group.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();select(practice.id);}});$('markers').append(group);
      });
    }
    function renderFilters(){
      ['All',...regions].forEach(region=>{const count=region==='All'?practices.length:practices.filter(p=>p.region===region).length;const button=element('button','filter');button.type='button';button.dataset.region=region;button.setAttribute('aria-pressed',String(state.region===region));button.append(document.createTextNode(region),element('span','filter-count',String(count)));button.addEventListener('click',()=>{state.region=region;update();});$('region-filters').append(button);});
    }
    function renderList(){
      const list=$('practice-list');list.replaceChildren();
      if(!visible.length){const empty=element('div','no-results');empty.append(element('p','',`No practices match “${state.query || state.region}”.`));const button=element('button','reset','Reset filters');button.type='button';button.addEventListener('click',reset);empty.append(button);list.append(empty);return;}
      visible.forEach(practice=>{const index=practices.findIndex(p=>p.id===practice.id)+1;const button=element('button','practice-card');button.type='button';button.dataset.id=practice.id;button.setAttribute('aria-pressed',String(practice.id===state.selected));button.setAttribute('aria-label',`Inspect ${practice.name}, ${practice.city}, ${practice.country}`);const top=element('div','practice-top');top.append(element('span','',practice.region),element('span','practice-index',String(index).padStart(2,'0')));button.append(top,element('h3','',practice.name),element('p','',`${practice.city}, ${practice.country}`),element('span','card-arrow','↗'));button.addEventListener('click',()=>select(practice.id));list.append(button);});
    }
    function detailRow(label,text,extraClass=''){const row=element('div','detail-row '+extraClass);row.append(element('span','detail-label',label),element('p','detail-value',text));return row;}
    function renderDetail(){
      const container=$('practice-detail');container.replaceChildren();const practice=practices.find(p=>p.id===state.selected);
      if(!practice){container.append(element('div','detail-kicker','Practice record'),element('h2','','Find your next practice.'),element('p','detail-empty','Change the region or search terms to explore the sample. The ten records remain available in the full pilot.'));return;}
      container.append(element('div','detail-kicker','Selected practice · '+practice.region),element('h2','',practice.name),element('p','detail-place',`${practice.city} / ${practice.country}`),element('p','detail-discipline',practice.discipline_summary));
      container.append(detailRow('Professional public location',practice.professional_public_location,'location-row'));
      const registration=element('div','detail-row registration-row');registration.append(element('span','detail-label','Registration status'),element('span','status-pill','Not verified'),element('p','detail-value','This record checks practice sources and city geography. It is not a registration check.'));container.append(registration);
      const roster=element('details','roster-details');roster.append(element('summary','','Practice role and roster context'),element('p','',practice.current_roster_note || 'Current roster not verified.'));
      if(practice.key_architect){const person=practice.key_architect;const p=element('p','detail-role',`${person.name} — ${person.role_as_listed}. `);p.append(link('Official role source',person.source_url || person.source_urls[0]));roster.append(p);}
      if(practice.additional_key_architects){practice.additional_key_architects.forEach(person=>{const p=element('p','detail-role',`${person.name} — ${person.role_as_listed}. `);p.append(link('Official role source',person.source_url));roster.append(p);});}
      container.append(roster);
      const actions=element('div','detail-actions');actions.append(link('Official practice source ↗',practice.source_url,'action primary'),link('City reference ↗',practice.coordinates.source_url,'action'));container.append(actions,element('p','source-date','Sources checked '+humanDate(practice.source_checked_date)));
      const sourceDetail=element('details','roster-details');sourceDetail.append(element('summary','','All source links'));const links=element('ul','evidence-list');const urls=[...new Set([practice.source_url,...(practice.additional_source_urls || []),practice.discipline_source_url,practice.coordinates.source_url])];urls.forEach(url=>{const li=element('li');li.append(link(url,url));links.append(li);});sourceDetail.append(links);container.append(sourceDetail,element('p','entity-line','ENTITY: PRACTICE · MARKER: APPROXIMATE CITY'));
    }
    function renderSelection(){
      document.querySelectorAll('.marker').forEach(group=>{const active=group.dataset.id===state.selected;group.setAttribute('aria-pressed',String(active));const shown=visible.some(p=>p.id===group.dataset.id);group.toggleAttribute('hidden',!shown);group.setAttribute('tabindex',shown?'0':'-1');group.querySelector('.marker-label').style.display=active&&shown?'block':'none';});
      document.querySelectorAll('.practice-card').forEach(card=>card.setAttribute('aria-pressed',String(card.dataset.id===state.selected)));renderDetail();
    }
    function select(id){if(!visible.some(p=>p.id===id))return;state.selected=id;renderSelection();}
    function update(){
      const query=normalize(state.query).trim();visible=practices.filter(p=>(state.region==='All'||p.region===state.region)&&(!query||normalize([p.name,p.city,p.country,p.region,p.discipline_summary,p.professional_public_location].join(' ')).includes(query)));
      if(!visible.some(p=>p.id===state.selected))state.selected=visible[0]?.id || null;
      document.querySelectorAll('.filter').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.region===state.region)));
      $('result-status').textContent=`${visible.length} of ${practices.length} practices · exports follow filters`;
      $('export-json').disabled=!visible.length;$('export-geojson').disabled=!visible.length;renderList();renderSelection();
    }
    function reset(){state.region='All';state.query='';$('search').value='';update();}
    function exportMetadata(){const counts={};visible.forEach(p=>{counts[p.region]=(counts[p.region] || 0)+1;});return {...research.metadata,record_count:visible.length,region_counts:counts,export_filter:{region:state.region,query:state.query},export_note:'This export follows the preview filters. City points are approximate and do not locate offices.'};}
    function makeGeoJSON(records,metadata){return {type:'FeatureCollection',name:'Team Terra — practice pilot 01',metadata,features:records.map(practice=>{const {coordinates,...properties}=practice;const {latitude,longitude,...coordinate_metadata}=coordinates;return {type:'Feature',id:practice.id,geometry:{type:'Point',coordinates:[longitude,latitude]},properties:{...properties,coordinate_metadata}};})};}
    function download(value,filename){const blob=new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast('Downloaded '+filename);}
    function showToast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>{$('toast').hidden=true;},3000);}
    const sourceShortNames={'uk-arb':'United Kingdom','us-ca-cab':'California, United States','au-nsw-arb':'New South Wales, Australia','in-coa':'India','za-sacap':'South Africa'};
    const stateLabels={permission_required:'Permission needed for broader reuse',documented_monthly_route_file_uninspected:'Monthly route · file uninspected',subscription_lookup_no_bulk_verified:'Lookup access · bulk reuse unverified',no_bulk_verified_live_lookup_preferred:'Live lookup preferred · bulk unverified'};
    function renderSources(){
      inventory.sources.forEach((source,index)=>{const card=element('article','source-card');card.append(element('div','source-meta',`${String(index+1).padStart(2,'0')} / ${source.region} / SOURCE ROUTE`),element('h3','',sourceShortNames[source.id] || source.jurisdiction),element('p','source-name',source.name),element('div','route-state',stateLabels[source.bulk_state] || 'Access route under review'));
        const details=element('details');details.append(element('summary','','Status, reuse, and evidence'));
        [['What the source verifies',source.status_semantics],['Access and reuse',source.bulk_reuse_summary],['Next research step',source.recommended_next_step]].forEach(([label,value])=>{const p=element('p');p.append(element('b','',label),document.createTextNode(value));details.append(p);});
        const evidence=element('ul','evidence-list');source.evidence_urls.forEach((url,i)=>{const li=element('li');li.append(link('Evidence '+(i+1)+' · '+new URL(url).hostname,url));evidence.append(li);});details.append(evidence,element('p','','Checked '+humanDate(source.checked_date)));card.append(details);
        const actions=element('div','source-card-actions');actions.append(link('Authority source ↗',source.official_url));source.lookup_urls.forEach((url,index)=>actions.append(link(source.lookup_urls.length>1?'Lookup '+(index+1)+' ↗':'Open lookup ↗',url)));card.append(actions);$('source-cards').append(card);
      });
    }
    $('total-practices').textContent=String(practices.length);$('total-countries').textContent=String(new Set(practices.map(p=>p.country)).size);$('total-regions').textContent=String(new Set(practices.map(p=>p.region)).size);
    $('search').addEventListener('input',event=>{state.query=event.target.value;update();});
    document.addEventListener('keydown',event=>{if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){event.preventDefault();$('search').focus();}});
    $('export-json').addEventListener('click',()=>download({metadata:exportMetadata(),practices:visible},'team-terra-practices.json'));
    $('export-geojson').addEventListener('click',()=>download(makeGeoJSON(visible,exportMetadata()),'team-terra-practices.geojson'));
    $('export-inventory').addEventListener('click',()=>download(inventory,'register-sources.json'));
    drawMap();renderFilters();renderSources();update();
  })();
  </script>
</body>
</html>
'''


def main():
    research = read_json("practices-research.json")
    inventory = read_json("register-sources.json")
    land = read_json("geometry/ne_110m_land.geojson")
    geometry_metadata = read_json("geometry/SOURCE-METADATA.json")
    practices = research["practices"]
    if len(practices) != 10 or len({p["id"] for p in practices}) != 10:
        raise ValueError("Practice pilot 01 requires ten uniquely identified practices.")
    if Counter(p["region"] for p in practices) != {"Europe":2,"Americas":2,"Africa":2,"Asia":2,"Oceania":2}:
        raise ValueError("The pilot must retain two practices in each of five regions.")
    if any(p["entity_type"] != "practice" or p["coordinates"]["is_office_location"] is not False for p in practices):
        raise ValueError("Pilot records must be practices with city-only coordinates.")
    if len(inventory["sources"]) != 5:
        raise ValueError("Five separate registration-source cards are required.")
    if land["type"] != "FeatureCollection" or not land["features"]:
        raise ValueError("Natural Earth land geometry is missing.")
    html = TEMPLATE
    for token, data in [
        ("__PRACTICE_DATA__", research), ("__REGISTER_DATA__", inventory),
        ("__LAND_DATA__", land), ("__GEOMETRY_METADATA__", geometry_metadata),
    ]:
        html = html.replace(token, embedded_json(data))
    html_path = ROOT / "Team-Terra-Atlas-Pilot.html"
    geojson_path = ROOT / "practices.geojson"
    html_path.write_text(html, encoding="utf-8")
    geojson_path.write_text(json.dumps(to_geojson(research), ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(json.dumps({
        "html": str(html_path), "html_bytes": html_path.stat().st_size,
        "geojson": str(geojson_path), "geojson_bytes": geojson_path.stat().st_size,
        "practice_count": len(practices), "source_cards": len(inventory["sources"]),
        "land_features": len(land["features"]),
    }))


if __name__ == "__main__":
    main()
