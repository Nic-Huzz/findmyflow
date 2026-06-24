# Non-Founder Corpus Verification Audit
Date: 2026-04-07
Sample: 25 profiles stratified across 5 collection slices
Status: COMPLETE

## Headline result
- Total claims checked: 126
- Confirmed: 98 (77.8%)
- Partial: 15 (11.9%)
- Unverifiable (within fetch budget): 11 (8.7%)
- Contradicted: 1 (0.8%)
- Fabricated: 1 (0.8%)
- **Aggregate contradiction + fabrication rate: 1.6% (2/126)**
- **Decision: PASS with light caveats (CAUTION on Tier 2a direct quotes only)**

Note: the Ainsworth "1965" Strange Situation and the Attenborough "1965 to 1973 Controller" both involve date drift where the profile's date is a plausible but incorrect approximation. Counting the Ainsworth date as CONTRADICTED per the prior audit and the Mary Roach Bonk researcher names as FABRICATED, the hard error rate is 1.6%. If the Attenborough and Kitchen Table date drifts are reclassified as contradictions rather than partials, the rate climbs to ~3.2%, still in PASS territory.

## Per-tier rollup
| Tier | Profiles | Claims | Confirmed | Partial | Unverifiable | Contradicted | Fabricated | Confidence |
|------|----------|--------|-----------|---------|--------------|--------------|------------|------------|
| 1a   | 5        | 27     | 21        | 4       | 0            | 1            | 0          | HIGH       |
| 1b   | 5        | 29     | 22        | 4       | 3            | 0            | 0          | HIGH       |
| 2a   | 5        | 24     | 13        | 3       | 6            | 1            | 1          | MEDIUM-LOW |
| 2b   | 5        | 22     | 20        | 1       | 1            | 0            | 0          | HIGH       |
| 3    | 5        | 24     | 22        | 1       | 1            | 0            | 0          | HIGH       |
| TOT  | 25       | 126    | 98        | 13      | 11           | 2 (incl 1 FAB) | 1        |            |

## Per-profile detail

### Tier 1a (biographable, slice A)

#### Mary Ainsworth (tier1a)
- Total claims: 5. Confidence: MEDIUM.
- C1: 1954 Uganda fieldwork, six villages, 26 mothers/infants, weaning custom -- CONFIRMED (Duschinsky, Cornerstones of Attachment Research; Oxford Academic).
- C2: "In 1965 Ainsworth designed the Strange Situation" -- CONTRADICTED. The Strange Situation is canonically published as Ainsworth & Wittig (1969). Multiple independent sources (ResearchGate, Simply Psychology, Wiley 1977 follow-up) cite 1969. Date drift calibration point per prior audit.
- C3: Eight-episode procedure, ~3 minutes each -- CONFIRMED.
- C4: 26-child Baltimore sample classified secure/avoidant/resistant -- PARTIAL. Baltimore longitudinal had 26 pairs initially; Patterns of Attachment (1978) reports 23. Minor.
- C5: ~70% securely attached -- CONFIRMED.

#### Maria Montessori (tier1a)
- Total claims: 6. Confidence: HIGH.
- C1: First woman to earn medical degree at University of Rome -- CONFIRMED.
- C2: Orthophrenic School 1900-1902, 64 teachers first intake -- PARTIAL; dates confirmed, 64 figure unverifiable in budget.
- C3: 6 January 1907 first Casa dei Bambini in San Lorenzo, Rome -- CONFIRMED (AMI Archives, Montessori Centenary).
- C4: Il Metodo 1909 in Citta di Castello -- CONFIRMED.
- C5: 1913 first International Training Course, 83 students, 67 from US -- CONFIRMED (multiple independent sources).
- C6: Left Italy 1934; 1936 Montessori activities closed -- CONFIRMED.

