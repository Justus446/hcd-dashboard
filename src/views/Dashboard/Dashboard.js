import React, { useState, useEffect } from 'react';
import makeStyles from '@material-ui/styles/makeStyles';
import Message from 'components/Message/Message';
import Grid from '@material-ui/core/Grid';
import Toolbar from 'components/Toolbar/Toolbar';
import { filterUrlConstructor, justFetch } from 'common/utils';
import Table from 'components/Table/Table';
import ShadedCell from 'components/Table/ShadedCell';
import { MOSbyCommodity } from './components';
import { programs } from 'hcd-config';

const abortRequests = new AbortController();

const activProgId = parseFloat(localStorage.getItem('program')) || 1;
const activProg = programs.filter(pr => pr.id == activProgId)[0];
const prog_thresholds = activProg.thresholds
const paige = activProg.pages.filter(ep => ep.page == 'Dashboard')[0];
const periodFilterType = paige.periodFilter;
const endpoints = paige.endpoints;

const queryString = require('query-string');
const useStyles = makeStyles(theme => ({
    root: {
        padding: theme.spacing(4)
    },
    sstatus: {
        minHeight: '400px'
    }
}));
const Dashboard = props => {
    const classes = useStyles();

    let base_mos_com = endpoints.filter(
        ep => ep.id == 'all__mos_by_commodity'
    )[0][process.env.REACT_APP_ENV == 'dev' ? 'local_url' : 'url'];
    let base_stockstatus = endpoints.filter(
        ep => ep.id == 'all__stock_status'
    )[0][process.env.REACT_APP_ENV == 'dev' ? 'local_url' : 'url'];
    let base_facility_ss = endpoints.filter(
        ep => ep.id == 'all__facilities_stock_status'
    )[0][process.env.REACT_APP_ENV == 'dev' ? 'local_url' : 'url'];
    let base_expected_reports = activProg.endpoints.filter(
        ae => ae.id == 'all__expected_reports'
    )[0][process.env.REACT_APP_ENV == 'dev' ? 'local_url' : 'url'];

    let filter_params = queryString.parse(props.location.hash);

    if (
        filter_params.pe &&
        filter_params.pe.search(';') > 0 &&
        periodFilterType != 'range'
    ) {
        filter_params.pe = 'LAST_MONTH';
    }
    let mos_url = filterUrlConstructor(
        filter_params.pe,
        filter_params.ou,
        filter_params.level,
        base_mos_com
    );
    let ss_url = filterUrlConstructor(
        filter_params.pe,
        filter_params.ou,
        filter_params.level,
        base_stockstatus
    );
    let hfss_url = filterUrlConstructor(
        filter_params.pe,
        filter_params.ou,
        5,
        base_facility_ss
    );
    let hfexp_url = filterUrlConstructor(
        filter_params.pe,
        filter_params.ou,
        null,
        base_expected_reports
    );

    let mnmx = prog_thresholds.national || [9, 18];
    let mnmxy = [0, 24];
    if (filter_params.ou == '~' || filter_params.ou == 'HfVjCurKxh2') {
        mnmx = prog_thresholds.national || [9, 18];
        mnmxy = [0, 24];
    } else {
        mnmx = prog_thresholds.subnational || [3, 6];
        mnmxy = [0, 10];
    }
    const [mosdata, setMOSData] = useState([[]]);
    const [ssdata, setSSData] = useState([['Loading...']]);
    const [hfssdata, setHFSSData] = useState([['Loading...']]);
    const [prd, setPrd] = useState(filter_params.pe);
    const [oun, setOun] = useState(filter_params.ou);
    const [loading, setLoading] = useState(true);
    const [oulvl, setOulvl] = useState(null);
    const [mosLabels, setMOSlabels] = useState([]);
    let [minmax, setMinMax] = useState(mnmx);
    let [yminmax, setyMinMax] = useState(mnmxy);
    const [err, setErr] = useState({ error: false, msg: '' });
    let title = `Overview.`;

    const lgnd = [
        { label: 'Stocked out', class: 'cell-darkred' },
        { label: 'MOS < ' + minmax[0], class: 'cell-red' },
        { label: 'MOS ' + minmax[0] + ' - ' + minmax[1], class: 'cell-green' },
        { label: 'MOS > ' + minmax[1], class: 'cell-amber' }
    ];

    const updateMOSData = (rws, priod, ogu, levl, labels) => {
        setMOSData(rws);
        setPrd(priod);
        // setOun(oun)
        // setOulvl(levl)
        setMOSlabels(labels);
    };

    const updateSSData = (rws, priod, ogu, levl) => {
        setSSData(rws);
    };

    const updateHFSSData = (rws, priod, ogu, levl) => {
        setHFSSData(rws);
    };

    /* ========================================================================
    <MOS_by_commo
    ======================================================================== */
    let fetchMOS = async mos_url => {
        setLoading(true);
        setMOSData([[0, 0, 0, 0, 0, 0, 0, 0]]);
        try {
            justFetch(mos_url, { signal: abortRequests.signal })
                // .then(ad => ad.json())
                .then(reply => {
                    //check if error here
                    let rows_data = [];
                    let alnames = [];
                    reply.fetchedData.metaData.dimensions.dx.map((o_dx, inx) => {
                        let nm_ = reply.fetchedData.metaData.items[o_dx].name
                            .replace('PMI_', '')
                            .replace('MOS', '')
                            .replace('FP_', '')
                            .replace('HIV-', '')
                            .replace('MOH 743 Rev_', '')
                            .replace('MoH 730B', '')
                            .replace('MoS', '')
                            .replace('Rev ', '')
                            .trim();
                        alnames.push(nm_);
                        const rows = reply.fetchedData.rows;
                        if (rows.length > 0) {
                            let dx_rows = rows.filter(o_dx_rw => o_dx_rw[0] == o_dx);
                            if (dx_rows.length > 0) {
                                rows_data.push(parseFloat(dx_rows[0][reply.fetchedData.headers.findIndex(jk => jk.name == "value")]));
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
                    updateMOSData(
                        rows_data,
                        reply.fetchedData.metaData.items[
                            reply.fetchedData.metaData.dimensions.pe[0]
                        ].name,
                        o_gu,
                        null,
                        alnames
                    );

                    setLoading(false);
                })
                .catch(err => {
                    if (abortRequests.signal.aborted) {
                        //if(err.name !== "AbortError"){
                        setLoading(false);
                        setErr({
                            error: true,
                            msg: `Error fetching data: ' ${process.env.REACT_APP_ENV == 'dev' ? err.message : ''
                                }`
                        });
                    } else {
                        console.log('Cancelling fetchMOS requests');
                    }
                });
        } catch (er) {
            setLoading(false);
            setErr({
                error: true,
                msg: `Error fetching data ${process.env.REACT_APP_ENV == 'dev' ? er.message : ''
                    }`
            });
        }
    };

    /* ========================================================================
     <HF StockStatus
     ======================================================================== */
    const fetchHFSS = async (hfss_url, hf_exp_url) => {
        const totalorgs = 0;
        justFetch(hfss_url, { signal: abortRequests.signal })
            .then(dataz => {
                justFetch(hf_exp_url, { signal: abortRequests.signal })
                    .then(totalorgs => {
                        totalorgs = parseInt(totalorgs.fetchedData.rows[0][dataz.fetchedData.headers.findIndex(jk => jk.name == "value")]) || 0;

                        const data = dataz.fetchedData;
                        let orgunits = data.metaData.dimensions.ou;
                        let hfss_rows = [];
                        let countname = 0;
                        // let rheads = []
                        data.metaData.dimensions.dx.map((entry, ky) => {
                            let overstock = 0;
                            let stockok = 0;
                            let understock = 0;
                            let stockout = 0;
                            let hfss_row = [];
                            let nme = data.metaData.items[entry].name;
                            nme = nme
                                .replace('PMI_', '')
                                .replace('MCD_', '')
                                .replace('Adjusted Consumption', '')
                                .replace('MOS', '')
                                .replace('MoS', '')
                                .replace('FP_', '')
                                .replace('HCD - ', '')
                                .replace('Rev ', '')
                                .replace('- HF', '')
                                .replace('MoH 730B', '')
                                .replace('HIV-', '')
                                .replace('MoH 730B', '')
                                .replace('TB/ HIV DRUGS ', '')
                                .replace('MOH 743 Rev_', '')
                                .replace('Revision 2017', '')
                                .replace('MCD_', '')
                                .replace('Medicines for OIs ', '')
                                .replace('MOS', '')
                                .replace('Revision', '')
                                .replace('2016', '')
                                .replace('2017', '')
                                .replace('2018', '')
                                .replace('2019', '')
                                .replace('2020', '')
                                .replace('Paediatric preparations', '')
                                .replace('Adult preparations', '')
                                .replace('MoS', '')
                                .replace('FP_', '')
                                .replace('HIV-', '')
                                .replace('MoS', '')
                                .replace('End of Month Physical Stock Count', '')
                                .replace(', FP', '')
                                .replace('MOH 647_', '')
                                .replace('MOH 743 Rev2020_', '')
                                .replace('Physical Count', '')
                                .replace('Ending Balance', '')
                                .replace('Closing Balance', '')
                                .trim();
                            // if(nme.search('Adjusted Consumption') > 0){
                            // 	rheads.push( nme )
                            // }
                            if (ky < 9) {
                                // hfss_row.push(data.metaData.items[entry].name);
                                //   hfss_row.push(rheads[ky]);
                                hfss_row.push(nme);
                                data.rows.map(rentry => {
                                    let dxid = rentry[0];
                                    let mosval = parseFloat(rentry[data.headers.findIndex(jk => jk.name == "value")]);
                                    if (dxid == entry) {
                                        if (mosval > 6) {
                                            overstock++;
                                        }
                                        if (mosval >= 3 && mosval <= 6) {
                                            stockok++;
                                        }
                                        if (mosval > 0 && mosval < 3) {
                                            understock++;
                                        }
                                        if (mosval <= 0) {
                                            stockout++;
                                        }
                                    }
                                });
                                countname++;
                                let nomos =
                                    totalorgs - (overstock + stockok + understock + stockout);
                                let overpercent = (overstock / totalorgs) * 100;
                                let okpercent = (stockok / totalorgs) * 100;
                                let underpercent = (understock / totalorgs) * 100;
                                let stockoutpercent = (stockout / totalorgs) * 100;
                                let nomospercent = (nomos / totalorgs) * 100;

                                hfss_row.push(
                                    <ShadedCell
                                        classes={'cell-fill cell-amber'}
                                        val={`${parseInt(overstock).toLocaleString("en")} (${overpercent.toFixed(0)}%)`}
                                    />
                                );
                                hfss_row.push(
                                    <ShadedCell
                                        classes={'cell-fill cell-green'}
                                        val={`${parseInt(stockok).toLocaleString("en")} (${okpercent.toFixed(0)}%)`}
                                    />
                                );
                                hfss_row.push(
                                    <ShadedCell
                                        classes={'cell-fill cell-red'}
                                        val={`${parseInt(understock).toLocaleString("en")} (${underpercent.toFixed(0)}%)`}
                                    />
                                );
                                hfss_row.push(
                                    <ShadedCell
                                        classes={'cell-fill cell-darkred'}
                                        val={`${parseInt(stockout).toLocaleString("en")} (${stockoutpercent.toFixed(0)}%)`}
                                    />
                                );
                                hfss_row.push(`${parseInt(nomos).toLocaleString("en")} (${nomospercent.toFixed(0)}%)`);
                                hfss_row.push(parseInt(totalorgs).toLocaleString("en"));
                                hfss_rows.push(hfss_row);
                            }
                        });

                        let o_gu = data.metaData.dimensions.ou[0];
                        if (filter_params.ou && filter_params.ou != '~') {
                            o_gu = filter_params.ou;
                        } else {
                            o_gu = data.metaData.dimensions.ou[0];
                        }
                        updateHFSSData(
                            hfss_rows,
                            data.metaData.items[data.metaData.dimensions.pe[0]].name,
                            o_gu,
                            null
                        );
                    })
                    .catch(err => {
                        if (abortRequests.signal.aborted) {
                            //if(err.name !== "AbortError"){
                            setLoading(false);
                            setErr({
                                error: true,
                                msg: `Error fetching data: ' ${process.env.REACT_APP_ENV == 'dev' ? err.message : ''
                                    }`
                            });
                        } else {
                            console.log('Cancelling fetchHFSS requests');
                        }
                    });
            })
            .catch(err => {
                if (abortRequests.signal.aborted) {
                    //if(err.name !== "AbortError"){
                    setLoading(false);
                    setErr({
                        error: true,
                        msg: `Error fetching data: ' ${process.env.REACT_APP_ENV == 'dev' ? err.message : ''
                            }`
                    });
                } else {
                    console.log('Cancelling fetchHFSS requests');
                }
            });
    };
    /* ========================================================================
     HF StockStatus />
     ======================================================================== */

    let getValue = (arrayy, searchTerm) => {
        let the_val = 0;
        arrayy.map(function (arrayItem) {
            if (searchTerm == arrayItem[0]) {
                the_val = parseFloat(arrayItem[3]);
            }
        });
        return parseFloat(the_val);
    };

    let fetchSStatus = ss_url => {
        setSSData([['Loading...']]);
        justFetch(ss_url, { signal: abortRequests.signal })
            .then(reply => {
                const data = reply.fetchedData;
                let ss_rows = [];
                let phycount = '';
                let adjc = '';
                let mos = '';
                let countercon = 0;
                let thedx = data.metaData.dimensions.dx;

                let itms = Array.from(
                    Object.keys(reply.fetchedData.metaData.items),
                    ky => {
                        return { id: ky, name: reply.fetchedData.metaData.items[ky].name };
                    }
                );
                let lngth = itms.filter(mi => mi.name.toLowerCase().includes('adjusted')).length;

                let rheads = [];
                thedx.map((d_x_, innx) => {
                    let nme_ = reply.fetchedData.metaData.items[d_x_].name;
                    if (nme_.search('MOS') > 0 || nme_.search('MoS') > 0) {
                        rheads.push(
                            nme_
                        );
                    }
                });
                let phy_count_arr = thedx.slice(lngth, lngth * 2);
                let phy_count_arr_vals = [];
                phy_count_arr.map(function (onePhy, inx2) {
                    let onePhy_valArr = reply.fetchedData.rows.find(drw => drw[reply.fetchedData.headers.findIndex(jk => jk.name == "dx")] == onePhy) || [0, 0, 0, 0, 0] //getValue(data.rows, onePhy);
                    let vlu = onePhy_valArr[reply.fetchedData.headers.findIndex(jk => jk.name == "value")] || 0.00
                    phy_count_arr_vals.push(vlu);
                });

                let adj_cons_arr = thedx.slice(lngth * 2, lngth * 3);
                let adj_cons_arr_vals = [];
                adj_cons_arr.map(function (oneAdj, inx) {
                    let oneAdj_valArr = reply.fetchedData.rows.find(drw => drw[reply.fetchedData.headers.findIndex(jk => jk.name == "dx")] == oneAdj) || [0, 0, 0, 0, 0] //getValue(data.rows, oneAdj);
                    let vlu = oneAdj_valArr[reply.fetchedData.headers.findIndex(jk => jk.name == "value")] || 0.00
                    adj_cons_arr_vals.push(vlu);
                });

                let mos_arr = thedx.slice(0, lngth);
                let mos_arr_vals = [];
                mos_arr.map(function (oneMOS, inx0) {
                    let oneMOS_valArr = reply.fetchedData.rows.find(drw => drw[reply.fetchedData.headers.findIndex(jk => jk.name == "dx")] == oneMOS) || [0, 0, 0, 0, 0] //getValue(data.rows, oneMOS);
                    let vlu = oneMOS_valArr[reply.fetchedData.headers.findIndex(jk => jk.name == "value")] || 0.00
                    mos_arr_vals.push(vlu);
                });

                phy_count_arr.map((pca, pcax) => {
                    let trow = []
                    trow.push(
                        reply.fetchedData.metaData.items[pca].name.replace('PMI_', '')
                            .replace('MoH 730B', '')
                            .replace('TB/ HIV DRUGS ', '')
                            .replace('Revision 2017', '')
                            .replace('MCD_', '')
                            .replace('Medicines for OIs ', '')
                            .replace('MOS', '')
                            .replace('MOH 743 Rev_', '')
                            .replace('_', ' ')
                            .replace('MOH', '')
                            .replace('743', '')
                            .replace('647', '')
                            .replace('Rev2020', '')
                            .replace('MoS', '')
                            .replace('FP_', '')
                            .replace('HIV-', '')
                            .replace('MoS', '')
                            .replace(', FP', '')
                            .replace('Revision', '')
                            .replace('Rev ', '')
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
                            .replace('Closing Balance', '')
                            .replace('HCD TB', '')
                            .replace('TB FCDRR ', '')

                            .trim()
                    )
                    let mos = parseFloat(mos_arr_vals[pcax]) || 0.0
                    let moscell = mos;
                    if (mos < minmax[0]) {
                        moscell = (
                            <ShadedCell
                                classes={'cell-fill cell-red'}
                                val={parseFloat(mos.toFixed(1))}
                            />
                        );
                    } else if (mos >= minmax[0] && mos <= minmax[1]) {
                        moscell = (
                            <ShadedCell
                                classes={'cell-fill cell-green'}
                                val={parseFloat(mos.toFixed(1))}
                            />
                        );
                    } else if (mos > minmax[1]) {
                        moscell = (
                            <ShadedCell
                                classes={'cell-fill cell-amber'}
                                val={parseFloat(mos.toFixed(1))}
                            />
                        );
                    }
                    trow.push(
                        parseFloat(adj_cons_arr_vals[pcax]).toLocaleString("en")
                    )
                    trow.push(
                        parseFloat(phy_count_arr_vals[pcax]).toLocaleString("en")
                    )
                    trow.push(moscell)
                    ss_rows.push(
                        trow
                    )
                })

                updateSSData(
                    ss_rows,
                    data.metaData.items[data.metaData.dimensions.pe[0]].name,
                    data.metaData.dimensions.ou[0],
                    null
                );
            })
            .catch(err => {
                if (abortRequests.signal.aborted) {
                    //if(err.name !== "AbortError"){
                    setLoading(false);
                    setErr({
                        error: true,
                        msg: `Error fetching data: ' ${process.env.REACT_APP_ENV == 'dev' ? err.message : ''
                            }`
                    });
                } else {
                    console.log('Cancelled fetchSStatus request');
                }
            });
    };

    const onUrlChange = () => {
        props.history.listen((location, action) => {
            if (location.pathname == paige.route) {
                let new_filter_params = queryString.parse(location.hash);

                //////~~~~~~~~~~~~
                let m_nmx = prog_thresholds.national || [9, 18];
                let m_nmxy = [0, 24];
                if (new_filter_params.ou == '~' || new_filter_params.ou == 'HfVjCurKxh2') {
                    m_nmx = prog_thresholds.national || [9, 18];
                    m_nmxy = [0, 24];
                } else {
                    m_nmx = prog_thresholds.subnational || [3, 6];
                    m_nmxy = [0, 10];
                }
                setMinMax(m_nmx)
                setyMinMax(m_nmxy)
                //////~~~~~~~~~~~~

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

                let new_mos_url = filterUrlConstructor(
                    new_filter_params.pe,
                    new_filter_params.ou,
                    new_filter_params.level,
                    base_mos_com
                );
                fetchMOS(new_mos_url);
                let new_ss_url = filterUrlConstructor(
                    new_filter_params.pe,
                    new_filter_params.ou,
                    new_filter_params.level,
                    base_stockstatus
                );
                fetchSStatus(new_ss_url);
                let new_hfss_url = filterUrlConstructor(
                    new_filter_params.pe,
                    new_filter_params.ou,
                    new_filter_params.level,
                    base_facility_ss
                );
                let new_hfexp_url = filterUrlConstructor(
                    new_filter_params.pe,
                    new_filter_params.ou,
                    '~',
                    base_expected_reports
                );
                fetchHFSS(new_hfss_url, new_hfexp_url);
            }
        });
    };

    useEffect(() => {
        let mounted = true;

        onUrlChange();
        if (mounted) {
            fetchMOS(mos_url);
            fetchSStatus(ss_url);
            fetchHFSS(hfss_url, hfexp_url);
        }

        return () => {
            mounted = false;
            console.log(`Dashboard: aborting requests...`);
            // abortRequests.abort();
        };
    }, []);

    /* ========================================================================
     MOS_by_commo />
     ======================================================================== */

    return (
        <div className={classes.root}>
            <Toolbar
                title={title}
                pe={prd}
                ou={oun}
                lvl={null}
                filter_params={filter_params}
                legends={lgnd}
            />
            <Grid container spacing={4}>
                {err.error ? (
                    <Message severity="error">
                        <b>{err.msg}</b>
                        <br />
                        {JSON.stringify(err)}
                    </Message>
                ) : (
                    <>
                        <Grid item lg={6} md={6} xl={6} xs={12} className={classes.sstatus} style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            <Table
                                pageTitle={`${(activProg.name || "")} Commodities Stock Status`}
                                theads={['Commodity', 'adj. AMC', 'Latest SOH', 'MOS']}
                                rows={ssdata}
                                loading={false}
                            />
                        </Grid>
                        <Grid item lg={6} md={6} xl={6} xs={12}>
                            <MOSbyCommodity
                                minmax={minmax}
                                yminmax={yminmax}
                                prog={activProg}
                                data={mosdata}
                                labels={mosLabels}
                            />
                        </Grid>
                        <Grid item lg={12} md={12} xl={12} xs={12}>
                            <Table
                                pageTitle={`${(activProg.name || "")} Health Facility Stock Status (%)`}
                                theads={[
                                    'Commodity',
                                    'Overstocked',
                                    'Stock OK',
                                    'Understocked',
                                    'Stocked Out',
                                    'No Data',
                                    'Total'
                                ]}
                                rows={hfssdata}
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
