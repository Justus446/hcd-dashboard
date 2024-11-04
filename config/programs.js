let DHIS_BASE_API_URL = process.env.REACT_APP_DHIS_BASE_API_URL
let APP_BASE_URL = process.env.REACT_APP_APP_BASE_URL || "http://41.89.94.99:3000"
let programs = []
const {m_al, f_p, t_b, e_mms, n_utr, hiv_adult_preps, hiv_oi_preps, hiv_paed_preps, hiv_tb_preps, hiv_lab_preps} = require('./endpoints')

const getPages = (end_points)=>{
	let pages = [
		{
		  "page": "Dashboard",
		  "level": "Dashboard",
		  "name": "Dashboard",
		  "id": "all__dashboard",
		  "route": `/dashboard`,
		  "endpoints": end_points.filter(pg=>pg.page=="Dashboard"),
		  "active": end_points.filter(pg=>pg.page=="Dashboard").length>0,
		  "ouFilter": true,		  
		  "Notes": ""
		},
		{
		  "page": "Stock status",
		  "level": "County",
		  "name": "Commodity-specific",
		  "id": "county__commodity_specific",
		  "route": `/ss/commodity`,
		  "endpoints": end_points.filter(pg=>pg.page=="Stock status"),
		  "active": end_points.filter(pg=>pg.page=="Stock status").length>0,
		  "ouFilter": true,		  
		  "Notes": ""
		},
		{
		  "page": "Stock status",
		  "level": "County",
		  "name": "All commodities",
		  "id": "county__all_commodities",
		  "route": `/ss/all`,
		  "endpoints": end_points.filter(pg=>pg.page=="Stock status all"),
		  "active": end_points.filter(pg=>pg.page=="Stock status all").length>0,
		  "ouFilter": true,		  
		  "Notes": ""
		},
		{
		  "page": "Stock status map",
		  "level": "County",
		  "name": "Stock Status Map",
		  "id": "county__all_commodities_map",
		  "route": `/ss/map`,
		  "endpoints": end_points.filter(pg=>pg.page=="Stock status map"),
		  "active": end_points.filter(pg=>pg.page=="Stock status map").length>0,
		  "ouFilter": false,	  
		  "Notes": ""
		},
		{
		  "page": "Reporting Rate",
		  "level": "County",
		  "name": "Reporting Rate Summary",
		  "id": "county__reporting_rate_trend",
		  "route": `/rr/summary`,
		  "endpoints": end_points.filter(pg=>pg.name.includes("Reporting Rate Trend")),
		  "active": end_points.filter(pg=>pg.name.includes("Reporting Rate Trend")).length>0,
		  "periodFilter": "range",
		  "ouFilter": true,		  
		  "Notes": ""
		},
		{
		  "page": "Reporting Rate",
		  "level": "County",
		  "name": "Facility Reporting Rate",
		  "id": "county__facility_reporting_rate",
		  "route": `/rr/facility`,
		  "endpoints": end_points.filter(pg=>pg.name.includes("Facility Reporting Rate")),
		  "active": end_points.filter(pg=>pg.name.includes("Facility Reporting Rate")).length>0,
		  "periodFilter": "range",
		  "ouFilter": true,		  
		  "Notes": ""
		},
		{
		  "page": "Reporting Rate",
		  "level": "County",
		  "name": "Subcounty Reporting Rate",
		  "id": "county__subcounty_reporting_rate",
		  "route": `/rr/subcounty`,
		  "endpoints": end_points.filter(pg=>pg.name.includes("Subcounty Reporting Rate")),
		  "active": end_points.filter(pg=>pg.name.includes("Subcounty Reporting Rate")).length>0,
		  "periodFilter": "range",
		  "ouFilter": true,		  
		  "Notes": ""
		},
		{
		  "page": "Data Quality: Completenes",
		  "level": "County",
		  "name": "Completeness",
		  "id": "county__dq_completeness",
		  "route": `/dq/completeness`,
		  "endpoints": end_points.filter(pg=>pg.page=="Data Quality: Completeness"),
		  "active": end_points.filter(pg=>pg.page=="Data Quality: Completeness").length>0,
		  "periodFilter": "range",
		  "commodityFilter": true,
		  "ouFilter": true,		  
		  "Notes": "Has commodity filter"
		},
		{
		  "page": "Data Quality: Concordance",
		  "level": "County",
		  "name": "Concordance",
		  "id": "county__dq_concordance",
		  "route": `/dq/concordance`,
		  "endpoints": end_points.filter(pg=>pg.page=="Data Quality: Concordance"),
		  "active": end_points.filter(pg=>pg.page=="Data Quality: Concordance").length>0,
		  "commodityFilter": true,
		  "ouFilter": true,		  
		  "Notes": ""
		},
		{
		  "page": "Data Quality: Consistency",
		  "level": "County",
		  "name": "Consistency",
		  "id": "county__dq_consistency",
		  "route": `/dq/consistency`,
		  "endpoints": end_points.filter(pg=>pg.page=="Data Quality: Consistency"),
		  "active": end_points.filter(pg=>pg.page=="Data Quality: Consistency").length>0,
		  "commodityFilter": true,
		  "ouFilter": true,		  
		  "Notes": ""
		},
		{
		  "page": "Data Quality: Comparison",
		  "level": "County",
		  "name": "Comparison",
		  "id": "county__dq_comparison",
		  "route": `/dq/comparison`,
		  "endpoints": end_points.filter(pg=>pg.page=="Data Quality: Comparison"),
		  "active": end_points.filter(pg=>pg.page=="Data Quality: Comparison").length>0,
		  "ouFilter": true,		  
		  "Notes": ""
		},
		{
		  "page": "Supply Chain Performance Summary",
		  "level": "County",
		  "name": "Indicator Summary",
		  "id": "county__indicator_summary",
		  "route": `/scp/summary`,
		  "endpoints": end_points.filter(pg=>pg.page==="Supply Chain Performance Summary"),
		  "active": end_points.filter(pg=>pg.page==="Supply Chain Performance Summary").length>0,
		  "ouFilter": true,		  
		  "Notes": ""
		},
		{
		  "page": "Supply Chain Performance Trends",
		  "level": "County",
		  "name": "Indicator Trends",
		  "id": "county__indicator_trends",
		  "route": `/scp/trends`,
		  "endpoints": end_points.filter(pg=>pg.page==="Supply Chain Performance Trends"),
		  "active": end_points.filter(pg=>pg.page==="Supply Chain Performance Trends").length>0,
		  "periodFilter": "range",
		  "commodityFilter": true,
		  "ouFilter": true,		  
		  "Notes": ""
		},
		{
		  "page": "Accountability",
		  "level": "County",
		  "name": "Accountability",
		  "id": "county__accountability",
		  "route": `/accountability`,
		  "endpoints": end_points.filter(pg=>pg.page=="Accountability"),
		  "active": end_points.filter(pg=>pg.page=="Accountability").length>0,
		  "ouFilter": true,		  
		  "Notes": ""
		},
		{
			"page": "Expiries",
			"level": "County",
			"name": "Expiries",
			"id": "county__expiries",
			"route": `/expiries`,
			"endpoints": end_points.filter(pg=>pg.page=="Expiries"),
			"active": end_points.filter(pg=>pg.page=="Expiries").length>0,
			"ouFilter": true,		  
			"Notes": ""
		  },
		{
		  "page": "Issues vs Receipts",
		  "level": "County",
		  "name": "Issues vs Receipts",
		  "id": "county__issues_vs_receipts",
		  "route": `/issues-receipts`,
		  "endpoints": end_points.filter(pg=>pg.page=="Issues vs Receipts"),
		  "active": end_points.filter(pg=>pg.page=="Issues vs Receipts").length>0,
		  "periodFilter": "range",
		  "ouFilter": true,		  
		  "Notes": ""
		},
		{
		  "page": "Health Facility Followup",
		  "level": "County",
		  "name": "Understocked Facilities",
		  "id": "county__understocked_facilities",
		  "route": `/hff/understocked`,
		  "endpoints": end_points.filter(pg=>pg.page=="Health Facility Followup"),
		  "active": end_points.filter(pg=>pg.page=="Health Facility Followup").length>0,
		  "ouFilter": true,		  
		  "Notes": ""
		},
		{
		  "page": "Health Facility Followup",
		  "level": "County",
		  "name": "Overstocked Facilities",
		  "id": "county__overstocked_facilities",
		  "route": `/hff/overstocked`,
		  "endpoints": end_points.filter(pg=>pg.page=="Health Facility Followup"),
		  "active": end_points.filter(pg=>pg.page=="Health Facility Followup").length>0,
		  "ouFilter": true,		  
		  "Notes": ""
		},
		{
		  "page": "National Stocks",
		  "level": "National",
		  "name": "National Stocks",
		  "id": "national__summary",
		  "route": `/national/summary`,
		  "endpoints": end_points.filter(pg=>pg.page=="National Stocks"),
		  "active": end_points.filter(pg=>pg.page=="National Stocks").length>0,
		  "ouFilter": true,		  
		  "Notes": ""
		},
		{
		  "page": "National SOH Comparison",
		  "level": "National",
		  "name": "SOH Comparison",
		  "id": "national__soh_comparison",
		  "route": `/national/commodities`,
		  "endpoints": end_points.filter(pg=>pg.page=="National SOH Comparison"),
		  "active": end_points.filter(pg=>pg.page=="National SOH Comparison").length>0,
		  "ouFilter": true,		  
		  "Notes": ""
		},
		{
		  "page": "Pending Shipments",
		  "level": "National",
		  "name": "Pending Shipments",
		  "id": "national__pending_shipments",
		  "route": `/national/pending-shipments`,
		  "endpoints": end_points.filter(pg=>pg.page=="Pending Shipments"),
		  "active": end_points.filter(pg=>pg.page=="Pending Shipments").length>0,
		  "ouFilter": true,		  
		  "Notes": ""
		},
		{
			"page": "Risk Parameters",
			"level": "County",
			"name": "Risk Parameters",
			"id": "county_risk_parameters",
			"route": `/riskparameters`,
			"endpoints": end_points.filter(pg=>pg.page=="Risk Parameters"),
			"active": end_points.filter(pg=>pg.page=="Risk Parameters").length>0,
			"periodFilter": "range",
			"ouFilter": true,		  
			"Notes": ""
		  },
	  ]
	return pages
}

