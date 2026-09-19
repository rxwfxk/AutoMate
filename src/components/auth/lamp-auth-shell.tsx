"use client";

import { useEffect, useRef, useState } from "react";
import { Gauge } from "lucide-react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";

/**
 * Pull-cord lamp toggle wrapping the real login/signup form — recolored to
 * the app's own "warm cream" tokens instead of the dark+gold reference the
 * user pasted (ต่างจากที่แนบมา ปรับให้ธีมเดียวกับแอปทั้งหมดตามที่ตกลง). The
 * form underneath (`children`) is untouched — this is presentation only,
 * same as the rest of the redesign never touching Supabase auth calls.
 */
export function LampAuthShell({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle: string;
}) {
  const [isOn, setIsOn] = useState(false);
  const cordBeadRef = useRef<SVGCircleElement>(null);
  const cordLineRef = useRef<SVGLineElement>(null);
  const cordHitRef = useRef<SVGCircleElement>(null);
  const isOnRef = useRef(isOn);
  isOnRef.current = isOn;

  const CORD_ANCHOR_Y = 136;
  const CORD_REST_Y2 = 178;

  useEffect(() => {
    gsap.registerPlugin(Draggable);
    if (!cordHitRef.current) return;

    const [instance] = Draggable.create(cordHitRef.current, {
      type: "y",
      bounds: { minY: 0, maxY: 60 },
      onDrag() {
        gsap.set(cordBeadRef.current, { y: this.y });
        cordLineRef.current?.setAttribute("y2", String(CORD_REST_Y2 + this.y));
      },
      onRelease() {
        if (this.y > 30) setIsOn(!isOnRef.current);
        gsap.to(this.target, { y: 0, duration: 0.6, ease: "back.out(1.7)" });
        gsap.to(cordBeadRef.current, { y: 0, duration: 0.6, ease: "back.out(1.7)" });
        gsap.to(cordLineRef.current, { attr: { y2: CORD_REST_Y2 }, duration: 0.6, ease: "back.out(1.7)" });
      },
    });

    return () => {
      instance.kill();
    };
  }, []);

  return (
    <div
      data-on={isOn}
      className="relative flex flex-1 items-center justify-center overflow-hidden bg-base p-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          opacity: isOn ? 1 : 0,
          background: "radial-gradient(circle at 30% 30%, var(--rd-cta) 0%, transparent 60%)",
        }}
      />

      <div className="relative flex w-full max-w-3xl flex-wrap items-center justify-center gap-14">
        {/* Lamp — mushroom-shade design, sized to roughly match the login
            card's height per the reference screenshot the user provided. */}
        <div className="flex shrink-0 flex-col items-center">
          <svg
            viewBox="0 0 200 300"
            className="h-[170px] w-auto overflow-visible sm:h-[240px] lg:h-[340px] xl:h-[400px]"
          >
            {/* warm glow behind the shade when lit */}
            <ellipse
              cx="100"
              cy="95"
              rx={isOn ? 95 : 20}
              ry={isOn ? 70 : 12}
              fill="var(--rd-cta)"
              opacity={isOn ? 0.28 : 0}
              style={{ transition: "all .5s ease-out", filter: "blur(6px)" }}
            />

            {/* dome shade */}
            <path
              d="M20 100 A80 80 0 0 1 180 100 Z"
              fill={isOn ? "var(--rd-surface)" : "var(--rd-line-strong)"}
              style={{ transition: "fill .3s ease-out" }}
            />
            {/* glowing underside rim, visible under the dome */}
            <path
              d="M38 100 L162 100 L146 122 L54 122 Z"
              fill={isOn ? "var(--rd-cta)" : "var(--rd-line-dash)"}
              style={{ transition: "fill .3s ease-out" }}
            />

            {/* pole */}
            <rect x="88" y="122" width="24" height="138" fill="var(--rd-ink-faint)" />
            {/* base */}
            <rect x="55" y="260" width="90" height="16" rx="8" fill="var(--rd-ink-faint)" />

            <g>
              <line
                ref={cordLineRef}
                x1="125"
                y1={CORD_ANCHOR_Y}
                x2="125"
                y2={CORD_REST_Y2}
                stroke="var(--rd-line-dash)"
                strokeWidth="2"
              />
              <circle ref={cordBeadRef} cx="125" cy={CORD_REST_Y2} r="6" fill="var(--rd-cta)" />
              <circle
                ref={cordHitRef}
                cx="125"
                cy={CORD_REST_Y2}
                r="18"
                fill="transparent"
                className="cursor-grab active:cursor-grabbing"
              />
            </g>
          </svg>
          <p className="mt-3 text-xs font-bold text-ink-faint">
            {isOn ? "ดึงเพื่อปิดไฟ" : "ดึงเชือกเพื่อเปิดไฟ"}
          </p>
        </div>

        {/* Form */}
        <div
          className="w-full max-w-sm transition-all duration-500"
          style={{
            opacity: isOn ? 1 : 0,
            transform: isOn ? "translateY(0)" : "translateY(24px)",
            pointerEvents: isOn ? "auto" : "none",
          }}
        >
          <div className="mb-8 flex flex-col items-center gap-2">
            <div className="flex size-12 items-center justify-center rounded-card bg-cta text-surface">
              <Gauge className="size-6" />
            </div>
            <h1 className="text-xl font-extrabold text-ink">AutoMate</h1>
            <p className="text-center text-sm text-ink-muted">{subtitle}</p>
          </div>
          <div className="rounded-card bg-surface-card p-6 shadow-card">{children}</div>
        </div>
      </div>
    </div>
  );
}
