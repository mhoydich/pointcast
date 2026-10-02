# Three-feature discovery integration

Scope: Communications Lab, Mobility 2030 and Manufacturing Atlas, already live
at main `4807083dc98f4d02a2c6e8005271bfe9da1f60b6`.

Add their three human/JSON pairs to the shared app catalog, current agent surface
registry and manifest compatibility maps, short LLM index and discovery sitemap.
The existing `/apps/` page renders the catalog. No homepage change or new channel.
Descriptions retain the Lab's independent/proposed status, mobility design-fiction
and factory-aspiration boundaries, and manufacturing distance/availability limits.

Validation: bare Astro build, existing agent/sitemap/Lab/mobility tests and a built
integration test confirming unique catalog entries, consistent endpoints, valid
JSON and resolvable links across all five discovery surfaces. Deployment uses the
serialized `scripts/deploy.sh` after the exact reviewed branch merges.

Actual local results: bare build passed (2,788 pages); 21 of 22 selected checks
passed, including the new built integration test. The broad existing
`agent-surfaces.test.mjs` stops on its <150-line LLM-index limit: unchanged main
has 237 lines and this bounded patch has 241. It is a pre-existing constraint,
not repaired by deleting unrelated discovery content. No tests were weakened.
