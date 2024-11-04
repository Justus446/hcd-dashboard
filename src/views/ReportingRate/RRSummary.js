import React, { useState, useEffect } from 'react';
import makeStyles from '@material-ui/styles/makeStyles';
import Grid from '@material-ui/core/Grid';
import Message from 'components/Message/Message';
import { filterUrlConstructor, justFetch } from '../../common/utils';
import { programs } from 'hcd-config';
import Toolbar from 'components/Toolbar/Toolbar';
import Line from './components/Line';
import Bar from './components/Bar';
const activProgId = parseFloat(localStorage.getItem('program')) || 1;
const activProg = programs.filter(pr => pr.id == activProgId)[0];
const paige = activProg.pages.filter(ep => ep.id == 'county__reporting_rate_trend')[0];
const endpoints = paige.endpoints;
const periodFilterType = paige.periodFilter;

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

const RRSummary = props => {
    const classes = useStyles();
    let filter_params = queryString.parse(props.location.hash);

    const [prd, setPrd] = useState(filter_params.pe || null);
    const [oun, setOun] = useState(filter_params.ou || null);
    const [loading, setLoading] = useState(true);
    const [oulvl, setOulvl] = useState(null);

    if (
        filter_params.pe == undefined ||
        filter_params.pe == '~' ||
        (filter_params.pe.search(';') <= 0 && periodFilterType == 'range')
    ) {
        filter_params.pe = 'LAST_6_MONTHS';
    }
    const base_rr_url = endpoints.find(
        ep => ep.id == 'county__reporting_rate_trend'
    )[process.env.REACT_APP_ENV == "dev" ? "local_url" : "url"];
    let lv_l = '2'
    if (oun == null || oun == '~' || oun == "HfVjCurKxh2" || filter_params?.ou == '~' || filter_params?.ou == 'HfVjCurKxh2') {
        lv_l = '1'
    }
    let [url, setUrl] = useState(
        filterUrlConstructor(
            'LAST_6_MONTHS',
            filter_params.ou,
            "~",//lv_l,
            base_rr_url
        )
    );
    const base_scrr_url = endpoints.find(
        ep => ep.id == 'county__latest_reporting_rate_subcounty'
    )[process.env.REACT_APP_ENV == "dev" ? "local_url" : "url"];
    let [scurl, setScUrl] = useState(
        filterUrlConstructor('LAST_MONTH', filter_params.ou, '3', base_scrr_url)
    );
    //console.log('Base setScUrl', scurl);
    //console.log('Base RR', base_rr_url);
    //console.log('Base Subcounty RR', base_scrr_url);
    const [rrdata, setRRData] = useState([[]]);
    const [otrrdata, setOTRRData] = useState([[]]);
    const [currdata, setCURRData] = useState([[]]);
    const [period_s, setPeriods] = useState([[]]);
    const [latestScRR, setLatestScRR] = useState([[]]);
    const [ScRRpe, setScRRpe] = useState('');
    const [scrrSubcounties, setScRRsubcs] = useState([[]]);

    const [err, setErr] = useState({ error: false, msg: '' });
    let title = `Reporting Rate: Summary`;

    const updateRRData = (rws, priod, ogu, levl) => {
        setRRData(rws);
        setPeriods(priod);
        // setOun(ogu)
        // setOulvl(levl)
    };

    const updateOTRRData = (rws, priod, ogu, levl) => {
        setOTRRData(rws);
    };

    //community reporting rate
    const updateCURRData = (rws, priod, ogu, levl) => {
        setCURRData(rws);
    };

    const updateLatestSCRR = (rws, priod, ogu, levl) => {
        setLatestScRR(rws);
        setScRRpe(priod);
        setScRRsubcs(ogu);
    };

    let fetchRR = async (rr_url) => {

        // setLoading(true);
        try {
            //rr
            //   fetch(rr_url, { signal: abortRequests.signal })
            return justFetch(rr_url, { signal: abortRequests.signal })
                // .then(ad => ad.json())
                .then(reply => {
                    if (!reply || reply?.fetchedData == undefined || reply?.fetchedData?.error) {
                        let e_rr = {
                            error: true,
                            msg: reply?.fetchedData?.message || '',
                            ...reply
                        }
                        if (e_rr.msg.includes('aborted') || e_rr.msg.includes('NetworkError')) {
                            props.history.go(0)
                        }
                        console.error(rr_url + " : ", reply)
                        return e_rr
                        setErr(e_rr)
                    } else {
                        let rows = reply.fetchedData.rows;
                        //rr
                        let rr_rows = rows.filter(
                            o_dx_rw =>
                                o_dx_rw[0] == reply.fetchedData.metaData.dimensions.dx[0]
                        );
                        // console.log("rr_rows: ", rr_rows.length)

                        //ot_rr
                        let ot_rr_rows = rows.filter(
                            o_dx_rw =>
                                o_dx_rw[0] == reply.fetchedData.metaData.dimensions.dx[1]
                        );

                        //community reporting rate
                        let cu_rr_rows = rows.filter(
                            o_dx_rw =>
                                o_dx_rw[0] == reply.fetchedData.metaData.dimensions.dx[2]
                        );

                        //console.log("ot_rr_rows: ", cu_rr_rows);

                        let theorigdate = [];
                        let minid8 = [];
                        let matched_data = [];

                        //////////////  rr ////////////////
                        rr_rows.map(ydate => {
                            let date8 = ydate[reply.fetchedData.headers.findIndex(jk => jk.name == "pe")];
                            let data8 = ydate[reply.fetchedData.headers.findIndex(jk => jk.name == "value")];
                            theorigdate.push(date8);
                            let ydata = parseFloat(data8).toFixed(2);
                            matched_data.push(ydata);
                            minid8.push(date8);
                        });
                        let xc = 0;
                        let finalRRdata = [];
                        let finalRRmonths = [];
                        let ot_data = [];
                        let rr_data = [];
                        reply.fetchedData.metaData.dimensions.pe.map(o_rr_pe => {
                            rr_rows.map((rw) => {
                                let array1 = rw;
                                if (array1[reply.fetchedData.headers.findIndex(jk => jk.name == "pe")] === o_rr_pe) {
                                    let findata = parseFloat(array1[reply.fetchedData.headers.findIndex(jk => jk.name == "value")]);
                                    let lenudate = array1[reply.fetchedData.headers.findIndex(jk => jk.name == "pe")];
                                    finalRRdata.push(findata);
                                    xc = 0;
                                } else xc = 1;
                            });
                            if (xc === 1) {
                                // finalRRdata.push(0.0);
                                xc = 0;
                            }
                        });
                        reply.fetchedData.metaData.dimensions.pe.map(p_e => {
                            finalRRmonths.push(reply.fetchedData.metaData.items[p_e].name);
                        });
                        //////////////  rr ////////////////

                        ////////////// ontime ////////////////
                        let theorigdate2 = [];
                        let converted_date_arr2 = [];
                        let matched_data2 = [];
                        let ondatarr = [];
                        ot_rr_rows.map(function (ydate2) {
                            let date82 = ydate2[reply.fetchedData.headers.findIndex(jk => jk.name == "pe")];
                            let data82 = ydate2[reply.fetchedData.headers.findIndex(jk => jk.name == "value")];
                            let ondt = parseFloat(ydate2[reply.fetchedData.headers.findIndex(jk => jk.name == "value")]);
                            ondatarr.push(ondt);
                            theorigdate2.push(date82);
                            let ydata2 = parseFloat(data82).toFixed(2);
                            matched_data2.push(ydata2);
                            //UID Fix
                            let nudate2 = date82;
                            //End UID Fix
                            converted_date_arr2.push(nudate2);
                        });

                        let xc1 = 0;
                        let finalondata2 = [];
                        reply.fetchedData.metaData.dimensions.pe.map(o_on_pe => {
                            ot_rr_rows.map(rw => {
                                let array12 = rw;
                                if (array12[reply.fetchedData.headers.findIndex(jk => jk.name == "pe")] === o_on_pe) {
                                    let findata2 = parseFloat(array12[reply.fetchedData.headers.findIndex(jk => jk.name == "value")]);
                                    finalondata2.push(findata2);
                                    xc1 = 0;
                                } else xc1 = 1;
                            });
                            if (xc1 === 1) {
                                // finalondata2.push(0.0);
                                xc1 = 0;
                            }
                        });
                        //////////////end  ontime ////////////////


                        ////////////// Community reporting rate ////////////////
                        let theorigdate3 = [];
                        let converted_date_arr3 = [];
                        let matched_data3 = [];
                        let ondatacu = [];

                        cu_rr_rows.map(function (ydate3) {
                            let date83 = ydate3[reply.fetchedData.headers.findIndex(jk => jk.name == "pe")];
                            let data83 = ydate3[reply.fetchedData.headers.findIndex(jk => jk.name == "value")];
                            let ondt3 = parseFloat(ydate3[reply.fetchedData.headers.findIndex(jk => jk.name == "value")]);
                            ondatacu.push(ondt3);
                            theorigdate3.push(date83);
                            let ydata3 = parseFloat(data83).toFixed(2);
                            matched_data3.push(ydata3);
                            //UID Fix
                            let nudate3 = data83;
                            //End UID Fix
                            converted_date_arr3.push(nudate3);
                        });

                        let xc2 = 0;
                        let finalondata3 = [];
                        reply.fetchedData.metaData.dimensions.pe.map(c_on_pe => {
                            cu_rr_rows.map(rw => {
                                let array13 = rw;
                                if (array13[reply.fetchedData.headers.findIndex(jk => jk.name == "pe")] === c_on_pe) {
                                    let findata3 = parseFloat(array13[reply.fetchedData.headers.findIndex(jk => jk.name == "value")]);
                                    finalondata3.push(findata3);
                                    xc2 = 0;
                                } else xc2 = 1;
                            });
                            if (xc2 === 1) {
                                // finalondata2.push(0.0);
                                xc2 = 0;
                            }
                        });
                        //////////////Community reporting rate ////////////////

                        let o_gu = reply.fetchedData.metaData.dimensions.ou[0];
                        if (filter_params.ou && filter_params.ou != '~') {
                            o_gu = filter_params.ou;
                        } else {
                            o_gu = reply.fetchedData.metaData.dimensions.ou[0];
                        }
                        let dat = {
                            rr: {
                                data: finalRRdata,
                                periods: finalRRmonths,
                                orgs: o_gu
                            },
                            ot: {
                                data: finalondata2,
                                periods: finalRRmonths,
                                orgs: o_gu
                            },
                            cu: {
                                data: finalondata3,
                                periods: finalRRmonths,
                                orgs: o_gu
                            }
                        }
                        return dat
                        updateRRData(finalRRdata, finalRRmonths, o_gu, null);
                        updateOTRRData(finalondata2, finalRRmonths, o_gu, null);
                        // setLoading(false);
                    }
                })
                .catch(err => {
                    if (abortRequests.signal.aborted) { //if(err.name !== "AbortError"){
                        // setLoading(false);
                        // setErr({ error: true, msg: `Error fetching data: ' ${process.env.REACT_APP_ENV == "dev" ? err.message : ""}` });
                        return { error: true, msg: `Error fetching data: ' ${process.env.REACT_APP_ENV == "dev" ? err.message : ""}` }
                    } else {
                        console.log("Cancelling fetchRR requests");
                    }
                });
        } catch (er) {
            setErr({ error: true, msg: 'Error fetching data' });
        }
    };

    let fetchScRR = async (scurl) => {
        // setLoading(true)
        try {
            //rr
            //   fetch(scrr_url, { signal: abortRequests.signal })
            return justFetch(scurl, { signal: abortRequests.signal })
                // .then(ad => ad.json())
                .then(reply => {
                    // console.log('screply: ', JSON.stringify(reply))
                    if (!reply || reply?.fetchedData == undefined || reply?.fetchedData?.error) {
                        let e_rr = {
                            error: true,
                            msg: reply?.fetchedData?.message || '',
                            ...reply
                        }
                        if (e_rr.msg.includes('aborted') || e_rr.msg.includes('NetworkError')) {
                            props.history.go(0)
                        }
                        console.error(scurl + " : ", reply)
                        return e_rr
                        setErr(e_rr);
                    } else {
                        ///////////////////////////////////////////////////////////
                        let subcounties = [];
                        let scrate = [];
                        let subcountyperiod =
                            reply.fetchedData.metaData.items[
                                reply.fetchedData.metaData.dimensions.pe[0]
                            ].name;
                        reply.fetchedData.metaData.dimensions.ou.map(o_u => {
                            subcounties.push(reply.fetchedData.metaData.items[o_u].name);                                                        
                            reply.fetchedData.rows.map(val => {
                                if ((val[2] == o_u || val[1] == o_u) && val[0] === "RRnz4uPHXdl.REPORTING_RATE") {
                                    scrate.push(
                                        parseFloat(val[3])
                                    );
                                }
                            })
                            
                        });
                        ///////////////////////////////////////////////////////////
                        return {
                            data: scrate,
                            period: subcountyperiod,
                            orgs: subcounties
                        }
                        updateLatestSCRR(scrate, subcountyperiod, subcounties, null);
                        setLoading(false);
                    }
                })
                .catch(err => {
                    if (abortRequests.signal.aborted) { //if(err.name !== "AbortError"){
                        // setLoading(false);
                        // setErr({ error: true, msg: `Error fetching data: ' ${process.env.REACT_APP_ENV == "dev" ? err.message : ""}` });
                        return { error: true, msg: `Error fetching data: ' ${process.env.REACT_APP_ENV == "dev" ? err.message : ""}` }
                    } else {
                        console.log("Cancelling fetchScRR requests");
                    }
                });
        } catch (er) {
            // setErr({ error: true, msg: 'Error fetching data' });
            return { error: true, msg: 'Error fetching data' }
        }
    };

    const onUrlChange = (base_url, base_sc_url) => {

    };

    useEffect(() => {
        let mounted = true
        let u_r_l = endpoints[0][process.env.REACT_APP_ENV == "dev" ? "local_url" : "url"]
        let ftch = (r_l, scr_l, nfp) => {
            fetchRR(r_l).then(dta => {
                // console.log('dta: ', dta)
                setLoading(false)
                if (dta?.error && dta?.msg) {
                    setErr(dta)
                } else {
                    updateRRData(dta?.rr?.data, dta?.rr?.periods, dta?.rr?.orgs, null);
                    updateOTRRData(dta?.ot?.data, dta?.ot?.periods, dta?.ot?.orgs, null);
                    updateCURRData(dta?.cu?.data, dta?.cu?.periods, dta?.cu?.orgs, null); //community reporting rate
                }
            }).then(r9t => {
                if (nfp?.ou != '~' && nfp?.ou != 'HfVjCurKxh2' && nfp?.ou != null) {
                    fetchScRR(scr_l).then((dt_a) => {
                        let { data, period, orgs } = dt_a
                        setLoading(false)
                        if (data?.error && data?.msg) {
                            setErr(data)
                        } else {
                            updateLatestSCRR(data, period, orgs, '')
                        }
                    });
                } else {
                    // console.log('HIDE_LATEST:: nfp.ou :: ' + nfp?.ou)
                }
            });
        }
        ftch(url, scurl, filter_params)
        if (mounted) {

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
                    if (new_filter_params.pe && new_filter_params.pe.search(';') <= 0) {
                        new_filter_params.pe = 'LAST_6_MONTHS';
                        setPrd('LAST_6_MONTHS');
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
                    let l_vl = '2'
                    if (oun == null || oun == '~' || oun == "HfVjCurKxh2") {
                        l_vl = '1'
                    }
                    let new_url = filterUrlConstructor(
                        new_filter_params.pe,
                        new_filter_params.ou,
                        "~", //l_vl,
                        base_rr_url
                    );
                    let new_scurl = filterUrlConstructor(
                        'LAST_MONTH',
                        new_filter_params.ou,
                        '3',
                        base_scrr_url
                    );
                    ftch(new_url, new_scurl, new_filter_params);
                }
            });
        }

        return () => {
            mounted = false
            console.log(`RR:Summary aborting requests...`);
            abortRequests.abort();
        };
    }, []);
    // console.group('TREND')
    // console.log('period_s: ', JSON.stringify(period_s))
    // console.log('otrrdata: ', JSON.stringify(otrrdata))
    // console.log('rrdata: ', JSON.stringify(rrdata))

    let trnd = {}
    trnd.pe = period_s
    trnd.ot = otrrdata
    trnd.rr = rrdata
    trnd.cu = currdata

    let ltst = {}
    ltst.sc = scrrSubcounties
    ltst.rate = latestScRR
    ltst.pe = ScRRpe

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
                    <Grid container direction="row" spacing={2}>
                        <Line
                            Periods={trnd.pe}
                            ontimeData={trnd.ot}
                            rrData={trnd.rr}
                            cuData={trnd.cu}
                            OTname={'On-time Facility Reporting rate'}
                            rrname={'Facility Reporting rate'}
                            cuname={activProg.id === 3 ? 'Sub County Reporting Rate': 'Community Reporting Rate'}
                        />
                        {oun == null || oun == '~' || oun == "HfVjCurKxh2" ? <></> : (
                            <Bar
                                scrr_subcounties={ltst.sc}
                                scrr_rate={ltst.rate}
                                scrr_pe={ltst.pe}
                            />
                        )}
                    </Grid>
                )}
            </div>
        </div>
    );
};

export default RRSummary;