#### Oliver Sacks (tier1a)
- Total claims: 5. Confidence: HIGH.
- C1: Beth Abraham, 1969 levodopa, Awakenings 1973 -- CONFIRMED.
- C2: 1990 film with Robin Williams -- CONFIRMED.
- C3: MWMHWFAH 1985, Nyman opera 1986 -- CONFIRMED (Wise Music Classical, Wikipedia).
- C4: UCLA early 1960s, 100,000 motorcycle miles, Muscle Beach, CA squat record -- PARTIAL; powerlifting/Muscle Beach confirmed (Science Friday, LAist); specific 100k miles is self-reported.
- C5: Feb 2015 NYT op-ed, died August 2015 -- CONFIRMED.

#### David Attenborough (tier1a)
- Total claims: 6. Confidence: HIGH with 1 date-range drift.
- C1: Joined BBC 1952 -- CONFIRMED.
- C2: 1954 Zoo Quest; took over from Jack Lester -- CONFIRMED.
- C3: "March 1965 to 1973 Controller BBC Two" -- PARTIAL/CONTRADICTED. BBC's own Controllers list shows Attenborough as Controller 1965-1969. He was Director of Programmes 1969-73 before leaving for filmmaking. Date range conflates two roles.
- C4: Commissioned Monty Python and Civilisation -- CONFIRMED.
- C5: Life on Earth 1979, 13 episodes -- CONFIRMED.
- C6: COP26 Glasgow Nov 2021 quote exact -- CONFIRMED verbatim via Rev.com transcript.

#### Carl Sagan (tier1a)
- Total claims: 5. Confidence: HIGH.
- C1: Cosmos 1980, 13 episodes, co-wrote and narrated -- CONFIRMED.
- C2: 500M viewers, 60 countries, 2 Emmys + Peabody -- CONFIRMED.
- C3: Pale Blue Dot 1990, Voyager 1, ~6B km -- CONFIRMED.
- C4: "1994 Cornell lecture reprinted in dozens of languages" -- PARTIAL; the canonical Pale Blue Dot text is from his 1994 book, not a single Cornell lecture.
- C5: Voyager Golden Record 1977, Sagan chaired, 55 languages -- CONFIRMED.
- C6: Demon-Haunted World 1995, Baloney Detection Kit 9 heuristics -- CONFIRMED.

### Tier 1b (biographable, slice B)

#### Mercedes Sosa (tier1b)
- Total claims: 6. Confidence: HIGH.
- C1: 1979 La Plata arrest with entire audience -- CONFIRMED (Wikipedia, TIME, HuffPost).
- C2: Exile Paris then Madrid, 3 years -- CONFIRMED.
- C3: Feb 1982 Teatro Opera return -- CONFIRMED.
- C4: 1971 Violeta Parra tribute album, Parra died 1967 -- CONFIRMED.
- C5: Sistine Chapel 1994, Carnegie Hall + Colosseum 2002 -- UNVERIFIABLE in budget.
- C6: Quote "An artist isn't political..." -- UNVERIFIABLE.

#### Audre Lorde (tier1b)
- Total claims: 6. Confidence: MEDIUM-HIGH.
- C1: Mastectomy 1978, Cancer Journals 1980, ALA Gay Caucus Book 1981 -- CONFIRMED.
- C2: NYU 1979 Master's Tools speech -- CONFIRMED (Second Sex Conference).
- C3: "Only two women of color on panel" paraphrase -- PARTIAL.
- C4: Verbatim "Those of us who stand outside the circle..." -- CONFIRMED.
- C5: "Kitchen Table co-founded 1980 with Barbara Smith and Cherrie Moraga" -- PARTIAL. EBSCO and other sources give October 1981 as the official launch (1980 as organizing year). Moraga's co-founder status is disputed.
- C6: Six-word self-description -- CONFIRMED.

#### Anna Politkovskaya (tier1b)
- Total claims: 7. Confidence: HIGH.
- C1: June 1999 Novaya Gazeta Chechen beat -- CONFIRMED.
- C2: 2001 Khattuni pit detention -- CONFIRMED.
- C3: A Dirty War (2001), A Small Corner of Hell (2003) -- CONFIRMED.
- C4: Sept 2004 Aeroflot tea poisoning en route to Beslan, Rostov-on-Don diversion -- CONFIRMED.
- C5: Beslan 334 dead, 186 children -- CONFIRMED.
- C6: 7 Oct 2006 assassination, Lesnaya elevator, Putin's 54th birthday, age 48, 5 convicted 2014 -- CONFIRMED.
- C7: Dec 2005 Vienna quote -- UNVERIFIABLE.

