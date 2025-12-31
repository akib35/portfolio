import { siteConfig } from '../config';

export function initTypewriter() {
  const typewriterElement = document.getElementById('typewriter') as HTMLElement | null;
  if (!typewriterElement) return;

  const data = [siteConfig.name, "Full Stack Developer", "Programmer", "Security Enthusiast"];
  let currentIndex = 0;

  function typeWriter(text: string): Promise<void> {
    return new Promise((resolve) => {
      let index = 0;
      typewriterElement!.textContent = '';  // Clear text for each new item
      function type() {
        if (index < text.length) {
          typewriterElement!.textContent += text.charAt(index);
          index++;
          setTimeout(type, 100);  // Delay per letter
        } else {
          resolve();  // Done typing this item
        }
      }
      type();
    });
  }

  async function startTyping() {
    while (true) {  // Loop infinitely for a cycling effect
      const item = data[currentIndex];
      await typeWriter(item);
      await new Promise(resolve => setTimeout(resolve, 2000));  // Pause before next item (2 seconds)
      currentIndex = (currentIndex + 1) % data.length;  // Cycle to next item
    }
  }

  startTyping();
}