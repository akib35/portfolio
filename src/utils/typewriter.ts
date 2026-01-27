/**
 * Typewriter animation effect for the hero section
 */
import { siteConfig } from '../config';

export function initTypewriter(): void {
  const typewriterElement = document.getElementById('typewriter') as HTMLElement | null;
  if (!typewriterElement) return;

  const data = [siteConfig.name, "Full Stack Developer", "Programmer", "Security Enthusiast"];
  let currentIndex = 0;

  function typeWriter(text: string): Promise<void> {
    return new Promise((resolve) => {
      let index = 0;
      typewriterElement!.textContent = '';
      function type() {
        if (index < text.length) {
          typewriterElement!.textContent += text.charAt(index);
          index++;
          setTimeout(type, 100);
        } else {
          resolve();
        }
      }
      type();
    });
  }

  async function startTyping(): Promise<void> {
    while (true) {
      const item = data[currentIndex];
      await typeWriter(item);
      await new Promise(resolve => setTimeout(resolve, 2000));
      currentIndex = (currentIndex + 1) % data.length;
    }
  }

  startTyping();
}
