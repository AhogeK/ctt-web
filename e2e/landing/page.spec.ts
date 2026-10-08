import { test, expect } from '@playwright/test'
import { mockAuthApis, loginViaForm } from '../utils/auth-helpers.js'

/**
 * Landing page E2E.
 *
 * The page's contract in this stage: `/` renders without a session, and the
 * top-bar call to action points at the destination that matches the visitor's
 * state — registration when signed out, the dashboard when signed in.
 */
test.describe('Landing page', () => {
  test('renders for an unauthenticated visitor without redirecting', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByTestId('marketing-cta')).toHaveAttribute('href', '/auth/login')
  })

  test('leads with the product and keeps the account entry in the top bar', async ({ page }) => {
    await page.goto('/')

    // Two distinct roles: the hero sells the product (the IDE plugin — the thing
    // the data comes from), while the top bar answers "I already have an
    // account". Neither routes to registration: that page carries no OAuth
    // provider, so GitHub users would hit a dead end there; they reach signup
    // through the login page's "Create account" link.
    await expect(page.getByTestId('landing-primary-cta')).toHaveAttribute(
      'href',
      'https://plugins.jetbrains.com/plugin/29379',
    )
    await expect(page.getByTestId('marketing-cta')).toHaveAttribute('href', '/auth/login')
    await expect(page.locator('a[href="/auth/register"]')).toHaveCount(0)
  })

  test('shows the real product surface above the fold, labelled as example data', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 800 })
    await page.goto('/')

    // The landing page's acceptance: within the first screen the visitor must be able to tell
    // what this is, see one piece of real UI evidence, and reach the main CTA —
    // all before scrolling. The evidence is the real dashboard components
    // (SummaryStatGrid + the ranked list), not a screenshot, so it must carry no
    // image or canvas: that also keeps the LCP element text.
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport()
    await expect(page.getByTestId('landing-primary-cta')).toBeInViewport()
    await expect(page.getByTestId('hero-preview')).toBeInViewport()
    await expect(page.getByTestId('hero-preview').getByText('Example data')).toBeVisible()
    await expect(page.getByTestId('hero-preview').getByText(/total/i)).toBeVisible()
    await expect(page.locator('[data-testid="hero-preview"] img, [data-testid="hero-preview"] canvas')).toHaveCount(0)
  })

  test('stacks the first screen on a phone without a horizontal scrollbar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    // The first screen is the pitch (headline + action); the demo window is its own step just below,
    // so it arrives after a short scroll rather than competing with the headline for the same screen.
    await expect(page.getByTestId('landing-primary-cta')).toBeInViewport()
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.9))
    await expect(page.getByTestId('hero-preview')).toBeInViewport()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('points an authenticated visitor at the dashboard', async ({ page }) => {
    await mockAuthApis(page)
    await loginViaForm(page)

    await page.goto('/')

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByTestId('marketing-cta')).toHaveAttribute('href', '/dashboard')
    // One entry only: the sign-in affordance is the same control, relabelled.
    await expect(page.getByTestId('marketing-cta')).toHaveCount(1)
  })

  test('opens the source dialog from both entries without moving the page', async ({ page }) => {
    // "View source" after "Install the plugin" is a question about the whole ecosystem, and three
    // repositories exist. The dialog answers it in place: scrolling to the open-source section at
    // the page's end would have to cross the landing stage's pinned track, which is exactly the
    // performance this entry should not replay, and an instant jump loses the sense of travel.
    await page.goto('/')
    await page.locator('h1').waitFor()

    // The footer keeps the ecosystem list; the anchor's no-JavaScript destination is now the
    // open-source section at the page's end.
    await expect(page.locator('#source')).toHaveCount(1)
    await expect(page.getByRole('link', { name: 'View source' })).toHaveAttribute('href', '#source')

    const before = await page.evaluate(() => window.scrollY)
    await page.getByRole('link', { name: 'View source' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('link')).toHaveCount(3)
    await expect(dialog.getByRole('link', { name: /code-time-tracker/ })).toHaveAttribute(
      'href',
      'https://github.com/AhogeK/code-time-tracker',
    )
    // The point of the dialog: the page itself must not move.
    expect(await page.evaluate(() => window.scrollY)).toBe(before)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()

    // The top bar's shortcut opens the same dialog.
    await page.getByTestId('marketing-source').click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('closes the page with capabilities, the pipeline and the open-source block', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.locator('h1').waitFor()

    // Capabilities: one claim with one consequence per item, and the figures are the product's own.
    const capabilities = page.getByTestId('landing-capabilities')
    for (const title of [
      '24 boards, every one real.',
      '67 badges across 14 ladders.',
      'Sync that converges.',
      'Devices and keys, in plain sight.',
    ]) {
      await expect(capabilities.getByText(title), `${title} is missing`).toBeVisible()
    }
    await expect(capabilities.locator('article')).toHaveCount(4)

    // Below the fold the band waits hidden — even with its box already on screen (it is pulled up
    // into the stage's dead tail) — until the hand-off line at ~1.5 screens: the same line the year
    // beat's dissolve is anchored to, read live from this band's box, so the lower hand-off is a
    // cross-fade and the band never stands crisp while the beat is still painted (the observer keeps
    // running this band on phones only; the stage takes it over above the breakpoint).
    // The footer deliberately does not join them: it is the page's last block and just scrolls.
    await expect(capabilities).toHaveCSS('opacity', '0')
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.4))
    await expect(capabilities).toHaveCSS('opacity', '0')
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.7))
    await expect
      .poll(async () => Number(await capabilities.evaluate((el) => getComputedStyle(el).opacity)), {
        message: 'the band never entered after the hand-off line',
      })
      .toBeGreaterThan(0.95)
    await expect(page.locator('footer')).toHaveCSS('opacity', '1')

    // The pipeline: three ordered steps, side by side only when there is room (see the phone case).
    const pipeline = page.getByTestId('landing-how-it-works')
    await expect(pipeline.locator('ol > li')).toHaveCount(3)
    const columns = await pipeline
      .locator('ol')
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)
    expect(columns).toBe(3)

    // Order is part of the claim: capabilities, then the pipeline, then the source.
    const tops = await page.evaluate(() =>
      ['landing-capabilities', 'landing-how-it-works', 'landing-open-source'].map(
        (id) =>
          (document.querySelector(`[data-testid="${id}"]`) as HTMLElement).getBoundingClientRect().top + window.scrollY,
      ),
    )
    expect(tops[0]!).toBeLessThan(tops[1]!)
    expect(tops[1]!).toBeLessThan(tops[2]!)

    // The source anchor moved onto the open-source block; the footer keeps its ecosystem list.
    await expect(page.locator('#source')).toHaveCount(1)
    expect(
      await page.evaluate(
        () => document.getElementById('source')?.matches('[data-testid="landing-open-source"]') ?? false,
      ),
    ).toBe(true)
    // The ecosystem list plus the support channels (Ko-fi / Afdian / Solana).
    await expect(page.locator('footer').getByRole('link')).toHaveCount(6)

    // The footer shares the bands' 1200px content grid: its own content box starts on the same
    // left edge as every band above it, instead of on a container with its own inset.
    const [bandLeft, footerLeft] = await Promise.all([
      capabilities.evaluate((el) => el.firstElementChild!.getBoundingClientRect().left),
      page.locator('footer > div').evaluate((el) => el.getBoundingClientRect().left),
    ])
    expect(Math.abs(footerLeft - bandLeft)).toBeLessThan(1)

    const source = page.getByTestId('landing-open-source')
    await expect(source.getByRole('link')).toHaveCount(3)
    await expect(source.getByRole('link', { name: 'code-time-tracker' })).toHaveAttribute(
      'href',
      'https://github.com/AhogeK/code-time-tracker',
    )
    await expect(source.getByText('Apache-2.0')).toHaveCount(1)
    await expect(source.getByText('MIT', { exact: true })).toHaveCount(2)

    // The deploy command copies as it reads.
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    await source.getByRole('button', { name: 'Copy' }).click()
    await expect(source.getByRole('button', { name: 'Copied' })).toBeVisible()
    const clipboard = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboard).toContain('git clone https://github.com/AhogeK/ctt-server')
    expect(clipboard).toContain('docker compose up -d --build')

    // ... and the footer is plain content at the page top and the page bottom alike: no arrival state,
    // it simply sits at the end of the page.
    await page.locator('footer').scrollIntoViewIfNeeded()
    await expect(page.locator('footer')).toHaveCSS('opacity', '1')
  })

  test('states the price plainly and links the support channels', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.locator('h1').waitFor()

    // The band under the stage: everything is free, so it leads with the statement rather than a
    // price table, and the hosted entry cannot be started — it carries no control at all.
    const band = page.getByTestId('landing-free')
    await band.scrollIntoViewIfNeeded()
    await expect(band.getByRole('heading', { name: 'Free, every part of it' })).toBeVisible()
    await expect(band.getByText('no tiers, no trial, nothing to buy')).toBeVisible()
    await expect(band.locator('article')).toHaveCount(2)

    const selfHost = band.getByTestId('run-option-self-host')
    await expect(selfHost.getByRole('link', { name: 'Read the quick start' })).toHaveAttribute('href', '#source')

    const hosted = band.getByTestId('run-option-hosted')
    await expect(hosted.getByText('Not offered today')).toBeVisible()
    await expect(hosted.getByRole('link')).toHaveCount(0)
    await expect(hosted.getByRole('button')).toHaveCount(0)

    // Support is voluntary and lives in two quiet places — the band and the footer — with the same
    // channels the plugin lists. Both sets must be real links to the right destinations.
    const support = page.getByTestId('landing-support')
    await expect(support.getByRole('link', { name: 'Ko-fi' })).toHaveAttribute('href', 'https://ko-fi.com/ahogek')
    await expect(support.getByRole('link', { name: 'Afdian' })).toHaveAttribute('href', 'https://afdian.com/a/AhogeK')
    await expect(support.getByRole('link', { name: 'Solana' })).toHaveAttribute('href', /solscan\.io\/account/)
    await expect(page.locator('footer').getByRole('link', { name: 'Ko-fi' })).toHaveAttribute(
      'href',
      'https://ko-fi.com/ahogek',
    )
  })

  test('stacks the pipeline into a readable column on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await page.locator('h1').waitFor()

    const list = page.getByTestId('landing-how-it-works').locator('ol')
    const columns = await list.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)
    expect(columns).toBe(1)

    // Stacked in order, each step on its own row at the list's full width — never a squeezed row.
    const boxes = await list.locator('li').evaluateAll((els) =>
      els.map((el) => {
        const rect = el.getBoundingClientRect()
        return { top: rect.top, bottom: rect.bottom, width: rect.width }
      }),
    )
    expect(boxes[0]!.bottom).toBeLessThanOrEqual(boxes[1]!.top)
    expect(boxes[1]!.bottom).toBeLessThanOrEqual(boxes[2]!.top)
    const width = await list.evaluate((el) => el.getBoundingClientRect().width)
    for (const box of boxes) {
      expect(box.width, 'a step is narrower than the column').toBeGreaterThan(width * 0.95)
    }

    // And the page as a whole still fits the phone.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)

    // The new bands join the phone fade like every other piece.
    await expect
      .poll(async () =>
        page.evaluate(() =>
          ['landing-capabilities', 'landing-how-it-works', 'landing-open-source'].every((id) =>
            document.querySelector(`[data-testid="${id}"]`)?.hasAttribute('data-reveal-state'),
          ),
        ),
      )
      .toBe(true)
  })

  test('raises each beat into the centre of the same stage', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    // The entrance is a timed animation; wait for its end state rather than for a duration.
    await expect(page.locator('[data-testid="hero-preview"]').locator('..')).toHaveCSS('opacity', '1')

    // The stage screens' fades are fixed clocks, and every hand-off is a cross-fade, so the stage is
    // never empty and never shows two blocks crisp at once: the year screen's entrance and the
    // opening screen's exit share one trigger (0.6 screens), and the year screen's exit dissolve is
    // anchored to the first closing band's top crossing 60% of the viewport (1.5 screens at this
    // height), where the band's own entrance reads the same line. None of the three depends on how
    // far a gesture travels (a scrubbed fade would be crossed between two frames by a flick and
    // never seen).
    const heroFade = page.locator('[data-testid="landing-beat-hero"] [data-scroll-fade]')
    const beatFade = page.locator('[data-testid="landing-beat-activity"] [data-scroll-fade]')
    const beatOpacity = () => beatFade.evaluate((el) => Number(getComputedStyle(el).opacity))
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.2))
    await expect(heroFade).toHaveCSS('opacity', '1')
    await expect(beatFade).toHaveCSS('opacity', '0')
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.4))
    await expect.poll(() => heroFade.evaluate((el) => Number(getComputedStyle(el).opacity))).toBeLessThan(0.95)
    await expect
      .poll(beatOpacity, { message: 'the year screen never entered while the opening screen left' })
      .toBeGreaterThan(0.95)
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2.4))
    await expect.poll(() => heroFade.evaluate((el) => Number(getComputedStyle(el).opacity))).toBeLessThanOrEqual(0.1)

    // Beat 2 passes through the centre of the viewport: the stage is pinned and the layer is
    // translated to -50% of its own height from the middle — one linear scrub across the release
    // window, so the exact centre falls at ~1.01 screens (travel = 135% of the layer over the
    // release line). It never parks: reaching the centre is a moment, not a stretch.
    const centred = async () =>
      page.evaluate(() => {
        const beat = document.querySelector('[data-testid="landing-beat-activity"]') as HTMLElement
        const fade = document.querySelector('[data-testid="landing-beat-activity"] [data-scroll-fade]') as HTMLElement
        const rect = beat.getBoundingClientRect()
        const centre = (window.innerHeight - rect.height) / 2
        return { offset: Math.round(rect.top - centre), opacity: Number(getComputedStyle(fade).opacity) }
      })
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.01))
    // Poll instead of sleeping: the beat must actually pass within ±4px of the centre. Scrolling up
    // here also re-crosses the band anchor, so this doubles as the upward re-entry check — the
    // entrance must be a real fade (state above 0.8 once settled), never a pop.
    await expect
      .poll(async () => Math.abs((await centred()).offset), { message: 'beat never crossed the centre of the stage' })
      .toBeLessThanOrEqual(4)
    await expect
      .poll(async () => (await centred()).opacity, { message: 'beat did not fade back in on the way up' })
      .toBeGreaterThan(0.8)

    // And it keeps moving: a further tenth of a viewport must carry it off the centre line — the
    // scrub is continuous (no frozen park; a park is what reads as dragging against the wheel), and
    // the dissolve is still armed for the band anchor far below, so the beat is fully opaque here.
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.1))
    await expect
      .poll(async () => (await centred()).offset, { message: 'the beat stayed frozen at the centre' })
      .toBeLessThanOrEqual(-30)
    await expect(beatFade).toHaveCSS('opacity', '1')

    // The exit dissolve plays on its own 900ms clock from the band anchor (1.5 screens at this
    // height) — overlapping the first closing band's rise into view, so the hand-off never shows a
    // blank pinned screen — and by the end of the track it has completed: no scroll length is
    // involved, so every visitor sees the same dissolve.
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 3.2))
    await expect.poll(beatOpacity).toBeLessThan(0.95)

    // And the beat really is the product's artefact: a year of days plus the cabinet's ladders,
    // which share the beat because they answer the same question.
    const activity = page.getByTestId('landing-beat-activity')
    await expect(activity.locator('[data-date]')).toHaveCount(364)
    await expect(activity.getByTestId('trophy-card')).toHaveCount(3)
    await expect(activity.getByText('Example data')).toBeVisible()

    // And it completes: by the end of the track the year grid has dissolved, because the page
    // continues with the closing bands below — an opaque slide-away is the missing exit.
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 3.6))
    await expect
      .poll(beatOpacity, { message: 'the beat never faded out before the closing bands' })
      .toBeLessThanOrEqual(0.1)
  })

  test('pins the frosted bar as fixed so a dropped filter pass can never show raw content', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    // Pinned by `sticky`, the bar's backdrop-filter pass was dropped as one unit under repaint
    // churn — tint included — and the raw page flashed through at full strength. The `fixed` path
    // runs the same stress without a dropped frame, and the shell's padding-top carries the in-flow
    // space the bar used to occupy. This pins both halves: the position and the compensation.
    const st = await page.getByRole('banner').evaluate((el) => {
      const cs = getComputedStyle(el)
      const shell = el.parentElement as HTMLElement
      return { position: cs.position, blur: cs.backdropFilter, shellPad: getComputedStyle(shell).paddingTop }
    })
    expect(st.position, 'the bar must be fixed to the viewport, not sticky').toBe('fixed')
    expect(st.blur, 'the frosted look stays on the bar itself').toMatch(/blur/)
    expect(st.shellPad, 'the shell keeps the bar’s in-flow space (content + its 1px rule)').toBe('57px')
  })

  test('keeps the stage inside a phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await expect(page.getByTestId('landing-beat-activity')).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
