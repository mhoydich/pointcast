import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, u as unescapeHTML, b as addAttribute, e as renderHead } from './prerender_CmTjnOuJ.mjs';
import 'clsx';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';
import { p as pickDailyBlock } from './daily_2eiOMuEj.mjs';
import { S as STATIONS, b as filterBlocksForStation, j as STATION_SHORTCUTS, g as getStationPath } from './local_DC-fTB3e.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Tv = createComponent(async ($$result, $$props, $$slots) => {
  const blocks = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const heroBlocks = blocks.slice(0, 24);
  const tickerBlocks = blocks.slice(0, 60);
  const dailyBlock = pickDailyBlock(blocks);
  const prettyToday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Los_Angeles"
  }).format(/* @__PURE__ */ new Date()).toUpperCase();
  const polls = (await getCollection("polls", ({ data }) => !data.draft)).sort((a, b) => b.data.openedAt.getTime() - a.data.openedAt.getTime()).slice(0, 4);
  const slides = [];
  if (dailyBlock) {
    slides.push({ kind: "daily", block: dailyBlock });
  }
  {
    let blockIdx = 0;
    let pollIdx = 0;
    for (let i = slides.length; i < 28; i++) {
      if (i > 0 && i % 5 === 0 && pollIdx < polls.length) {
        slides.push({ kind: "poll", poll: polls[pollIdx++] });
        continue;
      }
      while (blockIdx < heroBlocks.length && dailyBlock && heroBlocks[blockIdx].data.id === dailyBlock.data.id) {
        blockIdx++;
      }
      if (blockIdx < heroBlocks.length) {
        slides.push({ kind: "block", block: heroBlocks[blockIdx++] });
      }
    }
  }
  const stationEntries = [...STATIONS].sort((a, b) => a.miles - b.miles).map((station, index) => {
    const stationBlocks = filterBlocksForStation(blocks, station);
    return {
      station,
      keyHint: STATION_SHORTCUTS[index] ?? String(index + 1),
      blockCount: stationBlocks.length,
      blocks: stationBlocks.slice(0, 8)
    };
  });
  const stationPayload = stationEntries.map(({ station, keyHint, blockCount, blocks: blocks2 }) => ({
    name: station.name,
    slug: station.slug,
    miles: station.miles,
    direction: station.direction,
    blurb: station.blurb,
    path: getStationPath(station),
    keyHint,
    blockCount,
    blocks: blocks2.map((block) => {
      const channel = CHANNELS[block.data.channel];
      return {
        id: block.data.id,
        title: block.data.title,
        dek: block.data.dek ?? null,
        type: block.data.type,
        mood: block.data.mood ?? null,
        location: block.data.meta?.location ?? null,
        thumbnail: block.data.media?.thumbnail ?? (block.data.noun ? `https://noun.pics/${block.data.noun}.svg` : null),
        path: `/b/${block.data.id}`,
        channel: {
          code: channel.code,
          name: channel.name,
          color600: channel.color600
        }
      };
    })
  }));
  return renderTemplate(_a || (_a = __template(['<html lang="en" data-astro-cid-evvcql4w> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#050404"><meta name="description" content="PointCast broadcast mode — ambient big-screen feed. Cast, AirPlay, or open on any smart TV."><meta property="og:title" content="PointCast · TV"><meta property="og:description" content="Ambient big-screen feed. Cast to any TV."><meta property="og:image" content="https://pointcast.xyz/images/og-home-v3.png"><title>PointCast · TV</title><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,500&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">', '</head> <body data-astro-cid-evvcql4w> <header class="top" data-astro-cid-evvcql4w> <div class="top__brand" data-astro-cid-evvcql4w>POINT<em data-astro-cid-evvcql4w>CAST</em></div> <div class="top__live" data-astro-cid-evvcql4w> <span class="top__live-dot" aria-hidden="true" data-astro-cid-evvcql4w></span>\nLIVE · TV\n</div> <button class="top__stations-btn" id="tv-stations-toggle" type="button" aria-controls="tv-stations-index" data-astro-cid-evvcql4w>\nSTATIONS\n</button> <a class="top__asset-link" href="/tv/assets" data-astro-cid-evvcql4w>ASSETS</a> <div class="top__presence" id="tv-presence" aria-live="polite" data-astro-cid-evvcql4w> <span class="top__presence-label" data-astro-cid-evvcql4w>WATCHING</span> <span class="top__presence-constellation" id="tv-presence-constellation" aria-label="Watcher noun constellation" data-astro-cid-evvcql4w> ', ' </span> <span class="top__presence-num" id="tv-presence-num" data-astro-cid-evvcql4w>—</span> </div> <div class="top__spacer" data-astro-cid-evvcql4w></div> <div class="top__date" id="tv-date" data-astro-cid-evvcql4w>—</div> <div class="top__time" id="tv-time" data-astro-cid-evvcql4w>—</div> </header> <main class="hero" aria-label="PointCast broadcast slides" data-astro-cid-evvcql4w> <div class="progress" data-astro-cid-evvcql4w><div class="progress__bar" id="tv-progress" data-astro-cid-evvcql4w></div></div> <div class="hero__global" id="tv-global-layer" data-astro-cid-evvcql4w> ', ' </div> <section class="stations-index" id="tv-stations-index" hidden aria-label="Stations index" data-astro-cid-evvcql4w> <div class="stations-index__head" data-astro-cid-evvcql4w> <div data-astro-cid-evvcql4w> <p class="stations-index__lede" data-astro-cid-evvcql4w>15 nearby channels · keyed like presets</p> <h2 class="stations-index__title" data-astro-cid-evvcql4w>Stations <em data-astro-cid-evvcql4w>in range</em></h2> </div> <p class="stations-index__legend" data-astro-cid-evvcql4w>S or swipe up · 1-9 then QWERTY · Esc to back out</p> </div> <div class="stations-grid" data-astro-cid-evvcql4w> ', ' </div> </section> <section class="station-feed" id="tv-station-feed" hidden aria-label="Station feed" data-astro-cid-evvcql4w> <div class="station-feed__banner" data-astro-cid-evvcql4w> <div class="station-feed__banner-main" data-astro-cid-evvcql4w> <span class="station-feed__eyebrow" data-astro-cid-evvcql4w>NOW VIEWING</span> <h2 class="station-feed__name" id="tv-station-name" data-astro-cid-evvcql4w>—</h2> <span class="station-feed__meta" id="tv-station-meta" data-astro-cid-evvcql4w>—</span> </div> <button class="station-feed__back" id="tv-station-back" type="button" data-astro-cid-evvcql4w>← BACK TO GLOBAL</button> </div> <div class="station-feed__slide" data-astro-cid-evvcql4w> <div class="slide__col--text" data-astro-cid-evvcql4w> <span class="slide__channel" id="tv-station-channel" data-astro-cid-evvcql4w> <span class="slide__channel-dot" id="tv-station-channel-dot" aria-hidden="true" data-astro-cid-evvcql4w></span> <span id="tv-station-channel-label" data-astro-cid-evvcql4w>—</span> </span> <p class="slide__kicker" id="tv-station-kicker" data-astro-cid-evvcql4w>—</p> <h3 class="slide__title" id="tv-station-title" data-astro-cid-evvcql4w>—</h3> <p class="slide__dek station-feed__dek" id="tv-station-dek" data-astro-cid-evvcql4w></p> <span class="slide__mood station-feed__mood" id="tv-station-mood" hidden data-astro-cid-evvcql4w>—</span> </div> <div class="slide__col--side" data-astro-cid-evvcql4w> <div class="slide__art station-feed__art" id="tv-station-art" hidden data-astro-cid-evvcql4w> <img id="tv-station-art-img" src="" alt="" loading="eager" data-astro-cid-evvcql4w> </div> <div class="slide__art slide__art--empty station-feed__art-empty" id="tv-station-art-empty" hidden data-astro-cid-evvcql4w>\nNO BLOCKS YET\n</div> <div class="slide__qr" data-astro-cid-evvcql4w> <img id="tv-station-qr" src="" alt="" data-astro-cid-evvcql4w> <span id="tv-station-qr-label" data-astro-cid-evvcql4w>→ phone</span> </div> </div> </div> </section> </main> <footer class="ticker" aria-label="Block ticker" data-astro-cid-evvcql4w> <div class="ticker__label" id="tv-ticker-label" data-astro-cid-evvcql4w>POINTCAST</div> <div class="ticker__reel" data-astro-cid-evvcql4w> <div class="ticker__track" id="tv-ticker-track" data-astro-cid-evvcql4w> ', ' </div> </div> </footer> <div class="hint" id="tv-hint" data-astro-cid-evvcql4w>S · stations &nbsp; SPACE · pause &nbsp; ← / → · prev / next</div> <script type="application/json" id="tv-stations-data">', `<\/script> <script>
    (function () {
      const dateEl = document.getElementById('tv-date');
      const timeEl = document.getElementById('tv-time');
      const progress = document.getElementById('tv-progress');
      const stationsToggle = document.getElementById('tv-stations-toggle');
      const hint = document.getElementById('tv-hint');
      const tickerLabel = document.getElementById('tv-ticker-label');
      const tickerTrack = document.getElementById('tv-ticker-track');
      const stationsDataEl = document.getElementById('tv-stations-data');
      const stationsData = stationsDataEl ? JSON.parse(stationsDataEl.textContent || '{"stations":[]}') : { stations: [] };
      const stations = Array.isArray(stationsData.stations) ? stationsData.stations : [];
      const stationsBySlug = Object.fromEntries(stations.map((station) => [station.slug, station]));

      const globalLayer = document.getElementById('tv-global-layer');
      const stationIndex = document.getElementById('tv-stations-index');
      const stationFeed = document.getElementById('tv-station-feed');
      const stationBack = document.getElementById('tv-station-back');
      const stationTiles = Array.from(document.querySelectorAll('[data-station]'));
      const globalSlides = Array.from(document.querySelectorAll('[data-global-slide]'));
      const defaultTickerHTML = tickerTrack ? tickerTrack.innerHTML : '';

      const stationNameEl = document.getElementById('tv-station-name');
      const stationMetaEl = document.getElementById('tv-station-meta');
      const stationChannelEl = document.getElementById('tv-station-channel');
      const stationChannelLabel = document.getElementById('tv-station-channel-label');
      const stationChannelDot = document.getElementById('tv-station-channel-dot');
      const stationKicker = document.getElementById('tv-station-kicker');
      const stationTitle = document.getElementById('tv-station-title');
      const stationDek = document.getElementById('tv-station-dek');
      const stationMood = document.getElementById('tv-station-mood');
      const stationArt = document.getElementById('tv-station-art');
      const stationArtImg = document.getElementById('tv-station-art-img');
      const stationArtEmpty = document.getElementById('tv-station-art-empty');
      const stationQr = document.getElementById('tv-station-qr');
      const stationQrLabel = document.getElementById('tv-station-qr-label');

      const dateFmt = new Intl.DateTimeFormat('en-US', {
        weekday: 'short', month: 'short', day: '2-digit', year: 'numeric', timeZone: 'America/Los_Angeles'
      });
      const timeFmt = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'America/Los_Angeles'
      });
      const sunsetFmt = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles'
      });

      const BASE_DWELL = 12000;
      const EMPTY_STATION_DWELL = 9000;
      const STATION_AUTO_RETURN_MS = 5 * 60 * 1000;

      let mode = 'global';
      let globalIdx = 0;
      let paused = false;
      let slideStart = Date.now();
      let lastInteractionAt = Date.now();
      let stationSlug = null;
      let stationIdx = 0;
      let pollTallyTimer = null;
      let touchStart = null;

      const weatherByStation = {};
      const weatherRequests = {};

      function tickClock() {
        const now = new Date();
        if (dateEl) dateEl.textContent = dateFmt.format(now).toUpperCase().replace(/,/g, ' ·');
        if (timeEl) timeEl.textContent = timeFmt.format(now) + ' PT';
      }

      function showHint(text, ms) {
        if (!hint) return;
        hint.textContent = text;
        hint.classList.add('hint--visible');
        window.clearTimeout(showHint._t);
        showHint._t = window.setTimeout(function () {
          hint.classList.remove('hint--visible');
        }, ms || 1800);
      }

      function escapeHtml(value) {
        return String(value).replace(/[&<>"]/g, function (char) {
          if (char === '&') return '&amp;';
          if (char === '<') return '&lt;';
          if (char === '>') return '&gt;';
          return '&quot;';
        });
      }

      function markInteraction() {
        lastInteractionAt = Date.now();
      }

      function stationWeatherText(slug, detailed) {
        const weather = weatherByStation[slug];
        if (!weather || !weather.ok) return detailed ? 'WX loading' : 'WX · loading';
        const parts = [weather.tempF + '°F', String(weather.condition || '').toUpperCase()];
        if (detailed && weather.sunset) {
          try {
            parts.push('SUNSET ' + sunsetFmt.format(new Date(weather.sunset)).toUpperCase());
          } catch (error) {}
        }
        return parts.join(' · ');
      }

      function paintWeather(slug) {
        document.querySelectorAll('[data-weather="' + slug + '"]').forEach(function (node) {
          node.textContent = stationWeatherText(slug, false);
        });
        if (mode === 'station-feed' && stationSlug === slug) {
          paintStationMeta();
        }
      }

      function ensureWeather(slug) {
        if (!slug || weatherByStation[slug]) return Promise.resolve(weatherByStation[slug]);
        if (weatherRequests[slug]) return weatherRequests[slug];

        weatherRequests[slug] = fetch('/api/weather?station=' + encodeURIComponent(slug), { cache: 'no-store' })
          .then(function (response) { return response.ok ? response.json() : null; })
          .then(function (payload) {
            if (payload) weatherByStation[slug] = payload;
            paintWeather(slug);
            return payload;
          })
          .catch(function () {
            weatherByStation[slug] = { ok: false };
            paintWeather(slug);
            return null;
          });

        return weatherRequests[slug];
      }

      function ensureAllStationWeather() {
        stations.forEach(function (station) { ensureWeather(station.slug); });
      }

      function dwellForGlobal(slideEl) {
        const type = slideEl && slideEl.dataset ? slideEl.dataset.type || '' : '';
        if (type === 'DAILY') return BASE_DWELL + 8000;
        if (type === 'POLL') return BASE_DWELL + 6000;
        if (type === 'READ') return BASE_DWELL + 8000;
        if (type === 'WATCH' || type === 'LISTEN') return BASE_DWELL + 4000;
        return BASE_DWELL;
      }

      function currentStation() {
        return stationSlug ? stationsBySlug[stationSlug] : null;
      }

      function dwellForStation() {
        const station = currentStation();
        if (!station || !Array.isArray(station.blocks) || station.blocks.length === 0) return EMPTY_STATION_DWELL;
        const block = station.blocks[stationIdx] || station.blocks[0];
        if (!block) return EMPTY_STATION_DWELL;
        if (block.type === 'READ') return BASE_DWELL + 8000;
        if (block.type === 'WATCH' || block.type === 'LISTEN') return BASE_DWELL + 4000;
        return BASE_DWELL;
      }

      function clearPollTimer() {
        if (pollTallyTimer) {
          window.clearInterval(pollTallyTimer);
          pollTallyTimer = null;
        }
      }

      function fetchAndPaintPoll(slideEl) {
        const slug = slideEl && slideEl.dataset ? slideEl.dataset.pollSlug : null;
        if (!slug) return;
        fetch('/api/poll?slug=' + encodeURIComponent(slug), { cache: 'no-store' })
          .then(function (response) { return response.ok ? response.json() : null; })
          .then(function (payload) {
            if (!payload || !payload.ok) return;
            paintPoll(slideEl, payload.tally || {}, payload.total || 0);
          })
          .catch(function () {});
      }

      function paintPoll(slideEl, tally, total) {
        const rows = slideEl.querySelectorAll('.slide__bar');
        let max = 0;
        for (const key in tally) {
          if (tally[key] > max) max = tally[key];
        }
        rows.forEach(function (row) {
          const id = row.getAttribute('data-option-id');
          const count = tally[id] || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const fill = row.querySelector('[data-fill]');
          const pctEl = row.querySelector('[data-pct]');
          if (fill) fill.style.width = pct + '%';
          if (pctEl) pctEl.textContent = pct + '%';
          row.classList.toggle('slide__bar--leader', count === max && count > 0);
        });
        const totalEl = slideEl.querySelector('[data-poll-total]');
        if (totalEl) totalEl.textContent = total + (total === 1 ? ' vote' : ' votes');
      }

      function showGlobal(next) {
        const prev = globalSlides[globalIdx];
        if (prev) {
          prev.classList.remove('slide--active');
          prev.setAttribute('aria-hidden', 'true');
        }
        globalIdx = (next + globalSlides.length) % globalSlides.length;
        const active = globalSlides[globalIdx];
        if (active) {
          active.classList.add('slide--active');
          active.setAttribute('aria-hidden', 'false');
        }
        slideStart = Date.now();
        if (progress) progress.style.width = '0%';

        clearPollTimer();
        if (active && active.dataset.type === 'POLL') {
          fetchAndPaintPoll(active);
          pollTallyTimer = window.setInterval(function () {
            fetchAndPaintPoll(active);
          }, 5000);
        }
      }

      function stationRoute(slug) {
        return '/tv/' + encodeURIComponent(slug);
      }

      function setUrlForMode() {
        try {
          if (mode === 'station-feed' && stationSlug) history.replaceState(null, '', stationRoute(stationSlug));
          else history.replaceState(null, '', '/tv');
        } catch (error) {}
      }

      function paintTickerForMode() {
        if (!tickerTrack || !tickerLabel) return;

        if (mode === 'global') {
          tickerLabel.textContent = 'POINTCAST';
          tickerTrack.innerHTML = defaultTickerHTML;
          return;
        }

        if (mode === 'stations-index') {
          tickerLabel.textContent = 'STATIONS';
          const items = stations.map(function (station) {
            const count = station.blockCount > 0 ? station.blockCount + ' BLOCKS' : 'NO BLOCKS YET';
            return '<span class="ticker__item"><em>' + station.keyHint + ' · ' + station.miles + 'MI ' + station.direction + '</em>' + escapeHtml(station.name + ' · ' + count) + '</span>';
          });
          tickerTrack.innerHTML = items.concat(items).join('');
          return;
        }

        const station = currentStation();
        if (!station) return;
        tickerLabel.textContent = station.name.toUpperCase();
        const source = station.blocks.length > 0
          ? station.blocks.map(function (block) {
              return '<span class="ticker__item"><em>№' + escapeHtml(block.id) + ' · ' + escapeHtml(block.type) + '</em>' + escapeHtml(block.title) + '</span>';
            })
          : ['<span class="ticker__item"><em>LOCAL FEED</em>' + escapeHtml(station.blurb) + '</span>'];
        tickerTrack.innerHTML = source.concat(source).join('');
      }

      function paintHintForMode() {
        if (mode === 'global') showHint('S · stations   SPACE · pause   ← / → · prev / next', 4000);
        else if (mode === 'stations-index') showHint('1-9 / QWERTY · tune station   ESC · back', 2400);
        else showHint('ESC/B · global   ↓ swipe · back   ← / → · prev / next', 2400);
      }

      function updateStationsToggle() {
        if (!stationsToggle) return;
        stationsToggle.textContent = mode === 'global' ? 'STATIONS' : 'BACK';
      }

      function enterGlobal() {
        mode = 'global';
        stationSlug = null;
        stationIdx = 0;
        if (globalLayer) globalLayer.hidden = false;
        if (stationIndex) stationIndex.hidden = true;
        if (stationFeed) stationFeed.hidden = true;
        slideStart = Date.now();
        if (progress) progress.style.width = '0%';
        updateStationsToggle();
        paintTickerForMode();
        setUrlForMode();
        paintHintForMode();
        const active = globalSlides[globalIdx];
        clearPollTimer();
        if (active && active.dataset.type === 'POLL') {
          fetchAndPaintPoll(active);
          pollTallyTimer = window.setInterval(function () {
            fetchAndPaintPoll(active);
          }, 5000);
        }
      }

      function enterStationsIndex() {
        mode = 'stations-index';
        if (globalLayer) globalLayer.hidden = true;
        if (stationIndex) stationIndex.hidden = false;
        if (stationFeed) stationFeed.hidden = true;
        clearPollTimer();
        slideStart = Date.now();
        if (progress) progress.style.width = '0%';
        updateStationsToggle();
        paintTickerForMode();
        setUrlForMode();
        paintHintForMode();
        ensureAllStationWeather();
      }

      function paintStationMeta() {
        const station = currentStation();
        if (!station || !stationMetaEl || !stationNameEl) return;
        const countLabel = station.blockCount === 1 ? '1 BLOCK' : station.blockCount + ' BLOCKS';
        const slideLabel = station.blocks.length > 0
          ? (stationIdx + 1) + '/' + station.blocks.length
          : '0/0';
        stationNameEl.textContent = station.name.toUpperCase();
        stationMetaEl.textContent = station.miles + 'MI ' + station.direction + ' · ' + countLabel + ' · ' + slideLabel + ' · ' + stationWeatherText(station.slug, true);
      }

      function paintStationFeed() {
        const station = currentStation();
        if (!station) return;

        paintStationMeta();
        ensureWeather(station.slug);

        const block = station.blocks[stationIdx] || null;
        if (!block) {
          if (stationChannelEl) {
            stationChannelEl.style.background = 'rgba(245, 159, 0, 0.08)';
            stationChannelEl.style.color = 'var(--tv-accent)';
          }
          if (stationChannelLabel) stationChannelLabel.textContent = 'STATION FEED · HOLDING';
          if (stationChannelDot) stationChannelDot.style.background = 'currentColor';
          if (stationKicker) stationKicker.textContent = 'NO BLOCKS YET · LOCAL FEED STANDBY';
          if (stationTitle) stationTitle.textContent = station.name + ' has not landed a block yet.';
          if (stationDek) stationDek.textContent = station.blurb;
          if (stationMood) stationMood.hidden = true;
          if (stationArt) stationArt.hidden = true;
          if (stationArtEmpty) stationArtEmpty.hidden = false;
          if (stationQr) {
            const qrTarget = 'https://pointcast.xyz' + station.path;
            stationQr.src = 'https://api.qrserver.com/v1/create-qr-code/?size=216x216&margin=2&data=' + encodeURIComponent(qrTarget);
            stationQr.alt = 'QR code to ' + qrTarget;
          }
          if (stationQrLabel) stationQrLabel.textContent = '→ phone · ' + station.path;
          return;
        }

        if (stationChannelEl) {
          stationChannelEl.style.background = 'color-mix(in oklab, ' + block.channel.color600 + ' 18%, transparent)';
          stationChannelEl.style.color = block.channel.color600;
        }
        if (stationChannelLabel) stationChannelLabel.textContent = 'CH.' + block.channel.code + ' · ' + block.channel.name;
        if (stationChannelDot) stationChannelDot.style.background = 'currentColor';
        if (stationKicker) {
          const loc = block.location ? ' · ' + block.location.toUpperCase() : '';
          stationKicker.textContent = '№ ' + block.id + ' · ' + block.type + loc;
        }
        if (stationTitle) stationTitle.textContent = block.title;
        if (stationDek) stationDek.textContent = block.dek || station.blurb;
        if (stationMood) {
          if (block.mood) {
            stationMood.hidden = false;
            stationMood.textContent = '★ ' + block.mood.replace(/-/g, ' ');
          } else {
            stationMood.hidden = true;
          }
        }
        if (stationArt && stationArtImg && stationArtEmpty) {
          if (block.thumbnail) {
            stationArt.hidden = false;
            stationArtEmpty.hidden = true;
            stationArtImg.src = block.thumbnail;
          } else {
            stationArt.hidden = true;
            stationArtEmpty.hidden = false;
          }
        }
        if (stationQr) {
          const qrTarget = 'https://pointcast.xyz' + block.path;
          stationQr.src = 'https://api.qrserver.com/v1/create-qr-code/?size=216x216&margin=2&data=' + encodeURIComponent(qrTarget);
          stationQr.alt = 'QR code to ' + qrTarget;
        }
        if (stationQrLabel) stationQrLabel.textContent = '→ phone · ' + block.path;
      }

      function enterStationFeed(nextSlug, resetIndex) {
        const station = stationsBySlug[nextSlug];
        if (!station) return;
        mode = 'station-feed';
        stationSlug = station.slug;
        stationIdx = resetIndex === false ? stationIdx : 0;
        if (globalLayer) globalLayer.hidden = true;
        if (stationIndex) stationIndex.hidden = true;
        if (stationFeed) stationFeed.hidden = false;
        clearPollTimer();
        slideStart = Date.now();
        if (progress) progress.style.width = '0%';
        updateStationsToggle();
        paintStationFeed();
        paintTickerForMode();
        setUrlForMode();
        paintHintForMode();
      }

      function stepStation(delta, autoAdvance) {
        const station = currentStation();
        if (!station) return;

        if (!Array.isArray(station.blocks) || station.blocks.length === 0) {
          enterGlobal();
          return;
        }

        const next = stationIdx + delta;
        if (next < 0 || next >= station.blocks.length) {
          enterGlobal();
          return;
        }

        stationIdx = next;
        slideStart = Date.now();
        if (progress) progress.style.width = '0%';
        paintStationFeed();
        paintTickerForMode();

        if (!autoAdvance) markInteraction();
      }

      function handleStationShortcut(key) {
        const upper = key.toUpperCase();
        const station = stations.find(function (entry) { return entry.keyHint === upper; });
        if (!station) return false;
        enterStationFeed(station.slug, true);
        return true;
      }

      function bootStationFromUrl() {
        const url = new URL(window.location.href);
        const queryStation = url.searchParams.get('station');
        if (queryStation && stationsBySlug[queryStation]) return queryStation;
        const parts = window.location.pathname.split('/').filter(Boolean);
        if (parts[0] === 'tv' && parts[1] && stationsBySlug[parts[1]]) return parts[1];
        return null;
      }

      tickClock();
      window.setInterval(tickClock, 1000);
      paintHintForMode();

      if (globalSlides[0] && globalSlides[0].dataset.type === 'POLL') {
        fetchAndPaintPoll(globalSlides[0]);
        pollTallyTimer = window.setInterval(function () {
          fetchAndPaintPoll(globalSlides[globalIdx]);
        }, 5000);
      }

      function tickProgress() {
        if (!progress) return;
        if (mode === 'stations-index') {
          progress.style.width = '0%';
          return;
        }
        if (paused) return;

        if (mode === 'station-feed' && Date.now() - lastInteractionAt >= STATION_AUTO_RETURN_MS) {
          enterGlobal();
          return;
        }

        const dwell = mode === 'global' ? dwellForGlobal(globalSlides[globalIdx]) : dwellForStation();
        const pct = Math.min(100, ((Date.now() - slideStart) / dwell) * 100);
        progress.style.width = pct + '%';
        if (pct < 100) return;

        if (mode === 'global') showGlobal(globalIdx + 1);
        else if (mode === 'station-feed') stepStation(1, true);
      }

      window.setInterval(tickProgress, 100);

      if (stationsToggle) {
        stationsToggle.addEventListener('click', function () {
          markInteraction();
          if (mode === 'global') enterStationsIndex();
          else enterGlobal();
        });
      }

      if (stationBack) {
        stationBack.addEventListener('click', function () {
          markInteraction();
          enterGlobal();
        });
      }

      stationTiles.forEach(function (tile) {
        tile.addEventListener('click', function () {
          const slug = tile.getAttribute('data-station');
          if (!slug) return;
          markInteraction();
          enterStationFeed(slug, true);
        });
      });

      window.addEventListener('keydown', function (event) {
        const key = event.key;
        const lower = key.toLowerCase();

        if (key === ' ' || key === 'Enter' || key === 'Select') {
          if (mode !== 'stations-index') {
            paused = !paused;
            markInteraction();
            showHint(paused ? 'PAUSED' : 'PLAYING', 1400);
            event.preventDefault();
          }
          return;
        }

        if (lower === 's') {
          markInteraction();
          if (mode === 'global') enterStationsIndex();
          else if (mode === 'stations-index') enterGlobal();
          else enterStationsIndex();
          event.preventDefault();
          return;
        }

        if (key === 'Escape' || lower === 'b') {
          if (mode !== 'global') {
            markInteraction();
            enterGlobal();
            event.preventDefault();
          }
          return;
        }

        if (mode === 'stations-index' && handleStationShortcut(key)) {
          markInteraction();
          event.preventDefault();
          return;
        }

        if (key === 'ArrowRight' || key === 'MediaTrackNext') {
          markInteraction();
          if (mode === 'global') showGlobal(globalIdx + 1);
          else if (mode === 'station-feed') stepStation(1, false);
          event.preventDefault();
          return;
        }

        if (key === 'ArrowLeft' || key === 'MediaTrackPrevious') {
          markInteraction();
          if (mode === 'global') showGlobal(globalIdx - 1);
          else if (mode === 'station-feed') stepStation(-1, false);
          event.preventDefault();
        }
      });

      window.addEventListener('touchstart', function (event) {
        const touch = event.touches && event.touches[0];
        if (!touch) return;
        touchStart = { x: touch.clientX, y: touch.clientY };
      }, { passive: true });

      window.addEventListener('touchend', function (event) {
        if (!touchStart) return;
        const touch = event.changedTouches && event.changedTouches[0];
        if (!touch) return;

        const dx = touch.clientX - touchStart.x;
        const dy = touch.clientY - touchStart.y;
        touchStart = null;

        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 48) {
          markInteraction();
          if (dy < 0 && mode === 'global') enterStationsIndex();
          else if (dy > 0 && mode !== 'global') enterGlobal();
          return;
        }

        if (Math.abs(dx) > 40) {
          markInteraction();
          if (mode === 'global') showGlobal(globalIdx + (dx < 0 ? 1 : -1));
          else if (mode === 'station-feed') stepStation(dx < 0 ? 1 : -1, false);
        }
      }, { passive: true });

      const initialStation = bootStationFromUrl();
      if (initialStation) enterStationFeed(initialStation, true);
      else enterGlobal();

      const presenceNum = document.getElementById('tv-presence-num');
      const presenceConstellation = document.getElementById('tv-presence-constellation');
      const MAX_DOTS = 10;
      const host = window.location.host;
      const allowPresence = host.endsWith('pointcast.xyz') || host.endsWith('.pages.dev');
      const isPresenceAgent = /gptbot|claudebot|claude-user|anthropic-ai|perplexitybot|oai-searchbot|atlas|bingbot|googlebot/i.test(navigator.userAgent);
      let presenceWs = null;
      let presenceHeartbeat = 0;
      let presenceReconnect = 0;

      function cheapHash(input) {
        let hash = 5381;
        for (let i = 0; i < input.length; i++) {
          hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
        }
        return hash >>> 0;
      }

      function nounUrl(nounId) {
        return 'https://noun.pics/' + nounId + '.svg';
      }

      function lsGet(key) {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          return null;
        }
      }

      function viewerSessionId() {
        const key = 'pc:session';
        let value = lsGet(key);
        if (!value) {
          value = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
          try { localStorage.setItem(key, value); } catch (error) {}
        }
        return value;
      }

      function viewerNounId(sessionId) {
        let value = parseInt(lsGet('pc:visitor:noun') || '', 10);
        if (!(value >= 0 && value < 1200)) {
          value = cheapHash(sessionId) % 1200;
          try { localStorage.setItem('pc:visitor:noun', String(value)); } catch (error) {}
        }
        return value;
      }

      function presenceFields() {
        return {
          mood: lsGet('pc:visitor:mood'),
          listening: lsGet('pc:visitor:listening'),
          where: lsGet('pc:visitor:where'),
        };
      }

      function truncate(input, max) {
        if (!input || input.length <= max) return input || '';
        return input.slice(0, max - 1) + '…';
      }

      function presenceSummary(session, isYou) {
        const parts = [];
        if (isYou) parts.push('YOU');
        parts.push(session.kind === 'agent' ? 'AGENT' : (session.kind === 'wallet' ? 'WALLET' : 'HUMAN'));
        if (session.mood) parts.push(session.mood.replace(/-/g, ' '));
        if (session.listening) parts.push('listening ' + truncate(session.listening, 28));
        if (session.where) parts.push('in ' + truncate(session.where, 20));
        return parts.join(' · ');
      }

      function clearPresenceSlot(slot) {
        if (!slot) return;
        slot.classList.remove('top__presence-avatar--filled', 'top__presence-avatar--you');
        slot.removeAttribute('data-kind');
        slot.removeAttribute('title');
        slot.removeAttribute('aria-label');
        const img = slot.querySelector('.top__presence-avatar-img');
        const dot = slot.querySelector('.top__presence-avatar-dot');
        const chip = slot.querySelector('.top__presence-avatar-chip');
        if (img) {
          img.hidden = true;
          img.removeAttribute('src');
          img.alt = '';
        }
        if (dot) dot.hidden = false;
        if (chip) {
          chip.hidden = true;
          chip.textContent = '';
        }
      }

      function paintPresenceSlot(slot, session, isYou) {
        if (!slot || !session) return;
        const nounId = Number(session.nounId);
        if (!(nounId >= 0 && nounId < 1200)) {
          clearPresenceSlot(slot);
          return;
        }
        slot.classList.add('top__presence-avatar--filled');
        if (isYou) slot.classList.add('top__presence-avatar--you');
        else slot.classList.remove('top__presence-avatar--you');
        slot.dataset.kind = session.kind || 'human';
        const img = slot.querySelector('.top__presence-avatar-img');
        const dot = slot.querySelector('.top__presence-avatar-dot');
        const chip = slot.querySelector('.top__presence-avatar-chip');
        if (img) {
          img.hidden = false;
          img.src = nounUrl(nounId);
          img.alt = (isYou ? 'your noun · ' : 'watcher noun · ') + nounId;
        }
        if (dot) dot.hidden = true;
        if (chip) {
          const moodLabel = session.mood ? truncate(session.mood.replace(/-/g, ' '), 16) : '';
          chip.textContent = moodLabel;
          chip.hidden = !moodLabel;
        }
        const summary = presenceSummary(session, isYou);
        if (summary) {
          slot.title = summary;
          slot.setAttribute('aria-label', summary);
        }
      }

      function orderedPresenceEntries(payload, selfNounId) {
        const sessions = Array.isArray(payload && payload.sessions) ? payload.sessions : [];
        const entries = [];
        const others = [];
        let claimedSelf = false;

        sessions.forEach(function (session) {
          if (!session || typeof session !== 'object') return;
          if (!claimedSelf && Number(session.nounId) === selfNounId) {
            claimedSelf = true;
            entries.push({ session: session, isYou: true });
            return;
          }
          others.push({ session: session, isYou: false });
        });

        return entries.concat(others);
      }

      function paintConstellation(payload, selfNounId) {
        if (!presenceConstellation) return;
        const slots = Array.from(presenceConstellation.querySelectorAll('[data-presence-slot]'));
        const total = Math.max(1, (Number(payload && payload.humans) || 0) + (Number(payload && payload.agents) || 0));
        const entries = orderedPresenceEntries(payload, selfNounId);

        slots.forEach(function (slot, index) {
          if (index < entries.length) paintPresenceSlot(slot, entries[index].session, entries[index].isYou);
          else clearPresenceSlot(slot);
        });

        if (presenceNum) {
          presenceNum.textContent = total > MAX_DOTS ? total + '+' : String(total);
        }
      }

      function sendPresence(type, selfNounId, extra) {
        if (!presenceWs || presenceWs.readyState !== WebSocket.OPEN) return false;
        try {
          const payload = { type: type, nounId: selfNounId };
          if (!isPresenceAgent && extra && typeof extra === 'object') {
            if (Object.prototype.hasOwnProperty.call(extra, 'mood')) payload.mood = extra.mood;
            if (Object.prototype.hasOwnProperty.call(extra, 'listening')) payload.listening = extra.listening;
            if (Object.prototype.hasOwnProperty.call(extra, 'where')) payload.where = extra.where;
          }
          presenceWs.send(JSON.stringify(payload));
          return true;
        } catch (error) {
          return false;
        }
      }

      function stopPresenceHeartbeat() {
        if (presenceHeartbeat) {
          clearInterval(presenceHeartbeat);
          presenceHeartbeat = 0;
        }
      }

      function schedulePresenceReconnect(selfSessionId, selfNounId) {
        stopPresenceHeartbeat();
        if (presenceReconnect || !allowPresence) return;
        presenceReconnect = window.setTimeout(function () {
          presenceReconnect = 0;
          connectPresence(selfSessionId, selfNounId);
        }, 3000);
      }

      function connectPresence(selfSessionId, selfNounId) {
        if (!allowPresence || !presenceNum) return;
        const wsURL = (window.location.protocol === 'https:' ? 'wss://' : 'ws://')
          + host + '/api/presence?sid=' + encodeURIComponent(selfSessionId) + '&kind=' + (isPresenceAgent ? 'agent' : 'human');
        try {
          presenceWs = new WebSocket(wsURL);
        } catch (error) {
          schedulePresenceReconnect(selfSessionId, selfNounId);
          return;
        }

        presenceWs.addEventListener('open', function () {
          stopPresenceHeartbeat();
          sendPresence('identify', selfNounId, presenceFields());
          presenceHeartbeat = window.setInterval(function () {
            sendPresence('ping', selfNounId);
          }, 30_000);
        });

        presenceWs.addEventListener('message', function (event) {
          try {
            paintConstellation(JSON.parse(event.data), selfNounId);
          } catch (error) {}
        });

        presenceWs.addEventListener('close', function () {
          schedulePresenceReconnect(selfSessionId, selfNounId);
        });
        presenceWs.addEventListener('error', function () {
          schedulePresenceReconnect(selfSessionId, selfNounId);
        });
      }

      const selfSessionId = viewerSessionId();
      const selfNounId = viewerNounId(selfSessionId);
      const selfFields = presenceFields();
      paintConstellation({
        humans: isPresenceAgent ? 0 : 1,
        agents: isPresenceAgent ? 1 : 0,
        sessions: [{
          nounId: selfNounId,
          kind: isPresenceAgent ? 'agent' : 'human',
          joinedAt: new Date().toISOString(),
          mood: isPresenceAgent ? undefined : selfFields.mood,
          listening: isPresenceAgent ? undefined : selfFields.listening,
          where: isPresenceAgent ? undefined : selfFields.where,
        }],
      }, selfNounId);

      if (allowPresence && presenceNum) {
        connectPresence(selfSessionId, selfNounId);
      }
    })();
  <\/script> </body> </html>`])), renderHead(), Array.from({ length: 10 }).map((_, index) => renderTemplate`<span class="top__presence-avatar"${addAttribute(index, "data-presence-slot")} data-astro-cid-evvcql4w> <img class="top__presence-avatar-img" alt="" src="" loading="lazy" hidden data-astro-cid-evvcql4w> <span class="top__presence-avatar-dot" aria-hidden="true" data-astro-cid-evvcql4w></span> <span class="top__presence-avatar-chip mono" hidden data-astro-cid-evvcql4w></span> </span>`), slides.map((item, idx) => {
    if (item.kind === "daily") {
      const block = item.block;
      const channel = CHANNELS[block.data.channel];
      const thumbnail = block.data.media?.thumbnail ?? (block.data.noun ? `https://noun.pics/${block.data.noun}.svg` : null);
      const qrTarget2 = "https://pointcast.xyz/today";
      const qrSrc2 = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=2&data=${encodeURIComponent(qrTarget2)}`;
      return renderTemplate`<section${addAttribute(`slide slide--daily${idx === 0 ? " slide--active" : ""}`, "class")} data-global-slide${addAttribute(idx, "data-idx")} data-type="DAILY"${addAttribute(idx !== 0 ? "true" : "false", "aria-hidden")} data-astro-cid-evvcql4w> <div class="slide__col--text slide__col--text-daily" data-astro-cid-evvcql4w> <span class="slide__channel slide__channel--daily" data-astro-cid-evvcql4w> <span class="slide__channel-star" aria-hidden="true" data-astro-cid-evvcql4w>✦</span>
DAILY DROP · ${prettyToday} </span> <p class="slide__kicker" data-astro-cid-evvcql4w>№ ${block.data.id} · CH.${channel.code} · ${block.data.type}</p> <h2 class="slide__title slide__title--daily" data-astro-cid-evvcql4w>${block.data.title}</h2> ${block.data.dek && renderTemplate`<p class="slide__dek" data-astro-cid-evvcql4w>${block.data.dek}</p>`} ${block.data.mood && renderTemplate`<span class="slide__mood" data-astro-cid-evvcql4w>★ ${block.data.mood.replace(/-/g, " ")}</span>`} <div class="slide__daily-footnote" data-astro-cid-evvcql4w>
ONE BLOCK A DAY · ROTATES AT MIDNIGHT PT · COLLECT ON PHONE
</div> </div> <div class="slide__col--side" data-astro-cid-evvcql4w> ${thumbnail && renderTemplate`<div class="slide__art slide__art--daily" data-astro-cid-evvcql4w> <img${addAttribute(thumbnail, "src")} alt=""${addAttribute(idx === 0 ? "eager" : "lazy", "loading")} data-astro-cid-evvcql4w> </div>`} <div class="slide__qr slide__qr--daily" data-astro-cid-evvcql4w> <img${addAttribute(qrSrc2, "src")} alt="QR code — collect today's drop" data-astro-cid-evvcql4w> <span data-astro-cid-evvcql4w>→ SCAN · TAP TO COLLECT</span> </div> </div> </section>`;
    }
    if (item.kind === "block") {
      const block = item.block;
      const channel = CHANNELS[block.data.channel];
      const thumbnail = block.data.media?.thumbnail ?? (block.data.noun ? `https://noun.pics/${block.data.noun}.svg` : null);
      const qrTarget2 = `https://pointcast.xyz/b/${block.data.id}`;
      const qrSrc2 = `https://api.qrserver.com/v1/create-qr-code/?size=216x216&margin=2&data=${encodeURIComponent(qrTarget2)}`;
      return renderTemplate`<section${addAttribute(`slide${idx === 0 ? " slide--active" : ""}`, "class")} data-global-slide${addAttribute(idx, "data-idx")}${addAttribute(block.data.type, "data-type")}${addAttribute(idx !== 0 ? "true" : "false", "aria-hidden")} data-astro-cid-evvcql4w> <div class="slide__col--text" data-astro-cid-evvcql4w> <span class="slide__channel"${addAttribute(`background: color-mix(in oklab, ${channel.color600} 18%, transparent); color: ${channel.color600};`, "style")} data-astro-cid-evvcql4w> <span class="slide__channel-dot" aria-hidden="true" data-astro-cid-evvcql4w></span>
CH.${channel.code} · ${channel.name} </span> <p class="slide__kicker" data-astro-cid-evvcql4w>№ ${block.data.id} · ${block.data.type}</p> <h2 class="slide__title" data-astro-cid-evvcql4w>${block.data.title}</h2> ${block.data.dek && renderTemplate`<p class="slide__dek" data-astro-cid-evvcql4w>${block.data.dek}</p>`} ${block.data.mood && renderTemplate`<span class="slide__mood" data-astro-cid-evvcql4w>★ ${block.data.mood.replace(/-/g, " ")}</span>`} </div> <div class="slide__col--side" data-astro-cid-evvcql4w> ${thumbnail && renderTemplate`<div class="slide__art" data-astro-cid-evvcql4w> <img${addAttribute(thumbnail, "src")} alt=""${addAttribute(idx === 0 ? "eager" : "lazy", "loading")} data-astro-cid-evvcql4w> </div>`} <div class="slide__qr" data-astro-cid-evvcql4w> <img${addAttribute(qrSrc2, "src")}${addAttribute(`QR code to ${qrTarget2}`, "alt")} data-astro-cid-evvcql4w> <span data-astro-cid-evvcql4w>→ phone · /b/${block.data.id}</span> </div> </div> </section>`;
    }
    const poll = item.poll;
    const purpose = poll.data.purpose ?? "coordination";
    const qrTarget = `https://pointcast.xyz/poll/${poll.data.slug}?via=tv`;
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=216x216&margin=2&data=${encodeURIComponent(qrTarget)}`;
    return renderTemplate`<section${addAttribute(`slide slide--poll${idx === 0 ? " slide--active" : ""}`, "class")} data-global-slide${addAttribute(idx, "data-idx")} data-type="POLL"${addAttribute(poll.data.slug, "data-poll-slug")}${addAttribute(idx !== 0 ? "true" : "false", "aria-hidden")} data-astro-cid-evvcql4w> <div class="slide__col--text slide__col--text-poll" data-astro-cid-evvcql4w> <span${addAttribute(`slide__channel slide__channel--poll slide__channel--${purpose}`, "class")} data-astro-cid-evvcql4w> <span class="slide__channel-dot" aria-hidden="true" data-astro-cid-evvcql4w></span>
LIVE POLL · ${purpose.toUpperCase()} </span> <p class="slide__kicker" data-astro-cid-evvcql4w>/poll/${poll.data.slug}</p> <h2 class="slide__title slide__title--poll" data-astro-cid-evvcql4w>${poll.data.question}</h2> <ul class="slide__bars" data-poll-bars data-astro-cid-evvcql4w> ${poll.data.options.map((option) => renderTemplate`<li class="slide__bar"${addAttribute(option.id, "data-option-id")} data-astro-cid-evvcql4w> <span class="slide__bar-label" data-astro-cid-evvcql4w>${option.label}</span> <span class="slide__bar-track" data-astro-cid-evvcql4w><span class="slide__bar-fill" data-fill style="width:0%" data-astro-cid-evvcql4w></span></span> <span class="slide__bar-pct" data-pct data-astro-cid-evvcql4w>—</span> </li>`)} </ul> <p class="slide__poll-total" data-poll-total data-astro-cid-evvcql4w>— votes</p> </div> <div class="slide__col--side" data-astro-cid-evvcql4w> <div class="slide__qr slide__qr--poll" data-astro-cid-evvcql4w> <img${addAttribute(qrSrc, "src")}${addAttribute(`QR code — vote on ${poll.data.slug}`, "alt")} data-astro-cid-evvcql4w> <span data-astro-cid-evvcql4w>→ SCAN · TAP TO VOTE</span> </div> </div> </section>`;
  }), stationEntries.map(({ station, keyHint, blockCount, blocks: blocks2 }) => {
    const latest = blocks2[0];
    const thumbnail = latest?.data.media?.thumbnail ?? (latest?.data.noun ? `https://noun.pics/${latest.data.noun}.svg` : null);
    return renderTemplate`<button class="station-tile" type="button"${addAttribute(station.slug, "data-station")}${addAttribute(`Open ${station.name} station`, "aria-label")} data-astro-cid-evvcql4w> <div class="station-tile__top" data-astro-cid-evvcql4w> <span class="station-tile__key" data-astro-cid-evvcql4w>${keyHint} · ${station.miles}MI ${station.direction}</span> <h3 class="station-tile__name" data-astro-cid-evvcql4w>${station.name}</h3> <span class="station-tile__count" data-astro-cid-evvcql4w> ${blockCount > 0 ? `${blockCount} block${blockCount === 1 ? "" : "s"} in range` : "NO BLOCKS YET · COMING WHEN ONE LANDS"} </span> <span class="station-tile__weather"${addAttribute(station.slug, "data-weather")} data-astro-cid-evvcql4w>WX · loading</span> </div> ${latest ? renderTemplate`<div class="station-tile__preview" data-astro-cid-evvcql4w> <div class="station-tile__art" data-astro-cid-evvcql4w> ${thumbnail ? renderTemplate`<img${addAttribute(thumbnail, "src")} alt="" loading="lazy" data-astro-cid-evvcql4w>` : renderTemplate`<div class="station-tile__fallback" data-astro-cid-evvcql4w>NO ART</div>`} </div> <div class="station-tile__latest" data-astro-cid-evvcql4w> <span class="station-tile__latest-meta" data-astro-cid-evvcql4w>№ ${latest.data.id} · ${latest.data.type}</span> <p class="station-tile__latest-title" data-astro-cid-evvcql4w>${latest.data.title}</p> </div> </div>` : renderTemplate`<p class="station-tile__empty" data-astro-cid-evvcql4w>${station.blurb}</p>`} </button>`;
  }), tickerBlocks.concat(tickerBlocks).map((block) => renderTemplate`<span class="ticker__item" data-astro-cid-evvcql4w><em data-astro-cid-evvcql4w>№${block.data.id} · ${block.data.type}</em>${block.data.title}</span>`), unescapeHTML(JSON.stringify({ stations: stationPayload })));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/tv.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/tv.astro";
const $$url = "/tv";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Tv,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
