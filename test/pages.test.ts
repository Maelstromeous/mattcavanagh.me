import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import LandingPage from '@/pages/LandingPage.vue'
import PortfolioPage from '@/pages/PortfolioPage.vue'

describe('pages', () => {
  it('landing renders the headline', () => {
    const wrapper = mount(LandingPage)
    expect(wrapper.get('h1').text()).toBe('I make websites & AWS platforms sing')
  })

  it('portfolio renders the headline', () => {
    const wrapper = mount(PortfolioPage)
    expect(wrapper.get('h1').text()).toBe('My Portfolio & Skills')
  })
})
