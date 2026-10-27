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
    P('Estate planning attorney', 'financial', '📃', 'Wills, trusts and estate plans', 'wills trusts estate planning lawyer'),
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

    // ----- More jobs -----
    // Legal services
    P('Personal injury lawyer', 'legal', '⚖️', 'Personal injury representation after accidents', 'personal injury accident lawyer attorney'),
    P('Family law attorney', 'legal', '👪', 'Divorce, custody and family law', 'divorce custody family law lawyer'),
    P('Immigration attorney', 'legal', '🛂', 'Visas, green cards and citizenship', 'immigration visa green card citizenship lawyer'),
    P('Criminal defense attorney', 'legal', '🧑‍⚖️', 'Criminal defense and DUI cases', 'criminal defense dui lawyer'),
    P('Bankruptcy attorney', 'legal', '📉', 'Bankruptcy and debt relief', 'bankruptcy chapter 7 chapter 13 lawyer'),
    P('Workers comp attorney', 'legal', '🦺', 'Workers compensation claims', 'workers comp injury at work lawyer'),
    P('Social Security disability lawyer', 'legal', '♿', 'Disability benefit claims', 'ssdi disability benefits attorney'),
    P('Legal plan sales', 'legal', '📃', 'Prepaid legal plans for families', 'prepaid legal plan legalshield'),
    P('Paralegal / document services', 'legal', '🗂️', 'Wills, LLCs and legal paperwork', 'paralegal documents llc filing'),

    // Senior and home care
    P('Home care agency', 'care', '🤲', 'In-home care for seniors', 'home care caregiver senior care'),
    P('Assisted living sales', 'care', '🏡', 'Assisted living and memory care', 'assisted living memory care senior living community'),
    P('Hospice', 'care', '🕊️', 'Hospice and comfort care', 'hospice palliative'),
    P('Funeral pre-planning', 'care', '⚱️', 'Pre-planned funeral and cemetery arrangements', 'funeral preneed cemetery pre-planning'),
    P('Medical alert systems', 'care', '🆘', 'Medical alert devices for seniors', 'medical alert life alert fall detection'),
    P('Senior move manager', 'care', '📦', 'Downsizing and moving help for seniors', 'downsizing senior move'),
    P('Home health agency', 'care', '🩹', 'Skilled nursing and therapy at home', 'home health nursing'),
    P('Adult day center', 'care', '☀️', 'Daytime care and activities for seniors', 'adult day care'),
    P('Elder law attorney', 'care', '📜', 'Medicaid planning and elder law', 'elder law medicaid planning lawyer'),

    // More creative and marketing
    P('Video editor', 'marketing', '🎞️', 'Editing videos for creators and brands', 'video editing editor youtube'),
    P('Animator / motion designer', 'marketing', '🌀', 'Explainer videos and motion graphics', 'animation motion graphics explainer'),
    P('YouTube channel manager', 'marketing', '▶️', 'Growing YouTube channels for businesses', 'youtube channel growth'),
    P('Real estate photographer', 'marketing', '🏠', 'Listing photos, video and 3D tours for agents', 'real estate photography matterport listing photos'),
    P('Food photographer', 'marketing', '🍜', 'Menu and food photography for restaurants', 'food photography menu photos'),
    P('Commercial video production', 'marketing', '🎥', 'Commercials and brand films', 'commercial production brand video tv ads'),
    P('Lead generation agency', 'marketing', '🧲', 'Booked appointments and leads for local businesses', 'lead gen leads appointment setting'),
    P('Google Business Profile specialist', 'marketing', '📍', 'Getting businesses found on Google Maps', 'google maps business profile local seo'),
    P('Marketing consultant', 'marketing', '🧠', 'Marketing strategy for small businesses', 'marketing consultant strategy fractional cmo'),
    P('Public relations', 'marketing', '📰', 'Press coverage and PR for brands', 'pr public relations press media'),
    P('Website maintenance', 'marketing', '🧰', 'Website care plans and updates', 'website maintenance hosting care plan'),
    P('Voice-over artist', 'marketing', '🎤', 'Voice-overs for ads, videos and phone systems', 'voice over voiceover'),
    P('Music producer', 'marketing', '🎚️', 'Jingles, beats and custom music', 'music producer jingles beats'),

    // More events and personal milestones
    P('Quinceañera planner', 'events', '👑', 'Quinceañera planning and packages', 'quinceanera quince planner'),
    P('Balloon decor', 'events', '🎈', 'Balloon arches and event decor', 'balloons decor arches'),
    P('Officiant', 'events', '💒', 'Wedding ceremonies', 'officiant wedding ceremony'),
    P('Live band', 'events', '🎸', 'Live music for weddings and events', 'band live music'),
    P('Bartending service', 'events', '🍸', 'Mobile bartending for events', 'bartender bar service mobile bar'),
    P('Food truck', 'events', '🚚', 'Food truck catering for events', 'food truck catering'),
    P('Event lighting & AV', 'events', '🔦', 'Lighting, sound and AV for events', 'lighting av sound production'),
    P('Limo & party bus', 'events', '🚌', 'Limos and party buses for events', 'limo limousine party bus'),
    P('Kids party entertainer', 'events', '🤹', 'Entertainers for kids parties', 'clown magician kids party entertainer'),
    P('Cruise & vacation planner', 'events', '🛳️', 'Cruises and all-inclusive vacations', 'cruise vacation travel planner', 'people'),
    P('Family photographer', 'events', '👨‍👩‍👧', 'Family and maternity photo sessions', 'family photos maternity', 'people'),

    // More insurance
    P('Pet insurance agent', 'insurance', '🐶', 'Pet insurance plans', 'pet insurance'),
    P('Dental & vision insurance', 'insurance', '😁', 'Dental and vision plans', 'dental insurance vision insurance'),
    P('Disability insurance agent', 'insurance', '🩼', 'Income protection if you get hurt or sick', 'disability insurance income protection'),
    P('Long-term care insurance', 'insurance', '🧓', 'Long-term care coverage', 'long term care ltc insurance'),
    P('Group benefits broker', 'insurance', '🏢', 'Health and benefits plans for employers', 'group benefits employee benefits broker', 'businesses'),
    P('Supplemental insurance (Aflac-style)', 'insurance', '🦆', 'Accident and supplemental coverage through work', 'supplemental accident aflac colonial', 'businesses'),
    P('Truck & fleet insurance', 'insurance', '🚛', 'Insurance for truckers and fleets', 'trucking fleet commercial auto', 'businesses'),

    // More real estate
    P('Commercial real estate broker', 'real_estate', '🏬', 'Leasing and selling commercial space', 'commercial real estate cre leasing', 'businesses'),
    P('New home sales', 'real_estate', '🏗️', 'New construction homes', 'new construction builder model home'),
    P('Vacation rental manager', 'real_estate', '🏖️', 'Managing Airbnbs for owners', 'airbnb short term rental vacation rental'),
    P('Timeshare sales', 'real_estate', '🌴', 'Vacation ownership', 'timeshare vacation ownership'),
    P('Land sales', 'real_estate', '🌾', 'Land and lots', 'land lots acreage'),
    P('Apartment leasing agent', 'real_estate', '🏢', 'Apartment leases', 'leasing apartments rentals'),
    P('Hard money lender', 'real_estate', '💸', 'Fast loans for real estate investors', 'hard money private lender fix and flip'),

    // More home services
    P('Concrete contractor', 'home_services', '🧱', 'Driveways, patios and foundations', 'concrete driveway patio'),
    P('Deck & patio builder', 'home_services', '🪚', 'Decks, patios and pergolas', 'deck patio pergola'),
    P('Insulation', 'home_services', '🧤', 'Attic insulation that lowers energy bills', 'insulation attic'),
    P('Foundation repair', 'home_services', '🏚️', 'Foundation and crawl space repair', 'foundation repair crawl space'),
    P('Mold & water damage restoration', 'home_services', '🌊', 'Water damage and mold cleanup', 'restoration water damage mold'),
    P('Tree service', 'home_services', '🌲', 'Tree trimming and removal', 'tree trimming removal arborist'),
    P('Junk removal', 'home_services', '🚛', 'Junk hauling and cleanouts', 'junk removal hauling cleanout'),
    P('Carpet cleaning', 'home_services', '🧺', 'Carpet and upholstery cleaning', 'carpet cleaning upholstery'),
    P('Window cleaning', 'home_services', '🪟', 'Window washing for homes', 'window cleaning washing'),
    P('Chimney sweep', 'home_services', '🔥', 'Chimney cleaning and inspection', 'chimney sweep fireplace'),
    P('Septic service', 'home_services', '🚽', 'Septic pumping and repair', 'septic pumping'),
    P('Irrigation & sprinklers', 'home_services', '💦', 'Sprinkler installation and repair', 'irrigation sprinklers'),
    P('Holiday lighting', 'home_services', '🎄', 'Christmas light installation', 'christmas lights holiday lighting'),
    P('Smart home installer', 'home_services', '🏠', 'Smart home and home theater setup', 'smart home home theater automation'),
    P('Generator installer', 'home_services', '🔋', 'Standby generators for homes', 'generator backup power'),
    P('Kitchen cabinets & countertops', 'home_services', '🍳', 'Cabinets and countertops', 'cabinets countertops granite quartz'),
    P('Bath remodeler', 'home_services', '🛁', 'Walk-in tubs and shower remodels', 'bath remodel walk in tub shower'),
    P('Closet & garage organization', 'home_services', '🗄️', 'Custom closets and garage storage', 'closets organization garage storage'),
    P('Interior designer', 'home_services', '🛋️', 'Interior design for homes', 'interior design decorator'),
    P('Locksmith', 'home_services', '🔑', 'Lockouts, rekeys and smart locks', 'locksmith locks'),
    P('Appliance repair', 'home_services', '🧰', 'Appliance repair', 'appliance repair'),
    P('Home warranty sales', 'home_services', '📄', 'Home warranty plans', 'home warranty'),

    // More personal care
    P('Hair braider', 'personal_care', '🪢', 'Braids, locs and protective styles', 'braids braider locs natural hair'),
    P('Wig & hair extensions', 'personal_care', '💁', 'Wigs and hair extensions', 'wigs extensions'),
    P('Spray tanning', 'personal_care', '🌞', 'Spray tans', 'spray tan tanning'),
    P('Waxing studio', 'personal_care', '🍯', 'Waxing services', 'waxing'),
    P('Permanent makeup', 'personal_care', '✒️', 'Permanent makeup and lip blush', 'permanent makeup pmu'),
    P('Piercing studio', 'personal_care', '💍', 'Body piercing and jewelry', 'piercing'),
    P('Laser hair removal', 'personal_care', '✨', 'Laser hair removal packages', 'laser hair removal'),
    P('Teeth whitening', 'personal_care', '😬', 'Teeth whitening sessions', 'teeth whitening'),
    P('Personal stylist', 'personal_care', '👔', 'Wardrobe styling and shopping', 'stylist wardrobe image consultant'),

    // More health and fitness
    P('Boxing gym', 'fitness', '🥊', 'Boxing classes and memberships', 'boxing gym'),
    P('CrossFit box', 'fitness', '🏋️‍♀️', 'CrossFit memberships', 'crossfit'),
    P('Dance studio', 'fitness', '💃', 'Dance classes for kids and adults', 'dance studio classes'),
    P('Swim school', 'fitness', '🏊‍♂️', 'Swim lessons for kids', 'swim lessons'),
    P('Golf instructor', 'fitness', '⛳', 'Golf lessons', 'golf lessons'),
    P('Acupuncturist', 'fitness', '📍', 'Acupuncture for pain and stress', 'acupuncture'),
    P('Therapist / counselor', 'fitness', '🛋️', 'Counseling and therapy sessions', 'therapy therapist counseling mental health'),
    P('IV therapy & wellness', 'fitness', '💧', 'IV hydration and vitamin drips', 'iv therapy hydration'),
    P('Orthodontist', 'fitness', '🦷', 'Braces and clear aligners', 'orthodontist braces invisalign'),
    P('Plastic surgery consultant', 'fitness', '🪞', 'Cosmetic surgery consultations', 'plastic surgery cosmetic'),
    P('Sleep clinic', 'fitness', '😴', 'Sleep apnea testing and treatment', 'sleep apnea'),
    P('Hormone & men’s health clinic', 'fitness', '🧬', 'Hormone therapy and men’s health', 'trt hormone mens health'),
    P('Sports coach (private)', 'fitness', '🏀', 'Private coaching for young athletes', 'sports coach training athletes'),
    P('Senior fitness', 'fitness', '🧓', 'Fitness classes for older adults', 'senior fitness'),

    // More auto
    P('Car wash memberships', 'auto', '🚿', 'Unlimited car wash memberships', 'car wash membership'),
    P('Auto glass', 'auto', '🪟', 'Windshield repair and replacement', 'windshield auto glass'),
    P('Tire shop', 'auto', '🛞', 'Tires and alignments', 'tires alignment'),
    P('Extended car warranty', 'auto', '🛡️', 'Vehicle service contracts', 'extended warranty vehicle service contract'),
    P('Auto body shop', 'auto', '🔩', 'Collision repair', 'body shop collision repair'),
    P('Car audio & accessories', 'auto', '🔊', 'Car audio, lift kits and accessories', 'car audio stereo accessories'),
    P('Fleet sales', 'auto', '🚐', 'Work trucks and vans for businesses', 'fleet commercial vehicles work trucks', 'businesses'),
    P('Boat dealer', 'auto', '🚤', 'Boats and marine', 'boats marine dealer'),

    // More financial
    P('Mortgage protection insurance', 'financial', '🏠', 'Mortgage protection for homeowners', 'mortgage protection'),
    P('Retirement plan advisor (401k)', 'financial', '🏦', '401(k) plans for small businesses', '401k retirement plan employer', 'businesses'),
    P('Student loan advisor', 'financial', '🎓', 'Student loan repayment help', 'student loans'),
    P('Cash advance / payday', 'financial', '💵', 'Short-term personal loans', 'personal loans cash advance'),
    P('Gold & precious metals', 'financial', '🥇', 'Gold and silver for retirement accounts', 'gold silver precious metals ira'),
    P('Crypto education', 'financial', '🪙', 'Crypto courses and coaching', 'crypto bitcoin education'),
    P('Fractional CFO', 'financial', '📊', 'CFO services for growing companies', 'fractional cfo finance', 'businesses'),

    // More education and coaching
    P('Coding bootcamp', 'education', '👩‍💻', 'Coding bootcamp enrollment', 'coding bootcamp tech career'),
    P('Trade school', 'education', '🔧', 'Trade school programs', 'trade school welding hvac electrician program'),
    P('Test prep center', 'education', '📝', 'SAT, ACT and test prep courses', 'test prep sat act'),
    P('Learning center', 'education', '🧩', 'After-school learning programs', 'learning center after school'),
    P('Art classes', 'education', '🎨', 'Art classes for kids and adults', 'art classes painting'),
    P('Language school', 'education', '🗣️', 'English and language classes', 'language school esl spanish english'),
    P('Fitness certification', 'education', '🎖️', 'Personal trainer certification courses', 'certification course'),
    P('Relationship coach', 'education', '💞', 'Dating and relationship coaching', 'dating coach relationship'),
    P('Executive coach', 'education', '🧑‍💼', 'Leadership coaching for executives', 'executive coach leadership', 'businesses'),
    P('Public speaking coach', 'education', '🎤', 'Public speaking coaching', 'public speaking'),
    P('Real estate school', 'education', '🏫', 'Real estate license courses', 'real estate license school'),
    P('Summer camp', 'education', '🏕️', 'Summer camp enrollment', 'summer camp kids camp'),

    // More software
    P('CRM sales', 'software', '📇', 'CRM software for small businesses', 'crm salesforce hubspot'),
    P('Marketing software sales', 'software', '📬', 'Email and marketing automation software', 'marketing automation software'),
    P('Payroll software sales', 'software', '💲', 'Payroll and HR software', 'payroll software hris'),
    P('Construction software sales', 'software', '🏗️', 'Project software for contractors', 'construction software'),
    P('Restaurant tech sales', 'software', '🍽️', 'Online ordering and restaurant software', 'online ordering restaurant software'),
    P('Healthcare software sales', 'software', '🏥', 'EHR and practice software for clinics', 'ehr emr practice management'),
    P('AI tools sales', 'software', '🤖', 'AI tools and automation for businesses', 'ai automation chatbot'),
    P('Website builder sales', 'software', '🧱', 'Website and booking platforms', 'website builder platform'),

    // More business services
    P('Medical waste disposal', 'b2b_services', '♻️', 'Medical waste pickup for clinics', 'medical waste disposal'),
    P('Pest control (commercial)', 'b2b_services', '🪳', 'Pest control for restaurants and offices', 'commercial pest control'),
    P('Commercial HVAC', 'b2b_services', '🌬️', 'Maintenance plans for commercial HVAC', 'commercial hvac maintenance'),
    P('Fire & safety inspection', 'b2b_services', '🧯', 'Fire extinguishers, alarms and inspections', 'fire safety extinguisher inspection'),
    P('Grease trap & hood cleaning', 'b2b_services', '🍳', 'Kitchen hood and grease trap cleaning', 'hood cleaning grease trap'),
    P('Office furniture', 'b2b_services', '🪑', 'Office furniture and installs', 'office furniture'),
    P('Corporate catering', 'b2b_services', '🥪', 'Office lunches and catering', 'corporate catering office lunch'),
    P('Corporate wellness', 'b2b_services', '🧘‍♀️', 'Wellness programs for employees', 'corporate wellness employee'),
    P('Translation services', 'b2b_services', '🌍', 'Translation and interpreting', 'translation interpreter'),
    P('Answering service', 'b2b_services', '📞', 'Live answering and virtual receptionists', 'answering service virtual receptionist'),
    P('Virtual assistant agency', 'b2b_services', '💻', 'Virtual assistants for busy owners', 'virtual assistant va'),
    P('Document shredding', 'b2b_services', '🗂️', 'Secure shredding for offices', 'shredding'),
    P('Background checks & drug testing', 'b2b_services', '🧾', 'Screening services for employers', 'background check drug testing'),
    P('Equipment leasing', 'b2b_services', '📠', 'Leasing equipment for businesses', 'equipment leasing'),
    P('Commercial solar', 'b2b_services', '☀️', 'Solar for businesses and warehouses', 'commercial solar'),
    P('EV charging for businesses', 'b2b_services', '🔌', 'EV chargers for properties and fleets', 'ev charging stations'),
    P('Credit card terminal sales', 'b2b_services', '💳', 'Card terminals and POS for shops', 'card terminal'),
    P('Commercial roofing', 'b2b_services', '🏭', 'Roofing for commercial buildings', 'commercial roofing'),
    P('Janitorial supplies', 'b2b_services', '🧴', 'Cleaning supplies for facilities', 'janitorial supplies'),

    // More wholesale and manufacturing
    P('Restaurant equipment sales', 'wholesale', '🍳', 'Ovens, fryers and kitchen equipment', 'restaurant equipment kitchen'),
    P('Promotional products', 'wholesale', '🧢', 'Branded shirts, hats and swag', 'promotional products swag merch'),
    P('Custom apparel / screen printing', 'wholesale', '👕', 'Custom shirts and uniforms', 'screen printing custom apparel embroidery'),
    P('Salon product distributor', 'wholesale', '🧴', 'Hair and beauty products for salons', 'salon products beauty distributor'),
    P('Auto parts supplier', 'wholesale', '⚙️', 'Parts for repair shops', 'auto parts'),
    P('Medical supplies distributor', 'wholesale', '🩹', 'Supplies for clinics and care homes', 'medical supplies'),
    P('Specialty coffee roaster', 'wholesale', '☕', 'Coffee for cafes and offices', 'coffee roaster wholesale coffee'),
    P('Craft brewery sales', 'wholesale', '🍺', 'Getting beer into bars and stores', 'brewery beer sales'),
    P('Farm & produce sales', 'wholesale', '🥕', 'Local produce for restaurants', 'farm produce local'),
    P('Chemical & cleaning supply', 'wholesale', '🧪', 'Chemicals and cleaning supplies', 'chemical supply'),

    // More medical sales
    P('Durable medical equipment', 'medical_sales', '🦽', 'Wheelchairs, beds and mobility equipment', 'dme durable medical equipment'),
    P('Surgical sales rep', 'medical_sales', '🔪', 'Surgical products for hospitals', 'surgical rep'),
    P('Diagnostic imaging sales', 'medical_sales', '🩻', 'Imaging equipment for clinics', 'imaging ultrasound x-ray'),
    P('Healthcare staffing sales', 'medical_sales', '👩‍⚕️', 'Nurses and staff for clinics', 'healthcare staffing'),
    P('Telehealth sales', 'medical_sales', '📹', 'Telehealth platforms for practices', 'telehealth virtual care'),

    // More retail and products
    P('Solar generator & battery sales', 'retail', '🔋', 'Portable power stations', 'battery power station'),
    P('Bicycle shop', 'retail', '🚲', 'Bikes and e-bikes', 'bikes ebikes bicycle'),
    P('Firearms & outdoor store', 'retail', '🎯', 'Outdoor gear and sporting goods', 'outdoor sporting goods hunting'),
    P('Flooring showroom', 'retail', '🪵', 'Flooring for homes', 'flooring showroom'),
    P('Lighting store', 'retail', '💡', 'Lighting for homes', 'lighting fixtures'),
    P('Kitchen showroom', 'retail', '🍽️', 'Kitchen design and appliances', 'kitchen showroom'),
    P('Golf cart dealer', 'retail', '⛳', 'Golf carts and LSVs', 'golf carts'),
    P('Musical instruments store', 'retail', '🎸', 'Instruments and lessons', 'instruments guitar store'),
    P('Vacuum & sewing store', 'retail', '🧵', 'Vacuums and sewing machines', 'vacuum sewing machines'),
    P('Wine shop', 'retail', '🍷', 'Wine club memberships', 'wine club'),

    // More phone, internet and energy
    P('Solar community plans', 'telecom', '🌤️', 'Community solar subscriptions', 'community solar'),
    P('Home internet (5G)', 'telecom', '📡', '5G home internet', '5g home internet'),
    P('Propane & heating oil', 'telecom', '🛢️', 'Propane and heating oil delivery', 'propane heating oil'),

    // More recruiting
    P('Trucking recruiter', 'recruiting', '🚛', 'Hiring CDL drivers', 'cdl drivers trucking recruiter'),
    P('Tech recruiter', 'recruiting', '💻', 'Placing software engineers', 'tech recruiter engineers'),
    P('Sales recruiter', 'recruiting', '📈', 'Placing salespeople', 'sales recruiter'),
    P('Military / armed forces recruiter', 'recruiting', '🎖️', 'Military careers', 'military recruiter army navy'),
    P('College athletics recruiter', 'recruiting', '🏈', 'Recruiting student athletes', 'athletic recruiting'),

    // More nonprofit
    P('Animal shelter fundraising', 'nonprofit', '🐾', 'Donations for an animal shelter', 'animal shelter rescue'),
    P('Hospital foundation', 'nonprofit', '🏥', 'Giving to a hospital foundation', 'hospital foundation'),
    P('University advancement', 'nonprofit', '🎓', 'Alumni giving', 'alumni giving university'),
    P('Political campaign fundraising', 'nonprofit', '🗳️', 'Campaign donations and volunteers', 'campaign political fundraising'),
    P('Arts organization membership', 'nonprofit', '🎭', 'Memberships for a museum or theater', 'museum theater membership arts'),
  ];
})();