// <----malaria
let malaria = {}
malaria.name = "Malaria Programme"
malaria.id = 1
malaria.thresholds = {"national": [9,18], "subnational": [3,6], "kemsa": [6,9]}
malaria.active = true
malaria.owner = "DNMP"
malaria.pages = getPages(m_al)
malaria.endpoints = m_al
// malaria----- />

// <----FP
let fp = {}
fp.name = "Family Planning"
fp.id = 2
fp.thresholds = {"national": [9,18], "subnational": [3,6], "kemsa": [6,9]}
fp.active = true
fp.owner = "FP Department, MoH"
fp.pages = getPages(f_p)
fp.endpoints = f_p
// FP----- />

// <----TB
let tb = {}
tb.name = "Tuberculosis"
tb.id = 3
tb.thresholds = {"national": [9,18], "subnational": [3,6], "kemsa": [6,9]}
tb.active = true
tb.owner = "TB Department, MoH"
tb.pages = getPages(t_b)
tb.endpoints = t_b
// TB----- />

// <----HIV
let hiv = {}
hiv.name = "HIV - OI Medicines"
hiv.id = 4.1
hiv.thresholds = {"national": [9,15], "subnational": [2,3], "kemsa": [6,9]}
hiv.active = true
hiv.owner = "NASCOP, MoH"
hiv.pages = getPages(hiv_oi_preps)
hiv.endpoints = hiv_oi_preps
// HIV----- />

