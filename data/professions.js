/*
  PITCH BOOTH — what people do

  The searchable list behind "What do you do?". Each job points to a group in data/industries.js, which
  supplies the customer types and objections. Picking one fills in "what you sell" with the example, which
  the person can rewrite in their own words. Anything not here: "Write your own" (Claude drafts it).

  To add one, add a line:  P('Name', 'group', 'emoji', 'What you sell, as an example', 'extra search words', audience?)
    group      a key from data/industries.js
    audience   optional: 'businesses' or 'people' when this job sells to a different audience than its group
*/
window.PB_PROFESSIONS = (() => {
  const P = (name, group, emoji, offer, words = '', audience) => ({ name, group, emoji, offer, words, ...(audience ? { audience } : {}) });
  return [
    // Marketing & creative (selling to businesses)
    P('Videographer', 'marketing', '🎬', 'Short-form video and photos for local businesses', 'video videos reels tiktok instagram content filmmaker'),
    P('Photographer (businesses)', 'marketing', '📷', 'Product, headshot and brand photography for businesses', 'photo photos headshots product photography'),
    P('Social media manager', 'marketing', '📱', 'Managing Instagram, TikTok and Facebook for local businesses', 'social media posting content instagram facebook'),
    P('Web designer', 'marketing', '🖥️', 'Websites for small businesses that bring in customers', 'website websites web developer wordpress'),
    P('SEO specialist', 'marketing', '🔎', 'Getting local businesses found on Google', 'seo google search ranking local search'),
    P('Marketing agency', 'marketing', '📣', 'Full-service marketing for small businesses', 'agency digital marketing ads advertising'),
    P('Paid ads specialist', 'marketing', '🎯', 'Facebook and Google ads that bring in leads', 'ppc ads facebook ads google ads advertising'),
    P('Graphic designer', 'marketing', '🎨', 'Logos, menus, flyers and brand design', 'design logo branding flyers'),
    P('Branding agency', 'marketing', '✨', 'Brand identity and naming for growing businesses', 'brand identity rebrand'),
    P('Copywriter', 'marketing', '✍️', 'Website and ad copy that sells', 'writing copy content writer'),
    P('Drone photographer', 'marketing', '🚁', 'Aerial photos and video for real estate and businesses', 'drone aerial'),
    P('UGC creator', 'marketing', '🤳', 'User-generated video content for brands', 'ugc influencer content creator brands'),
    P('Influencer', 'marketing', '⭐', 'Sponsored posts and brand partnerships', 'influencer sponsorship partnerships creator'),
    P('Podcast producer', 'marketing', '🎙️', 'Podcast production and editing for businesses', 'podcast audio'),
    P('Email marketing specialist', 'marketing', '📧', 'Email campaigns that bring customers back', 'email newsletters campaigns'),
    P('Print & signage', 'marketing', '🪧', 'Signs, banners and printed marketing for businesses', 'signs printing banners vehicle wraps'),
    P('Reputation management', 'marketing', '💬', 'Getting more 5-star reviews for local businesses', 'reviews google reviews reputation'),

    // Events and personal milestones
    P('Wedding videographer', 'events', '💍', 'Wedding films for couples', 'wedding video film videography'),
    P('Wedding photographer', 'events', '📸', 'Wedding and engagement photography', 'wedding photos photography engagement'),
    P('DJ', 'events', '🎧', 'DJ and MC for weddings and parties', 'dj music mc party'),
    P('Event venue', 'events', '🏛️', 'A venue for weddings and private events', 'venue hall wedding venue'),
    P('Caterer', 'events', '🍱', 'Catering for weddings, parties and corporate events', 'catering food events'),
    P('Florist', 'events', '💐', 'Flowers for weddings and events', 'flowers floral'),
    P('Wedding planner', 'events', '📋', 'Full and day-of wedding planning', 'planner coordination planning'),
    P('Party rentals', 'events', '🎪', 'Tents, tables, bounce houses and party rentals', 'rentals tents bounce house'),
    P('Photo booth', 'events', '🖼️', 'Photo booths for weddings and parties', 'photo booth'),
    P('Custom cake baker', 'events', '🎂', 'Custom cakes for weddings and celebrations', 'cakes bakery desserts'),
    P('Portrait photographer', 'events', '🧑‍🎨', 'Family, senior and newborn portraits', 'portraits family photos newborn senior pictures', 'people'),
    P('Event planner (corporate)', 'events', '🗂️', 'Corporate events and team retreats', 'corporate events retreats conferences', 'businesses'),

    // Insurance
    P('Life insurance agent', 'insurance', '🛡️', 'Term and whole life insurance for families', 'life insurance term whole'),
    P('Health insurance agent', 'insurance', '🏥', 'Health plans for individuals and families', 'health insurance aca marketplace'),
    P('Medicare agent', 'insurance', '👵', 'Medicare supplement and Advantage plans', 'medicare seniors supplement advantage'),
    P('Final expense agent', 'insurance', '🕊️', 'Final expense coverage for seniors', 'final expense burial funeral'),
    P('Auto & home insurance agent', 'insurance', '🚘', 'Auto, home and renters insurance', 'auto insurance home insurance car insurance renters'),
    P('Commercial insurance agent', 'insurance', '🏢', 'Liability, workers comp and business insurance', 'commercial insurance business insurance liability workers comp', 'businesses'),
    P('Annuities advisor', 'insurance', '💰', 'Annuities and guaranteed retirement income', 'annuity annuities retirement income'),

    // Real estate and lending
    P('Real estate agent', 'real_estate', '🏡', 'Helping homeowners sell for top dollar', 'realtor listing agent sell homes'),
    P("Buyer's agent", 'real_estate', '🔑', 'Helping families buy their next home', 'buyers agent home buyers'),
    P('Mortgage loan officer', 'real_estate', '🏦', 'Home loans and refinancing', 'mortgage loans refinance lender'),
    P('Mortgage broker', 'real_estate', '📑', 'Shopping lenders to find the best mortgage', 'mortgage broker'),
    P('Property manager', 'real_estate', '🏘️', 'Managing rental properties for owners', 'property management rentals landlords'),
    P('Home buyer / investor', 'real_estate', '💵', 'Buying houses for cash, as-is', 'we buy houses cash buyer investor wholesaling'),
    P('Home stager', 'real_estate', '🛋️', 'Staging homes so they sell faster', 'staging'),
    P('Home inspector', 'real_estate', '🔍', 'Home inspections for buyers and sellers', 'inspection inspector'),
    P('Title & escrow', 'real_estate', '📜', 'Title and escrow services for agents and buyers', 'title escrow closing', 'businesses'),

    // Home services
    P('Solar sales', 'home_services', '☀️', 'Solar panels with no money down', 'solar panels energy'),
    P('Roofer', 'home_services', '🏠', 'Roof repair and replacement', 'roofing roof'),
    P('HVAC technician / company', 'home_services', '❄️', 'Heating and air conditioning repair and installs', 'hvac ac heating air conditioning furnace'),
    P('Plumber', 'home_services', '🚿', 'Plumbing repair and water heaters', 'plumbing pipes water heater'),
    P('Electrician', 'home_services', '💡', 'Electrical repairs, panels and EV chargers', 'electrical electric wiring'),
    P('Pest control', 'home_services', '🐜', 'Pest control plans for homes', 'pest exterminator bugs termites'),
    P('Window & door sales', 'home_services', '🪟', 'Energy-efficient windows and doors', 'windows doors'),
    P('Pool service', 'home_services', '🏊', 'Pool cleaning and repair', 'pool cleaning'),
    P('Home security sales', 'home_services', '🔒', 'Home security and camera systems', 'security alarm cameras'),
    P('Landscaper', 'home_services', '🌳', 'Lawn care and landscaping', 'lawn landscaping yard mowing'),
    P('House cleaner', 'home_services', '🧽', 'Recurring home cleaning', 'cleaning maid housekeeping'),
    P('Painter', 'home_services', '🖌️', 'Interior and exterior painting', 'painting'),
    P('Remodeling contractor', 'home_services', '🛠️', 'Kitchen and bathroom remodels', 'remodel renovation kitchen bathroom contractor'),
    P('Gutters & siding', 'home_services', '🏚️', 'Gutters, siding and exterior work', 'gutters siding'),
    P('Moving company', 'home_services', '📦', 'Local and long-distance moving', 'movers moving'),
    P('Water treatment', 'home_services', '💧', 'Water softeners and filtration', 'water softener filtration'),
    P('Garage doors', 'home_services', '🚪', 'Garage door repair and installation', 'garage door'),
    P('Handyman', 'home_services', '🔨', 'Repairs and small home projects', 'handyman repairs'),
    P('Flooring', 'home_services', '🪵', 'Flooring installation', 'flooring floors tile carpet hardwood'),
    P('Fencing', 'home_services', '🚧', 'Fence installation and repair', 'fence fencing'),
    P('Pressure washing', 'home_services', '🫧', 'Pressure washing for homes and driveways', 'pressure washing power washing'),
    P('Dog walker / pet sitter', 'home_services', '🦮', 'Dog walking and pet sitting', 'dog walking pet sitting pets'),
    P('Piano tuner', 'home_services', '🎹', 'Piano tuning and repair', 'piano tuning repair'),

    // Personal care and beauty
    P('Barber', 'personal_care', '💈', 'Fades, beard work and full restyles', 'barber haircut fades beard'),
    P('Hair stylist', 'personal_care', '💇', 'Cuts, color and styling', 'hair stylist salon color'),
    P('Nail tech', 'personal_care', '💅', 'Manicures, pedicures and nail art', 'nails manicure pedicure'),
    P('Lash artist', 'personal_care', '👁️', 'Lash extensions and lifts', 'lashes lash extensions'),
    P('Esthetician', 'personal_care', '🧖', 'Facials and skin care', 'esthetician facials skin care spa'),
    P('Massage therapist', 'personal_care', '💆', 'Massage therapy', 'massage'),
    P('Tattoo artist', 'personal_care', '🖋️', 'Custom tattoos', 'tattoo'),
    P('Makeup artist', 'personal_care', '💄', 'Makeup for weddings and events', 'makeup mua'),
    P('Brow artist', 'personal_care', '🪮', 'Brow shaping, tinting and microblading', 'brows microblading'),
    P('Spa owner', 'personal_care', '🧴', 'Spa packages and memberships', 'spa day spa'),
    P('Pet groomer', 'personal_care', '🐩', 'Grooming for dogs and cats', 'dog grooming pet groomer pets'),

    // Health and fitness
    P('Personal trainer', 'fitness', '💪', 'One-on-one personal training', 'trainer personal training'),
    P('Gym membership sales', 'fitness', '🏋️', 'Gym memberships', 'gym membership'),
    P('Yoga or pilates studio', 'fitness', '🧘', 'Classes and memberships', 'yoga pilates studio'),
    P('Med spa', 'fitness', '💉', 'Botox, fillers and skin treatments', 'med spa botox fillers aesthetics'),
    P('Chiropractor', 'fitness', '🦴', 'Chiropractic care for back and neck pain', 'chiropractor chiro back pain'),
    P('Dental office', 'fitness', '🦷', 'Dental cleanings, whitening and implants', 'dentist dental front desk'),
    P('Physical therapist', 'fitness', '🦵', 'Physical therapy and rehab', 'physical therapy pt rehab'),
    P('Nutrition coach', 'fitness', '🥗', 'Nutrition coaching and meal plans', 'nutrition diet weight loss'),
    P('Martial arts school', 'fitness', '🥋', 'Martial arts classes for kids and adults', 'martial arts karate jiu jitsu'),
    P('Weight loss clinic', 'fitness', '⚖️', 'Medical weight loss programs', 'weight loss semaglutide'),
    P('Optometrist', 'fitness', '👓', 'Eye exams and eyewear', 'optometrist eye doctor glasses'),
    P('Hearing aid specialist', 'fitness', '🦻', 'Hearing tests and hearing aids', 'hearing aids'),
    P('Veterinary clinic', 'fitness', '🐾', 'Wellness plans and pet care', 'vet veterinarian animal hospital pets'),

    // Auto
    P('Car salesperson', 'auto', '🚗', 'New and used cars', 'car sales dealership'),
    P('Dealership BDC rep', 'auto', '☎️', 'Booking appointments for a dealership', 'bdc dealership appointments'),
    P('Auto detailer', 'auto', '🧼', 'Car detailing and ceramic coating', 'detailing detail ceramic coating'),
    P('Auto repair shop', 'auto', '🔧', 'Car repair and maintenance', 'mechanic auto repair'),
    P('Window tint & wraps', 'auto', '🕶️', 'Window tint, wraps and paint protection', 'tint wraps ppf'),
    P('Used car dealer', 'auto', '🚙', 'Quality used cars with financing', 'used cars'),
    P('RV & motorcycle sales', 'auto', '🏍️', 'RVs, motorcycles and powersports', 'rv motorcycle powersports boats'),

    // Financial
    P('Financial advisor', 'financial', '📈', 'Retirement planning and investments', 'financial advisor planner investments retirement'),
    P('Tax preparer', 'financial', '🧾', 'Tax preparation for individuals and families', 'taxes tax prep'),
    P('Credit repair', 'financial', '📊', 'Credit repair and coaching', 'credit repair score'),
    P('Bookkeeper', 'financial', '📒', 'Monthly bookkeeping for small businesses', 'bookkeeping books quickbooks', 'businesses'),
    P('Debt relief', 'financial', '🧮', 'Debt consolidation and relief programs', 'debt relief consolidation'),
    P('Estate planning attorney', 'financial', '📃', 'Wills, trusts and estate plans', 'wills trusts estate planning'),
    P('Wealth manager', 'financial', '💼', 'Wealth management for high earners', 'wealth management'),

    // Education and coaching
    P('Tutor', 'education', '📚', 'Math and SAT tutoring', 'tutoring tutor sat act'),
    P('Life coach', 'education', '🌱', 'Life and mindset coaching', 'life coach coaching mindset'),
    P('Business coach', 'education', '🧭', 'Coaching for small business owners', 'business coach consultant', 'businesses'),
    P('Music teacher', 'education', '🎹', 'Music lessons for kids and adults', 'music lessons piano guitar'),
    P('Driving school', 'education', '🚦', 'Driving lessons for teens', 'driving lessons'),
    P('College admissions advisor', 'education', '🎓', 'College admissions coaching', 'college admissions counselor'),
    P('Online course creator', 'education', '💻', 'An online course and community', 'course online program'),
    P('Enrollment advisor', 'education', '🏫', 'Enrolling students in programs', 'enrollment admissions school'),
    P('Daycare or preschool', 'education', '🧸', 'Childcare and preschool enrollment', 'daycare preschool childcare'),
    P('Dog trainer', 'education', '🐕', 'Puppy classes and private dog training', 'dog training puppy obedience pets'),
    P('Sales trainer', 'education', '🗣️', 'Sales training for teams', 'sales training', 'businesses'),

    // Software
    P('SaaS sales rep (SDR)', 'software', '💻', 'Booking demos for software', 'sdr bdr saas software sales'),
    P('Account executive', 'software', '🤝', 'Closing software deals', 'account executive ae saas'),
    P('POS systems sales', 'software', '🧾', 'Point-of-sale systems for restaurants and shops', 'pos point of sale'),
    P('Booking software sales', 'software', '📅', 'Scheduling software for service businesses', 'scheduling booking software'),
    P('App developer', 'software', '📲', 'Custom apps for businesses', 'app developer mobile app'),
    P('Cybersecurity sales', 'software', '🛡️', 'Cybersecurity for small businesses', 'cybersecurity security'),

    // Business services
    P('Commercial cleaning', 'b2b_services', '🧹', 'Office and commercial cleaning', 'janitorial commercial cleaning'),
    P('IT support (MSP)', 'b2b_services', '🖧', 'Managed IT support for small offices', 'it support msp managed services'),
    P('Payroll & HR services', 'b2b_services', '🗃️', 'Payroll and HR for small businesses', 'payroll hr peo'),
    P('Merchant services', 'b2b_services', '💳', 'Card processing that cuts fees', 'merchant services credit card processing payments'),
    P('Business loans', 'b2b_services', '🏦', 'Funding and loans for small businesses', 'business loans funding mca'),
    P('Staffing agency', 'b2b_services', '👷', 'Temporary and permanent staff for businesses', 'staffing temp workers'),
    P('Uniform & linen service', 'b2b_services', '👕', 'Uniforms, mats and linens', 'uniforms linen'),
    P('Waste management', 'b2b_services', '🗑️', 'Trash and recycling service', 'waste trash dumpster recycling'),
    P('Office coffee & vending', 'b2b_services', '☕', 'Coffee, snacks and vending for offices', 'vending coffee service'),
    P('Commercial landscaping', 'b2b_services', '🌿', 'Grounds maintenance for properties', 'commercial landscaping grounds'),
    P('Security guard services', 'b2b_services', '🦺', 'Security guards and patrols', 'security guards patrol'),
    P('Business attorney', 'b2b_services', '⚖️', 'Legal services for small businesses', 'lawyer attorney legal'),
    P('Accounting firm', 'b2b_services', '🧮', 'Accounting and taxes for businesses', 'cpa accountant accounting'),
    P('Consultant', 'b2b_services', '📐', 'Consulting for growing companies', 'consulting consultant'),
    P('Courier & logistics', 'b2b_services', '🚚', 'Local delivery and logistics', 'courier delivery logistics freight'),
    P('Business phone systems', 'b2b_services', '☎️', 'Phone systems and internet for offices', 'voip phone systems'),

    // Wholesale and manufacturing
    P('Food distributor rep', 'wholesale', '🥫', 'Food and supplies for restaurants', 'food distributor broadline'),
    P('Wholesale rep', 'wholesale', '📦', 'Wholesale products for retailers', 'wholesale products'),
    P("Manufacturer's rep", 'wholesale', '🏭', 'Representing a manufacturer to buyers', 'manufacturers rep'),
    P('Packaging sales', 'wholesale', '🎁', 'Packaging and labels for brands', 'packaging labels'),
    P('Industrial supplies', 'wholesale', '⚙️', 'Tools, parts and supplies for shops and plants', 'industrial supplies parts'),
    P('Beverage distributor', 'wholesale', '🥤', 'Beverages for bars, shops and restaurants', 'beverage beer wine distributor'),
    P('Equipment sales', 'wholesale', '🚜', 'Equipment for contractors and businesses', 'equipment machinery'),
    P('Building materials sales', 'wholesale', '🧱', 'Building materials for contractors', 'building materials lumber'),
    P('Office supplies', 'wholesale', '🖇️', 'Office supplies and furniture for businesses', 'office supplies'),

    // Medical and pharma sales
    P('Medical device rep', 'medical_sales', '🩺', 'Medical devices for clinics', 'medical device rep'),
    P('Pharmaceutical rep', 'medical_sales', '💊', 'Medications for physicians', 'pharma pharmaceutical drug rep'),
    P('Dental supplies rep', 'medical_sales', '🦷', 'Dental supplies and equipment', 'dental supplies'),
    P('Lab services rep', 'medical_sales', '🧪', 'Lab testing services for clinics', 'lab services testing'),
    P('Medical billing services', 'medical_sales', '🧾', 'Billing and collections for practices', 'medical billing'),

    // Retail and products
    P('Furniture sales', 'retail', '🛋️', 'Furniture for the home', 'furniture showroom'),
    P('Mattress sales', 'retail', '🛏️', 'Mattresses and bedding', 'mattress'),
    P('Jewelry sales', 'retail', '💎', 'Engagement rings and fine jewelry', 'jewelry rings'),
    P('Phone & electronics store', 'retail', '📱', 'Phones, tablets and electronics', 'electronics phones store'),
    P('Clothing boutique', 'retail', '👗', 'Clothing and accessories', 'clothing boutique fashion'),
    P('Appliance sales', 'retail', '🧊', 'Appliances for the home', 'appliances'),
    P('Hot tub & pool store', 'retail', '🛁', 'Hot tubs, pools and supplies', 'hot tub spa pool store'),
    P('Bridal shop', 'retail', '👰', 'Wedding dresses and fittings', 'bridal dresses'),
    P('Eyewear store', 'retail', '🕶️', 'Glasses and sunglasses', 'eyewear glasses'),

    // Phone, internet and energy
    P('Cell phone plans', 'telecom', '📶', 'Cell phone plans for families', 'cell phone wireless plans'),
    P('Internet & cable sales', 'telecom', '🌐', 'Fiber internet for homes', 'internet cable fiber'),
    P('Energy plans', 'telecom', '⚡', 'Lower electricity rates', 'energy electricity utility'),
    P('Satellite TV', 'telecom', '📡', 'Satellite TV packages', 'satellite tv'),

    // Recruiting
    P('Recruiter', 'recruiting', '🧑‍💼', 'Placing candidates in great jobs', 'recruiter recruiting headhunter'),
    P('Executive recruiter', 'recruiting', '👔', 'Placing executives and senior leaders', 'executive search headhunter'),
    P('Healthcare recruiter', 'recruiting', '🩺', 'Placing nurses and clinicians', 'nurse recruiter travel nursing'),

    // Nonprofit
    P('Nonprofit fundraiser', 'nonprofit', '❤️', 'Monthly giving for a cause', 'nonprofit fundraiser donations'),
    P('Church or ministry giving', 'nonprofit', '⛪', 'Giving and pledges for a church', 'church ministry tithe'),
    P('School fundraising', 'nonprofit', '🏫', 'Donations for a school', 'school fundraising pta booster'),

    // Hospitality and food (selling to customers and groups)
    P('Restaurant or catering sales', 'events', '🍽️', 'Private dining and catering for groups', 'restaurant private events group dining'),
    P('Hotel sales', 'events', '🏨', 'Group room blocks and events at a hotel', 'hotel group sales', 'businesses'),
    P('Travel agent', 'events', '✈️', 'Vacations, cruises and honeymoons', 'travel agent cruises vacations', 'people'),
  ];
})();
