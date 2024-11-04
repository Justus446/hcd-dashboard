import React, { useState, useEffect } from 'react';
import makeStyles from '@material-ui/styles/makeStyles';
import Message from 'components/Message/Message';
import {
    filterUrlConstructor,
    getValidOUs,
    justFetch,
    isArray
} from '../../common/utils';
import { programs } from 'hcd-config';
import Toolbar from 'components/Toolbar/Toolbar';
import Table from 'components/Table/Table';
import ShadedCell from 'components/Table/ShadedCell';

const activProgId = parseFloat(localStorage.getItem('program')) || 1;
const activProg = programs.filter(pr => pr.id == activProgId)[0];
const paige = activProg.pages.filter(ep => ep.page == 'Issues vs Receipts')[0];
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

const IssuesReceipts = props => {
    const classes = useStyles();

    let filter_params = queryString.parse(props.location.hash);
    if (
        filter_params.pe &&
        filter_params.pe.search(';') > 0
        // && periodFilterType != 'range'
    ) {
        filter_params.pe = 'LAST_3_MONTHS';
    }
    let [url, setUrl] = useState(
        filterUrlConstructor(
            filter_params.pe,
            filter_params.ou,
            filter_params.level,
            endpoints[0][process.env.REACT_APP_ENV == "dev" ? "local_url" : "url"]
        )
    );
    const [irdata, setIRdata] = useState([['Loading...']]);
    const [prd, setPrd] = useState(null);
    const [validOUs, setValidOUs] = useState(
        JSON.parse(localStorage.getItem('validOUs'))
    );
    const [oun, setOun] = useState(null);
    const [mnths, setMnths] = useState([])
    const [loading, setLoading] = useState(true);
    const [oulvl, setOulvl] = useState(null);
    const [err, setErr] = useState({ error: false, msg: '' });
    let title = `Issues vs Receipts`;

    const updateData = (rws, priod, ogu, levl, peri) => {
        setIRdata(rws);
        setPrd(priod)
        // setOun(ogu)
        // setOulvl(levl)
        setMnths(peri)
    };


  //////// CUSTOM FXNs \\\\\\\\\\\\\\\\\\\\\\\\
  const sumArr = arr => arr.reduce((a, b) => a + b, 0);
  //////// CUSTOM FXNs \\\\\\\\\\\\\\\\\\\\\\\\


    let fetchIR = async the_url => {
        
        try {
            //   fetch(the_url, { signal: abortRequests.signal })
            return justFetch(the_url, { signal: abortRequests.signal })
                // .then(s_p => s_p.json())
                .then(reply => {
                    console.log(reply)
                    // setLoading(false)
                    if (reply.fetchedData == undefined || reply.fetchedData?.error) {
                        let e_rr = {
                            error: true,
                            msg: reply?.fetchedData?.message || '',
                            ...reply
                        }
                        console.error(e_rr)
                        console.error(reply)
                        if (e_rr.msg.includes('aborted') || e_rr.msg.includes('NetworkError')) {
                            props.history.go(0)
                        }
                        return e_rr
                        setErr(e_rr);
                    } else {
                        setErr({ error: false, msg: '' });
                        /// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                        /// ~~~~~~~~~~~~~~~~~~~~~~ <SUCCESS ~~~~~~~~~~~~~~~~~~~~~~~~~~
                        /// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                        let tableData = [];
                        let orgunits = reply.fetchedData.metaData.dimensions.ou;
                        let thedxissued = reply.fetchedData.metaData.dimensions.dx.splice(0, reply.fetchedData.metaData.dimensions.dx.length / 2);
                        let thedxreceived = reply.fetchedData.metaData.dimensions.dx.splice(0, reply.fetchedData.metaData.dimensions.dx.length);
                        
                        let o_gu = reply.fetchedData.metaData.items[reply.fetchedData.metaData.dimensions.ou[0]].name
                        let peri = []
                        reply.fetchedData.metaData.dimensions.pe.map(p_e => {
                            peri.push(reply.fetchedData.metaData.items[p_e].name)
                        })
                        thedxissued.map((issdId, index) => {
                            let recvdId = thedxreceived[index];

                            let iss_arr = reply.fetchedData.rows.filter(ri => ri[reply.fetchedData.headers.findIndex(jk => jk.name == "dx")] == issdId && ri[reply.fetchedData.headers.findIndex(jk => jk.name == "pe")] == reply.fetchedData.metaData.dimensions.pe[0])
                            let iss_val = 0
                            if (Array.isArray(iss_arr) && iss_arr.length > 0) {
                                iss_val = parseFloat(iss_arr[0][reply.fetchedData.headers.findIndex(jk => jk.name == "value")])
                            }

                            let recc = []
                            reply.fetchedData.metaData.dimensions.pe.map(p_e => {
                                let recvd_arr_month = reply.fetchedData.rows.filter(ri => ri[reply.fetchedData.headers.findIndex(jk => jk.name == "dx")] == recvdId && ri[reply.fetchedData.headers.findIndex(jk => jk.name == "pe")] == p_e)
                                let recvd_val_month = 0
                                if (Array.isArray(recvd_arr_month) && recvd_arr_month.length > 0) {
                                    recvd_val_month = parseFloat(recvd_arr_month[0][reply.fetchedData.headers.findIndex(jk => jk.name == "value")])
                                }
                                recc.push(recvd_val_month)
                            })

                            let total_recvd = sumArr(recc);

                            if (issdId == 'EtG9ozt2joA.DTnItSklSr8') { iss_val *= 1000; }

                            let diff_val = parseFloat(total_recvd) - parseFloat(iss_val);
                            if (iss_val > total_recvd) { } else { }

                            let diff_perc = (diff_val / iss_val) * 100;
                            if (diff_perc < 0) {
                            }

                            let bcolor = '';
                            if (diff_perc > 15 && diff_perc < 90) { bcolor = 'cell-amber'; }

                            if (diff_perc < 15 && diff_perc > 0) { bcolor = 'cell-green'; }

                            if (diff_perc >= 90 || diff_perc < 0) { bcolor = 'cell-red'; }

                            let calcperc = '';

                            if (iss_val == 0 && diff_val > 0) { calcperc = 'Infinity'; }
                            else {
                                if (iss_val == 0 && diff_val == 0) { calcperc = '0%'; }
                                else { calcperc = diff_perc.toFixed(1) + '%'; }
                            }

                            let trow = []
                            // trow.push( list_products[index] )
                            trow.push(reply.fetchedData.metaData.items[issdId].name.replace('MCD_', '').replace('HCD - ','').replace('HIV-', '').replace('Issues', '').replace('TB_FCDRR ', '').replace('Facility_TB_2022 ', '').replace('KEMSA_TB','').trim())
                            trow.push(iss_val)
                            recc.map(r_ec => {
                                trow.push(r_ec)
                            })
                            trow.push(total_recvd)
                            trow.push(diff_val.toFixed(1))
                            let calc_perc_cell = <ShadedCell classes={"cell-fill " + bcolor} val={calcperc} />
                            trow.push(calc_perc_cell)

                            tableData.push(trow)
                        })
                        
                        reply.fetchedData.metaData.dimensions.dx.map( (xd,ndx) => console.log([ndx,xd, reply.fetchedData.metaData.items[xd].name]))
                        // console.table(
                        //     Array.from(reply.fetchedData.rows, (r) =>
                        //         r.map((r_) =>
                        //             reply.fetchedData.metaData.items[r_]
                        //                 ? [r_, reply.fetchedData.metaData.items[r_].name]
                        //                 // ? reply.fetchedData.metaData.items[r_].name
                        //                 : r_
                        //         )
                        //     )
                        // );
                        
                        let updated_Data = {
                            "tableData": tableData,
                            "pe": reply.fetchedData.metaData.items[reply.fetchedData.metaData.dimensions.pe[0]].name + " - " + reply.fetchedData.metaData.items[reply.fetchedData.metaData.dimensions.pe[reply.fetchedData.metaData.dimensions.pe.length-1]].name,
                            "ou": o_gu,
                            "level": oulvl,
                            "period": peri
                        };
                        return updated_Data
                        updateData(tableData, reply.fetchedData.metaData.items[reply.fetchedData.metaData.dimensions.pe[0]].name, o_gu, oulvl, peri);
                        /// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                        /// ~~~~~~~~~~~~~~~~~~~~~~ SUCCESS/> ~~~~~~~~~~~~~~~~~~~~~~~~~~
                        /// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                    }
                    setLoading(false);
                })
                .catch(err => {
                    if (abortRequests.signal.aborted) { //if(err.name !== "AbortError"){
                        // setLoading(false);
                        return{ error: true, msg: `Error fetching data: ' ${process.env.REACT_APP_ENV == "dev" ? err.message : ""}` };
                        setErr({ error: true, msg: `Error fetching data: ' ${process.env.REACT_APP_ENV == "dev" ? err.message : ""}` });
                    } else {
                        console.log("Cancelling fetchIR requests");
                    }
                });
        } catch (er) {
            return { error: true, msg: `Error fetching data ${process.env.REACT_APP_ENV == "dev" ? er.message : ""}` };
            setErr({ error: true, msg: `Error fetching data ${process.env.REACT_APP_ENV == "dev" ? er.message : ""}` });
        }
    };

    useEffect(() => {
        let mounted = true
        if (mounted) {
            let ftch = (r_l) => {
                setLoading(true);
                setErr({ error: false, msg: '' });
                setIRdata([['Loading...']]);
                fetchIR(r_l).then(f => {
                    setLoading(false)
                    if (f?.error && f?.msg) {
                        setErr(f)
                    }else{
                        //updateData(f, '', '', '')
                        updateData(
                            f.tableData,
                            f.pe,
                            f.ou,
                            f.level,
                            f.period,
                        );
                    }
                });
            }
            ftch(url);
            // onUrlChange(endpoints[0][process.env.REACT_APP_ENV == "dev" ? "local_url" : "url"]);
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
                        endpoints[0][process.env.REACT_APP_ENV == "dev" ? "local_url" : "url"]
                    );
                    ftch(new_url);
                }
            });
            getValidOUs().then(vo => {
                let vFlS = JSON.parse(localStorage.getItem('validOUs'));
                if (vFlS && vFlS.length < 1) {
                    setValidOUs(vo);
                }
            });
        }

        return () => {
            mounted = false
            console.log(`ISSRec: aborting requests...`);
            abortRequests.abort();
        };
    }, []);

    let data = {};
    data.theads = ['Commodity', 'Qty Issued by KEMSA (' + mnths[0]+')'];
    mnths.map(mt => {
        data.theads.push('Qty Received at Facility (' + mt+')')
    })
    data.theads.push('Total')
    data.theads.push('Difference')
    data.theads.push('% Difference')
    data.rows = irdata;

    return (
        <div className={classes.root}>
            <Toolbar
                className={classes.gridchild}
                title={title}
                pe={prd}
                ou={oun}
                lvl={oulvl}
                // filter_params={filter_params}
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

export default IssuesReceipts;
