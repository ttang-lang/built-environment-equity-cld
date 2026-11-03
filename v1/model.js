window.CLD_MODEL = {
  "schemaVersion": "1.1",
  "version": "2026-11-03.2",
  "meta": {
    "title": "Built Environment Equity",
    "subtitle": "An evidence-traceable causal loop atlas",
    "problem": "Which factors cause inequity in the built environment setting and what are their effects on people? Which reinforcing or balancing feedback mechanisms created by those factors increase or decrease equity?",
    "definition": "Equity is the extent to which the built environment meets the differing needs of all groups through planning, design, construction, operation, management, regulation, governance, participation and policy making.",
    "definitionSource": "Supplied PPT, slide 1; attributed there to Seyedrezaei et al. (2023).",
    "definitionSourceUrl": "https://doi.org/10.1016/j.buildenv.2023.110827",
    "scope": "Urban neighborhood systems, primarily high-income settings represented in these reviews. Follow a defined group of residents facing disadvantage and a locally defined reference group. Disadvantage here means barriers to adequate housing, accessible transport, safe public spaces or essential services. Age, disability, gender, ethnicity, tenure, climate and institutions can modify mechanisms; no universal group hierarchy is assumed. Rent-capitalization and payment-burden paths concern market-exposed renters. Owner housing-wealth effects are outside this model. Population membership and measurement periods must be defined locally before empirical use.",
    "needs": [
      "Well-being",
      "Access",
      "Mobility",
      "Shelter",
      "Safety"
    ],
    "limitations": [
      "Conceptual hypotheses, not causal identification, effect sizes, fitted simulation or proof of loop dominance. Solid reported mechanisms include authors' conceptual interpretations; they are not established causal effects.",
      "A gap narrows when the outcome for residents facing disadvantage improves relative to the reference group. Average environmental or health improvement alone does not establish greater equity. Group membership and outcome definitions must remain comparable over time.",
      "The proposed unmet-needs indicator subtracts the reference-group prevalence of any unmet need from the prevalence among residents facing disadvantage, with locally agreed thresholds and separate domain reporting. It is not a validated scale. Poor-health prevalence uses a prespecified self-rated-health measure; disparity alone is not proof of inequity.",
      "R means amplification and B means counteraction; neither label determines whether equity improves. Highlighted loops are selected explanatory paths, not an exhaustive cycle inventory or a ranking of dominant dynamics.",
      "Policy loops require detection, mandate, political willingness, funding and delivery. Their response arrows are assumptions, and delays are qualitative modeling assumptions with no estimated duration.",
      "Contextual links can weaken, vanish or change sign. Density, displacement, noise inequity and active-travel injury exposure are not treated as universal effects.",
      "The 35-variable boundary omits separate food/diet, water/sanitation, climate drivers and discrimination variables. These remain important context or are aggregated into service access and housing barriers; the diagram is not a complete theory of every inequity.",
      "The six reviews overlap in underlying studies and are not six independent causal replications. Evidence anchors refer to review-level mechanisms unless explicitly stated otherwise.",
      "The PPT says six need categories but lists five; this model retains the five stated categories and does not invent a sixth. This is an interpretation requiring future stakeholder confirmation.",
      "Two income-to-burden arrows are algebraic definitions, not empirical findings. Their negative signs require positive disposable income and fixed payments. Most other variables remain conceptual constructs needing locally agreed measurement.",
      "Direct and mediated paths represent distinct proposed mechanisms, not independent effect sizes. Do not add or multiply paths to estimate total effects; no numerical equations, parameters or loop dominance are established."
    ],
    "readingGuide": "Start with a highlighted feedback loop, inspect each signed arrow, then compare the full network. A plus sign means same-direction change; a minus sign means opposite-direction change, with other relevant conditions held constant. Double bars mark plausible delays, not measured times.",
    "validationStatus": "Reviewed conceptual model. Structural checks pass; independent expert, stakeholder and empirical validation remain outstanding.",
    "counts": {
      "variables": 35,
      "links": 77,
      "loops": 10,
      "sources": 6
    },
    "population": {
      "term": "Residents facing disadvantage",
      "definition": "Residents facing barriers to adequate housing, accessible transport, safe public spaces or essential services. These barriers describe circumstances, not an inherent characteristic of a person.",
      "studyGroup": "For a specific study, define the study group at the start using explicit local criteria. The phrase \"study group\" refers to those residents throughout the model.",
      "examples": [
        "Low-income renters facing housing-cost pressure.",
        "Residents with mobility limitations facing inaccessible streets or public transport.",
        "Residents with limited access to affordable essential services or safe public spaces."
      ],
      "exampleNote": "These are examples of possible study populations, not a claim that every pathway affects all of them equally. Choose and document the population; do not switch groups between variables.",
      "referenceTerm": "Reference group",
      "referenceDefinition": "A locally defined comparison group facing fewer of the relevant barriers. State who is included, why the comparison is appropriate and which outcome is being compared.",
      "cohortRule": "Define membership at the start and follow the same groups over time, including people who move away. Do not remove residents from the study group simply because their circumstances improve. Household variables refer to the households in which these residents live.",
      "gapInterpretation": "For both gap indicators, subtract the reference-group percentage from the study-group percentage. A positive gap indicates a worse outcome for the study group; zero means equal percentages, not that everyone has adequate conditions. A negative gap means the reference group has the higher percentage. Always report each group's outcome alongside the gap."
    }
  },
  "groups": [
    {
      "id": "governance",
      "label": "Resources & governance",
      "color": "#526b82"
    },
    {
      "id": "housing",
      "label": "Housing & displacement",
      "color": "#b77946"
    },
    {
      "id": "mobility",
      "label": "Access & mobility",
      "color": "#3e7b83"
    },
    {
      "id": "place",
      "label": "Shared places & safety",
      "color": "#708a56"
    },
    {
      "id": "health",
      "label": "Exposure & health",
      "color": "#8c6687"
    },
    {
      "id": "equity",
      "label": "Between-group outcomes",
      "color": "#9c6373"
    }
  ],
  "nodes": [
    {
      "id": "V01",
      "label": "Household disposable income",
      "group": "governance",
      "definition": "Income of households facing disadvantage after taxes and transfers, before housing and household energy payments. Assess change for the same households; neighborhood compositional change is V35. Assets and borrowing are contextual buffers, not part of this income flow.",
      "domains": [
        "Shelter",
        "Access"
      ],
      "x": 150,
      "y": 160,
      "measurementNote": "Currency per household per month; compare the same households and household-size definition."
    },
    {
      "id": "V02",
      "label": "Resident decision-making influence",
      "group": "governance",
      "definition": "Neighborhood-level effective collective influence over planning, budgets and housing decisions. Influence can favor affluent newcomers; a neighborhood gain is not automatically greater voice for original residents facing disadvantage.",
      "domains": [
        "Access",
        "Safety",
        "Shelter"
      ],
      "x": 410,
      "y": 160,
      "measurementNote": "Effective collective influence over local decisions; neighborhood level. Original residents and affluent newcomers may have different influence."
    },
    {
      "id": "V03",
      "label": "Local public investment",
      "group": "governance",
      "definition": "Realized public spending on the focal neighborhood's housing, infrastructure and services. Its equity effect depends on allocation and resident retention.",
      "domains": [
        "Access",
        "Mobility",
        "Shelter"
      ],
      "x": 670,
      "y": 160,
      "measurementNote": "Realized neighborhood public expenditure per period; hold sector allocation fixed for each intervention arrow."
    },
    {
      "id": "V04",
      "label": "Equity-focused policy effort",
      "group": "governance",
      "definition": "Institutional effort to prioritize and enact equity-oriented measures in response to monitored needs or health gaps. Distinct from realized spending (V03) and effective housing protections (V05). Detection, mandate, political willingness and implementation are required.",
      "domains": [
        "Well-being",
        "Access",
        "Mobility",
        "Shelter",
        "Safety"
      ],
      "x": 930,
      "y": 160,
      "measurementNote": "Institutional commitment and implementation effort; an ordinal construct requiring local stakeholder definition."
    },
    {
      "id": "V05",
      "label": "Affordable housing protection",
      "group": "governance",
      "definition": "Effective provision and preservation of affordable secure homes, tenant protections and anti-displacement measures for renters and other residents facing housing insecurity or affordability barriers.",
      "domains": [
        "Shelter"
      ],
      "x": 1190,
      "y": 160,
      "measurementNote": "Effective coverage and enforceability of protections for households facing disadvantage; assess provision and protection separately in an empirical model."
    },
    {
      "id": "V35",
      "label": "Neighborhood socioeconomic resources",
      "group": "governance",
      "definition": "Average resources of the resident population; changes may reflect who can afford to enter or remain. A compositional variable, not incumbent household income.",
      "domains": [
        "Access",
        "Shelter"
      ],
      "x": 1450,
      "y": 160,
      "measurementNote": "Neighborhood socioeconomic composition, using a prespecified resource-based classification; not the income change of incumbent households."
    },
    {
      "id": "V06",
      "label": "Healthy housing quality",
      "group": "housing",
      "definition": "Access for residents facing disadvantage to homes with adequate ventilation, moisture control, thermal comfort and safe materials; energy performance is separately represented.",
      "domains": [
        "Shelter",
        "Well-being",
        "Safety"
      ],
      "x": 150,
      "y": 430,
      "measurementNote": "Prespecified housing-condition assessment for homes occupied by residents facing disadvantage; higher means healthier conditions."
    },
    {
      "id": "V07",
      "label": "Housing energy efficiency",
      "group": "housing",
      "definition": "Energy performance of homes occupied by households facing disadvantage, with adequate ventilation and comfort maintained; implementation costs are not assumed away.",
      "domains": [
        "Shelter",
        "Well-being"
      ],
      "x": 410,
      "y": 430,
      "measurementNote": "Useful thermal service per unit of delivered energy, at fixed comfort, floor area and ventilation."
    },
    {
      "id": "V09",
      "label": "Energy cost burden",
      "group": "housing",
      "definition": "Required household energy expenditure divided by the same household's disposable income over the same period, excluding rent or mortgage payments. Household changes are evaluated before aggregation; zero or negative incomes require separate hardship reporting.",
      "domains": [
        "Shelter",
        "Well-being"
      ],
      "x": 670,
      "y": 430,
      "measurementNote": "Household required-energy-payment/income ratio, then a prespecified population summary; positive-income domain."
    },
    {
      "id": "V08",
      "label": "Housing cost burden",
      "group": "housing",
      "definition": "Rent or mortgage payments and mandatory tenure charges divided by the same household's disposable income over the same period; excludes household energy payments. Evaluate a prespecified household-level distribution, not the ratio of unrelated group averages.",
      "domains": [
        "Shelter",
        "Access"
      ],
      "x": 930,
      "y": 430,
      "measurementNote": "Household tenure-payment/income ratio, then a prespecified population summary; positive-income domain."
    },
    {
      "id": "V12",
      "label": "Local market rent level",
      "group": "housing",
      "definition": "Quality-adjusted monthly market rent for comparable dwellings in the focal neighborhood. Actual payments change only for market-exposed tenancies or on a move or renewal. This variable does not represent property asset values or existing fixed mortgage payments.",
      "domains": [
        "Shelter"
      ],
      "x": 1190,
      "y": 430,
      "measurementNote": "Currency per month for a comparable rental dwelling; a market measure, not incumbent rent for every tenure."
    },
    {
      "id": "V13",
      "label": "Gentrification pressure",
      "group": "housing",
      "definition": "Market-led neighborhood upgrading and socioeconomic replacement pressure. Effects depend on tenure, timing, safeguards and local institutions.",
      "domains": [
        "Shelter",
        "Access"
      ],
      "x": 1450,
      "y": 430,
      "measurementNote": "Intensity of market upgrading and replacement pressure; do not define it using the same rent series as V12."
    },
    {
      "id": "V10",
      "label": "Housing insecurity",
      "group": "housing",
      "definition": "Uncertainty among residents facing disadvantage about retaining an adequate, affordable home; includes threatened loss and unstable tenure.",
      "domains": [
        "Shelter",
        "Well-being"
      ],
      "x": 930,
      "y": 650,
      "measurementNote": "Share of residents facing disadvantage experiencing threatened housing loss or unstable tenure over a fixed period."
    },
    {
      "id": "V11",
      "label": "Involuntary displacement",
      "group": "housing",
      "definition": "Forced or financially compelled residential moves among original residents facing disadvantage; distinct from all residential mobility or cultural change alone.",
      "domains": [
        "Shelter",
        "Access",
        "Well-being"
      ],
      "x": 1190,
      "y": 650,
      "measurementNote": "Involuntary residential moves per original resident in the defined study group per year; follow displaced residents outside the neighborhood."
    },
    {
      "id": "V18",
      "label": "Walkable land-use mix",
      "group": "mobility",
      "definition": "Connected proximity of everyday destinations and complementary uses. Density alone is deliberately not treated as uniformly beneficial.",
      "domains": [
        "Access",
        "Mobility"
      ],
      "x": 150,
      "y": 880,
      "measurementNote": "Reachable complementary everyday destinations within a fixed walking network distance; density alone is insufficient."
    },
    {
      "id": "V16",
      "label": "Inclusive public transport access",
      "group": "mobility",
      "definition": "Affordable, physically accessible, reliable public transport that meets the destinations and travel needs of residents facing disadvantage; distance to a stop alone is insufficient.",
      "domains": [
        "Access",
        "Mobility"
      ],
      "x": 410,
      "y": 880,
      "measurementNote": "Share of residents facing disadvantage whose essential journeys are served by affordable, accessible and reliable transit."
    },
    {
      "id": "V17",
      "label": "Safe walking and cycling infrastructure",
      "group": "mobility",
      "definition": "Usable routes, safe crossings, separation and speed management, adapted to age, disability and other access needs.",
      "domains": [
        "Mobility",
        "Safety"
      ],
      "x": 670,
      "y": 880,
      "measurementNote": "Coverage of usable walking/cycling routes meeting a prespecified safe-design criterion."
    },
    {
      "id": "V21",
      "label": "Active-travel time",
      "group": "mobility",
      "definition": "Walking and cycling time for everyday transport per resident in the defined study group, including walking to public transport. Excludes gym exercise and purely recreational activity. Population coverage, trip purposes and reporting period are fixed.",
      "domains": [
        "Mobility",
        "Well-being"
      ],
      "x": 930,
      "y": 880,
      "measurementNote": "Walking/cycling transport minutes per resident in the defined study group per week."
    },
    {
      "id": "V19",
      "label": "Car-dependent travel",
      "group": "mobility",
      "definition": "Reliance on private motorized travel for everyday needs; changing this requires viable alternatives rather than simply restricting mobility.",
      "domains": [
        "Mobility",
        "Access"
      ],
      "x": 1190,
      "y": 880,
      "measurementNote": "Private motorized travel per resident in the defined study group for essential journeys; assess trip length, occupancy and alternatives."
    },
    {
      "id": "V20",
      "label": "Motor traffic volume",
      "group": "mobility",
      "definition": "Motor-vehicle traffic in places used by residents facing disadvantage, with background fleet, road design and speeds held in context.",
      "domains": [
        "Mobility",
        "Safety"
      ],
      "x": 1450,
      "y": 880,
      "measurementNote": "Vehicle flow per period on the relevant street network, with network boundary fixed."
    },
    {
      "id": "V14",
      "label": "Usable green-space quality",
      "group": "place",
      "definition": "Condition and usability of shared green spaces serving residents facing disadvantage, including maintenance, welcoming design and effective access. Canopy and shade are separate attributes: a quality improvement has a cooling effect only when it improves those attributes at places people use.",
      "domains": [
        "Access",
        "Well-being",
        "Safety"
      ],
      "x": 150,
      "y": 1160,
      "measurementNote": "Locally specified green-space condition and usability assessment; do not treat this as a canopy or cooling measure."
    },
    {
      "id": "V15",
      "label": "Effective local service access",
      "group": "place",
      "definition": "Ability to use affordable, appropriate local services, including healthcare, healthy food and community amenities; includes financial and physical accessibility.",
      "domains": [
        "Access",
        "Well-being"
      ],
      "x": 410,
      "y": 1160,
      "measurementNote": "Share of residents facing disadvantage able to obtain prespecified essential services within affordable time and money budgets."
    },
    {
      "id": "V28",
      "label": "Social cohesion",
      "group": "place",
      "definition": "Inclusive trust, support and collective capacity among original residents facing disadvantage; exclusionary bonding is not counted as an equity benefit.",
      "domains": [
        "Well-being",
        "Safety"
      ],
      "x": 670,
      "y": 1160,
      "measurementNote": "Inclusive trust and mutual support among the original network of residents facing disadvantage; a validated local survey is needed."
    },
    {
      "id": "V26",
      "label": "Neighborhood disorder",
      "group": "place",
      "definition": "Neglect and environmental disorder of shared places, without treating poverty or demographic composition itself as disorder.",
      "domains": [
        "Safety",
        "Well-being"
      ],
      "x": 930,
      "y": 1160,
      "measurementNote": "Prespecified assessment of physical neglect and disorder; exclude demographic identity as an indicator."
    },
    {
      "id": "V27",
      "label": "Perceived neighborhood safety",
      "group": "place",
      "definition": "Perceived safety from crime and traffic danger among residents facing disadvantage when using streets and shared places; perceptions may differ from measured risk.",
      "domains": [
        "Safety",
        "Mobility",
        "Access"
      ],
      "x": 1190,
      "y": 1160,
      "measurementNote": "Perceived safety when using local streets and shared places; measure crime and traffic components separately for empirical work."
    },
    {
      "id": "V22",
      "label": "Active-travel injury incidence",
      "group": "place",
      "definition": "Road-traffic injuries sustained while walking or cycling for transport per resident in the defined study group per year. This is a population incidence measure, not injury risk per trip or per kilometer, and excludes car-occupant-only injuries.",
      "domains": [
        "Safety",
        "Mobility",
        "Well-being"
      ],
      "x": 1450,
      "y": 1160,
      "measurementNote": "Active-travel road injuries per 100,000 residents facing disadvantage per year; fix reporting completeness."
    },
    {
      "id": "V23",
      "label": "Air pollution exposure",
      "group": "health",
      "definition": "Exposure of residents facing disadvantage to harmful outdoor pollutants. Traffic emissions are one driver; local dispersion and other sources remain contextual.",
      "domains": [
        "Well-being",
        "Safety"
      ],
      "x": 150,
      "y": 1460,
      "measurementNote": "Time-weighted exposure to a prespecified harmful pollutant; do not average incomparable pollutants into an undefined scale."
    },
    {
      "id": "V24",
      "label": "Noise exposure",
      "group": "health",
      "definition": "Harmful environmental noise affecting residents facing disadvantage; unequal exposure is context-dependent rather than assumed in every city.",
      "domains": [
        "Well-being",
        "Safety"
      ],
      "x": 410,
      "y": 1460,
      "measurementNote": "Personal or residential exposure to a prespecified environmental noise metric and period."
    },
    {
      "id": "V25",
      "label": "Heat exposure",
      "group": "health",
      "definition": "Harmful heat experienced by residents facing disadvantage, conditional on shade, dwelling conditions, cooling access and individual vulnerability.",
      "domains": [
        "Well-being",
        "Safety"
      ],
      "x": 670,
      "y": 1460,
      "measurementNote": "Person-hours above a prespecified harmful-heat threshold, accounting for indoor/outdoor exposure."
    },
    {
      "id": "V29",
      "label": "Chronic stress",
      "group": "health",
      "definition": "Persistent psychosocial stress associated with financial strain, insecurity, environmental conditions and constrained control.",
      "domains": [
        "Well-being"
      ],
      "x": 930,
      "y": 1460,
      "measurementNote": "Persistent stress among residents facing disadvantage using an appropriate survey instrument; no diagnostic inference."
    },
    {
      "id": "V30",
      "label": "Physical ill health",
      "group": "health",
      "definition": "Physical morbidity and functional limitations in residents facing disadvantage. The model represents direction, not a fitted disease incidence rate.",
      "domains": [
        "Well-being"
      ],
      "x": 1190,
      "y": 1460,
      "measurementNote": "Physical morbidity or functional limitation using a prespecified population measure; not an unspecified disease sum."
    },
    {
      "id": "V31",
      "label": "Mental ill health",
      "group": "health",
      "definition": "Adverse mental health among residents facing disadvantage, distinguished from stress as a mediating experience; no diagnosis is inferred for individuals.",
      "domains": [
        "Well-being"
      ],
      "x": 1450,
      "y": 1460,
      "measurementNote": "Adverse mental health using a prespecified population measure; distinct from stress and not an individual diagnosis."
    },
    {
      "id": "V32",
      "label": "Work participation",
      "group": "health",
      "definition": "The ability of working-age residents facing disadvantage to obtain and sustain paid work. The health-to-work link is a synthesis hypothesis sensitive to labor protections.",
      "domains": [
        "Well-being",
        "Access"
      ],
      "x": 1710,
      "y": 1460,
      "measurementNote": "Paid-work participation among working-age residents facing disadvantage; distinguish hours, employment and productivity in future measurement."
    },
    {
      "id": "V33",
      "label": "Unmet-needs prevalence gap",
      "group": "equity",
      "definition": "Percentage-point difference in the prevalence of at least one unmet built-environment need: residents facing disadvantage minus the defined reference group. Agree group-appropriate thresholds for the five stated needs domains before measurement. This proposed non-compensatory indicator is not a validated scale; report each domain alongside it. A positive gap means unmet needs are more common among the residents facing disadvantage.",
      "domains": [
        "Well-being",
        "Access",
        "Mobility",
        "Shelter",
        "Safety"
      ],
      "x": 1710,
      "y": 430,
      "measurementNote": "Gap (percentage points) = percentage with at least one unmet need among residents facing disadvantage − percentage with at least one unmet need in the reference group. Keep group membership, thresholds and reporting period fixed; no domain weights."
    },
    {
      "id": "V34",
      "label": "Poor-health prevalence gap",
      "group": "equity",
      "definition": "Percentage-point difference in poor-self-rated-health prevalence: residents facing disadvantage minus the defined reference group, using the same survey definition and period. A positive gap means poor self-rated health is more common among the residents facing disadvantage. Interpreting it as inequity additionally requires an assessment of unfairness and avoidability; physical or mental morbidity does not mechanically determine self-rating.",
      "domains": [
        "Well-being"
      ],
      "x": 1710,
      "y": 880,
      "measurementNote": "Gap (percentage points) = percentage reporting poor health among residents facing disadvantage − percentage reporting poor health in the reference group. Keep group membership fixed; prespecify survey response categories and any age standardization."
    }
  ],
  "edges": [
    {
      "id": "E01",
      "source": "V35",
      "target": "V02",
      "polarity": 1,
      "rationale": "A better-resourced resident composition can support greater collective political influence.",
      "status": "reported",
      "evidence": [
        "A01"
      ],
      "delay": false,
      "scope": "Neighborhood composition; not an effect of prices on incumbent income."
    },
    {
      "id": "E02",
      "source": "V02",
      "target": "V03",
      "polarity": 1,
      "rationale": "Effective resident influence can attract and shape investment in the focal neighborhood.",
      "status": "reported",
      "evidence": [
        "A01",
        "A25"
      ],
      "delay": true,
      "scope": "Allocation may favor already influential groups; investment is not intrinsically equitable."
    },
    {
      "id": "E03",
      "source": "V29",
      "target": "V02",
      "polarity": -1,
      "rationale": "Sustained strain can reduce the capacity to organize and influence local decisions.",
      "status": "synthesis",
      "evidence": [
        "A02"
      ],
      "delay": false,
      "scope": "CROSS-LEVEL CONDITION: residents facing disadvantage form a material part of the neighborhood organizing base. Stress in a politically excluded minority need not change aggregate influence. S1 describes neighborhood stress, not this group-specific estimate."
    },
    {
      "id": "E04",
      "source": "V01",
      "target": "V29",
      "polarity": -1,
      "rationale": "Higher disposable income can reduce financial strain and associated chronic stress, with housing and energy payments held fixed.",
      "status": "reported",
      "evidence": [
        "A02"
      ],
      "delay": false,
      "scope": "Income-flow pathway only; assets, debt and social protection can buffer strain independently."
    },
    {
      "id": "E05",
      "source": "V03",
      "target": "V14",
      "polarity": 1,
      "rationale": "Spending directed to usable public spaces can improve their quality for residents facing disadvantage.",
      "status": "synthesis",
      "evidence": [
        "A01",
        "A25"
      ],
      "delay": true,
      "scope": "Assumes implementation, maintenance and effective access for residents facing disadvantage. SECTOR CONDITION: the marginal spending reaches this intervention; total spending alone does not guarantee every sector receives more. No offsetting displacement of other local funding is assumed."
    },
    {
      "id": "E06",
      "source": "V03",
      "target": "V15",
      "polarity": 1,
      "rationale": "Implemented service investment can improve affordable, appropriate local provision.",
      "status": "synthesis",
      "evidence": [
        "A01",
        "A12"
      ],
      "delay": true,
      "scope": "Provision must address actual access barriers, not facility counts alone. SECTOR CONDITION: the marginal spending reaches this intervention; total spending alone does not guarantee every sector receives more. No offsetting displacement of other local funding is assumed."
    },
    {
      "id": "E07",
      "source": "V03",
      "target": "V16",
      "polarity": 1,
      "rationale": "Transport spending can improve usable public transport when affordability and accessibility are specified.",
      "status": "policy",
      "evidence": [
        "A16",
        "A25",
        "A30"
      ],
      "delay": true,
      "scope": "Requires inclusive service design and operating support. SECTOR CONDITION: the marginal spending reaches this intervention; total spending alone does not guarantee every sector receives more. No offsetting displacement of other local funding is assumed."
    },
    {
      "id": "E08",
      "source": "V03",
      "target": "V17",
      "polarity": 1,
      "rationale": "Allocated street investment can deliver safer and more accessible active-travel routes.",
      "status": "policy",
      "evidence": [
        "A13",
        "A25",
        "A32"
      ],
      "delay": true,
      "scope": "SECTOR CONDITION: the marginal spending reaches this intervention; total spending alone does not guarantee every sector receives more. No offsetting displacement of other local funding is assumed."
    },
    {
      "id": "E09",
      "source": "V03",
      "target": "V06",
      "polarity": 1,
      "rationale": "Targeted housing programs can finance healthier homes for underserved residents.",
      "status": "policy",
      "evidence": [
        "A23",
        "A25"
      ],
      "delay": true,
      "scope": "Assumes quality gains reach original residents facing disadvantage and preserve affordability. SECTOR CONDITION: the marginal spending reaches this intervention; total spending alone does not guarantee every sector receives more. No offsetting displacement of other local funding is assumed."
    },
    {
      "id": "E10",
      "source": "V03",
      "target": "V07",
      "polarity": 1,
      "rationale": "Targeted retrofit programs can improve energy performance in homes occupied by households facing disadvantage.",
      "status": "policy",
      "evidence": [
        "A23",
        "A26"
      ],
      "delay": true,
      "scope": "With appropriate ventilation, installation and financial support. SECTOR CONDITION: the marginal spending reaches this intervention; total spending alone does not guarantee every sector receives more. No offsetting displacement of other local funding is assumed."
    },
    {
      "id": "E12",
      "source": "V04",
      "target": "V03",
      "polarity": 1,
      "rationale": "An operational equity response can redirect resources to underserved needs.",
      "status": "policy",
      "evidence": [
        "A12",
        "A25",
        "A28"
      ],
      "delay": true,
      "scope": "Requires monitoring, mandate, budget, coordination and implementation."
    },
    {
      "id": "E13",
      "source": "V04",
      "target": "V05",
      "polarity": 1,
      "rationale": "An operational response can fund and enforce affordable housing protection.",
      "status": "policy",
      "evidence": [
        "A25",
        "A26"
      ],
      "delay": true,
      "scope": "This is a proposed intervention response, not an observed automatic feedback."
    },
    {
      "id": "E14",
      "source": "V33",
      "target": "V04",
      "polarity": 1,
      "rationale": "A detected widening of unmet-needs disparities may trigger stronger equity action.",
      "status": "policy",
      "evidence": [
        "A12",
        "A28"
      ],
      "delay": true,
      "scope": "MODEL ASSUMPTION: institutions detect the gap and are willing and able to respond."
    },
    {
      "id": "E15",
      "source": "V34",
      "target": "V04",
      "polarity": 1,
      "rationale": "A detected poor-self-rated-health gap judged unfair and avoidable may increase equity-focused policy effort.",
      "status": "policy",
      "evidence": [
        "A16",
        "A28"
      ],
      "delay": true,
      "scope": "POLICY ASSUMPTION: the positive gap is detected, assessed as inequitable and acted on. Surveillance, mandate and political willingness are required; response is not automatic."
    },
    {
      "id": "E16",
      "source": "V22",
      "target": "V04",
      "polarity": 1,
      "rationale": "A worsening injury burden among residents facing disadvantage may prompt an equity-focused safety response.",
      "status": "policy",
      "evidence": [
        "A13",
        "A32"
      ],
      "delay": true,
      "scope": "MODEL ASSUMPTION: surveillance identifies the burden and decision makers act."
    },
    {
      "id": "E17",
      "source": "V05",
      "target": "V08",
      "polarity": -1,
      "rationale": "Effective affordability measures can reduce tenure-cost pressure on protected households.",
      "status": "policy",
      "evidence": [
        "A26"
      ],
      "delay": true,
      "scope": "Refers to realized protective coverage, not any policy bearing an affordability label."
    },
    {
      "id": "E18",
      "source": "V05",
      "target": "V10",
      "polarity": -1,
      "rationale": "Secure affordable provision and enforceable tenure safeguards can reduce insecurity.",
      "status": "policy",
      "evidence": [
        "A24",
        "A26"
      ],
      "delay": true,
      "scope": ""
    },
    {
      "id": "E19",
      "source": "V05",
      "target": "V11",
      "polarity": -1,
      "rationale": "Effective protections can help original residents remain through neighborhood change.",
      "status": "policy",
      "evidence": [
        "A26"
      ],
      "delay": true,
      "scope": "Coverage, enforcement, eligibility and housing supply matter."
    },
    {
      "id": "E20",
      "source": "V06",
      "target": "V12",
      "polarity": 1,
      "rationale": "Housing-condition improvements can command higher market rents when they change comparable rental supply or market valuations.",
      "status": "synthesis",
      "evidence": [
        "A03"
      ],
      "delay": true,
      "scope": "Market capitalization applies to exposed rental units in the affected segment; upgrades confined to permanently protected housing need not raise local market rent."
    },
    {
      "id": "E21",
      "source": "V14",
      "target": "V12",
      "polarity": 1,
      "rationale": "More attractive usable green amenities may increase nearby rental demand and market rents.",
      "status": "reported",
      "evidence": [
        "A03",
        "A22"
      ],
      "delay": true,
      "scope": "Conditional on demand, supply and rental-market institutions. A privately enjoyed or inaccessible improvement may not affect rents for the relevant comparison dwellings."
    },
    {
      "id": "E22",
      "source": "V15",
      "target": "V12",
      "polarity": 1,
      "rationale": "Market-valued amenity improvements accompanying better effective service access may increase local market rents.",
      "status": "synthesis",
      "evidence": [
        "A03"
      ],
      "delay": true,
      "scope": "A synthesis bridge: price capitalization concerns market-valued amenity changes. A service subsidy or accessibility-only adjustment need not raise rent."
    },
    {
      "id": "E23",
      "source": "V12",
      "target": "V35",
      "polarity": 1,
      "rationale": "Higher rental entry and renewal costs can select a more affluent resident composition over time.",
      "status": "reported",
      "evidence": [
        "A04"
      ],
      "delay": true,
      "scope": "Composition changes through entry, exit and renewal; original residents do not become richer by definition. Protected tenancies and a large owner-occupied sector weaken the neighborhood-level effect."
    },
    {
      "id": "E24",
      "source": "V12",
      "target": "V08",
      "polarity": 1,
      "rationale": "Higher market rents raise the housing-payment burden of market-exposed renters when they affect paid rent, with disposable income fixed.",
      "status": "reported",
      "evidence": [
        "A18"
      ],
      "delay": true,
      "scope": "Exposed new or renewing tenancies only; no automatic effect on protected renters, owners without mortgages or fixed mortgage payments. Pass-through can be delayed."
    },
    {
      "id": "E25",
      "source": "V13",
      "target": "V12",
      "polarity": 1,
      "rationale": "Market-led upgrading and stronger affluent rental demand can increase local market rents.",
      "status": "reported",
      "evidence": [
        "A18",
        "A21"
      ],
      "delay": true,
      "scope": "Gentrification pressure must be measured separately from the rent outcome; the relationship varies with supply, tenure and protections."
    },
    {
      "id": "E27",
      "source": "V13",
      "target": "V15",
      "polarity": -1,
      "rationale": "Commercial replacement can reduce access to locally appropriate affordable services for original residents.",
      "status": "reported",
      "evidence": [
        "A20"
      ],
      "delay": true,
      "scope": "Effective affordable access can fall even when aggregate amenity counts rise."
    },
    {
      "id": "E28",
      "source": "V08",
      "target": "V10",
      "polarity": 1,
      "rationale": "Persistent tenure-cost strain can undermine confidence in retaining adequate housing.",
      "status": "synthesis",
      "evidence": [
        "A18",
        "A24"
      ],
      "delay": false,
      "scope": ""
    },
    {
      "id": "E29",
      "source": "V08",
      "target": "V29",
      "polarity": 1,
      "rationale": "Higher housing cost burden can intensify chronic financial strain.",
      "status": "reported",
      "evidence": [
        "A18"
      ],
      "delay": false,
      "scope": ""
    },
    {
      "id": "E30",
      "source": "V10",
      "target": "V29",
      "polarity": 1,
      "rationale": "Uncertain housing security can sustain psychological strain.",
      "status": "reported",
      "evidence": [
        "A24"
      ],
      "delay": false,
      "scope": ""
    },
    {
      "id": "E31",
      "source": "V08",
      "target": "V11",
      "polarity": 1,
      "rationale": "Unaffordable tenure costs can compel original residents to move.",
      "status": "reported",
      "evidence": [
        "A06",
        "A18"
      ],
      "delay": true,
      "scope": "Conditional on resources, protections, arrears processes and available alternatives."
    },
    {
      "id": "E32",
      "source": "V11",
      "target": "V28",
      "polarity": -1,
      "rationale": "Forced moves can break established support networks and local collective capacity.",
      "status": "reported",
      "evidence": [
        "A06",
        "A19"
      ],
      "delay": true,
      "scope": "Follows original residents rather than improved neighborhood-average composition."
    },
    {
      "id": "E33",
      "source": "V11",
      "target": "V29",
      "polarity": 1,
      "rationale": "Disruption and lost residential control can increase persistent strain.",
      "status": "association",
      "evidence": [
        "A06",
        "A19"
      ],
      "delay": false,
      "scope": ""
    },
    {
      "id": "E34",
      "source": "V01",
      "target": "V06",
      "polarity": 1,
      "rationale": "Higher disposable income can improve access to healthier housing where suitable supply is available.",
      "status": "synthesis",
      "evidence": [
        "A22"
      ],
      "delay": true,
      "scope": "Model inference, not a separately established effect in S5. Discrimination, supply constraints, tenure and protected housing can interrupt the relationship."
    },
    {
      "id": "E35",
      "source": "V06",
      "target": "V30",
      "polarity": -1,
      "rationale": "Reduced damp, pollutants and other housing hazards can reduce physical morbidity.",
      "status": "reported",
      "evidence": [
        "A23"
      ],
      "delay": true,
      "scope": "Housing quality is multidimensional; no universal magnitude is asserted."
    },
    {
      "id": "E36",
      "source": "V07",
      "target": "V09",
      "polarity": -1,
      "rationale": "Improved energy performance can reduce required energy expenditure for adequate comfort.",
      "status": "reported",
      "evidence": [
        "A23"
      ],
      "delay": true,
      "scope": "Assumes service needs, tariffs, ventilation and financing costs do not offset savings."
    },
    {
      "id": "E37",
      "source": "V09",
      "target": "V29",
      "polarity": 1,
      "rationale": "A larger required energy-cost share can intensify chronic household financial strain.",
      "status": "synthesis",
      "evidence": [
        "A23"
      ],
      "delay": false,
      "scope": ""
    },
    {
      "id": "E38",
      "source": "V14",
      "target": "V28",
      "polarity": 1,
      "rationale": "Welcoming, well-maintained shared places can enable inclusive social encounters.",
      "status": "reported",
      "evidence": [
        "A05",
        "A08",
        "A15"
      ],
      "delay": true,
      "scope": ""
    },
    {
      "id": "E39",
      "source": "V28",
      "target": "V14",
      "polarity": 1,
      "rationale": "Inclusive collective capacity can support shared-space stewardship and upkeep.",
      "status": "reported",
      "evidence": [
        "A05"
      ],
      "delay": true,
      "scope": "Requires usable resident influence and maintenance opportunities."
    },
    {
      "id": "E40",
      "source": "V28",
      "target": "V26",
      "polarity": -1,
      "rationale": "Collective efficacy and informal stewardship can reduce neglect and disorder.",
      "status": "reported",
      "evidence": [
        "A05"
      ],
      "delay": true,
      "scope": ""
    },
    {
      "id": "E41",
      "source": "V26",
      "target": "V27",
      "polarity": -1,
      "rationale": "Visible disorder can reduce feelings of neighborhood safety.",
      "status": "reported",
      "evidence": [
        "A05",
        "A10"
      ],
      "delay": false,
      "scope": ""
    },
    {
      "id": "E42",
      "source": "V27",
      "target": "V28",
      "polarity": 1,
      "rationale": "Feeling safe can support public-space use and neighborly interaction.",
      "status": "reported",
      "evidence": [
        "A05",
        "A10"
      ],
      "delay": true,
      "scope": ""
    },
    {
      "id": "E43",
      "source": "V27",
      "target": "V21",
      "polarity": 1,
      "rationale": "Feeling safer can increase walking and cycling for transport when it changes participation or trip choices.",
      "status": "association",
      "evidence": [
        "A13",
        "A33"
      ],
      "delay": false,
      "scope": "Transport activity only. Greater willingness must translate into additional active-travel time; essential journeys may persist even when people feel unsafe."
    },
    {
      "id": "E44",
      "source": "V14",
      "target": "V29",
      "polarity": -1,
      "rationale": "Usable green space can provide opportunities for stress recovery.",
      "status": "association",
      "evidence": [
        "A08",
        "A24"
      ],
      "delay": false,
      "scope": ""
    },
    {
      "id": "E45",
      "source": "V14",
      "target": "V25",
      "polarity": -1,
      "rationale": "Green-space improvements can lower heat exposure when they increase effective vegetation, shade or cooling at places residents facing disadvantage use.",
      "status": "synthesis",
      "evidence": [
        "A09"
      ],
      "delay": false,
      "scope": "ATTRIBUTE CONDITION: added effective shade or cooling is required. Better lighting, tidiness, welcoming design or access alone has no necessary cooling effect. Climate and exposure location matter."
    },
    {
      "id": "E46",
      "source": "V14",
      "target": "V21",
      "polarity": 1,
      "rationale": "Usable green corridors may support walking or cycling for transport when they connect everyday origins and destinations.",
      "status": "synthesis",
      "evidence": [
        "A11",
        "A29"
      ],
      "delay": false,
      "scope": "ROUTE CONDITION: green space must serve practical journeys. An isolated park can increase recreation without increasing active travel. Additional participation must outweigh any reduction in walking/cycling trip time."
    },
    {
      "id": "E47",
      "source": "V18",
      "target": "V21",
      "polarity": 1,
      "rationale": "Connected nearby destinations can increase active-travel time if more people or more trips switch to walking and cycling.",
      "status": "synthesis",
      "evidence": [
        "A29"
      ],
      "delay": true,
      "scope": "TIME-AGGREGATION CONDITION: proximity also shortens trips. The positive link applies only where added participation or frequency outweighs shorter duration per trip. Walkability-to-mode-choice evidence does not establish a universal positive effect on minutes."
    },
    {
      "id": "E48",
      "source": "V18",
      "target": "V19",
      "polarity": -1,
      "rationale": "Proximate connected destinations can reduce the need for private motorized trips.",
      "status": "reported",
      "evidence": [
        "A11",
        "A29"
      ],
      "delay": true,
      "scope": "Mode substitution requires suitable services and feasible alternatives."
    },
    {
      "id": "E49",
      "source": "V18",
      "target": "V27",
      "polarity": 1,
      "rationale": "Complementary uses can sustain street presence and informal surveillance.",
      "status": "reported",
      "evidence": [
        "A10"
      ],
      "delay": false,
      "scope": "A contextual mechanism; density alone is not assigned a universal safety effect."
    },
    {
      "id": "E50",
      "source": "V16",
      "target": "V19",
      "polarity": -1,
      "rationale": "Usable public transport can substitute for otherwise necessary car travel.",
      "status": "synthesis",
      "evidence": [
        "A29",
        "A30"
      ],
      "delay": true,
      "scope": "Assumes mode substitution rather than exclusively additional journeys."
    },
    {
      "id": "E51",
      "source": "V16",
      "target": "V28",
      "polarity": 1,
      "rationale": "Affordable accessible transport can enable social journeys and reduce exclusion.",
      "status": "reported",
      "evidence": [
        "A30"
      ],
      "delay": true,
      "scope": ""
    },
    {
      "id": "E52",
      "source": "V17",
      "target": "V21",
      "polarity": 1,
      "rationale": "Safe, accessible routes and crossings can make active travel more feasible.",
      "status": "reported",
      "evidence": [
        "A13",
        "A29",
        "A32"
      ],
      "delay": true,
      "scope": "Safe routes must increase participation, journey frequency or duration enough to increase total active-travel time. Route shortening or substitution from other walking trips can yield little or no time change."
    },
    {
      "id": "E53",
      "source": "V17",
      "target": "V22",
      "polarity": -1,
      "rationale": "Protective street design and speed management can reduce population injury burden.",
      "status": "reported",
      "evidence": [
        "A32"
      ],
      "delay": true,
      "scope": "At comparable travel exposure; induced activity is represented separately."
    },
    {
      "id": "E54",
      "source": "V21",
      "target": "V22",
      "polarity": 1,
      "rationale": "At unchanged injury hazard per unit of active-travel time, more walking/cycling transport exposure increases injuries per resident.",
      "status": "association",
      "evidence": [
        "A32"
      ],
      "delay": false,
      "scope": "EXPOSURE CONDITION: hazard per unit of time, route mix and reporting stay fixed and hazard is nonzero. Incidence = exposure per resident × injury hazard per unit exposure. Safer routes and safety-in-numbers can lower hazard, so the net observed effect may be zero or negative. This is not a claim that exercise or cycling inherently worsens safety."
    },
    {
      "id": "E55",
      "source": "V22",
      "target": "V27",
      "polarity": -1,
      "rationale": "Experienced or visible road danger may lower perceived safety of local travel.",
      "status": "synthesis",
      "evidence": [
        "A13",
        "A33"
      ],
      "delay": false,
      "scope": "Residents observe or learn of relevant active-travel injuries and update perceptions. Media coverage, near misses and crime affect perceived safety independently."
    },
    {
      "id": "E56",
      "source": "V19",
      "target": "V20",
      "polarity": 1,
      "rationale": "Greater reliance on private motorized trips tends to add vehicle traffic.",
      "status": "synthesis",
      "evidence": [
        "A31"
      ],
      "delay": true,
      "scope": "CROSS-LEVEL CONDITION: changed car trips made by residents facing disadvantage use the modeled streets and are not offset by other travelers, route diversion, freight or induced traffic. Hold occupancy and trip distance explicit."
    },
    {
      "id": "E57",
      "source": "V20",
      "target": "V23",
      "polarity": 1,
      "rationale": "Additional vehicle traffic can increase pollutant emissions and local exposure.",
      "status": "reported",
      "evidence": [
        "A31"
      ],
      "delay": false,
      "scope": "Depends on fleet, dispersion, proximity, routes and other sources."
    },
    {
      "id": "E58",
      "source": "V20",
      "target": "V24",
      "polarity": 1,
      "rationale": "Motor traffic is a source of harmful environmental noise.",
      "status": "reported",
      "evidence": [
        "A14",
        "A31"
      ],
      "delay": false,
      "scope": "Vehicle speeds, barriers, fleet and building design moderate exposure."
    },
    {
      "id": "E59",
      "source": "V20",
      "target": "V22",
      "polarity": 1,
      "rationale": "Greater motor traffic can increase conflict exposure for vulnerable road users.",
      "status": "reported",
      "evidence": [
        "A32"
      ],
      "delay": false,
      "scope": "Road design, speed and pedestrian/cyclist exposure held in context."
    },
    {
      "id": "E60",
      "source": "V23",
      "target": "V30",
      "polarity": 1,
      "rationale": "Pollutant exposure can contribute to respiratory and cardiovascular morbidity.",
      "status": "reported",
      "evidence": [
        "A14",
        "A31"
      ],
      "delay": true,
      "scope": ""
    },
    {
      "id": "E61",
      "source": "V24",
      "target": "V29",
      "polarity": 1,
      "rationale": "Persistent noise can disturb sleep and activate stress responses.",
      "status": "reported",
      "evidence": [
        "A14",
        "A31"
      ],
      "delay": false,
      "scope": ""
    },
    {
      "id": "E62",
      "source": "V25",
      "target": "V30",
      "polarity": 1,
      "rationale": "Harmful heat can increase acute illness and aggravate existing physical disease.",
      "status": "reported",
      "evidence": [
        "A09",
        "A14"
      ],
      "delay": false,
      "scope": "Vulnerability and access to cooling modify effects."
    },
    {
      "id": "E63",
      "source": "V21",
      "target": "V30",
      "polarity": -1,
      "rationale": "Physical activity accumulated through walking and cycling for transport can reduce chronic physical disease risk.",
      "status": "reported",
      "evidence": [
        "A29"
      ],
      "delay": true,
      "scope": "Activity-mediated pathway, with pollution and injury pathways considered separately. Exposure intensity, baseline activity and substitution from other exercise matter; more travel minutes do not imply a net health gain in every setting."
    },
    {
      "id": "E64",
      "source": "V29",
      "target": "V30",
      "polarity": 1,
      "rationale": "Prolonged stress may contribute to cumulative physical disease pathways.",
      "status": "synthesis",
      "evidence": [
        "A14",
        "A31"
      ],
      "delay": true,
      "scope": "A coarse synthesis, not a quantified stress–disease coefficient."
    },
    {
      "id": "E65",
      "source": "V29",
      "target": "V31",
      "polarity": 1,
      "rationale": "Persistent stress can contribute to adverse mental health.",
      "status": "synthesis",
      "evidence": [
        "A14",
        "A19",
        "A24"
      ],
      "delay": true,
      "scope": "Stress and clinical mental ill health are distinct constructs."
    },
    {
      "id": "E66",
      "source": "V28",
      "target": "V29",
      "polarity": -1,
      "rationale": "Inclusive support networks can buffer persistent psychosocial strain.",
      "status": "reported",
      "evidence": [
        "A19",
        "A30"
      ],
      "delay": false,
      "scope": ""
    },
    {
      "id": "E67",
      "source": "V30",
      "target": "V32",
      "polarity": -1,
      "rationale": "Physical morbidity and functional limitations may reduce capacity to sustain paid work.",
      "status": "synthesis",
      "evidence": [
        "A34"
      ],
      "delay": true,
      "scope": "EXPLORATORY BRIDGE: S6 Section 6.4 discusses absenteeism, disability and modeled productivity costs; it does not directly estimate the effect on employment participation. Job accommodation, labor demand and protections can interrupt the pathway."
    },
    {
      "id": "E68",
      "source": "V32",
      "target": "V01",
      "polarity": 1,
      "rationale": "More paid-work participation can increase household disposable income if net earnings rise.",
      "status": "synthesis",
      "evidence": [
        "A34"
      ],
      "delay": true,
      "scope": "MODEL ASSUMPTION: wages and hours are adequate and gains are not fully offset by taxes, transfer withdrawal or loss of other income. No automatic link to wealth or neighborhood composition."
    },
    {
      "id": "E70",
      "source": "V06",
      "target": "V33",
      "polarity": -1,
      "rationale": "Closing the healthy-housing shortfall experienced by residents facing disadvantage can narrow the shelter-needs gap.",
      "status": "indicator",
      "evidence": [
        "A12",
        "A23"
      ],
      "delay": false,
      "scope": "PROPOSED INDICATOR: the change crosses an agreed unmet-need threshold for affected residents facing disadvantage; reference-group outcomes and definitions are fixed. Removing one unmet need reduces the any-unmet-need prevalence only for people with no other unmet needs. Equal improvements in both groups need not narrow the gap; zero effects are possible."
    },
    {
      "id": "E71",
      "source": "V15",
      "target": "V33",
      "polarity": -1,
      "rationale": "Removing barriers that prevent residents facing disadvantage from using essential services can narrow the access gap.",
      "status": "indicator",
      "evidence": [
        "A12",
        "A20"
      ],
      "delay": false,
      "scope": "PROPOSED INDICATOR: the change crosses an agreed unmet-need threshold for affected residents facing disadvantage; reference-group outcomes and definitions are fixed. Removing one unmet need reduces the any-unmet-need prevalence only for people with no other unmet needs. Equal improvements in both groups need not narrow the gap; zero effects are possible."
    },
    {
      "id": "E72",
      "source": "V16",
      "target": "V33",
      "polarity": -1,
      "rationale": "Meeting underserved groups' transport requirements can narrow unmet mobility needs.",
      "status": "indicator",
      "evidence": [
        "A12",
        "A16",
        "A30"
      ],
      "delay": false,
      "scope": "PROPOSED INDICATOR: the change crosses an agreed unmet-need threshold for affected residents facing disadvantage; reference-group outcomes and definitions are fixed. Removing one unmet need reduces the any-unmet-need prevalence only for people with no other unmet needs. Equal improvements in both groups need not narrow the gap; zero effects are possible."
    },
    {
      "id": "E73",
      "source": "V17",
      "target": "V33",
      "polarity": -1,
      "rationale": "Accessible safe routes can narrow underserved groups' mobility and safety shortfalls.",
      "status": "indicator",
      "evidence": [
        "A12",
        "A13",
        "A32"
      ],
      "delay": false,
      "scope": "PROPOSED INDICATOR: the change crosses an agreed unmet-need threshold for affected residents facing disadvantage; reference-group outcomes and definitions are fixed. Removing one unmet need reduces the any-unmet-need prevalence only for people with no other unmet needs. Equal improvements in both groups need not narrow the gap; zero effects are possible."
    },
    {
      "id": "E74",
      "source": "V10",
      "target": "V33",
      "polarity": 1,
      "rationale": "Disproportionately worsening housing insecurity can widen unmet shelter needs.",
      "status": "indicator",
      "evidence": [
        "A12",
        "A24"
      ],
      "delay": false,
      "scope": "PROPOSED INDICATOR: the change crosses an agreed unmet-need threshold for affected residents facing disadvantage; reference-group outcomes and definitions are fixed. Removing one unmet need reduces the any-unmet-need prevalence only for people with no other unmet needs. Equal improvements in both groups need not narrow the gap; zero effects are possible."
    },
    {
      "id": "E75",
      "source": "V25",
      "target": "V33",
      "polarity": 1,
      "rationale": "Disproportionate harmful heat exposure can widen unmet health-protection needs.",
      "status": "indicator",
      "evidence": [
        "A09",
        "A14"
      ],
      "delay": false,
      "scope": "PROPOSED INDICATOR: the change crosses an agreed unmet-need threshold for affected residents facing disadvantage; reference-group outcomes and definitions are fixed. Removing one unmet need reduces the any-unmet-need prevalence only for people with no other unmet needs. Equal improvements in both groups need not narrow the gap; zero effects are possible."
    },
    {
      "id": "E76",
      "source": "V27",
      "target": "V33",
      "polarity": -1,
      "rationale": "Improving the perceived ability of residents facing disadvantage to use places safely can narrow the safety-needs gap.",
      "status": "indicator",
      "evidence": [
        "A10",
        "A12",
        "A33"
      ],
      "delay": false,
      "scope": "PROPOSED INDICATOR: the change crosses an agreed unmet-need threshold for affected residents facing disadvantage; reference-group outcomes and definitions are fixed. Removing one unmet need reduces the any-unmet-need prevalence only for people with no other unmet needs. Equal improvements in both groups need not narrow the gap; zero effects are possible."
    },
    {
      "id": "E77",
      "source": "V30",
      "target": "V34",
      "polarity": 1,
      "rationale": "Worsening physical ill health may raise poor-self-rated-health prevalence among residents facing disadvantage and thereby widen the gap.",
      "status": "synthesis",
      "evidence": [
        "A12",
        "A14",
        "A35"
      ],
      "delay": false,
      "scope": "OUTCOME-MAPPING ASSUMPTION: morbidity changes self-rated health and deterioration among residents facing disadvantage exceeds reference-group deterioration. Self-rating, survey thresholds and population composition are held comparable. This is not a mechanical identity or proof of unfairness."
    },
    {
      "id": "E78",
      "source": "V31",
      "target": "V34",
      "polarity": 1,
      "rationale": "Worsening mental ill health may raise poor-self-rated-health prevalence among residents facing disadvantage and thereby widen the gap.",
      "status": "synthesis",
      "evidence": [
        "A12",
        "A19",
        "A35"
      ],
      "delay": false,
      "scope": "OUTCOME-MAPPING ASSUMPTION: morbidity changes self-rated health and deterioration among residents facing disadvantage exceeds reference-group deterioration. Self-rating, survey thresholds and population composition are held comparable. This is not a mechanical identity or proof of unfairness."
    },
    {
      "id": "E79",
      "source": "V01",
      "target": "V08",
      "polarity": -1,
      "status": "definition",
      "evidence": [],
      "delay": false,
      "rationale": "With housing payments fixed and disposable income positive, more income reduces the household housing-payment-to-income ratio.",
      "scope": "DEFINITIONAL RELATIONSHIP: burden = payment / disposable income; derivative with respect to income = -payment / income squared. Zero payments imply zero sensitivity. Evaluate the same households, then aggregate with a fixed rule. Zero/negative incomes and changes in household composition fall outside this ratio domain.",
      "derivation": "For C >= 0 and Y > 0: B = C/Y; partial B/partial Y = -C/Y^2 <= 0.",
      "evidenceBasis": "Algebraic consequence of the stated variable definitions; not an empirical finding attributed to a paper."
    },
    {
      "id": "E80",
      "source": "V01",
      "target": "V09",
      "polarity": -1,
      "status": "definition",
      "evidence": [],
      "delay": false,
      "rationale": "With energy payments fixed and disposable income positive, more income reduces the household energy-payment-to-income ratio.",
      "scope": "DEFINITIONAL RELATIONSHIP: burden = payment / disposable income; derivative with respect to income = -payment / income squared. Zero payments imply zero sensitivity. Evaluate the same households, then aggregate with a fixed rule. Zero/negative incomes and changes in household composition fall outside this ratio domain.",
      "derivation": "For C >= 0 and Y > 0: B = C/Y; partial B/partial Y = -C/Y^2 <= 0.",
      "evidenceBasis": "Algebraic consequence of the stated variable definitions; not an empirical finding attributed to a paper."
    }
  ],
  "loops": [
    {
      "id": "R1",
      "name": "Cohesion and safety",
      "type": "R",
      "nodes": [
        "V28",
        "V26",
        "V27"
      ],
      "edges": [
        "E40",
        "E41",
        "E42"
      ],
      "mechanism": "Stronger cohesion reduces disorder. Lower disorder raises perceived safety; safer shared places support interaction and cohesion. The same loop can amplify decline in the opposite direction.",
      "equityEffect": "Can improve safety and social wellbeing for residents facing disadvantage; unevenly distributed gains can still leave disparities unchanged.",
      "assumptions": [
        "Cohesion is inclusive, rather than exclusionary social control.",
        "Safety perceptions affect real opportunities for interaction."
      ],
      "basis": "Simplified source-described reinforcing mechanism: S1 Section 3.4.3 and Figure 5; supported by S2.",
      "negativeLinks": 2,
      "polarityProduct": 1,
      "delay": true,
      "evidenceCategory": "Source-described structure",
      "reviewNote": "Source-described conceptual feedback, not empirical causal validation."
    },
    {
      "id": "R2",
      "name": "Green-space stewardship",
      "type": "R",
      "nodes": [
        "V28",
        "V14"
      ],
      "edges": [
        "E39",
        "E38"
      ],
      "mechanism": "Collective capacity supports upkeep of shared places. Welcoming usable places enable encounters that rebuild that capacity.",
      "equityEffect": "A potential virtuous cycle where underserved residents retain usable access; a vicious cycle when neglect and withdrawal reinforce each other.",
      "assumptions": [
        "Residents have maintenance opportunities and shared spaces are welcoming.",
        "Physical improvement does not exclude the original residents."
      ],
      "basis": "Simplified mutual reinforcement described in S1 Section 3.4.3 and Figure 5.",
      "negativeLinks": 0,
      "polarityProduct": 1,
      "delay": true,
      "evidenceCategory": "Source-described structure",
      "reviewNote": "Source-described stewardship mechanism, adapted to usable green space."
    },
    {
      "id": "R3",
      "name": "Resources, voice and residential sorting",
      "type": "R",
      "nodes": [
        "V35",
        "V02",
        "V03",
        "V15",
        "V12"
      ],
      "edges": [
        "E01",
        "E02",
        "E06",
        "E22",
        "E23"
      ],
      "mechanism": "A wealthier resident composition supports greater influence and investment. Improved amenities increase housing costs, which can further select a wealthier resident composition.",
      "equityEffect": "Can concentrate advantages and exclude lower-resource residents. Higher neighborhood-average wealth is not evidence of gains for original residents.",
      "assumptions": [
        "Investment responds to effective influence rather than fully compensating need.",
        "Housing costs sort entry and retention; affordability protections can interrupt the loop.",
        "Effective service access accompanies market-valued amenity improvements; access gains alone do not necessarily raise prices.",
        "V35 is compositional and never substitutes for V01 household resources.",
        "Local market rents are transmitted to exposed rental payments; owner-occupied and protected tenures do not automatically follow this pathway."
      ],
      "basis": "Cross-theme reconstruction of S1 Sections 3.4.1–3.4.2; public investment is an explicit mediator added in this model.",
      "negativeLinks": 0,
      "polarityProduct": 1,
      "delay": true,
      "evidenceCategory": "Adapted source mechanism",
      "reviewNote": "S1 sorting mechanism with explicit public-investment and effective-access mediators; rental-sector and capitalization conditions apply."
    },
    {
      "id": "R4",
      "name": "Stress and constrained voice",
      "type": "R",
      "nodes": [
        "V29",
        "V02",
        "V03",
        "V14"
      ],
      "edges": [
        "E03",
        "E02",
        "E05",
        "E44"
      ],
      "mechanism": "Persistent strain reduces influence. Weaker influence can limit local investment and shared-space quality, leaving fewer opportunities for stress recovery and perpetuating strain.",
      "equityEffect": "May trap underserved residents in a cycle of constrained control; targeted investment independent of political influence can weaken it.",
      "assumptions": [
        "Collective influence affects realized investment, and stressed residents facing disadvantage form the relevant organizing base.",
        "Public-space quality is accessible to the same study population.",
        "The composite closed path has not been empirically tested."
      ],
      "basis": "Synthesis of S1 resource/voice mechanisms with S2 green-space stress pathways.",
      "negativeLinks": 2,
      "polarityProduct": 1,
      "delay": true,
      "evidenceCategory": "Adapted source mechanism",
      "reviewNote": "S1 stress–influence mechanism mapped between population levels; organizing-base and investment-allocation assumptions are essential."
    },
    {
      "id": "R5",
      "name": "Health and household resources",
      "type": "R",
      "nodes": [
        "V01",
        "V06",
        "V30",
        "V32"
      ],
      "edges": [
        "E34",
        "E35",
        "E67",
        "E68"
      ],
      "mechanism": "Resources widen healthy-housing options. Healthier homes can reduce physical morbidity, supporting paid work and household resources; declining resources can reverse the sequence.",
      "equityEffect": "A plausible disadvantage trap or virtuous cycle for original households facing disadvantage, depending on housing supply, employment support and social protection.",
      "assumptions": [
        "Health-to-work and work-to-resources are explicitly untested synthesis closures.",
        "Income support and inclusive employment can decouple illness from resources.",
        "Housing improvements reach original residents without unaffordable cost increases."
      ],
      "basis": "Hypothesized cross-source loop. S5 supports housing pathways; S6 calls for downstream productivity evidence rather than validating this closure.",
      "negativeLinks": 2,
      "polarityProduct": 1,
      "delay": true,
      "evidenceCategory": "Exploratory closure",
      "reviewNote": "Household health–work–income closure is not established as a complete feedback loop by the six papers."
    },
    {
      "id": "B1",
      "name": "Equity-responsive housing protection",
      "type": "B",
      "nodes": [
        "V33",
        "V04",
        "V05",
        "V10"
      ],
      "edges": [
        "E14",
        "E13",
        "E18",
        "E74"
      ],
      "mechanism": "A widening needs gap is detected and acted on. Effective housing protections reduce insecurity, which can reduce the disproportionate unmet shelter need that triggered action.",
      "equityEffect": "Can reduce shelter inequity if measures reach underserved original residents; delayed or unfunded responses leave the loop inactive.",
      "assumptions": [
        "Monitoring and political willingness activate the response.",
        "Protections are financed, enforced and accessible.",
        "Improvement among residents facing disadvantage exceeds reference-group improvement.",
        "The intervention changes the prevalence of at least one unmet need, accounting for overlapping needs, and the reference-group gap does not offset the gain."
      ],
      "basis": "Proposed policy balancing loop; response activation is a model assumption informed by S2 and S5 recommendations.",
      "negativeLinks": 1,
      "polarityProduct": -1,
      "delay": true,
      "evidenceCategory": "Policy-design hypothesis",
      "reviewNote": "Feedback exists only if an unmet-needs gap is monitored and a housing response is authorized, funded and delivered."
    },
    {
      "id": "B2",
      "name": "Equity-responsive transport access",
      "type": "B",
      "nodes": [
        "V33",
        "V04",
        "V03",
        "V16"
      ],
      "edges": [
        "E14",
        "E12",
        "E07",
        "E72"
      ],
      "mechanism": "Detected mobility shortfalls prompt an equity response and targeted spending. Inclusive public transport reduces unmet mobility needs among residents facing disadvantage and the disparity prompting action.",
      "equityEffect": "Can reduce access and mobility inequities; capital spending alone is insufficient without affordable reliable operations.",
      "assumptions": [
        "Needs monitoring identifies the mobility component of the gap.",
        "Budgets are directed to underserved groups and translate into usable transport.",
        "The disparity indicator is conditional on relative improvement.",
        "The intervention changes the prevalence of at least one unmet need, accounting for overlapping needs, and the reference-group gap does not offset the gain."
      ],
      "basis": "Proposed policy balancing loop; S2, S3, S5 and S6 motivate interventions but do not establish automatic feedback.",
      "negativeLinks": 1,
      "polarityProduct": -1,
      "delay": true,
      "evidenceCategory": "Policy-design hypothesis",
      "reviewNote": "Feedback exists only if monitored needs trigger transit investment that reaches the disadvantaged group."
    },
    {
      "id": "B3",
      "name": "Safety-responsive street investment",
      "type": "B",
      "nodes": [
        "V22",
        "V04",
        "V03",
        "V17"
      ],
      "edges": [
        "E16",
        "E12",
        "E08",
        "E53"
      ],
      "mechanism": "An injury burden prompts action and street investment. Delivered protective infrastructure lowers road danger, reducing the signal that triggered intervention.",
      "equityEffect": "Can reduce unequal injury burdens when surveillance and design prioritize vulnerable road users; effects depend on travel exposure.",
      "assumptions": [
        "The injury signal activates an equity-focused response.",
        "Investment is delivered, maintained and protective at comparable exposure.",
        "Safety-in-numbers and induced activity can change net injury rates."
      ],
      "basis": "Conditional intervention loop based on S6 traffic-safety measures and S3 inclusive-city recommendations.",
      "negativeLinks": 1,
      "polarityProduct": -1,
      "delay": true,
      "evidenceCategory": "Policy-design hypothesis",
      "reviewNote": "Feedback requires injury surveillance, political response and effective safety investment."
    },
    {
      "id": "B4",
      "name": "Amenity gains eroded by displacement",
      "type": "B",
      "nodes": [
        "V28",
        "V14",
        "V12",
        "V08",
        "V11"
      ],
      "edges": [
        "E39",
        "E21",
        "E24",
        "E31",
        "E32"
      ],
      "mechanism": "Cohesion improves shared spaces, but amenities can raise housing costs and tenure burden. Forced moves can break the original residents' networks, weakening the cohesion that helped produce the gains.",
      "equityEffect": "This balancing loop can undermine equity: it erodes original residents' social benefits. Balancing does not mean socially beneficial.",
      "assumptions": [
        "Housing costs capitalize amenity improvements.",
        "Original residents lack sufficient protection against unaffordable tenure costs.",
        "Track displaced people, not only the changing neighborhood population.",
        "Local market rents are transmitted to exposed rental payments; owner-occupied and protected tenures do not automatically follow this pathway."
      ],
      "basis": "Cross-source synthesis: S1 stewardship and capitalization, S4/S5 displacement pathways. No universal gentrification effect is assumed.",
      "negativeLinks": 1,
      "polarityProduct": -1,
      "delay": true,
      "evidenceCategory": "Cross-source synthesis",
      "reviewNote": "Combines stewardship, rent capitalization, financial displacement and network loss; not a source-validated complete loop."
    },
    {
      "id": "B5",
      "name": "Active-travel exposure constraint",
      "type": "B",
      "nodes": [
        "V21",
        "V22",
        "V27"
      ],
      "edges": [
        "E54",
        "E55",
        "E43"
      ],
      "mechanism": "More active-travel time can increase injuries per resident when injury hazard per unit of time is unchanged. If those injuries lower perceived safety, people reduce active travel. This balancing exposure pathway does not describe the net effect of safer walking and cycling policies.",
      "equityEffect": "Can suppress mobility and health opportunities for vulnerable groups. Safer design can interrupt this adverse constraint.",
      "assumptions": [
        "Injury hazard per unit exposure is positive and held fixed; total physical activity is not the exposure variable.",
        "Residents become aware of injuries and update perceived safety.",
        "Perceived danger reduces actual transport walking or cycling, rather than only recreational activity.",
        "Safety-in-numbers, route choice and safety infrastructure may reduce hazard and weaken or interrupt this loop."
      ],
      "basis": "Conditional counterpath from S6 Sections 5.4–5.5 and S3 safety concerns; the closed loop is a synthesis hypothesis.",
      "negativeLinks": 1,
      "polarityProduct": -1,
      "delay": false,
      "evidenceCategory": "Context-dependent hypothesis",
      "reviewNote": "Exposure-feedback scenario with fixed injury hazard and responsive safety perception; the loop can weaken or disappear when those conditions fail."
    }
  ],
  "anchors": [
    {
      "id": "A01",
      "sourceId": "S1",
      "locator": "Section 3.4.1; article p.4 / repository PDF p.5",
      "paraphrase": "Resources strengthen collective influence; influence attracts investment and protects neighborhood conditions.",
      "url": "https://pure.eur.nl/ws/files/219230304/Understanding_the_systems_dynamics_of_neighborhood_socioeconomic_inequities_in_health_in_European_cities.pdf"
    },
    {
      "id": "A02",
      "sourceId": "S1",
      "locator": "Section 3.4.1; article p.4 / PDF p.5",
      "paraphrase": "Stress inhibits collective engagement; material resources buffer strain.",
      "url": "https://pure.eur.nl/ws/files/219230304/Understanding_the_systems_dynamics_of_neighborhood_socioeconomic_inequities_in_health_in_European_cities.pdf"
    },
    {
      "id": "A03",
      "sourceId": "S1",
      "locator": "Section 3.4.2; article p.5 / PDF p.6",
      "paraphrase": "Amenities, housing and green-space quality increase desirability and housing prices.",
      "url": "https://pure.eur.nl/ws/files/219230304/Understanding_the_systems_dynamics_of_neighborhood_socioeconomic_inequities_in_health_in_European_cities.pdf"
    },
    {
      "id": "A04",
      "sourceId": "S1",
      "locator": "Section 3.4.2; article p.5 / PDF p.6",
      "paraphrase": "Housing affordability sorts neighborhood socioeconomic composition, rather than raising incumbent incomes.",
      "url": "https://pure.eur.nl/ws/files/219230304/Understanding_the_systems_dynamics_of_neighborhood_socioeconomic_inequities_in_health_in_European_cities.pdf"
    },
    {
      "id": "A05",
      "sourceId": "S1",
      "locator": "Section 3.4.3 and Figure 5; article pp.5–7 / PDF pp.6–8",
      "paraphrase": "Cohesion discourages disorder; safety supports interaction; shared-space upkeep and cohesion reinforce each other.",
      "url": "https://pure.eur.nl/ws/files/219230304/Understanding_the_systems_dynamics_of_neighborhood_socioeconomic_inequities_in_health_in_European_cities.pdf"
    },
    {
      "id": "A06",
      "sourceId": "S1",
      "locator": "Section 6; article p.8 / PDF p.9",
      "paraphrase": "Rising housing costs can displace residents, disrupt networks and intensify stress.",
      "url": "https://pure.eur.nl/ws/files/219230304/Understanding_the_systems_dynamics_of_neighborhood_socioeconomic_inequities_in_health_in_European_cities.pdf"
    },
    {
      "id": "A07",
      "sourceId": "S1",
      "locator": "Section 2.1.5 p.3 and Section 7 p.8 / PDF pp.4,9",
      "paraphrase": "Connections are expert hypotheses; the diagram does not identify strict epidemiological causality.",
      "url": "https://pure.eur.nl/ws/files/219230304/Understanding_the_systems_dynamics_of_neighborhood_socioeconomic_inequities_in_health_in_European_cities.pdf"
    },
    {
      "id": "A08",
      "sourceId": "S2",
      "locator": "Availability of green areas; article p.741",
      "paraphrase": "Usable green space supports encounters and recovery from stress.",
      "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4721462/"
    },
    {
      "id": "A09",
      "sourceId": "S2",
      "locator": "Climate characteristics; article p.741",
      "paraphrase": "Vegetation cools urban environments; heat vulnerability differs by resources, age and isolation.",
      "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4721462/"
    },
    {
      "id": "A10",
      "sourceId": "S2",
      "locator": "Link 2: social conditions; article p.742",
      "paraphrase": "Neglect signals danger; mixed uses support surveillance; fear discourages activity and interaction.",
      "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4721462/"
    },
    {
      "id": "A11",
      "sourceId": "S2",
      "locator": "Physical activity and active mobility; article p.742",
      "paraphrase": "Car-oriented separation increases driving; safe accessible destinations support activity, with unequal use.",
      "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4721462/"
    },
    {
      "id": "A12",
      "sourceId": "S2",
      "locator": "Discussion and conclusions; article pp.743–744",
      "paraphrase": "Tailored interventions must address unequal starting conditions; equal facility counts cannot establish equity.",
      "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4721462/"
    },
    {
      "id": "A13",
      "sourceId": "S3",
      "locator": "Health behaviors within the cities; PDF pp.3–4",
      "paraphrase": "Walkability and safe recreation support activity; safety concerns impede participation.",
      "url": "https://link.springer.com/content/pdf/10.1007/s40520-025-03052-1.pdf#page=4"
    },
    {
      "id": "A14",
      "sourceId": "S3",
      "locator": "Environmental risk factors; PDF pp.6–7",
      "paraphrase": "Air pollution, heat and noise create health burdens through biological and psychological pathways.",
      "url": "https://link.springer.com/content/pdf/10.1007/s40520-025-03052-1.pdf#page=6"
    },
    {
      "id": "A15",
      "sourceId": "S3",
      "locator": "Structural factors; PDF p.8",
      "paraphrase": "Green infrastructure enables social interaction; housing crowding contributes to distress.",
      "url": "https://link.springer.com/content/pdf/10.1007/s40520-025-03052-1.pdf#page=8"
    },
    {
      "id": "A16",
      "sourceId": "S3",
      "locator": "Age-friendly cities; governance; mental health services; PDF p.11",
      "paraphrase": "Inclusive infrastructure and participatory governance are recommended; unemployment is a distress pathway.",
      "url": "https://link.springer.com/content/pdf/10.1007/s40520-025-03052-1.pdf#page=11"
    },
    {
      "id": "A17",
      "sourceId": "S3",
      "locator": "Healthcare access; PDF p.10",
      "paraphrase": "Treatment costs can worsen poverty without financial protection.",
      "url": "https://link.springer.com/content/pdf/10.1007/s40520-025-03052-1.pdf#page=10"
    },
    {
      "id": "A18",
      "sourceId": "S4",
      "locator": "Section 4 and Figure 5; PDF p.11",
      "paraphrase": "Higher housing costs squeeze resources, create displacement pressure and financial distress.",
      "url": "https://www.frontiersin.org/journals/public-health/articles/10.3389/fpubh.2023.1154515/pdf#page=11"
    },
    {
      "id": "A19",
      "sourceId": "S4",
      "locator": "Section 4 and Figure 5; PDF p.12",
      "paraphrase": "Social displacement disrupts support; isolation harms wellbeing; collective efficacy can buffer gentrification harms.",
      "url": "https://www.frontiersin.org/journals/public-health/articles/10.3389/fpubh.2023.1154515/pdf#page=12"
    },
    {
      "id": "A20",
      "sourceId": "S4",
      "locator": "Section 4; PDF p.12",
      "paraphrase": "Commercial displacement can reduce access to affordable food and locally appropriate services.",
      "url": "https://www.frontiersin.org/journals/public-health/articles/10.3389/fpubh.2023.1154515/pdf#page=12"
    },
    {
      "id": "A21",
      "sourceId": "S4",
      "locator": "Sections 3.6.1–3.6.3; PDF pp.9–11",
      "paraphrase": "Gentrification's health effects vary by population, tenure and time; displacement is not universal.",
      "url": "https://www.frontiersin.org/journals/public-health/articles/10.3389/fpubh.2023.1154515/pdf#page=10"
    },
    {
      "id": "A22",
      "sourceId": "S5",
      "locator": "Introduction; PDF p.2",
      "paraphrase": "Market barriers exclude disadvantaged households; green upgrades can increase costs and displacement.",
      "url": "https://researchers-admin.westernsydney.edu.au/ws/portalfiles/portal/319751755/sustainability-17-07519.pdf#page=2"
    },
    {
      "id": "A23",
      "sourceId": "S5",
      "locator": "Sections 4.2–4.3 and Table 1; PDF pp.5–6",
      "paraphrase": "Ventilation, moisture control and safer materials support respiratory health; efficient housing reduces energy stress.",
      "url": "https://researchers-admin.westernsydney.edu.au/ws/portalfiles/portal/319751755/sustainability-17-07519.pdf#page=6"
    },
    {
      "id": "A24",
      "sourceId": "S5",
      "locator": "Table 1; PDF p.6",
      "paraphrase": "Affordable inclusive housing reduces insecurity and associated distress; green spaces support activity and wellbeing.",
      "url": "https://researchers-admin.westernsydney.edu.au/ws/portalfiles/portal/319751755/sustainability-17-07519.pdf#page=6"
    },
    {
      "id": "A25",
      "sourceId": "S5",
      "locator": "Section 5; PDF p.11",
      "paraphrase": "Coordinated funding, zoning and standards can support healthy housing; cost and political barriers impede implementation.",
      "url": "https://researchers-admin.westernsydney.edu.au/ws/portalfiles/portal/319751755/sustainability-17-07519.pdf#page=11"
    },
    {
      "id": "A26",
      "sourceId": "S5",
      "locator": "Section 6; PDF p.12",
      "paraphrase": "Affordable units, rent protections and community-led housing are proposed to retain benefits for vulnerable residents.",
      "url": "https://researchers-admin.westernsydney.edu.au/ws/portalfiles/portal/319751755/sustainability-17-07519.pdf#page=12"
    },
    {
      "id": "A27",
      "sourceId": "S5",
      "locator": "Section 8; PDF pp.13–14",
      "paraphrase": "Climate-responsive housing and cooling designs can protect vulnerable residents from heat and disaster exposure.",
      "url": "https://researchers-admin.westernsydney.edu.au/ws/portalfiles/portal/319751755/sustainability-17-07519.pdf#page=13"
    },
    {
      "id": "A28",
      "sourceId": "S5",
      "locator": "Section 9; PDF pp.14–15",
      "paraphrase": "Longitudinal evidence and monitoring are needed; coalitions and resident engagement can influence policy.",
      "url": "https://researchers-admin.westernsydney.edu.au/ws/portalfiles/portal/319751755/sustainability-17-07519.pdf#page=14"
    },
    {
      "id": "A29",
      "sourceId": "S6",
      "locator": "Sections 3–4.1; accepted manuscript pp.6–10",
      "paraphrase": "Connected mixed uses, active infrastructure and transit support walking; activity protects against chronic disease.",
      "url": "https://ora.ox.ac.uk/objects/uuid%3A9c42ba3a-ca01-425e-8982-69434adc1b25/download_file?safe_filename=BE-Health_final.pdf&type_of_work=Journal+article#page=9"
    },
    {
      "id": "A30",
      "sourceId": "S6",
      "locator": "Section 4.3; accepted manuscript p.13",
      "paraphrase": "Transport access reduces exclusion; shared places enable social contact; commuting can crowd out social time.",
      "url": "https://ora.ox.ac.uk/objects/uuid%3A9c42ba3a-ca01-425e-8982-69434adc1b25/download_file?safe_filename=BE-Health_final.pdf&type_of_work=Journal+article#page=13"
    },
    {
      "id": "A31",
      "sourceId": "S6",
      "locator": "Sections 5.1–5.3; accepted manuscript pp.14–17",
      "paraphrase": "Car dependence generates traffic emissions; pollution damages cardiopulmonary health; noise disrupts sleep and increases stress.",
      "url": "https://ora.ox.ac.uk/objects/uuid%3A9c42ba3a-ca01-425e-8982-69434adc1b25/download_file?safe_filename=BE-Health_final.pdf&type_of_work=Journal+article#page=14"
    },
    {
      "id": "A32",
      "sourceId": "S6",
      "locator": "Section 5.4; accepted manuscript pp.17–18",
      "paraphrase": "Road design and speed influence injury; more active-travel exposure can increase injuries without protective measures.",
      "url": "https://ora.ox.ac.uk/objects/uuid%3A9c42ba3a-ca01-425e-8982-69434adc1b25/download_file?safe_filename=BE-Health_final.pdf&type_of_work=Journal+article#page=17"
    },
    {
      "id": "A33",
      "sourceId": "S6",
      "locator": "Section 5.5; accepted manuscript pp.18–19",
      "paraphrase": "Perceived danger discourages walking and park use; disorder and insecurity contribute to distress.",
      "url": "https://ora.ox.ac.uk/objects/uuid%3A9c42ba3a-ca01-425e-8982-69434adc1b25/download_file?safe_filename=BE-Health_final.pdf&type_of_work=Journal+article#page=18"
    },
    {
      "id": "A34",
      "sourceId": "S6",
      "locator": "Section 6.4, accepted manuscript pp.22–23; especially p.23",
      "paraphrase": "Health-related costs include absenteeism and disability-related productivity losses. A planning-model example monetizes productivity benefits. This supports an economic pathway but does not estimate this model's household employment or income feedback.",
      "url": "https://ora.ox.ac.uk/objects/uuid%3A9c42ba3a-ca01-425e-8982-69434adc1b25/download_file?safe_filename=BE-Health_final.pdf&type_of_work=Journal+article#page=23"
    },
    {
      "id": "A35",
      "sourceId": "S1",
      "locator": "Table 1, article p.5 / repository PDF p.6",
      "paraphrase": "The source model represents the distribution of poor self-assessed health between neighborhoods. The present model adapts this to a defined prevalence gap between residents facing disadvantage and a defined reference group; it does not estimate a morbidity-to-self-rating function.",
      "url": "https://pure.eur.nl/ws/files/219230304/Understanding_the_systems_dynamics_of_neighborhood_socioeconomic_inequities_in_health_in_European_cities.pdf"
    }
  ],
  "sources": [
    {
      "id": "S1",
      "authors": "Vernon Cail et al.",
      "year": 2026,
      "title": "Understanding the systems dynamics of neighborhood socioeconomic inequities in health in European cities: a causal loop diagram",
      "journal": "Health & Place 97, 103595",
      "doi": "10.1016/j.healthplace.2025.103595",
      "fullTextUrl": "https://pure.eur.nl/ws/files/219230304/Understanding_the_systems_dynamics_of_neighborhood_socioeconomic_inequities_in_health_in_European_cities.pdf",
      "access": "Open-access journal article / university repository PDF",
      "note": "Scoping review and expert model building: 85 studies, 22 factors and 64 connections. Expert-hypothesized arrows; not epidemiological causal identification. Repository PDF has a cover: PDF page = article page + 1. The PPT spells Cail as Cali and says around 70 articles; the original paper takes precedence.",
      "url": "https://doi.org/10.1016/j.healthplace.2025.103595"
    },
    {
      "id": "S2",
      "authors": "Elena Gelormino, Giulia Melis, Cristina Marietta and Giuseppe Costa",
      "year": 2015,
      "title": "From built environment to health inequalities: An explanatory framework based on evidence",
      "journal": "Preventive Medicine Reports 2, 737–745",
      "doi": "10.1016/j.pmedr.2015.08.019",
      "fullTextUrl": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4721462/",
      "access": "Open-access full text",
      "note": "Review framework. Equity effects depend on social position and effective use; equal facility provision is insufficient. No universal direction is assigned to urban density.",
      "url": "https://doi.org/10.1016/j.pmedr.2015.08.019"
    },
    {
      "id": "S3",
      "authors": "Stefano Cacciatore et al.",
      "year": 2025,
      "title": "Urban health inequities and healthy longevity: traditional and emerging risk factors across the cities and policy implications",
      "journal": "Aging Clinical and Experimental Research 37, 143",
      "doi": "10.1007/s40520-025-03052-1",
      "fullTextUrl": "https://link.springer.com/article/10.1007/s40520-025-03052-1",
      "access": "Open-access journal full text",
      "note": "Narrative review. Heterogeneous evidence and policy recommendations; no estimated closed feedback responses.",
      "url": "https://doi.org/10.1007/s40520-025-03052-1"
    },
    {
      "id": "S4",
      "authors": "Sun Delong (publisher citation: Delong S)",
      "year": 2023,
      "title": "Urban health inequality in shifting environment: systematic review on the impact of gentrification on residents' health",
      "journal": "Frontiers in Public Health 11, 1154515",
      "doi": "10.3389/fpubh.2023.1154515",
      "fullTextUrl": "https://www.frontiersin.org/journals/public-health/articles/10.3389/fpubh.2023.1154515/full",
      "access": "Open-access full text",
      "note": "Systematic review of 66 empirical studies, predominantly Western and often cross-sectional. Displacement and health effects are heterogeneous. The author's displayed name and publisher citation differ in order.",
      "url": "https://doi.org/10.3389/fpubh.2023.1154515"
    },
    {
      "id": "S5",
      "authors": "Kritika Rana",
      "year": 2025,
      "title": "Sustainable Housing as a Social Determinant of Health and Wellbeing",
      "journal": "Sustainability 17(16), 7519",
      "doi": "10.3390/su17167519",
      "fullTextUrl": "https://researchers-admin.westernsydney.edu.au/ws/portalfiles/portal/319751755/sustainability-17-07519.pdf",
      "access": "Open-access journal PDF / university repository",
      "note": "Integrative review of sustainable housing, health, equity and policy. This is the PPT's Rana paper; it is not the earlier migrant/refugee housing review.",
      "url": "https://doi.org/10.3390/su17167519"
    },
    {
      "id": "S6",
      "authors": "Lawrence D. Frank, Nicole Iroz-Elardo, Kara E. MacLeod and Andy Hong",
      "year": 2019,
      "title": "Pathways from built environment to health: A conceptual framework linking behavior and exposure-based impacts",
      "journal": "Journal of Transport & Health 12, 319–335",
      "doi": "10.1016/j.jth.2018.11.008",
      "fullTextUrl": "https://ora.ox.ac.uk/objects/uuid%3A9c42ba3a-ca01-425e-8982-69434adc1b25/download_file?safe_filename=BE-Health_final.pdf&type_of_work=Journal+article",
      "access": "Author-accepted manuscript in Oxford University Research Archive",
      "note": "Conceptual synthesis separating behavioral and exposure pathways. Page locators here refer to the 33-page accepted manuscript, not publisher pagination. Feedbacks are acknowledged but not drawn; health–work closure remains a synthesis hypothesis.",
      "url": "https://doi.org/10.1016/j.jth.2018.11.008"
    }
  ],
  "provenance": {
    "brief": "Automated CLD input parameters.pptx",
    "briefSha256": "623d989b04a6ff482e54e35a037ca6ea949e5faf6d4c5dfa2d1e2d2585691290",
    "slides": "1: problem, target and equity definition; 2–7: six source titles; 8: definition references.",
    "sourceSelection": "Only the six papers named on slides 2–7 inform the substantive causal model. Earlier local PDFs and the previous CLD are superseded, not reused as evidence.",
    "verifiedOn": "2026-10-20",
    "targetVariables": "Approximately 30–35; implemented 35.",
    "corrections": [
      "Cali in the PPT corrected to Cail from S1.",
      "S1 reports 85 reviewed studies, not the PPT's around 70.",
      "S5 is the sustainable-housing review specified in the PPT.",
      "The PPT enumerates five needs after announcing six; five are modeled."
    ],
    "statusDefinitions": {
      "reported": "A directional mechanism discussed by a source, including conceptual hypotheses; not proof of causation.",
      "association": "An observed/reviewed association given a proposed direction; confounding and reverse causality remain possible.",
      "synthesis": "An explicit modeling inference or cross-source bridge; not directly established as this arrow.",
      "policy": "A proposed, conditional intervention or response; not an automatic or empirically measured feedback.",
      "indicator": "Conditional group-difference accounting; improvement must exceed the reference group's change.",
      "definition": "A stated algebraic relationship between model variables; no empirical source citation is implied."
    },
    "review": {
      "date": "2026-11-03",
      "baselineVersion": "2026-10-20.1",
      "version": "2026-11-03.1",
      "report": "CLD_REVIEW.html",
      "ledger": "cld_review.json",
      "coverage": "All 35 variable definitions, all 78 original links, two added definitional links, and all 10 highlighted loop paths reviewed for semantics and structure. Review-level evidence was checked at the cited passages; underlying primary studies were not independently reappraised.",
      "reviewer": "AI-assisted methodological review; not an independent human expert validation."
    },
    "terminologyRevision": {
      "date": "2026-11-03",
      "version": "2026-11-03.2",
      "previousVersion": "2026-11-03.1",
      "record": "terminology_revision.json",
      "description": "Clarified study-population terminology, reference-group definitions and gap explanations. The graph structure, signs, evidence categories and scientific-review conclusions are retained."
    }
  }
};
