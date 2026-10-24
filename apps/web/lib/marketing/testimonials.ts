/**
 * Church leaders' words — shared by the landing page and the pricing page.
 * `result` is the headline shown above the quote; it must restate the quote,
 * never add a claim. `photo` is for the person's own headshot (public/images/
 * testimonials/) once they send one — never a stock face.
 */
export type Testimonial = { quote: string; name: string; role: string; initials: string; result: string; photo?: string };

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Our worship director used to spend two hours every week on scheduling. It's twenty minutes now, and nobody is surprised the morning of.",
    name: "Michael Kim",
    role: "Lead Pastor · Crossroads Community Church",
    initials: "MK",
    result: "2 hours of scheduling → 20 minutes",
  },
  {
    quote:
      "The volunteers actually confirm. That sounds small until you've spent five years texting eleven people every Saturday to ask if they're still coming.",
    name: "Rachel Adeyemi",
    role: "Children's Director · Grace Fellowship",
    initials: "RA",
    result: "The volunteers actually confirm",
  },
  {
    quote:
      "I'm not technical and I didn't need to be. I opened it, understood it, and had our first service plan built before lunch.",
    name: "Tom Barrett",
    role: "Church Administrator · Rowan Springs Chapel",
    initials: "TB",
    result: "First service plan built before lunch",
  },
];
