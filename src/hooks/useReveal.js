import { useState, useEffect, useCallback } from 'react'

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * useReveal — single element scroll-reveal.
 * Returns a callback ref to attach to the element.
 * Adds `.revealed` class when it enters the viewport.
 *
 * Uses a callback ref (not useRef) so the observer is created
 * when the element actually mounts — works with conditional rendering.
 */
export function useReveal({ threshold = 0.15, rootMargin = '0px 0px -40px 0px', once = true } = {}) {
  const [el, setEl] = useState(null)

  const ref = useCallback(node => {
    setEl(node)
  }, [])

  useEffect(() => {
    if (!el) return

    if (prefersReducedMotion) {
      el.classList.add('revealed')
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          if (once) observer.unobserve(entry.target)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [el, threshold, rootMargin, once])

  return ref
}

/**
 * useRevealAll — container-level scroll-reveal.
 * Returns a callback ref for a container. Observes all `.reveal-fade-up` and
 * `.reveal-scale` children, adding `.revealed` when each enters viewport.
 */
export function useRevealAll({ threshold = 0.1, rootMargin = '0px 0px -30px 0px', once = true } = {}) {
  const [container, setContainer] = useState(null)

  const ref = useCallback(node => {
    setContainer(node)
  }, [])

  useEffect(() => {
    if (!container) return

    const targets = container.querySelectorAll('.reveal-fade-up, .reveal-scale, .reveal-slide-left, .reveal-slide-right, .reveal-blur-up')
    if (targets.length === 0) return

    if (prefersReducedMotion) {
      targets.forEach(el => el.classList.add('revealed'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            if (once) observer.unobserve(entry.target)
          }
        })
      },
      { threshold, rootMargin }
    )

    targets.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [container, threshold, rootMargin, once])

  return ref
}