// <----HIV
let hiv2 = {}
hiv2.name = "HIV - TB Drugs"
hiv2.id = 4.2
hiv2.thresholds = {"national": [9,15], "subnational": [2,3], "kemsa": [6,9]}
hiv2.active = true
hiv2.owner = "NASCOP, MoH"
hiv2.pages = getPages(hiv_tb_preps)
hiv2.endpoints = hiv_tb_preps
// HIV----- />

// <----HIV
let hiv3 = {}
hiv3.name = "HIV - Paediatric preparations"
hiv3.id = 4.3
hiv3.thresholds = {"national": [9,15], "subnational": [2,3], "kemsa": [6,9]}
hiv3.active = true
hiv3.owner = "NASCOP, MoH"
hiv3.pages = getPages(hiv_paed_preps)
hiv3.endpoints = hiv_paed_preps
// HIV----- />

// <----HIV
let hiv4 = {}
hiv4.name = "HIV - Adult preparations"
hiv4.id = 4.4
hiv4.thresholds = {"national": [9,15], "subnational": [2,3], "kemsa": [6,9]}
hiv4.active = true
hiv4.owner = "NASCOP, MoH"
hiv4.pages = getPages(hiv_adult_preps)
hiv4.endpoints = hiv_adult_preps
// HIV----- />

