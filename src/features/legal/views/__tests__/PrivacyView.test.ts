import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PrivacyView from '../PrivacyView.vue'
import { privacyContent } from '@/features/legal/content'

// The page is plain prose around one link; a router instance would add nothing the test reads.
const stubs = { RouterLink: { template: '<a><slot /></a>' } }
// `privacyContent` is a computed over the active language; read its value, not the ref.
const content = privacyContent.value

describe('PrivacyView', () => {
  it('renders every storage entry the notice declares', () => {
    const wrapper = mount(PrivacyView, { global: { stubs } })

    // One row per declared item: a table that silently drops rows is the failure this catches.
    const table = wrapper.get('[data-testid="privacy-storage-table"]')
    expect(table.findAll('tbody tr')).toHaveLength(content.storage.length)
  })

  it('renders every section title', () => {
    const wrapper = mount(PrivacyView, { global: { stubs } })

    for (const section of content.sections) {
      expect(wrapper.text()).toContain(section.title)
    }
  })

  it('offers a way back to the app', () => {
    const wrapper = mount(PrivacyView, { global: { stubs } })

    expect(wrapper.find('[data-testid="privacy-back"]').exists()).toBe(true)
  })
})
