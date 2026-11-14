# Submission refinement from Product Hunt screenshots

Recorded: 12 October 2026. Input: ten screenshots supplied by the user during their Product Hunt submission flow. This is a specification update only; no application, schema or taxonomy changes are authorized by this document itself.

Read alongside [the submission audit](./project-submission-audit.md) and [implementation roadmap](./submission-implementation-roadmap.md). Milestones 1–3 are implemented. Follow-up: the user accepted specific categories organized into browsing groups; see [the implemented taxonomy](./category-taxonomy.md).

## Observed reference and intended adaptation

These observations describe the supplied screenshots, not an independently verified account of Product Hunt's entire current workflow.

| Screenshot | Observed pattern | Direction for HubDigital |
|---|---|---|
| [01 · Name and tagline](./references/product-hunt-submission/01-name-tagline.png) | Direct labels, short placeholders, character counters; shown limits are 40 and 60. | Keep one label per field and show counters using our actual contract limits. Do not adopt their limits without a separate decision. |
| [02 · Links and source](./references/product-hunt-submission/02-links-source.png) | Add/remove destinations; open-source selection prompts for a repository; optional X account. | Keep typed destinations and a clear primary action. Selecting open source should offer “Adicionar repositório” if missing, as an optional suggestion rather than a publication blocker. Social profiles remain optional; do not privilege X. |
| [03 · Description](./references/product-hunt-submission/03-description.png) | A focused prompt about what the product does differently; 500-character counter. | Use “O que faz o projeto?” for directory descriptions. For future announcements, separately ask “O que há de novo?”. Preserve rich text and current limits unless explicitly redesigned. |
| [04 · Compact tag picker](./references/product-hunt-submission/04-tag-picker.png) | Search, quick additions, maximum three tags, link to browse all. | Keep our primary + two secondary rule. Offer a compact search and “Ver todas as categorias” without a long permanently open list. |
| [05 · Full tag browser](./references/product-hunt-submission/05-tag-browser.png) | Searchable dialog, selected count, explicit save action. | Add a desktop dialog/mobile sheet for browsing larger taxonomies. Stage selection locally; “Aplicar categorias” commits and Cancel restores the previous selection. Keep primary selection visible. |
| [06 · Thumbnail](./references/product-hunt-submission/06-thumbnail-preview.png) | Upload guidance and immediate homepage-card preview. | Show the actual discovery-card preview next to/below logo selection. Use truthful empty states and zero counts, without simulated popularity. Retain our supported formats and 5 MB limit. |
| [07 · Gallery](./references/product-hunt-submission/07-gallery.png) | Clear drop area, thumbnail strip; first image explained as share preview. | Add reorder and explicit “Imagem de capa”. Gallery stays optional. Explain its use in link sharing only when social metadata uses that image. |
| [08 · Video and demo](./references/product-hunt-submission/08-video-demo.png) | Separate optional video and interactive-demo URLs. | Keep demos as existing typed links, with a shortcut that creates the same destination instead of a second field storing the same URL. YouTube stays supported; Loom is a future optional provider. |
| [09 · Attribution](./references/product-hunt-submission/09-maker-attribution.png) | Distinguishes the submitter from people who built the product; optional maker lookup. | Later ask “Participaste neste projeto?” and support accepted contributors. Submitting a project does not automatically claim authorship or ownership of another person's work. |
| [10 · Pricing and offer](./references/product-hunt-submission/10-pricing-offer.png) | Optional payment classification; separate promotional offer, code and expiry. | Keep “Monetização (opcional)”, not a question asking for a numeric price. Distinguish a free plan from a time-limited trial. Community offers are a later optional addition. |

## UI and copy rules to preserve

- One visible label for a single input. No repeated section title, repeated question or explanatory paragraph for Monetização or Modelo de negócio.
- Single-column reading order for identity, maturity, availability and each destination. Source code is the requested exception: Acesso and Licença side by side on desktop, stacked on mobile.
- Preserve one divider after “Para quem é útil?”; none between Monetização, Modelo de negócio and Código-fonte.
- Keep “Código-fonte (opcional)” with “Acesso (opcional)” and “Licença (opcional)”. Keep B2B/B2C/B2G/C2C with Portuguese explanations in parentheses.
- Helper text should resolve a real ambiguity, explain a consequential action or report an error. Prefer one sentence; place detailed guidance behind an accessible help control.
- Mark optional fields once at the useful level. Show character counters for bounded text and clear counts for categories/media.
- Dropdown options wrap and remain readable. Dialogs, lists and sheets must fit the viewport without horizontal scrolling; support keyboard navigation, visible focus and focus return.
- Save/autosave remains available throughout. Changes to layout must preserve incomplete drafts, recovery, validation paths and accurate pending-review messages.

