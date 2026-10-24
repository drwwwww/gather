import type { Testimonial } from "../../lib/marketing/testimonials";

/** A testimonial giver's own headshot when we have it, otherwise their initials. Never a stock face. */
export default function PersonBadge({
  t,
  size,
  area,
}: {
  t: Pick<Testimonial, "initials" | "photo">;
  size: number;
  area: "blue" | "plum" | "olive";
}) {
  if (t.photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={t.photo} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size >= 56 ? 20 : 13,
        background: `var(--area-${area}-tint)`,
        color: `var(--area-${area}-ink)`,
      }}
    >
      {t.initials}
    </span>
  );
}
