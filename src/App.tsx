import { useEffect, useRef, useState } from "react";

export function App() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) return;

    // Try to remove Arena branding from iframe (works only if same-origin)
    const removeArenaBranding = () => {
      try {
        const iframe = iframeRef.current;
        if (!iframe?.contentDocument) return;

        const doc = iframe.contentDocument;

        // Common Arena watermark selectors
        const selectorsToHide = [
          '[class*="arena-badge"]',
          '[class*="arena-watermark"]',
          '[class*="arena-branding"]',
          '[id*="arena-badge"]',
          '[id*="arena-watermark"]',
          '#arena-badge',
          '.arena-badge',
          '[data-testid*="arena"]',
          'a[href*="arena.site"]',
          'a[href*="arena.dev"]',
        ];

        selectorsToHide.forEach((selector) => {
          try {
            doc.querySelectorAll(selector).forEach((el: Element) => {
              (el as HTMLElement).style.setProperty("display", "none", "important");
              (el as HTMLElement).style.setProperty("visibility", "hidden", "important");
              (el as HTMLElement).style.setProperty("opacity", "0", "important");
              (el as HTMLElement).style.setProperty("pointer-events", "none", "important");
            });
          } catch {
            // ignore
          }
        });

        // Search for text-based Arena references
        const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const el = node as HTMLElement;
          const text = (el.textContent || "").toLowerCase();
          const computedStyle = iframe.contentWindow?.getComputedStyle(el);
          
          if (
            computedStyle &&
            (computedStyle.position === "fixed" || computedStyle.position === "sticky")
          ) {
            if (
              text.includes("arena") ||
              text.includes("made with") ||
              text.includes("built with") ||
              text.includes("powered by")
            ) {
              el.style.setProperty("display", "none", "important");
            }
          }
        }

        // Inject CSS to hide Arena elements
        const style = doc.createElement("style");
        style.textContent = `
          [class*="arena" i],
          [id*="arena" i],
          a[href*="arena.site"],
          a[href*="arena.dev"],
          [class*="watermark" i],
          [class*="branding" i] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
          }
        `;
        doc.head.appendChild(style);
      } catch {
        // Cross-origin - can't access iframe content directly
        console.log("Cross-origin: using overlay method to hide watermark");
      }
    };

    // Run multiple times to catch dynamically added elements
    removeArenaBranding();
    const interval = setInterval(removeArenaBranding, 300);

    // Stop after 10 seconds
    const timeout = setTimeout(() => clearInterval(interval), 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [loaded]);

  return (
    <div className="w-full h-screen relative overflow-hidden bg-white">
      <iframe
        ref={iframeRef}
        src="https://019c609f-6b79-786c-9217-650462c48133.arena.site"
        className="w-full border-none absolute inset-0"
        style={{
          width: "100%",
          height: "calc(100% + 60px)", // Extra height to push watermark below viewport
          border: "none",
        }}
        title="Website"
        onLoad={() => setLoaded(true)}
      />
      {/* Bottom cover strip to hide any fixed watermark at the bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white z-50"
        style={{ height: "0px" }}
        id="bottom-cover"
      />
    </div>
  );
}
