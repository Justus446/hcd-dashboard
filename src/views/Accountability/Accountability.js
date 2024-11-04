import React, { useState, useEffect } from 'react';
import makeStyles from '@material-ui/styles/makeStyles';
import Message from 'components/Message/Message';
import {
	filterUrlConstructor,
	justFetch
} from '../../common/utils';
import { programs } from 'hcd-config';
import Toolbar from 'components/Toolbar/Toolbar';
import Table from 'components/Table/Table';
import ShadedCell from 'components/Table/ShadedCell';

const activProgId = parseFloat(localStorage.getItem('program')) || 1;
const activProg = programs.filter(pr => pr.id == activProgId)[0];
const paige = activProg.pages.filter(ep => ep.page == 'Accountability')[0];
const periodFilterType = paige.periodFilter;
const endpoints = paige.endpoints;

const abortRequests = new AbortController();

const queryString = require('query-string');
const useStyles = makeStyles(theme => ({
	root: { padding: theme.spacing(3) },
	content: { marginTop: theme.spacing(1) },
	gridchild: {
		paddingLeft: theme.spacing(2),
		paddingRight: theme.spacing(2)
	}
}));

const Accountability = props => {
	const classes = useStyles();

	let filter_params = queryString.parse(props.location.hash);
	if (
		filter_params.pe &&
		filter_params.pe.search(';') > 0 &&
		periodFilterType != 'range'
	) {
		filter_params.pe = 'LAST_MONTH';
	}
	let [url, setUrl] = useState(
		filterUrlConstructor(
			filter_params.pe,
			filter_params.ou,
			filter_params.level,
			endpoints[0][process.env.REACT_APP_ENV == "dev" ? "local_url" : "url"]
		)
	);
	const [accdata, setAccData] = useState([['Loading...']]);
	const [prd, setPrd] = useState(null);
	const [oun, setOun] = useState(null);
	const [loading, setLoading] = useState(true);
	const [oulvl, setOulvl] = useState(null);
	const [err, setErr] = useState({ error: false, msg: '' });
	let title = `Accountability`;

	const updateData = (rws, priod, ogu, levl) => {
		setAccData(rws);
		// setPrd(priod)
		// setOun(ogu)
		// setOulvl(levl)
	};


	//////// CUSTOM FXNs \\\\\\\\\\\\\\\\\\\\\\\\
	const filterItems = (array, query) => {
		return array.filter(function (el) {
			return el.indexOf(query) > -1;
		});
	};
	const sumArr = (array) => {
		let sum_total = 0;
		if (array == null || array == undefined) {
			array = [0];
		}
		array.map((val) => {
			if (val == null || val == undefined) {
				val = 0;
			}
			sum_total += parseFloat(val);
		});
		return sum_total;
	};
	//////// CUSTOM FXNs \\\\\\\\\\\\\\\\\\\\\\\\


	let fetchAcc = async the_url => {
		setLoading(true);
		setErr({ error: false, msg: '' });
		setAccData([['Loading...']]);
		try {
			//   fetch(the_url, { signal: abortRequests.signal })
			justFetch(the_url, { signal: abortRequests.signal })
				// .then(s_p => s_p.json())
				.then(reply => {
					// console.log('reply: '+JSON.stringify(reply))
					console.log('accurl: '+the_url)
					if (reply.fetchedData == undefined || reply.fetchedData?.error) {
						setLoading(false)
						let e_rr = {
							error: true,
							msg: reply?.fetchedData?.message || '',
							...reply
						}
						setErr(e_rr);
						if (e_rr.msg.includes('aborted') || e_rr.msg.includes('NetworkError')) {
							props.history.go(0)
						}
					} else {
						setErr({ error: false, msg: '' });
						/// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
						/// ~~~~~~~~~~~~~~~~~~~~~~ <SUCCESS ~~~~~~~~~~~~~~~~~~~~~~~~~~
						/// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
						let tableData = [];
						let thedx = reply.fetchedData.metaData.dimensions.dx;
						let therows = reply.fetchedData.rows;

						// let commodities_qrecvd_arr ; //from qty received
						let commodities_qrecvd_arr = []; thedx.map(x_ => { if (reply.fetchedData.metaData.items[x_].name.toLowerCase().search('received') > 0) { commodities_qrecvd_arr.push(x_) } })

						// let commodities_opsoh_arr  //from opening_soh
						let commodities_opsoh_arr = []; thedx.map(x_ => { if (reply.fetchedData.metaData.items[x_].name.toLowerCase().search('beginning') > 0) { commodities_opsoh_arr.push(x_) } })
						let commodities_arr = commodities_opsoh_arr //using this as commodity array

						// let commodities_posadj_arr  //from posadj
						let commodities_posadj_arr = []; thedx.map(x_ => { if (reply.fetchedData.metaData.items[x_].name.toLowerCase().search('positive') > 0 || reply.fetchedData.metaData.items[x_].name.search('Postive') > 0) { commodities_posadj_arr.push(x_) } })

						// let commodities_negadj_arr  //from negadj
						let commodities_negadj_arr = []; thedx.map(x_ => { if (reply.fetchedData.metaData.items[x_].name.toLowerCase().search('negative') > 0) { commodities_negadj_arr.push(x_) } })

						// let commodities_dispns_arr //from dispensed
						let commodities_dispns_arr = []; thedx.map(x_ => { if (reply.fetchedData.metaData.items[x_].name.toLowerCase().search('dispensed') > 0 || reply.fetchedData.metaData.items[x_].name.toLowerCase().search('issued') > 0) { commodities_dispns_arr.push(x_) } })

						// let commodities_phycount_arr //from phycount
						let commodities_phycount_arr = []; thedx.map(i_ => { if (reply.fetchedData.metaData.items[i_].name.toLowerCase().search('physical') > 0 || reply.fetchedData.metaData.items[i_].name.toLowerCase().search('closing') > 0 || reply.fetchedData.metaData.items[i_].name.toLowerCase().search('ending') > 0) { commodities_phycount_arr.push(i_) } })

						let commodities_id_arr0 = [];
						let commodities_id_arr = [];
						let commodities_name_arr = [];
						commodities_arr.map((co_ar) => {
							commodities_id_arr0 = co_ar.split(".", 2);
							commodities_id_arr.push(commodities_id_arr0[0]);
						});

						commodities_arr.map((coid) => {
							commodities_name_arr.push(
								reply.fetchedData.metaData.items[coid].name.replace('Beginning', '').replace('Balance', '').replace('MOH 647_','').replace('MOH 743 Rev2020_','').replace('.', '').replace('HCD - ', '').replace(' - HF', '').replace('MOH 743', '').replace('Rev2020_', '').replace('PMI', '').replace('_', ' ').replace('MoH 730B', '')
								.replace('TB/ HIV DRUGS ', '')
								.replace('Revision 2017', '')
								.replace('MCD_', '')
								.replace('Medicines for OIs ', '')
								.replace('MOS', '')
								.replace('Rev ', '')
								.replace('MoS', '')
								.replace('FP_', '')
								.replace('HIV-', '')
								.replace('MoS', '')
								.replace(', FP', '')
								.replace('Revision', '')
								.replace('2016', '')
								.replace('2017', '')
								.replace('2018', '')
								.replace('2019', '')
								.replace('2020', '')
								.replace('Paediatric preparations', '')
								.replace('Adult preparations', '')
								.replace('End of Month', '')
								.replace('Physical Stock Count', '')
								.replace('MOH 647_', '')
								.replace('MOH 743 Rev2020_', '')
								.replace('Physical Count', '')
								.replace('Ending Balance', '')
								.replace('TB FCDRR', '')
								.replace('Closing Balance', '').trim()
							);
						});

						reply.fetchedData.metaData.dimensions.ou.map((ou, ou_ix) => {
							let tdata = [];
							let ki_cells = [];
							let rows_filtered_ou = filterItems(therows, ou);
							let opsoh_arr = [];
							let posadj_arr = [];
							let kemsi_arr = [];
							let qtydisp_arr = [];
							let negadj_arr = [];
							let kissue_arr = [];
							let closbal_arr = [];
							let pcacc_arr = [];
							let letiance_arr = [];

							commodities_qrecvd_arr.map((one_ki) => {
								let filt_rows = filterItems(rows_filtered_ou, one_ki);
								if (filt_rows == undefined) {
									filt_rows = [["", "", "", "0.0"]];
									ki_cells.push("0.0");
								} else {
									if (filt_rows[0] == undefined) {
										ki_cells.push("0.0");
									} else {
										ki_cells.push(filt_rows[0][reply.fetchedData.headers.findIndex(jk=>jk.name=="value")]);
									}
								}
							});

							commodities_id_arr.map((cidarr, cid_inx) => {
								let trow = []
								let commo_id_indicator_1 = commodities_opsoh_arr.find(op => op.split('.')[0] == cidarr)
								let commo_id_indicator_2 = commodities_posadj_arr.find(op => op.split('.')[0] == cidarr)
								let commo_id_indicator_3 = commodities_dispns_arr.find(op => op.split('.')[0] == cidarr)
								let commo_id_indicator_4 = commodities_negadj_arr.find(op => op.split('.')[0] == cidarr)
								let commo_id_indicator_5 = commodities_phycount_arr.find(op => op.split('.')[0] == cidarr)
								let commo_id_indicator_6 = commodities_qrecvd_arr.find(op => op.split('.')[0] == cidarr)

								let rows_filtered_ou_commo1 = rows_filtered_ou.filter(rw => rw[0] == commo_id_indicator_1);
								let rows_filtered_ou_commo2 = rows_filtered_ou.filter(rw => rw[0] == commo_id_indicator_2);
								let rows_filtered_ou_commo3 = rows_filtered_ou.filter(rw => rw[0] == commo_id_indicator_3);
								let rows_filtered_ou_commo4 = rows_filtered_ou.filter(rw => rw[0] == commo_id_indicator_4);
								let rows_filtered_ou_commo5 = rows_filtered_ou.filter(rw => rw[0] == commo_id_indicator_5);
								let rows_filtered_ou_commo6 = rows_filtered_ou.filter(rw => rw[0] == commo_id_indicator_6);
								trow.push(reply.fetchedData.metaData.items[ou].name)
								trow.push(commodities_name_arr[cid_inx])
								// ----------data cells----------
								let opsoh = filterItems(rows_filtered_ou_commo1, commo_id_indicator_1)[0];
								if (opsoh == undefined) { opsoh = [0, 0, 0, 0]; }
								opsoh_arr.push(opsoh[reply.fetchedData.headers.findIndex(jk=>jk.name=="value")]);
								trow.push(parseFloat(opsoh[reply.fetchedData.headers.findIndex(jk=>jk.name=="value")]).toFixed(1))

								let posadj = filterItems(rows_filtered_ou_commo2, commo_id_indicator_2)[0];
								if (posadj == undefined) { posadj = [0, 0, 0, 0]; }
								trow.push(parseFloat(posadj[reply.fetchedData.headers.findIndex(jk=>jk.name=="value")]).toFixed(1))
								posadj_arr.push(posadj[reply.fetchedData.headers.findIndex(jk=>jk.name=="value")]);

								//Quantity received this period
								let qtyrec = filterItems(rows_filtered_ou_commo6, commo_id_indicator_6)[0];
								if (qtyrec == undefined) { qtyrec = [0, 0, 0, 0]; }
								kemsi_arr.push(qtyrec[reply.fetchedData.headers.findIndex(jk=>jk.name=="value")]);
								trow.push(parseFloat(qtyrec[reply.fetchedData.headers.findIndex(jk=>jk.name=="value")]).toFixed(1))
								//end qty received

								let qtydisp = filterItems(rows_filtered_ou_commo3, commo_id_indicator_3)[0];
								if (qtydisp == undefined) { qtydisp = [0, 0, 0, 0]; }
								qtydisp_arr.push(qtydisp[reply.fetchedData.headers.findIndex(jk=>jk.name=="value")]);
								trow.push(parseFloat(qtydisp[reply.fetchedData.headers.findIndex(jk=>jk.name=="value")]).toFixed(1))

								let negadj = filterItems(rows_filtered_ou_commo4, commo_id_indicator_4)[0];
								if (negadj == undefined) { negadj = [0, 0, 0, 0]; }
								negadj_arr.push(negadj[reply.fetchedData.headers.findIndex(jk=>jk.name=="value")]);
								trow.push(parseFloat(negadj[reply.fetchedData.headers.findIndex(jk=>jk.name=="value")]).toFixed(1))

								let closbal = filterItems(rows_filtered_ou_commo5, commo_id_indicator_5)[0];
								if (closbal == undefined) { closbal = [0, 0, 0, 0]; }
								closbal_arr.push(closbal[reply.fetchedData.headers.findIndex(jk=>jk.name=="value")]);
								trow.push(parseFloat(closbal[reply.fetchedData.headers.findIndex(jk=>jk.name=="value")]).toFixed(1))

								let kiar = [];
								// kiar = getPerc();

								let k_is_val = parseFloat(kiar[cid_inx]);
								if (Number.isNaN(k_is_val)) {
									k_is_val = 0;
								} else {
									k_is_val = parseFloat(kiar[cid_inx]);
								}

								let sum_pos = parseFloat(opsoh[reply.fetchedData.headers.findIndex(jk=>jk.name=="value")]) + parseFloat(posadj[reply.fetchedData.headers.findIndex(jk=>jk.name=="value")]) + parseFloat(qtyrec[reply.fetchedData.headers.findIndex(jk=>jk.name=="value")]);
								let sum_neg = parseFloat(qtydisp[reply.fetchedData.headers.findIndex(jk=>jk.name=="value")]) + parseFloat(negadj[reply.fetchedData.headers.findIndex(jk=>jk.name=="value")]) + parseFloat(closbal[reply.fetchedData.headers.findIndex(jk=>jk.name=="value")]);
								let per_acc_for = parseFloat(sum_neg) / parseFloat(sum_pos);
								per_acc_for = per_acc_for * 100;

								let expected =
									sum_pos - (parseFloat(qtydisp[reply.fetchedData.headers.findIndex(jk=>jk.name=="value")]) + parseFloat(negadj[reply.fetchedData.headers.findIndex(jk=>jk.name=="value")]));
								let letiance = expected - parseFloat(closbal[reply.fetchedData.headers.findIndex(jk=>jk.name=="value")]);
								letiance_arr.push(letiance.toFixed(1));

								trow.push(letiance.toFixed(1))

								let n_cell;
								if (per_acc_for >= 95 && per_acc_for <= 105) {
									n_cell = <ShadedCell classes={"cell-fill cell-green"} val={per_acc_for.toFixed(1)} suffix="%" />
								} else {
									n_cell = <ShadedCell classes={"cell-fill cell-darkred fcwhite"} val={per_acc_for.toFixed(1)} suffix="%" />
								}
								if (isNaN(per_acc_for)) {
									trow.push("-")
								} else {
									trow.push(n_cell)
								}
								pcacc_arr.push(per_acc_for);
								// ----------END data cells----------

								tdata.push(trow);
								tableData.push(trow);
							});

							let o_gu;
							if (filter_params.ou) {
								o_gu = filter_params.ou;
							} else {
								o_gu = '';
							}

							commodities_id_arr.map((com_ki, comki_indx) => {
								let kione_val = filterItems(rows_filtered_ou, com_ki[0]);
								if (
									kione_val[0] == undefined ||
									kione_val == undefined ||
									kione_val == null ||
									kione_val == ""
								) {
									kione_val = [0, 0, 0, 0];
								}
								let kione_value
								if (typeof kione_val[0] == "number") {
									kione_value = kione_val[reply.fetchedData.headers.findIndex(jk=>jk.name=="value")];
								} else if (
									typeof kione_val[0] == "array" ||
									typeof kione_val[0] == "object"
								) {
									kione_value = kione_val[0][reply.fetchedData.headers.findIndex(jk=>jk.name=="value")];
								}
								let kione_id2 = ou + "_ki_cell_" + comki_indx;
							});

							const getPerc = () => {
								return kissue_arr;
							}

							updateData(tableData, reply.fetchedData.metaData.items[reply.fetchedData.metaData.dimensions.pe[0]].name, o_gu, oulvl);
							setLoading(false)
						});


						/// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
						/// ~~~~~~~~~~~~~~~~~~~~~~ SUCCESS/> ~~~~~~~~~~~~~~~~~~~~~~~~~~
						/// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
					}
					setLoading(false);
				})
				.catch(err => {
					if (abortRequests.signal.aborted) { //if(err.name !== "AbortError"){
						setLoading(false);
						setErr({ error: true, msg: `Error fetching data: ' ${process.env.REACT_APP_ENV == "dev" ? err.message : ""}` });
					} else {
						console.log("Cancelling fetchAcc requests");
					}
				});
		} catch (er) {
			setErr({ error: true, msg: `Error fetching data ${process.env.REACT_APP_ENV == "dev" ? er.message : ""}` });
		}
	};

	const onUrlChange = base_url => {
		props.history.listen((location, action) => {
			if (location.pathname == paige.route) {
				let new_filter_params = queryString.parse(location.hash);
				if (
					new_filter_params.pe != '~' &&
					new_filter_params.pe != '' &&
					new_filter_params.pe != null
				) {
					setPrd(new_filter_params.pe);
				}
				if (
					new_filter_params.ou != '~' &&
					new_filter_params.ou != '' &&
					new_filter_params.ou != null
				) {
					setOun(new_filter_params.ou);
				}
				if (
					new_filter_params.level != '~' &&
					new_filter_params.level != '' &&
					new_filter_params.level != null
				) {
					setOulvl(new_filter_params.level);
				}
				let new_url = filterUrlConstructor(
					new_filter_params.pe,
					new_filter_params.ou,
					new_filter_params.level,
					base_url
				);
				fetchAcc(new_url);
			}
		});
	};

	useEffect(() => {
		fetchAcc(url);
		onUrlChange(endpoints[0][process.env.REACT_APP_ENV == "dev" ? "local_url" : "url"]);

		return () => {
			console.log(`Acc: aborting requests...`);
			abortRequests.abort();
		};
	}, []);

	let data = {};
	data.theads = [
		'Org. unit',
		'Item',
		'Opening SOH',
		'+ve adj',
		'Qty received',
		'Qty dispensed',
		'-ve adj',
		'Closing SOH',
		"Variance \n (Expected-Actual)",
		'% accounted for'
	];
	data.rows = accdata;
	// console.log('accdata: ', JSON.stringify(accdata))

	return (
		<div className={classes.root}>
			<Toolbar
				className={classes.gridchild}
				title={title}
				pe={prd}
				ou={oun}
				lvl={oulvl}
				filter_params={filter_params}
			/>
			<div className={classes.content}>
				{err.error ? (
					<Message severity="error">{err.msg}</Message>
				) : (
					<Table
						pageTitle={title}
						theads={data.theads}
						rows={data.rows}
						loading={loading}
					/>
				)}
			</div>
		</div>
	);
};

export default Accountability;