// <----HIV
let hiv5 = {}
hiv5.name = "HIV - Lab Commodities"
hiv5.id = 4.5
hiv5.thresholds = {"national": [9,15], "subnational": [2,3], "kemsa": [6,9]}
hiv5.active = true
hiv5.owner = "NASCOP, MoH"
hiv5.pages = getPages(hiv_lab_preps)
hiv5.endpoints = hiv_lab_preps
// HIV----- />

// <----Nutrition
// let nutr = {}
// nutr.name = "Nutrition"
// nutr.id = 5
// nutr.thresholds = {"national": [9,18], "subnational": [3,6], "kemsa": [6,9]}
// nutr.active = false
// nutr.owner = "Nutrition Department"
// nutr.pages = getPages(n_utr)
// nutr.endpoints = n_utr
// Nutrition----- />

// <----EMMS - Medicines
let emms = {}
emms.name = "Tracer HPTs - Medicines"
emms.id = 5
emms.thresholds = {"national": [9,18], "subnational": [3,6], "kemsa": [6,9]}
emms.active = true
emms.owner = "DHPT"
emms.pages = getPages(e_mms)
emms.endpoints = e_mms
// EMMS----- />


// <----EMMS - Medical Supplies
let emms_supplies = {}
emms_supplies.name = "Tracer HPTs - Medical Supplies"
emms_supplies.id = 5
emms_supplies.thresholds = {"national": [9,18], "subnational": [3,6], "kemsa": [6,9]}
emms_supplies.active = true
emms_supplies.owner = "DHPT"
emms_supplies.pages = getPages(e_mms)
emms_supplies.endpoints = e_mms
// EMMS----- />


// <----EMMS - Radiology Items
let emms_radiology = {}
emms_radiology.name = "Tracer HPTs - Radiology Items"
emms_radiology.id = 5
emms_radiology.thresholds = {"national": [9,18], "subnational": [3,6], "kemsa": [6,9]}
emms_radiology.active = true
emms_radiology.owner = "DHPT"
emms_radiology.pages = getPages(e_mms)
emms_radiology.endpoints = e_mms
// EMMS----- />


// <----EMMS - Medical Labaratory (Diagnostic)
let emms_diagnostics = {}
emms_diagnostics.name = "Tracer HPTs - Diagnostics"
emms_diagnostics.id = 5
emms_diagnostics.thresholds = {"national": [9,18], "subnational": [3,6], "kemsa": [6,9]}
emms_diagnostics.active = true
emms_diagnostics.owner = "DHPT"
emms_diagnostics.pages = getPages(e_mms)
emms_diagnostics.endpoints = e_mms
// EMMS----- />


programs.push(malaria)
programs.push(fp)
programs.push(hiv)
programs.push(hiv2)
programs.push(hiv3)
programs.push(hiv4)
programs.push(hiv5)
programs.push(tb)
programs.push(emms)
programs.push(emms_supplies)
programs.push(emms_radiology)
programs.push(emms_diagnostics)
// programs.push(nutr)

module.exports = programs
