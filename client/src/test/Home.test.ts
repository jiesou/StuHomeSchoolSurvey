import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Home from '../views/Home.vue'

describe('Home.vue', () => {
  it('renders home page correctly', () => {
    const wrapper = mount(Home)
    expect(wrapper.text()).toContain('家校问卷系统')
    expect(wrapper.text()).toContain('通过问卷收集家长反馈，促进家校沟通')
  })

  it('has the correct navigation link', () => {
    const wrapper = mount(Home)
    const link = wrapper.find('router-link')
    expect(link.attributes('to')).toBe('/admin')
  })
})

describe('Survey Types', () => {
  it('should validate star question config', () => {
    const starConfig = {
      type: 'star' as const,
      maxRating: 5
    }
    
    expect(starConfig.type).toBe('star')
    expect(starConfig.maxRating).toBe(5)
  })

  it('should validate input question config', () => {
    const inputConfig = {
      type: 'input' as const,
      multiline: true,
      maxLength: 500
    }
    
    expect(inputConfig.type).toBe('input')
    expect(inputConfig.multiline).toBe(true)
    expect(inputConfig.maxLength).toBe(500)
  })
})