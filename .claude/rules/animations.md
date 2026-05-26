# Animations

- **Framer Motion** for UI animations (not GSAP)
- **CSS transitions** for simple hover/focus effects
- Avoid `style jsx` — broken in Next.js App Router. Use CSS keyframes in `globals.css` instead
- Tailwind v4 motion variants: `motion-safe:` and `motion-reduce:` for animation control
- Tailwind v4 arbitrary media queries: `[@media(hover:none)]:` for touch device variants (not `max-[hover:none]:`)
