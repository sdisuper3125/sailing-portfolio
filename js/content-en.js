// English version of the content. Structure mirrors content.js; photos, links and video ids are copied from it.
(() => {
  const zh = window.CONTENT;
  const en = JSON.parse(JSON.stringify(zh));

  en.SITE.title = "Logan's Sailing Log";
  en.SITE.subtitle = "Logan's Sailing Log";
  en.SITE.intro = "I live in Taiwan, study sustainability and climate at graduate school, and I am learning to sail.";
  en.SITE.what = "This website is a sailboat that follows the coast of Taiwan. At each port I tell you about something I have done, and what I have learned at sea.";
  en.SITE.hello = "I am Hao-Che Chang (Logan). ";

  // per port: meta + texts of each block, in order (null = keep as is)
  const T = {
    keelung: {
      hook: 'Who I am now', vol: 'I am still learning, and glad to get things done together with others.',
      name: 'Keelung', tag: 'About me', title: 'Hi, I am Logan', lead: 'My friends call me Logan.',
      blocks: [
        'I am 24 years old. My student life has revolved around sustainability, energy and the ocean.',
        'I like to try things with my hands, I look for ways to solve problems, and I enjoy learning new things. I value long-term relationships, and I am most at ease with people who share similar values.',
        'In high school I joined the Taiwan Youth Climate Coalition, the main organisation driving youth climate action in Taiwan. That was where my interest in climate and sustainability began.',
        'It led me to do internships in different industries, to see how experts with different backgrounds think about sustainability.',
        'Today I am a master\'s student at National Sun Yat-sen University in Taiwan, studying sustainable finance. Before that I studied political science, and at National Taiwan University I researched greenwashing in climate initiatives. I hope to make a small difference in the world through the power of capital.',
        'I also volunteer at a community foundation, where I teach children from low-income families English, maths, Chinese, history and geography, and share things beyond schoolwork.',
        'I do not get seasick easily. When living on a boat, I pay special attention to everyone\'s personal space and privacy. We live in a small space together, and I think that matters a lot.',
      ],
    },
    hualien: {
      hook: 'Why I am applying', vol: 'The sea is a place I have always wanted to get closer to.',
      name: 'Hualien', tag: 'Why ITSB', title: 'Why I want to volunteer with In the Same Boat',
      lead: 'I would like to bring what I have learned about sailing and sustainability to a place where it is needed.',
      blocks: [
        'I love the sea. I hold a licence to operate vessels under 24 metres. Last summer I sailed across the Taiwan Strait to Penghu with a group of university students on three J80 sailboats, and I was the skipper of one of them. After that trip I believed even more that getting to know the sea with your own hands is where a changed relationship between people and the ocean begins.',
        'In Taiwan, many people live farther from the sea than you might expect, sometimes only because they have never really gone near it. I also only learned what it is like out on the water after I joined my university sailing club.',
        'I also write screenplays, and I like looking at coastlines from the air with a drone. Once, while scouting an outlying island for a documentary, I saw sand-dredging vessels working out of bounds, illegal fishing, and a large amount of marine litter on the local coast and fishing grounds. From then on, the damage to the environment was no longer just distant data.',
        'My studies have followed the same direction. I started following climate issues in high school, then studied politics, then global governance, and now sustainable finance. My master\'s thesis analysed whether the carbon emissions of 5,000 companies in Taiwan and Japan improved after they joined international climate initiatives. What I care about is whether a commitment turns into action that can be measured.',
        'I also believe the direction in which money flows can shape a whole industry. That is why I want to work in sustainable finance, and one day I hope capital can become a force that protects the ocean. To judge which funding really helps, I want to first see with my own eyes what is happening at sea, and to have done this cleaning work with my own hands. This is the main reason I would like to join In the Same Boat.',
        'As for life on board, I know that when space is limited, one person\'s carelessness affects the whole boat: put things back where they belong, share the watches and chores without being asked, and let others sleep well when you are tired. For six years I ran a guesthouse in Taipei and hosted more than 1,500 travellers. In the early years I did everything myself, from hosting to cleaning, and I got used to doing the details nobody notices.',
        'I am also preparing an Instagram account about sailing, to help more young people in Taiwan get to know sailboats and the sea. After I return to Taiwan, I hope to keep promoting education on marine litter and sailing. I still have a lot to learn, and I would be glad to build a rhythm with everyone in your way.',
      ],
    },
    kaohsiung: {
      hook: 'My interests', vol: 'Beyond climate, sustainability and sailing, I have many everyday interests.',
      name: 'Kaohsiung', tag: 'Interests', title: 'My interests', lead: 'Beyond climate, sustainability and sailing,',
      blocks: [
        ['I like cooking, and I bake desserts. I have an electric-assist bicycle, and I often ride it around Taipei.', ['Cycling']],
        'I like classical music, and I listen to pop as well. I also enjoy exhibitions and art museums. Whenever I visit a city, I look for the local museum, and I often find something interesting.',
        'I once worked part-time as a screenwriter, helping write the scripts for four VR films and one documentary. The documentary is about the marine island ecology of Taiwan and a culture that is about to disappear.',
        'Watch the documentary (YouTube)',
        'I also follow international politics and energy policy, which is one of my study topics.',
      ],
    },
    taitung: {
      hook: 'Spring 2027, NHH exchange', vol: 'Next January I will start my exchange in Norway.',
      name: 'Taitung', tag: 'Norway exchange', title: 'Exchange in Norway', lead: 'Spring 2027, exchange at the Norwegian School of Economics (NHH).',
      blocks: [
        'I will start an exchange at NHH in January 2027. Besides wanting to understand more about how the Norwegian government manages sustainability, I also hope to experience Norway\'s nature and culture.',
        'The spring semester is expected to end in mid-June, and I can stay in the dormitory until July. I will hold a student residence permit from January to July.',
        'I will take the school\'s basic Norwegian course, and I would like to go hiking. For sailing, I plan to return to NYS in Croatia to complete the RYA Skipper certificate, and I would like to join the NHH sailing club.',
      ],
    },
    penghu: {
      hook: 'What the sea taught me', vol: 'It was the first time I lived on a boat for a whole week.',
      name: 'Penghu', tag: 'Sailing', title: 'What the sea taught me', lead: 'I am not a very experienced skipper, but I really enjoy being out at sea.',
      blocks: [
        'I first came across sailing in my university sailing club. In Taiwan sailing is a small leisure activity, and most people never get the chance to try it.',
        'We started by learning to sail near the river mouth, beginning with the Hunter 17 and RS Tera, practising every weekend. After a year I was one of the few members who kept practising, and I slowly came to enjoy sailing.',
        ['Later I began taking part in coastal sailing on J80 boats around Taiwan. I learned to hoist the spinnaker, and raced together with others, which taught me how important teamwork and communication are on a sailboat.', ['Regatta']],
        'In the summer of 2025, a group of students decided to do something interesting: sail J80s across the Taiwan Strait. We worked to win our university\'s support, raised funds and sought press coverage, and we set off. It was the first time I was skipper on a long-distance passage. The unknown and the challenges of sailing gave me more respect for the sea.',
        'NCKU SDG website: report on the J80 Taiwan Strait crossing',
        'In winter I joined as crew and sailed from northern to southern Taiwan. I felt the strength of the northeast monsoon and gained more night-sailing experience.',
        ['In summer 2026 I was fortunate to be selected for a Taiwanese government training programme and went to Croatia for sailing training, and I also visited the Cannes Yachting Festival. In Croatia, five other students, a coach and I lived for seven days on a Salona 46. We left from Split and sailed to the islands of Hvar, Vis and Šolta, about 130 nautical miles in total.', ['First day at sea', 'At the helm']],
        'It was the first time I spent so many days on a sailboat with people I had just met, and it was a wonderful experience. With so little space, people need to think about each other fully, and respect privacy and personal space.',
        'Four one-minute films',
        'I made this voyage into four one-minute films, from Taiwan to Croatia and then to Cannes.',
        [['EP1  Taiwan, where we start', 'Why Taiwanese people live so far from the sea.'], ['EP2  Croatia, setting sail', 'How a sailboat is operated and how the crew shares the work.'], ['EP3  How they turn the sea into a business', 'How much it costs to charter a boat for a week.'], ['EP4  Cannes Yachting Festival', 'The largest boat show in Europe.']],
      ],
    },
    tamsui: {
      hook: 'Studies, internships and sustainability', vol: 'I have done a few different jobs, and ran a guesthouse.',
      name: 'Tamsui', tag: 'Studies & internships', title: 'Studies, internships and sustainability',
      lead: 'Alongside my studies, I interned in different places to see how people think about sustainability.',
      blocks: [
        'I studied political science as an undergraduate, then entered the Graduate Institute of National Development at National Taiwan University. My thesis studies whether carbon emission intensity changed after companies joined transnational climate initiatives, using Bloomberg Terminal data on listed companies in Taiwan and Japan. Now I study digital and sustainable finance at National Sun Yat-sen University, researching corporate sustainable finance and institutional ratings.',
        'NTU repository: my thesis',
        'At NTU I cared a lot about youth and intergenerational sustainability, and I once had a conversation with the chairman of O\'right, a certified B Corp.',
        'NTU College of Social Sciences event record: conversation with the chairman',
        'My first internship was in CSR at Lite-On Technology, mainly working with non-profit organisations and keeping communication going between the parties. In spring 2022 I interned at the New Taipei City Government, organising electricity demand and net-zero pathways, and finally briefed the mayor. That summer I spent two months at an incineration plant to understand the waste treatment process, read how Taiwan\'s waste policy has developed, and presented ideas for a new sustainability business to the general manager.',
        'In autumn 2022 I did a sustainability consulting internship at KPMG, where I learned how ESG has risen inside companies and about global climate action and initiatives. In summer 2024 I went to the Shenzhen Stock Exchange in Guangdong, China, to study Taiwan\'s securities market with quantitative methods.',
        ['In spring 2026 I worked at the American Institute in Taiwan, which operates under the US Department of State, helping revise crisis management plans for wartime and disaster scenarios.', ['During the internship']],
        'Besides internships',
        'In 2019 I renovated an unused family house into a guesthouse, set among the local tea industry. It was later listed among the top ten recommended Airbnb stays in Taipei, and it earned 21 Superhost awards and more than 1,500 guests. Booking management, cleaning, hosting and emergencies were the small things that accompanied me through six years as a student. In December 2025 I moved to southern Taiwan and closed the guesthouse.',
        'Skills and certificates',
        'I am most familiar with ESG, renewable energy topics and public policy. My certificates include CFA ESG Investing, Bloomberg ESG, GRI 2021 Update, SGS ISO 14064-1 verifier, and a professional-level energy saving certificate. For sailing, I hold a small vessel operator licence.',
      ],
    },
    wuqi: {
      hook: 'Sailing days in photos', vol: 'I bring back the sea I see, in photos.',
      name: 'Wuqi', tag: 'Photos', title: 'The sea and everyday life through my lens', lead: 'The sea, internships, travel and everyday life. Tap a photo to enlarge it, and swipe to see the next one.',
      blocks: [
        ['View of Hvar island from the fortress', 'Dinner cooked on board', 'Dinghy', 'Night watch', 'Sunset at sea', 'Sunset at the marina', 'Military tunnel on Vis', 'Wartime aircraft wreck at ten metres depth', 'Ferry at Split', 'Cannes Yachting Festival', 'Frankfurt: IFRS Foundation', 'Frankfurt: KfW', 'Port of Monaco', 'A street in a small European town', 'Cockpit of a catamaran', 'Galley on board', 'The red spinnaker in a regatta', '2025 Penghu regatta', 'On a sailboat', 'At the helm of a catamaran', 'Regatta', 'Control room at the incineration plant', 'Internship at KPMG', 'At the Shenzhen Stock Exchange', 'Karst hills of Guilin', 'Cormorant fishing at night', 'The landscape from the air', 'Kyoto', 'The red pumpkin on Naoshima', 'Berlin', 'Rome', 'A ride by the river', 'By Keelung harbour', 'Hiking', 'Bodyboarding at the beach', 'A quiet beach', 'Sunset on a sailboat', 'A J80 under sail', 'A sculpture made of letters', 'Driftwood by the sea', 'Cycling through the rice fields', 'The sea framed by a concrete window', 'Daylily fields', 'Rice fields and mountains', 'A cross underwater', 'An orange cat I met at night', 'On a scooter by the harbour', 'My shadow on a gravel road', 'A sailing ship at sunset', 'Looking over the old town from a tower', 'Red roofs and a cathedral dome', 'Dinner at home', 'The Peace Boat cruise ship', 'An iron bridge', 'The pylon of a cable-stayed bridge', 'Hong Kong street view', 'Hong Kong traffic at night'],
      ],
    },
  };

  en.PORTS.forEach((p) => {
    const t = T[p.id];
    p.hook = t.hook; p.vol = t.vol; p.name = t.name; p.en = ''; p.tag = t.tag; p.title = t.title; p.lead = t.lead;
    p.blocks.forEach((b, i) => {
      const v = t.blocks[i];
      if (b.type === 'p' || b.type === 'h' || b.type === 'link') { b.text = v; }
      else if (b.type === 'pp') { b.text = v[0]; b.pics.forEach((pc, j) => { pc.caption = v[1][j]; }); }
      else if (b.type === 'gallery') { b.items.forEach((it, j) => { it.caption = v[j]; }); }
      else if (b.type === 'videos') { b.items.forEach((it, j) => { it.title = v[j][0]; it.desc = v[j][1]; }); }
    });
  });
  window.CONTENT_EN = en;
})();
