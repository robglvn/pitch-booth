/*
  PITCH BOOTH — business types

  Used when someone calls business owners instead of people at home ("You're calling … · Change" on the
  home screen). Each call picks the chosen kind of business (or a random one for "Any kind of business")
  and one owner type, and the AI builds the person who picks up from both.

  To add a kind of business, copy an entry:
    label     shown in the picker, plural ("Restaurants & cafes")
    calling   shown on the home screen after "You're calling" ("Restaurant & cafe owners")
    who       the person who picks up, singular ("owner of a restaurant or cafe")
    emoji     shown in the picker
    examples  small text under the label in the picker
    detail    what that business is like day to day, so the person reacts the way that business would
*/
window.PB_BUSINESS_TYPES = {
  restaurant: { label: 'Restaurants & cafes', calling: 'Restaurant & cafe owners', who: 'owner of a restaurant or cafe', emoji: '🍽️', examples: 'Family restaurants, cafes, bakeries, food trucks',
    detail: 'Thin margins, staffing headaches, busy lunch and dinner rushes, online reviews matter a lot, and the owner is often on the floor.' },
  auto: { label: 'Auto shops', calling: 'Auto shop owners', who: 'owner of an auto repair or body shop', emoji: '🔧', examples: 'Repair shops, body shops, tire and detail shops',
    detail: 'Hands-on owner, phones ringing, customers waiting on cars, parts costs rising, trust and word of mouth drive business.' },
  salon: { label: 'Salons & barbershops', calling: 'Salon & barbershop owners', who: 'owner of a salon or barbershop', emoji: '💈', examples: 'Hair salons, barbershops, nail and lash studios',
    detail: 'Booked by appointment, rents chairs or employs stylists, busy weekends, loyal regulars, works with clients most of the day.' },
  fitness: { label: 'Gyms & studios', calling: 'Gym & studio owners', who: 'owner of a gym or fitness studio', emoji: '🏋️', examples: 'Gyms, yoga and pilates studios, martial arts',
    detail: 'Membership churn, January rush then a summer slump, coaches to schedule, competes with big-box gyms on price.' },
  medical: { label: 'Dental & medical offices', calling: 'Dental & medical offices', who: 'practice owner or office manager at a dental or medical office', emoji: '🦷', examples: 'Dentists, chiropractors, clinics, vets',
    detail: 'Run by appointments and insurance billing, a front desk that screens calls, compliance worries, no-shows cost money.' },
  contractor: { label: 'Contractors & trades', calling: 'Contractors & trades', who: 'owner of a contracting or trades business', emoji: '🛠️', examples: 'Plumbing, HVAC, roofing, landscaping, electricians',
    detail: 'Out on job sites most of the day, crews to manage, seasonal swings, quotes and callbacks in the evening.' },
  retail: { label: 'Shops & boutiques', calling: 'Shop & boutique owners', who: 'owner of a retail shop or boutique', emoji: '🛍️', examples: 'Boutiques, gift shops, furniture, specialty stores',
    detail: 'Foot traffic and online competition, inventory tied up in stock, small staff, holidays make or break the year.' },
  professional: { label: 'Law & accounting offices', calling: 'Law & accounting offices', who: 'partner or office manager at a small law or accounting firm', emoji: '⚖️', examples: 'Law firms, accountants, tax and insurance offices',
    detail: 'Bills by the hour so time is money, cautious and detail-minded, a few partners decide together, busy seasons.' },
  realty: { label: 'Real estate offices', calling: 'Real estate offices', who: 'broker or owner of a real estate office', emoji: '🏡', examples: 'Brokerages, property managers, title offices',
    detail: 'Agents are independent and hard to rally, the market drives everything, always chasing leads and listings.' },
  hospitality: { label: 'Hotels & venues', calling: 'Hotels & venues', who: 'owner or manager of a hotel or event venue', emoji: '🏨', examples: 'Small hotels, B&Bs, event and wedding venues',
    detail: 'Bookings and occupancy rule the week, events on weekends, staff turnover, reviews on booking sites matter.' },
  office: { label: 'Offices & small companies', calling: 'Small office-based companies', who: 'owner or operations manager of a small office-based company', emoji: '🏢', examples: 'Agencies, small tech firms, nonprofits, offices of 10–50',
    detail: 'A handful of departments, the owner wears many hats, purchases go through a manager or a partner, budgets set yearly.' },
};

// The kinds of owner who pick up. One is picked per call, combined with the kind of business above.
window.PB_OWNER_TYPES = [
  { label: 'Does everything themselves', desc: 'An owner-operator who answers the phone, does the work, and does the books at night; time is the scarcest thing they have.' },
  { label: 'Second-generation owner', desc: 'Took over the family business; proud of how things have always been done and wary of change.' },
  { label: 'Gatekeeper', desc: "An office manager or front-desk person whose job is to protect the owner's time and screen calls like this one." },
  { label: 'Barely staying afloat', desc: 'Margins are thin and every dollar gets scrutinized; interested only if it pays for itself fast.' },
  { label: 'Growing fast', desc: 'Just added staff or a second location; overwhelmed, but open to anything that takes work off their plate.' },
  { label: 'Burned by vendors', desc: 'Signed contracts before that did not deliver, and assumes salespeople overpromise.' },
  { label: 'Numbers person', desc: 'Runs the business by the numbers and wants specifics, proof, and a clear return before anything else.' },
  { label: 'New owner', desc: 'Opened or bought the business in the last year; excited, still learning, and short on cash.' },
];