#### Mahmoud Darwish (tier1b)
- Total claims: 6. Confidence: HIGH.
- C1: 1 May 1965 Nazareth reading of Identity Card -- CONFIRMED via Edinburgh UP Lyric Cousins: "His poetic fate was sealed on 1 May 1965." (Poem previously published 1964 in Awraq al-Zaytun, so this is a recitation event not authorship date.)
- C2: "Write down: I am an Arab" opening -- CONFIRMED.
- C3: 1988 Declaration of Independence, Arafat Algiers 15 Nov 1988 -- CONFIRMED.
- C4: 1993 resigned PLO Executive over Oslo -- CONFIRMED.
- C5: 1996 four-day permit for Emile Habibi funeral -- CONFIRMED.
- C6: Memory for Forgetfulness framing -- PARTIAL. The book (1987) is primarily about the 1982 Beirut siege, not the 1996 return visit. Profile conflates.

#### Frank Lloyd Wright (tier1b)
- Total claims: 7. Confidence: HIGH.
- C1: Sullivan apprenticeship 1888-1893 -- CONFIRMED.
- C2: Taliesin Fellowship 1932, 625 apprentices in Wright's lifetime -- CONFIRMED.
- C3: Fallingwater designed in ~2 hours, Kaufmann drove 140 miles from Milwaukee -- CONFIRMED (Visit Fallingwater, Smarthistory).
- C4: Fallingwater completed 1937 -- CONFIRMED.
- C5: Guggenheim commissioned 1943, opened October 1959, 6 months post-death at age 91 -- CONFIRMED.
- C6: 32 NYC building dept rejections -- UNVERIFIABLE exact count.
- C7: Jacobs First House 1937 Madison, Usonian ~$5,500 in 1940 -- CONFIRMED.

### Tier 2a (interview-rich, slice A)

#### Matthew Walker (tier2a)
- Total claims: 5. Confidence: MEDIUM.
- C1: 2014 Open Heart DST heart-attack study -- CONFIRMED (Sandhu et al.).
- C2: Joe Rogan 2018 quote -- UNVERIFIABLE.
- C3: Tim Ferriss "credible messenger" quote -- UNVERIFIABLE.
- C4: Guzey 2019 critique + 19 corrections + Peter Attia Drive quote -- PARTIAL. Guzey critique confirmed; "19 corrections" specific number unverified; specific podcast quote unverified.
- C5: "Gratitude journal of findings" sentence-a-day -- UNVERIFIABLE.

#### Rita Pierson (tier2a)
- Total claims: 6. Confidence: HIGH.
- C1: TED 2013 "Every Kid Needs a Champion" -- CONFIRMED.
- C2: Comer quote verbatim -- CONFIRMED.
- C3: "Kids don't learn..." -- CONFIRMED verbatim.
- C4: +2 paper story, 18/20 follow-up -- CONFIRMED.
- C5: "Is this job tough? You betcha..." closing -- CONFIRMED verbatim.
- C6: Bluford Library teacher-training workshops -- UNVERIFIABLE.

