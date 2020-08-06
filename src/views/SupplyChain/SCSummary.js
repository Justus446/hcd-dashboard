import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/styles';
import { Typography } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import {
  filterUrlConstructor,
  getValidOUs,
  justFetch
} from '../../common/utils';
import { programs } from 'hcd-config';
import Toolbar from 'components/Toolbar/Toolbar';
import HFTable from './components/Table/SCTable';
import { isArray } from 'validate.js';

const activProgId = parseFloat(localStorage.getItem('program')) || 1;
const activProg = programs.filter(pr => pr.id == activProgId)[0];
const paige = activProg.pages.filter(ep => ep.name == 'Indicator Summary')[0];
const periodFilterType = paige.periodFilter || null;
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

const SCSummary = props => {
  const classes = useStyles();

  let filter_params = queryString.parse(props.location.hash);
  if (
    filter_params.pe &&
	filter_params.pe.search(';') > 0 
	// && periodFilterType != 'range'
  ) {
    filter_params.pe = 'LAST_MONTH';
  }
  let [url, setUrl] = useState(
    filterUrlConstructor(
      filter_params.pe,
      filter_params.ou,
	  "5",//filter_params.level,
      endpoints[0].local_url
    )
  );
  const [scsummdata, setScSummdata] = useState([['Loading...']]);
  const [prd, setPrd] = useState(null);
  const [validOUs, setValidOUs] = useState(
    JSON.parse(localStorage.getItem('validOUs'))
  );
  const [oun, setOun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [oulvl, setOulvl] = useState(null);
  const [err, setErr] = useState({ error: false, msg: '' });
  let title = `Supply Chain Performance Summary`;

  const updateData = (rws, priod, ogu, levl) => {
    setScSummdata(rws);
    // setPrd(priod)
    // setOun(ogu)
	// setOulvl(levl)
  };


  	/////////////// CUSTOM FXNs ///////////////////
  	const getExpectedUnits = async (ou_, pe_) => {
		let ur_l = `${process.env.REACT_APP_APP_BASE_URL}/api/common/expected-reports/${ou_}/~/${pe_}`
		
		try {
			return justFetch(ur_l, { signal: abortRequests.signal })
				.then(reply => {
					if (reply.fetchedData.error) {
						setErr({ error: true, msg: reply.fetchedData.message, ...reply.fetchedData });
						console.log("Error fetching expected reports", reply.fetchedData);
						return 0
					} else {
						let count = parseInt(reply.fetchedData.rows[0][3]);
						return count
					}
				})
		} catch (er) {
			setErr({ error: true, msg: 'Error fetching expected reports', ...er });
			console.log("Error fetching expected reports", er);
			return 0
		}
	}
	//\\\\\\\\\\\\\\ CUSTOM FXNs \\\\\\\\\\\\\\\\\\\

  let fetchHFUnder = async the_url => {
	setLoading(true);
	setErr({ error: false, msg: '' });
    setScSummdata([['Loading...']]);
    try {
		justFetch(the_url, { signal: abortRequests.signal })
			.then(reply => {
				setLoading(false)
				getExpectedUnits(filter_params.ou, filter_params.pe).then( (expectedUnitsNo)=>{
					if (reply.fetchedData.error) {
						setErr({
						error: true,
						msg: reply.fetchedData.message,
						...reply.fetchedData
						});
					} else {
						setErr({ error: false, msg: '' });
						/// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
						/// ~~~~~~~~~~~~~~~~~~~~~~ <SUCCESS ~~~~~~~~~~~~~~~~~~~~~~~~~~
						/// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
						let tableData = [];
						reply.fetchedData.metaData.dimensions.dx.map( entry => {
							if( entry.includes("REPORTING_RATE") && !entry.includes("REPORTING_RATE_ON_TIME") ) {
								let rratecount = 0;
								let rrate = 0; 
								reply.fetchedData.rows.map( rentry => {
										let dxid = rentry[0];
										let rrval = parseFloat(rentry[3]);

										if(dxid==entry) {
											rratecount++;	
											rrate = rrate+rrval;
										}					
								})	
								let acceptable=90;
								let target=95;
								// let rrate=(rrate);
								
								let rrpercent = (rratecount/expectedUnitsNo)*100;
								let bgc = 'cell-white';
								if(rrpercent>=acceptable){
									if(rrpercent >= target){
										bgc  = 'cell-green';
									}else{
										bgc  = 'cell-amber';
									}
								}else{
									bgc = 'cell-red';
								}

								let trow = [];
								trow.push("Reporting Rate");
								trow.push(reply.fetchedData.metaData.items[entry].name);
								trow.push(rratecount);
								trow.push(expectedUnitsNo);
								let n_cell = (
									<>
										{rrpercent.toFixed(1)}%
										<span className={"cell-fill fcblack "+bgc} aria-hidden="true" tabIndex="-1"> &nbsp;
										</span>
									</>
								);
								trow.push(n_cell);
								trow.push(target);
								trow.push(acceptable);
								tableData.push(trow)	
							}
								
							if(entry.includes("REPORTING_RATE_ON_TIME")) { 
								let rratecount = 0;
								let rrate = 0;
								
								reply.fetchedData.rows.map( rentry => {
										let dxid = rentry[0];
										let rrval = parseFloat(rentry[3]);

										if(dxid==entry) {
											rratecount++;	
											rrate = rrate+rrval;
										}					
								})	
								let acceptable=90;
								let target=95;
								// let rrate=(rrate);
								
								let rrpercent = (rratecount/expectedUnitsNo)*100;

								let bgc = 'cell-white';
								if(rrpercent>=acceptable){
									if(rrpercent >= target){
										bgc  = 'cell-green';
									}else{
										bgc  = 'cell-amber';
									}
								}else{
									bgc = 'cell-red';
								}

								let trow = [];
								trow.push("On Time Reporting - Anti Malarials");
								trow.push(reply.fetchedData.metaData.items[entry].name);
								trow.push(rratecount);
								trow.push(expectedUnitsNo);
								let n_cell = (
									<>
										{rrpercent.toFixed(1)}%
										<span className={"cell-fill fcblack "+bgc} aria-hidden="true" tabIndex="-1"> &nbsp;
										</span>
									</>
								);
								trow.push(n_cell);
								trow.push(target);
								trow.push(acceptable);
								tableData.push(trow)	
							}
							
							if( !entry.includes("REPORTING_RATE") && !entry.includes("REPORTING_RATE_ON_TIME") ) {
								
								let stockok = 0;

								reply.fetchedData.rows.map( rentry => {
									let dxid = rentry[0];
									let mosval = parseFloat(rentry[3]);

									if(dxid==entry) {
										if(mosval>=3 && mosval<=6) {
											stockok++;
										}						
									}					
								})	
								let acceptable=70;
								let target=90;
								// let stockok=(stockok);
								// let org=(reply.fetchedData.metaData.dimensions.ou.length);
								let okpercent = (stockok/expectedUnitsNo)*100;

								let bgc = 'cell-white';
								if(okpercent>=acceptable){
									if(okpercent >= target){
										bgc  = 'cell-green';
									}else{
										bgc  = 'cell-amber';
									}
								}else{
									bgc = 'cell-red';
								}

								let trow = [];
								trow.push("HFs stocked according to plan");
								trow.push(reply.fetchedData.metaData.items[entry].name);
								trow.push(stockok);
								trow.push(expectedUnitsNo);
								let n_cell = (
									<>
										{okpercent.toFixed(1)}%
										<span className={"cell-fill fcblack "+bgc} aria-hidden="true" tabIndex="-1"> &nbsp;
										</span>
									</>
								);
								trow.push(n_cell);
								trow.push(target);
								trow.push(acceptable);
								tableData.push(trow)	
							}
							
							if( !entry.includes("REPORTING_RATE") && !entry.includes("REPORTING_RATE_ON_TIME") ) {
								
								let overstock = 0;								
								reply.fetchedData.rows.map( rentry => {	
									let dxid = rentry[0];
									let mosval = parseFloat(rentry[3]);
									
									if(dxid==entry){
										
										if(mosval>6){
											overstock++;
										}										
									}					
								})	
								let acceptable = 15;
								let target = 5;
								// let overOrg=(reply.fetchedData.metaData.dimensions.ou.length);
								// let overstock = (overstock);			
								let overpercent = (overstock/expectedUnitsNo)*100;

								let bgc = 'cell-white';
								if(overpercent<=acceptable){
									if(overpercent<target){
										bgc  = 'cell-green';
									}else{
										bgc  = 'cell-amber';
									}
								}else{
									bgc = 'cell-red';
								}

								let trow = [];
								trow.push("HFs over-stocked");
								trow.push(reply.fetchedData.metaData.items[entry].name);
								trow.push(overstock);
								trow.push(expectedUnitsNo);
								let n_cell = (
									<>
										{overpercent.toFixed(1)}%
										<span className={"cell-fill fcblack "+bgc} aria-hidden="true" tabIndex="-1"> &nbsp;
										</span>
									</>
								);
								trow.push(n_cell);
								trow.push(target);
								trow.push(acceptable);
								tableData.push(trow)
							}
							
							if( !entry.includes("REPORTING_RATE") && !entry.includes("REPORTING_RATE_ON_TIME") ) {
								let understock = 0;
								
								reply.fetchedData.rows.map( rentry => {	
									let dxid = rentry[0];
									let mosval = parseFloat(rentry[3]);
									if(dxid==entry){
										if(mosval>0 && mosval<3){
											understock++;
										}						
									}					
								})	
								let acceptable = 15;
								let target = 5;
								// let understock=(understock);
								// let org=(reply.fetchedData.metaData.dimensions.ou.length);
								let underpercent = (understock/expectedUnitsNo)*100;
									
								let bgc = 'cell-white';
								if(underpercent<=acceptable){
									if(underpercent<target){
										bgc  = 'cell-green';
									}else{
										bgc  = 'cell-amber';
									}
								}else{
									bgc = 'cell-red';
								}

								let trow = [];
								trow.push("HFs under-stocked");
								trow.push(reply.fetchedData.metaData.items[entry].name);
								trow.push(understock);
								trow.push(expectedUnitsNo);
								let n_cell = (
									<>
										{underpercent.toFixed(1)}%
										<span className={"cell-fill fcblack "+bgc} aria-hidden="true" tabIndex="-1"> &nbsp;
										</span>
									</>
								);
								trow.push(n_cell);
								trow.push(target);
								trow.push(acceptable);
								tableData.push(trow)
							}
							
							if( !entry.includes("REPORTING_RATE") && !entry.includes("REPORTING_RATE_ON_TIME") ) {
								let stockout = 0;
								reply.fetchedData.rows.map( rentry => {	
									let dxid = rentry[0];
									let mosval = parseFloat(rentry[3]);
									if(dxid==entry) {
										if(mosval==0){
											stockout++;
										}						
									}					
								})	
								let acceptable=10;
								let target = 0;
								// let stockout=(stockout);
								// let org=(reply.fetchedData.metaData.dimensions.ou.length);
								let stockoutpercent = (stockout/expectedUnitsNo)*100;
								
								let bgc = 'cell-white';
								if(stockoutpercent<=acceptable){
									if(stockoutpercent<target){
										bgc  = 'cell-green';
									}else{
										bgc  = 'cell-amber';
									}
								}else{
									bgc = 'cell-red';
								}
																							
								let trow = [];
								trow.push("HFs with a stock out");
								trow.push(reply.fetchedData.metaData.items[entry].name);
								trow.push(stockout);
								trow.push(expectedUnitsNo);
								let n_cell = (
									<>
										{stockoutpercent.toFixed(1)}%
										<span className={"cell-fill fcblack "+bgc} aria-hidden="true" tabIndex="-1"> &nbsp;
										</span>
									</>
								);
								trow.push(n_cell);
								trow.push(target);
								trow.push(acceptable);
								tableData.push(trow)
							}
						})
						updateData(
							tableData, 
							reply.fetchedData.metaData.items[reply.fetchedData.metaData.dimensions.pe[0]].name || filter_params.pe, 
							reply.fetchedData.metaData.items[reply.fetchedData.metaData.dimensions.ou[0]].name || filter_params.ou, 
							filter_params.level || "~")
					}
					// updateData( tableData, reply.fetchedData.metaData.items[ reply.fetchedData.metaData.dimensions.pe[0] ].name || prd, o_gu, oulvl );
					/// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
					/// ~~~~~~~~~~~~~~~~~~~~~~ SUCCESS/> ~~~~~~~~~~~~~~~~~~~~~~~~~~
					/// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
				//   }
					setLoading(false);
				})
			})
			.catch(err => {
				setLoading(false);
				setErr({ error: true, msg: 'Error fetching data', ...err });
			})
    } catch (er) {
      setErr({ error: true, msg: 'Error fetching data', ...er });
    }
  };

  const onUrlChange = base_url => {
    props.history.listen((location, action) => {
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
      fetchHFUnder(new_url);
    });
  };

  useEffect(() => {
    fetchHFUnder(url);
    onUrlChange(endpoints[0].local_url);
    getValidOUs().then(vo => {
      let vFlS = JSON.parse(localStorage.getItem('validOUs'));
      if (vFlS && vFlS.length < 1) {
        setValidOUs(vo);
        // localStorage.removeItem('validOUs')
        // console.log("refetching validOUs with getValidOUs")
        // localStorage.setItem('validOUs', JSON.stringify(vo))
      }
    });

    return () => {
      console.log(`SCP:Summary: aborting requests...`);
      abortRequests.abort();
    };
  }, []);

  let data = {};
	data.theads = [ 
		'Parameter',
		'Commodity',
		'Numerator',
		'Denominator',
		'Result',
		'Target',
		'Acceptable'
	];
  data.rows = scsummdata;

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
          <Alert severity="error">{err.msg}</Alert>
        ) : (
          <HFTable
            pageTitle={title}
            theads={data.theads}
            rows={data.rows}
            loading={loading.toString()}
		  />
        )}
      </div>
    </div>
  );
};

export default SCSummary;