Suggested copy, to apply when the UI refinement resumes:

| Field/action | Copy |
|---|---|
| Project identity | Nome do projeto |
| Tagline | Descrição curta · placeholder: “O projeto numa frase” |
| Directory description | Descrição (opcional) · placeholder: “O que faz o projeto e para quem?” |
| Destination collection | Links · optional helper when needed: “Escolhe onde as pessoas podem experimentar ou conhecer o projeto.” |
| Destination labels/actions | Tipo de link · Endereço · Link principal · Adicionar link |
| Optional custom action text | Texto do botão (opcional) |
| Category search | Pesquisar categorias · Ver todas as categorias · Aplicar categorias |
| Logo/gallery/video | Logo (opcional) · Imagens (opcional) · Vídeo (opcional) |
| Commercial fields | Monetização (opcional) · Modelo de negócio (opcional) |
| Source fields | Código-fonte (opcional) · Acesso (opcional) · Licença (opcional) |
| Future attribution | Participaste neste projeto? · Sim, participei · Não, estou a partilhar · Quem participou? |

Labels remain Portuguese and describe projects already in use as well as new work. Do not rename the permanent directory record to a “launch”.

## Future data and display decisions

1. **Category picker:** improve browsing without changing membership semantics. The user accepted the finer taxonomy and browsing groups; see [the taxonomy delivery](./category-taxonomy.md). Picker groups are navigation, not additional selectable categories. Platforms, source licensing and formats remain separate.
2. **Media:** existing ordered gallery keys remain the source of truth. Add reorder; derive the cover from the first gallery image, falling back to logo/default imagery. A future explicit cover must reference a verified image owned by the project. Use the same selection in preview, public detail and social metadata. Do not add remote image importing or animated formats in this pass.
3. **Video/demo:** reuse the existing demo destination kind. If Loom is introduced, generalize video storage to an allowlisted provider + validated provider identifier/URL and update the public player and preview together. Never accept arbitrary embed HTML. No new provider is supported merely because this spec mentions it.
4. **Monetization/trials:** free, freemium, paid, contact-for-quote, undecided and not-applicable remain distinct. A time-limited trial is separate from a permanent free tier; consider an optional `offersFreeTrial` value and optional duration later. Do not introduce amount/currency inputs without a separate pricing requirement. Public copy must not promise a free plan when only a trial exists.
5. **Attribution/team:** retain the submitting account separately from accepted maker memberships. Search existing handles first; email invitations can be considered later with private addresses and an explicit sending flow. Invited people become publicly credited only after accepting. Existing-project submissions and authorship claims need clear ownership/moderation rules before enabling submission by non-makers. This belongs to milestone 6.
6. **Community offers:** optional offer text, code, redemption destination and expiry belong to a separate offer record, not the project's permanent monetization. Require a complete redemption path only when an offer is added; distinguish no expiry from an unknown date. Expired offers should not display as active or block project publication. Defer this until the core submission refinement is complete.

## Suggested next delivery and acceptance checks

When the user resumes implementation, the first focused pass should cover concise copy, actual-limit counters, the compact/full category browser, immediate card preview and gallery ordering. Team attribution, announcement-specific descriptions, new video providers and offers are later deliveries, aligned with milestones 5–6. Geography remains milestone 4; this document does not silently reorder or start it.

Acceptance checks:

- A builder can identify every single-input field without a duplicate heading or long paragraph.
- The category browser supports search, selected count, changing primary, cancel/apply, removal and the three-category limit on desktop and mobile.
- Autosave and recovery preserve selections and gallery order. Canceling category browsing does not save uncommitted selections.
- Gallery cover and social previews agree; missing optional media never blocks a text-only listing.
- Demo shortcuts edit the existing destination and never produce duplicate links.
- Ideas without external links, app-store-only projects, repository projects and established products remain publishable under their existing rules.
- Empty optional fields stay absent from public metadata. Trial, creator and promotional claims reflect stored, verified data.

No code changes, database migration, category split or application verification was performed for this documentation update.

## Implementation follow-up

The user resumed implementation across the roadmap. The focused copy/category/media pass and optional project information are delivered in [milestone 5](./project-pages-and-metrics.md); accepted attribution and announcements are delivered in [milestone 6](./community-and-reviewed-edits.md). The screenshot table remains a record of the supplied reference, not an instruction to add its entire feature set. Promo codes/offers, trials, extra media providers and email invitations remain deferred.
