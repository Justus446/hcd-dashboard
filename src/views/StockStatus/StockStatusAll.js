import React, { useState, useEffect } from 'react';
import makeStyles from '@material-ui/styles/makeStyles';
import Message from 'components/Message/Message';
import {
    filterUrlConstructor,
    getValidOUs,
    justFetch
} from '../../common/utils';
import { programs } from 'hcd-config';
import Toolbar from 'components/Toolbar/Toolbar';
import Table from 'components/Table/Table';

const activProgId = parseFloat(localStorage.getItem('program')) || 1;
const activProg = programs.filter(pr => pr.id == activProgId)[0];
const paige = activProg.pages.filter(ep => (ep.page == 'Stock status' && ep.name == 'All commodities'))[0];
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

const StockStatusAll = props => {
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
    const [sdata, setSSData] = useState([['Loading...']]);
    const [prd, setPrd] = useState(null);
    const [validOUs, setValidOUs] = useState(
        JSON.parse(localStorage.getItem('validOUs'))
    );
    const [oun, setOun] = useState(null);
    const [loading, setLoading] = useState(true);
    const [oulvl, setOulvl] = useState(null);
    const [err, setErr] = useState({ error: false, msg: '' });
    let title = `Stock Status: All commodities`;

    const updateData = (rws, priod, ogu, levl) => {
        // console.log(`updateData = pe: ${prd}, ou:${oun}, lv:${oulvl}`)
        setSSData(rws);
        // setPrd(priod)
        // setOun(ogu)
        // setOulvl(levl)
    };
    let fetchAll = async the_url => {
        setLoading(true);
        setSSData([['Loading...']]);
        try {
            //   fetch(the_url, { signal: abortRequests.signal })
            justFetch(the_url, { signal: abortRequests.signal })
                // .then(s_p => s_p.json())
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
                        setErr({ error: false, msg: '' });
                        let tableData = [];
                        let dxidsadjc = [];
                        let dxidshfs = [];
                        let count = 0;
                        const products = [];

                        reply.fetchedData.metaData.dimensions.dx.map(dx_val => {
                            const nme = reply.fetchedData.metaData.items[dx_val].name;
                            if (nme.toLowerCase().includes('adjusted')) {
                                products.push(
                                    nme.replace('MCD_', '')
                                        .replace(' Adjusted Consumption', '')
                                        .replace('HCD -', '')
                                        .replace('MOH 647_', '')
                                        .replace('- HF', '')
                                        .replace('MOH', '')
                                        .replace('_', ' ')
                                        .replace('743', '')
                                        .replace('647', '')
                                        .replace('Rev2020', '')
                                        .replace('HIV-', '')
                                        .replace('Physical Count', '')
                                        .replace('Physical count', '')
                                        .replace('Beginning', '').replace('Balance', '').replace('MOH 647_', '').replace('.', '').replace('HCD - ', '').replace(' - HF', '').replace('MOH 743', '').replace('Rev2020_', '').replace('PMI', '').replace('_', ' ').replace('MoH 730B', '')
                                        .replace('TB/ HIV DRUGS ', '')
                                        .replace('Revision 2017', '')
                                        .replace('MCD_', '')
                                        .replace('Medicines for OIs ', '')
                                        .replace('MOS', '')
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
                                        .replace('Closing Balance', '').trim()
                                        .replace('HCD TB', '')
                                );
                                dxidsadjc.push(dx_val);
                            }
                            if (nme.toLowerCase().includes('closing') || nme.toLowerCase().includes('physical')) {
                                dxidshfs.push(dx_val);
                            }
                            count++;
                        });
                        let adjcvalues = []; // Adjusted values
                        let hfsvalues = []; // Physical count
                        let adjcvals = [];
                        let hfidvals = [];
                        dxidsadjc.map(dx_adj => {
                            let vrw = reply.fetchedData.rows.find(rw =>
                                rw[reply.fetchedData.headers.findIndex(jk => jk.name == "dx")] == dx_adj
                            ) || [0, 0, 0, 0, 0]
                            let vlue = vrw[reply.fetchedData.headers.findIndex(jk => jk.name == "value")] || 0.0
                            adjcvalues.push(vlue)
                        })
                        dxidshfs.map(dx_phc => {
                            let vrw = reply.fetchedData.rows.find(rw =>
                                rw[reply.fetchedData.headers.findIndex(jk => jk.name == "dx")] == dx_phc
                            ) || [0, 0, 0, 0, 0]
                            let vlue = vrw[reply.fetchedData.headers.findIndex(jk => jk.name == "value")] || 0.0
                            hfsvalues.push(vlue)
                        })
                        for (let i = 0; i < products.length; i++) {
                            if (typeof hfsvalues[i] == 'undefined') {
                                hfsvalues[i] = 0;
                            }
                            if (typeof adjcvalues[i] == 'undefined') {
                                adjcvalues[i] = 0;
                            }
                            let hfsmos = hfsvalues[i] / adjcvalues[i];
                            if (isNaN(hfsmos)) {
                                hfsmos = 0;
                            }
                            let trow = [];
                            trow.push(products[i]);
                            //   trow.push(dxuom[i]);
                            trow.push(Math.trunc(adjcvalues[i]).toLocaleString());
                            trow.push(Math.trunc(hfsvalues[i]).toLocaleString());
                            trow.push(hfsmos.toFixed(1));
                            tableData.push(trow);
                        }
                        let o_gu;
                        if (filter_params.ou) {
                            o_gu = filter_params.ou;
                        } else {
                            o_gu = '';
                        }
                        updateData(
                            tableData,
                            reply.fetchedData.metaData.items[
                                reply.fetchedData.metaData.dimensions.pe[0]
                            ].name,
                            o_gu,
                            oulvl
                        );
                    }
                    setLoading(false);
                })
                .catch(err => {
                    if (abortRequests.signal.aborted) { //if(err.name !== "AbortError"){
                        setLoading(false);
                        setErr({ error: true, msg: `Error fetching data: ' ${process.env.REACT_APP_ENV == "dev" ? err.message : ""}` });
                    } else {
                        console.log("Cancelling fetchAll requests");
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
                fetchAll(new_url);
            }
        });
    };

    useEffect(() => {
        let mounted = true
        if (mounted) {

            fetchAll(url);
            onUrlChange(endpoints[0][process.env.REACT_APP_ENV == "dev" ? "local_url" : "url"]);
            getValidOUs().then(vo => {
                let vFlS = JSON.parse(localStorage.getItem('validOUs'));
                if (vFlS && vFlS.length < 1) {
                    setValidOUs(vo);
                    // localStorage.removeItem('validOUs')
                    // console.log("refetching validOUs with getValidOUs")
                    // localStorage.setItem('validOUs', JSON.stringify(vo))
                }
            });
        }

        return () => {
            mounted = false
            console.log(`SS:All aborting requests...`);
            abortRequests.abort();
        };
    }, []);

    let data = {};
    data.theads = [
        'Commodity',
        // 'Unit of measure',
        'Adjusted AMC',
        'Latest SOH',
        'Months of Stock (MOS)'
    ];
    data.rows = sdata;

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

export default StockStatusAll;
