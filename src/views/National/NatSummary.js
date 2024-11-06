import React, { useState, useEffect } from 'react';
import makeStyles from '@material-ui/styles/makeStyles';
import Message from 'components/Message/Message';
import Grid from '@material-ui/core/Grid';
import Toolbar from 'components/Toolbar/Toolbar';
import { filterUrlConstructor, justFetch } from 'common/utils';
import { NatSummaryGraph } from './components';
import { programs } from 'hcd-config';
import Table from 'components/Table/Table';

const abortRequests = new AbortController();

const activProgId = parseFloat(localStorage.getItem('program')) || 1;

const activProg = programs.filter(pr => pr.id == activProgId)[0];

const paige = activProg.pages.filter(ep => ep.page == 'National Stocks')[0];
const periodFilterType = paige.periodFilter;
const endpoints = paige.endpoints;

const queryString = require('query-string');
const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(4)
  },
  sstatus: {
    height: '400px'
  }
}));

const Dashboard = props => {
  const classes = useStyles();

  let base_url_facility = endpoints.filter(
    ep => ep.id == 'national__summary_facility_mos'
  )[0][process.env.REACT_APP_ENV == "dev" ? "local_url": "url"];
  let base_url_kemsamos = endpoints.filter(
    ep => ep.id == 'national__summary_kemsa_mos'
  )[0][process.env.REACT_APP_ENV == "dev" ? "local_url": "url"];
  let base_url_pending = endpoints.filter(
    ep => ep.id == 'national__summary_pending_mos'
  )[0][process.env.REACT_APP_ENV == "dev" ? "local_url": "url"];
  let base_kemsa_url = endpoints.filter(
    ep => ep.id == 'national__kemsa_summary'
  )[0][process.env.REACT_APP_ENV == "dev" ? "local_url": "url"];

  let filter_params = queryString.parse(props.location.hash);
  if(filter_params.pe && filter_params.pe.search(';')>0 && periodFilterType != "range"){
	filter_params.pe = 'LAST_MONTH'
  }
  filter_params.ou = "~"
  let summ_url_facility = filterUrlConstructor(
    filter_params.pe,
    filter_params.ou,
    filter_params.level,
    base_url_facility
  );
  let summ_url_kemsa = filterUrlConstructor(
    filter_params.pe,
    filter_params.ou,
    filter_params.level,
    base_url_kemsamos
  );
  let summ_url_pending = filterUrlConstructor(
    filter_params.pe,
    filter_params.ou,
    filter_params.level,
    base_url_pending
  );
  let kemsa_url = filterUrlConstructor(
    filter_params.pe,
    filter_params.ou,
    filter_params.level,
    base_kemsa_url
  );
  const [facilityMOSdata, setFacilityMOSdata] = useState([[]]);
  const [kemsaMOSdata, setKEMSAMOSdata] = useState([[]]);
  const [pendingMOSdata, setPendingMOSdata] = useState([[]]);

  const [kemsaSUMMARYdata, setKEMSAsummaryData] = useState([['Loading...']]);
  const [prd, setPrd] = useState(filter_params.pe);
  const [oun, setOun] = useState(filter_params.ou);
  const [loading, setLoading] = useState(true);
  const [oulvl, setOulvl] = useState(null);
  const [xlabels, setLabels] = useState([]);
  let [minmax, setMinMax] = useState([9, 18]);
  let [yminmax, setyMinMax] = useState([0, 24]);
  const [err, setErr] = useState({ error: false, msg: '' });
  let title = `National Summary`;

  const updateFacilityMOSdata = (rws, priod, ogu, levl) => {
    setFacilityMOSdata(rws);
    setPrd(priod);
    // setOun(oun)
    // setOulvl(levl)
  };
  const updateKEMSAMOSdata = (rws, priod, ogu, levl, labels) => {
	setKEMSAMOSdata(rws);
	setLabels(labels)
  };
  const updatePendingMOSdata = (rws, priod, ogu, levl) => {
    setPendingMOSdata(rws);
  };

  const updateKEMSAsummaryData = (rws, priod, ogu, levl) => {
    setKEMSAsummaryData(rws);
  };

  let fetchMOSsummary = async (
    summ_url_facility,
    summ_url_kemsa,
    summ_url_pending
  ) => {
    setLoading(true);
    try {
    //   fetch(summ_url_facility, { signal: abortRequests.signal })
      justFetch(summ_url_facility, { signal: abortRequests.signal })
        // .then(ad => ad.json())
        .then(reply => {
          if (reply.fetchedData == undefined || reply.fetchedData?.error) {
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
            let rows_data = [];
            reply.fetchedData.metaData.dimensions.dx.map((o_dx, inx) => {
              const rows = reply.fetchedData.rows;
              if (rows.length > 0) {
                let dx_rows = rows.filter(o_dx_rw => o_dx_rw[0] == o_dx);

                if (dx_rows.length > 0) {
                  rows_data.push(parseFloat(dx_rows[0][3]));
                } else {
                  rows_data.push(0);
                }
              }
            });

            let o_gu = reply.fetchedData.metaData.dimensions.ou[0];
            if (filter_params.ou && filter_params.ou != '~') {
              o_gu = filter_params.ou;
            } else {
              o_gu = reply.fetchedData.metaData.dimensions.ou[0];
            }
            updateFacilityMOSdata(
              rows_data,
              reply.fetchedData.metaData.items[
                reply.fetchedData.metaData.dimensions.pe[0]
              ].name,
              o_gu,
              null
            );
            setLoading(false);
          }
        })
        //kemsa
        .then(() => {
        //   fetch(summ_url_kemsa, { signal: abortRequests.signal })
          justFetch(summ_url_kemsa, { signal: abortRequests.signal })
            // .then(ad => ad.json())
            .then(reply => {
              if (reply.fetchedData == undefined || reply.fetchedData?.error) {
                setErr({
                  error: true,
                  msg: reply?.fetchedData?.message || '',
                  ...reply
                });
              } else {
				let rows_data = [];
				let labels = []
                reply.fetchedData.metaData.dimensions.dx.map((o_dx, inx) => {
				  const rows = reply.fetchedData.rows;
				  labels.push(reply.fetchedData.metaData.items[o_dx].name.replace('PMI_','').replace('MOS','').replace('MoS','').replace('Stock','').replace('HIV-','').trim())
                  if (rows.length > 0) {
                    let dx_rows = rows.filter(o_dx_rw => o_dx_rw[0] == o_dx);
                    if (dx_rows.length > 0) {
                      rows_data.push(parseFloat(dx_rows[0][3]));
                    } else {
                      rows_data.push(0);
                    }
                  }
                });
                let o_gu = reply.fetchedData.metaData.dimensions.ou[0];
                if (filter_params.ou && filter_params.ou != '~') {
                  o_gu = filter_params.ou;
                } else {
                  o_gu = reply.fetchedData.metaData.dimensions.ou[0];
                }
                updateKEMSAMOSdata(
                  rows_data,
                  reply.fetchedData.metaData.items[
                    reply.fetchedData.metaData.dimensions.pe[0]
                  ].name,
                  o_gu,
				  null,
				  labels
                );
                setLoading(false);
              }
            })
            .catch(err => {
				if(abortRequests.signal.aborted){ //if(err.name !== "AbortError"){
					setLoading(false);
					setErr({ error: true, msg: `Error fetching data: ' ${process .env.REACT_APP_ENV == "dev" ? err.message : ""}` });
				}else{
					console.log("Cancelling kemsa summary requests");
				}
            });
        })
        //pending
        .then(() => {
          justFetch(summ_url_pending, { signal: abortRequests.signal })
        //   fetch(summ_url_pending, { signal: abortRequests.signal })
            // .then(ad => ad.json())
            .then(reply => {
              if (reply.fetchedData == undefined || reply.fetchedData?.error) {
                setErr({
                  error: true,
                  msg: reply?.fetchedData?.message || '',
                  ...reply
                });
              } else {
                let rows_data = [];
                reply.fetchedData.metaData.dimensions.dx.map((o_dx, inx) => {
                  const rows = reply.fetchedData.rows;
                  if (rows.length > 0) {
                    let dx_rows = rows.filter(o_dx_rw => o_dx_rw[0] == o_dx);

                    if (dx_rows.length > 0) {
                      rows_data.push(parseFloat(dx_rows[0][3]));
                    } else {
                      rows_data.push(0);
                    }
                  }
                });

                let o_gu = reply.fetchedData.metaData.dimensions.ou[0];
                if (filter_params.ou && filter_params.ou != '~') {
                  o_gu = filter_params.ou;
                } else {
                  o_gu = reply.fetchedData.metaData.dimensions.ou[0];
                }
                updatePendingMOSdata(
                  rows_data,
                  reply.fetchedData.metaData.items[
                    reply.fetchedData.metaData.dimensions.pe[0]
                  ].name,
                  o_gu,
                  null
                );
                setLoading(false);
              }
            })
            .catch(err => {
				if(abortRequests.signal.aborted){ //if(err.name !== "AbortError"){
					setLoading(false);
					setErr({ error: true, msg: `Error fetching data: ' ${process .env.REACT_APP_ENV == "dev" ? err.message : ""}` });
				}else{
					console.log("Cancelling kemsa pending requests");
				}
            });
        })
        .catch(err => {
			if(abortRequests.signal.aborted){ //if(err.name !== "AbortError"){
				setLoading(false);
				setErr({ error: true, msg: `Error fetching data: ' ${process .env.REACT_APP_ENV == "dev" ? err.message : ""}` });
			}else{
				console.log("Cancelling fetchMOSsummary requests");
			}
        });
    } catch (er) {
      setErr({ error: true, msg: 'Error fetching data' });
    }
  };

  let fetchKEMSAsummaryData = kemsa_url => {
    setKEMSAsummaryData([['Loading...']]);
    justFetch(kemsa_url, { signal: abortRequests.signal })
      .then(reply => {
        const data = reply.fetchedData;
        // ========================
        //products to be displayed

        const d_x = data.metaData.dimensions.dx;
		let rheads = [];
		
		let productids = []; d_x.map(x_=>{if(reply.fetchedData.metaData.items[x_].name.search('Pending')>0){productids.push(x_.split('.')[0])}})

		let opsoh_dxs = []; d_x.map(x_=>{if(reply.fetchedData.metaData.items[x_].name.search('eginning')>0 || reply.fetchedData.metaData.items[x_].name.search('pening')>0){opsoh_dxs.push(x_)}});

		let revd_dxs = []; d_x.map(x_=>{if(reply.fetchedData.metaData.items[x_].name.search('eceipts')>0 || reply.fetchedData.metaData.items[x_].name.search('eceived')>0){revd_dxs.push(x_)}});
		
		let issued_dxs = []; d_x.map(x_=>{if(reply.fetchedData.metaData.items[x_].name.search('Issues')>0 || reply.fetchedData.metaData.items[x_].name.search('Issued')>0){issued_dxs.push(x_)}});
		
		let phyclos_dxs = []; d_x.map(x_=>{if(reply.fetchedData.metaData.items[x_].name.search('Closing')>0 || reply.fetchedData.metaData.items[x_].name.search('hysical')>0){phyclos_dxs.push(x_)}});
		
		let pending_dxs = []; d_x.map(x_=>{if(reply.fetchedData.metaData.items[x_].name.search('pending')>0 || reply.fetchedData.metaData.items[x_].name.search('Pending')>0){pending_dxs.push(x_)}});



        d_x.map(o_d_x => {
		  let nme = reply.fetchedData.metaData.items[o_d_x].name;
		//   console.log('DX: '+o_d_x+' => '+reply.fetchedData.metaData.items[o_d_x].name);
          if (nme.search(' Physical count') > 0) {
            nme = nme
              .replace('PMI_', '')
              .replace('MCD_', '')
              .replace('HIV-', '')
              .replace(' Physical count', '')
              .replace(' End of Month', '')
              .replace('KEMSA ', '')
              .replace('KEMSA_TB','')
              .trim();
            rheads.push(nme);
          }
        });
		
		let kemsa_rows = [];
        productids.map( (pr_id, index) => {
			let table_row = [];
			table_row.push(rheads[index]);

			//opsoh
			let opsoh_dx = opsoh_dxs.find(dx_=>dx_.split('.')[0] == pr_id)
			let v_al = 0; let v_al_arr = data.rows.filter( dr=>dr[0]== opsoh_dx ) 
			if(v_al_arr.length>0){ v_al = v_al_arr[0][3] }
			table_row.push(v_al)

			//recpts
			let revd_dx = revd_dxs.find(dx_=>dx_.split('.')[0] == pr_id)
			let v_al2 = 0; let v_al2_arr = data.rows.filter( dr=>dr[0]== revd_dx )
			if(v_al2_arr.length>0){ v_al2 = v_al2_arr[0][3] }
			table_row.push(v_al2)

			//issues
			let issued_dx = issued_dxs.find(dx_=>dx_.split('.')[0] == pr_id)
			let v_al3 = 0; let v_al3_arr = data.rows.filter( dr=>dr[0]== issued_dx )
			if(v_al3_arr.length>0){ v_al3 = v_al3_arr[0][3] }
			table_row.push(v_al3)

			//closbal
			let phyclos_dx = phyclos_dxs.find(dx_=>dx_.split('.')[0] == pr_id)
			let v_al4 = 0; let v_al4_arr = data.rows.filter( dr=>dr[0]== phyclos_dx )
			if(v_al4_arr.length>0){ v_al4 = v_al4_arr[0][3] }
			table_row.push(v_al4)

			//pending
			let pending_dx = pending_dxs.find(dx_=>dx_.split('.')[0] == pr_id)
			let v_al5 = 0; let v_al5_arr = data.rows.filter( dr=>dr[0]== pending_dx )
			if(v_al5_arr.length>0){ v_al5 = v_al5_arr[0][3] }
			table_row.push(v_al5)

          	kemsa_rows.push(table_row);
        });
		// ========================
		

        updateKEMSAsummaryData(
          kemsa_rows,
          data.metaData.items[data.metaData.dimensions.pe[0]].name,
          data.metaData.dimensions.ou[0],
          null
        );
      })
      .catch(err => {
        if(abortRequests.signal.aborted){ //if(err.name !== "AbortError"){
			setLoading(false);
			setErr({ error: true, msg: `Error fetching data: ' ${process .env.REACT_APP_ENV == "dev" ? err.message : ""}` });
		}else{
			console.log("Cancelling fetchKEMSAsummary requests");
		}
      });
  };

  const onUrlChange = () => {
    props.history.listen((location, action) => {
		if(location.pathname == paige.route){
			let new_filter_params = queryString.parse(location.hash);
      new_filter_params.ou = "~"
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
			let new_summ_url_facility = filterUrlConstructor(
				new_filter_params.pe,
				new_filter_params.ou,
				new_filter_params.level,
				base_url_facility
			);
			let new_summ_url_kemsa = filterUrlConstructor(
				new_filter_params.pe,
				new_filter_params.ou,
				new_filter_params.level,
				base_url_kemsamos
			);
			let new_summ_url_pending = filterUrlConstructor(
				new_filter_params.pe,
				new_filter_params.ou,
				new_filter_params.level,
				base_url_pending
			);
			fetchMOSsummary(
				new_summ_url_facility,
				new_summ_url_kemsa,
				new_summ_url_pending
			);

			let new_kemsa_url = filterUrlConstructor(
				new_filter_params.pe,
				new_filter_params.ou,
				new_filter_params.level,
				base_kemsa_url
			);
			fetchKEMSAsummaryData(new_kemsa_url);
		}
    });
  };

  useEffect(() => {
    let mounted = true
    if(mounted){
      fetchMOSsummary(summ_url_facility, summ_url_kemsa, summ_url_pending);
      fetchKEMSAsummaryData(kemsa_url);
      onUrlChange();
    }

    return () => {
      mounted = false
      console.log(`NatSum aborting requests...`);
      abortRequests.abort();
    };
  }, []);

  return (
    <div className={classes.root}>
      <Toolbar
        title={title}
        pe={prd}
        ou={oun}
        lvl={null}
        filter_params={filter_params}
      />
      <Grid container spacing={4}>
        {err.error ? (
          <Message severity="error">{err.msg}</Message>
        ) : (
          <>

            <Grid
              item
              lg={12}
              md={12}
              xl={12}
              xs={12}
              justify="center"
              container>
              <Grid item lg={9} md={9} xl={9} xs={12}>
                <NatSummaryGraph
                  data={{
                    pending: pendingMOSdata,
                    kemsa: kemsaMOSdata,
                    facility: facilityMOSdata
				  }}
				  labels={xlabels}
                />
              </Grid>
            </Grid>
            <br />
            <Grid item lg={12} md={12} xl={12} xs={12}>
              <Table
                pageTitle={`KEMSA Stock Summary`}
                theads={[
                  'Commodity',
                  'Opening SOH',
                  'Total Receipts',
                  'Total Issues',
                  'Closing SOH',
                  'Pending Stock'
                ]}
                rows={kemsaSUMMARYdata}
                loading={false}
              />
            </Grid>
          </>
        )}
      </Grid>
    </div>
  );
};

export default Dashboard;
