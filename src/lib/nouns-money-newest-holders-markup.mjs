// Shared by the review page and the insertion snippet for the separate home site.
export function newestHoldersMarkup(config) {
  return `<section class="nmh" data-newest-holders hidden aria-labelledby="nmh-title">
  <div class="nmh-inner">
    <div class="nmh-heading"><h2 id="nmh-title">Newest holders</h2><p>Latest note recipients · live from Tezos</p></div>
    <ol class="nmh-list" data-newest-holders-list aria-label="Newest note recipients, newest first" tabindex="0"></ol>
    <p class="nmh-invite">Get a free note: reply to an <a href="https://x.com/officenoun">Office Noun post</a> with your tz address.</p>
  </div>
  <script type="application/json" data-newest-holders-config>${JSON.stringify(config).replaceAll('<', '\\u003c')}</script>
</section>`;
}