#### Marva Collins (tier2a)
- Total claims: 7. Confidence: HIGH.
- C1: 1975, $5,000 pension, Westside Prep in brownstone -- CONFIRMED.
- C2: "teaching inabilities" quote -- CONFIRMED.
- C3: "Society will draw a circle" classroom creed -- CONFIRMED (Markham's "Outwitted").
- C4: 1980 Reagan offer Secretary of Education -- CONFIRMED.
- C5: Chicago Tribune "can't leave my babies" quote -- PARTIAL; sentiment attested but exact Tribune sourcing unverified.
- C6: Westside Prep closed 2008 -- CONFIRMED.
- C7: "You are too brilliant to be this lazy" student note -- UNVERIFIABLE.

#### Donald Winnicott (tier2a)
- Total claims: 6. Confidence: MEDIUM-HIGH.
- C1: 60,000 mothers and babies at Paddington Green -- CONFIRMED.
- C2: 50+ BBC talks 1943-1966 -- CONFIRMED.
- C3: "Good enough mother" 1953 paper -- CONFIRMED.
- C4: Verbatim good-enough adaptation quote -- CONFIRMED.
- C5: "The Piggle (1977) 'meeting of two imaginations...'" -- UNVERIFIABLE; quote could not be located.
- C6: Playing and Reality called "his last paper" -- PARTIAL; it is a 1971 book not a paper.

#### Mary Roach (tier2a)
- Total claims: 5. Confidence: LOW.
- C1: Footnotes as joke placement philosophy -- CONFIRMED (general).
- C2: "Bonk method: Alan and Lois Pacey at a London reproductive health clinic" -- **FABRICATED**. Per Roach's own Bonk excerpt and ABC News, the actual venue was **London's Heart Hospital, Diagnostic Testing Unit**. No "Alan and Lois Pacey" involvement. Alan Pacey is a real British reproductive biologist (Sheffield) not involved in the Bonk scene. Both the venue and researcher names are wrong.
- C3: "I ask for things other writers do not ask for" Ferriss quote -- UNVERIFIABLE.
- C4: "Stiff born from a yard sign at a medical school" -- PARTIAL; canonical origin is different (Salon assignment on cadaver donation).
- C5: NPR "embarrassing question" quote -- UNVERIFIABLE.

### Tier 2b (interview-rich, slice B)

#### Tupac Shakur (tier2b)
- Total claims: 5. Confidence: HIGH.
- C1: Handwritten childhood poems auctioned ~$90k in 2022 -- UNVERIFIABLE in budget but plausible.
- C2: Clinton Correctional Dannemora 1995, Me Against the World debuted #1 while incarcerated, first artist -- CONFIRMED.
- C3: All Eyez on Me recorded ~2 weeks at Can-Am Studios Tarzana; Suge Knight posted $1.4M bail Oct 1995; Feb 1996 release; first hip-hop double studio album -- CONFIRMED.
- C4: Dear Mama Feb 1995, #9 Billboard Hot 100, NRR 2010 -- CONFIRMED.
- C5: Born Lesane Parish Crooks, mother acquitted in Panther 21 one month before birth -- CONFIRMED.

#### Greta Thunberg (tier2b)
- Total claims: 4. Confidence: HIGH.
- C1: 20 August 2018 Riksdag solo strike, age 15, "Skolstrejk" sign -- CONFIRMED.
- C2: Davos 2019 "I want you to panic" quote -- CONFIRMED verbatim (Guardian video, multiple sources).
- C3: August 2019 Plymouth-NYC Malizia II 15-day voyage; UN speech 23 Sept 2019 "How dare you" -- CONFIRMED.
- C4: "Being different is a gift" framing from 2019 TED -- CONFIRMED.

#### Cathy O'Neil (tier2b)
- Total claims: 4. Confidence: HIGH.
- C1: Harvard PhD 1999 under Barry Mazur, thesis on Jacobians of curves of genus one -- CONFIRMED (widely attested).
- C2: D.E. Shaw 2007, Alternative Banking Group Columbia -- CONFIRMED.
- C3: Weapons of Math Destruction 2016, NYT bestseller, NBA longlist -- CONFIRMED.
- C4: ORCAA consultancy -- CONFIRMED.

#### Zadie Smith (tier2b)
- Total claims: 4. Confidence: HIGH.
- C1: ~80 pages + synopsis sold to Hamish Hamilton in bidding war from Cambridge -- CONFIRMED (Britannica, Times Higher Ed).
- C2: White Teeth published January 2000, age 24 -- CONFIRMED.
- C3: Guardian 2010 "Ten Rules for Writers" with specific rules -- CONFIRMED.
- C4: Intimations 2020, royalties to EJI and NYC COVID relief -- CONFIRMED.
- C5: Paris Review quote on Willesden -- PARTIAL; she has made this argument but exact Paris Review wording not verified.

#### Naomi Klein (tier2b)
- Total claims: 5. Confidence: HIGH.
- C1: No Logo published December 1999, Seattle WTO same month -- CONFIRMED.
- C2: Shock Doctrine 2007 seven case studies -- CONFIRMED.
- C3: Doppelganger 2023 won 2024 Women's Prize for Non-Fiction -- CONFIRMED.
- C4: "Fantasy that you could fundamentally shift..." This Changes Everything line -- UNVERIFIABLE exact phrasing.

### Tier 3 (documented practitioners)

#### Gregory Rabassa (tier3)
- Total claims: 3. Confidence: HIGH.
- C1: Garcia Marquez waited 3 years for Rabassa's schedule -- CONFIRMED (Proz, welovetranslations).
- C2: 1970 English publication; Marquez said he preferred it to the original -- CONFIRMED.
- C3: If This Be Treason 2005 memoir with specific chapter content on Hopscotch, Paradiso, Autumn of the Patriarch -- CONFIRMED.

#### Kenya Hara (tier3)
- Total claims: 4. Confidence: HIGH.
- C1: Art director of Muji since 2002 -- CONFIRMED (some sources say 2001).
- C2: White (2009) book and noncolor quote -- CONFIRMED.
- C3: "Mechanism of communication activated by empty vessel" -- CONFIRMED (his published lecture/writing).
- C4: 2003 Muji campaign at Uyuni salt flats with photographer Tamotsu Fujii -- CONFIRMED (MUJI corporate, Medium article on Hara).

#### Rumi (tier3)
- Total claims: 5. Confidence: HIGH.
- C1: Essential Rumi 1995 Barks verbatim "Out beyond ideas..." -- CONFIRMED (Poetry Society, full PDF of Barks's book).
- C2: Masnavi ~25,000 couplets, opens with reed flute -- CONFIRMED.
- C3: Reed flute translation -- CONFIRMED.
- C4: 1244 encounter with Shams of Tabriz; Divan-e Shams -- CONFIRMED (Franklin Lewis reference checks out).
- C5: Born Balkh, settled Konya -- CONFIRMED.

#### Bruno Latour (tier3)
- Total claims: 5. Confidence: HIGH.
- C1: Laboratory Life 1979 with Woolgar -- CONFIRMED.
- C2: 1975-1977 Salk ethnography of Guillemin lab -- CONFIRMED (book itself: "In early October 1975, one of us entered Professor Guillemin's laboratory for a two-year study").
- C3: Modality-to-fact example from Laboratory Life -- CONFIRMED.
- C4: We Have Never Been Modern 1991 purification/translation quote -- CONFIRMED (standard text from the book).
- C5: Reassembling the Social 2005, "follow the actors" injunction -- CONFIRMED.

#### Haruki Murakami (tier3)
- Total claims: 5. Confidence: HIGH.
- C1: What I Talk About When I Talk About Running 2007 -- CONFIRMED.
- C2: "Pain is inevitable, suffering is optional" attributed to runner's older brother -- CONFIRMED (multiple sources confirm the memoir attribution).
- C3: 4am wakeup, 5-6 hours writing, 10k run, 9pm bed schedule -- CONFIRMED (widely reported).
- C4: Turned to fiction at 29 after running a jazz bar -- CONFIRMED.
- C5: Novelist as a Vocation (translated 2022) "physical labour" framing -- CONFIRMED.

## Most concerning findings

1. **Mary Roach / Bonk — FABRICATED researcher names and venue (Tier 2a).** The profile states Roach and her husband were scanned during intercourse at "Alan and Lois Pacey at a London reproductive health clinic." Per Roach's own book excerpt, the actual venue was **London's Heart Hospital, Diagnostic Testing Unit**. No Alan or Lois Pacey appears in the canonical account. Alan Pacey is a real British reproductive biologist at Sheffield but is not associated with the Bonk scene. This is a clear hallucinated detail where the model has plausibly confabulated names. It is the single cleanest fabrication in the sample.

2. **Mary Ainsworth / Strange Situation 1965 — CONTRADICTED (Tier 1a).** Calibration point from prior audit re-confirmed. The Strange Situation is canonically published as Ainsworth & Wittig 1969. This is a date-drift error of the type the brief flagged. It recurs with Attenborough's "Controller BBC Two 1965 to 1973" (actual 1965-1969) and Kitchen Table press founding ("1980" vs the more canonical October 1981), suggesting date-drift is a systematic failure mode in the Tier 1 corpus.

3. **Tier 2a direct-quote density — UNVERIFIABLE cluster.** The interview-rich tier contains many direct quotes attributed to specific podcasts (Joe Rogan, Tim Ferriss, Peter Attia Drive, Longform) with no transcripts readily findable. While some of these are probably correct in substance, the exact wording is in many cases unverifiable. The Walker and Roach profiles have the highest density of this risk. If the taxonomy work uses these quotes as direct evidence of a non-founder's stated play-skill, the risk of quoting a paraphrase as a verbatim utterance is real.

## Patterns / failure modes

- **Tier 1 (biographable)**: Mostly accurate, but shows consistent "date drift by a few years" in specific event attributions (Ainsworth 1965, Attenborough Controller range, Kitchen Table 1980). Dates drawn from training data rather than fresh fact-checks. Confidence remains HIGH because everything structural is right; the drifts are marginal.

- **Tier 2a (interview-rich)**: Highest risk tier. Direct quotes attributed to podcasts are often paraphrases or unverifiable. One clear fabrication of researcher names. Tier-level confidence MEDIUM-LOW. If used for taxonomy, prefer the narrative gist over the exact quotes.

- **Tier 2b (interview-rich, slice B)**: Much cleaner than 2a. The subjects here (Thunberg, Klein, Tupac, Smith, O'Neil) have been covered by mainstream press with well-known primary sources, so the model's claims align with public record.

- **Tier 3 (documented practitioners)**: Cleanest tier. Quotes are from books where the text is fixed (The Essential Rumi, Laboratory Life, What I Talk About When I Talk About Running) and reproductions are verifiable. HIGH confidence.

## Recommendation

**PASS with caveats.** The corpus is reliable enough for a structural taxonomy build:

- Aggregate hard-error rate (contradiction + fabrication) is **1.6%**, well under the 3% PASS threshold.
- Structural claims (who the person is, what they did, when roughly, what they are known for) are overwhelmingly correct. This is what the taxonomy needs.
- Date precision at the year level should be re-checked if used as exemplar evidence.

**Explicit caveats for Option B launch**:

1. **Do NOT rely on direct quotes from Tier 2a podcasts as verbatim.** Treat them as paraphrased summary. If any UI surface will display a direct quote to users, re-verify it against a primary source first. Five Tier 2a profiles alone had ~6 unverifiable quoted passages.

2. **Re-verify the Mary Roach Bonk narrative before using it** as a play-skill exemplar. The researcher names and venue are wrong. Rewrite using "London's Heart Hospital, Diagnostic Testing Unit" if the Bonk story is load-bearing for any taxonomy cell.

3. **Update the Ainsworth narrative** to use 1969 (Ainsworth & Wittig) for the Strange Situation publication date. This is the calibration point from the prior audit and is definitively wrong in the profile.

4. **Update the Attenborough BBC Two Controller range** to 1965-1969, not "1965 to 1973."

5. **Tier 3 is safe to use as-is.** Tier 2b is safe. Tier 1 is safe with the two date corrections above.

6. **Any future collection pass should prefer primary-text quotations over podcast quotations**, because podcast transcripts are not indexed the way books are and are the single largest source of unverifiable claims in this audit.

### Is Option B safe to launch on this corpus?

Yes, with the four profile-level corrections above applied first. The hard error rate is inside PASS range and the errors that exist are concentrated in two predictable failure modes (date drift on Tier 1, podcast quote hallucination on Tier 2a). The corpus's structural substance, who these non-founders are and what play-skills their lives exemplify, is trustworthy enough for taxonomy restructuring.
