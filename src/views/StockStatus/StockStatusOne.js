import React, { useState, useEffect } from 'react';
import makeStyles from '@material-ui/styles/makeStyles';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Grid from '@material-ui/core/Grid';
import Message from 'components/Message/Message';
import {
    filterUrlConstructor,
    getValidOUs,
    justFetch
} from '../../common/utils';
import { programs } from 'hcd-config';
import Toolbar from 'components/Toolbar/Toolbar';
import Table from 'components/Table/Table';
import MFLcell from 'components/Table/MFLcell';
import ShadedCell from 'components/Table/ShadedCell';

const activProgId = parseFloat(localStorage.getItem('program')) || 1;
const activProg = programs.filter(pr => pr.id == activProgId)[0];
const prog_thresholds = activProg.thresholds
const paige = activProg.pages.filter(ep => ep.page == 'Stock status')[0];
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

const StockStatusOne = props => {
    const classes = useStyles();

    // ------pages-------
    const [spages, setSSPages] = useState([['Loading...']]);
    // ------pages-------
    let filter_params = queryString.parse(props.location.hash);
    if (
        filter_params.pe &&
        filter_params.pe.search(';') > 0 &&
        periodFilterType != 'range'
    ) {
        filter_params.pe = 'LAST_MONTH';
    }
    filter_params.level = 5;
    let [url, setUrl] = useState(
        filterUrlConstructor(
            filter_params.pe,
            filter_params.ou,
            5,
            endpoints[0][process.env.REACT_APP_ENV == "dev" ? "local_url" : "url"]
        )
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

    const [sdata, setSSData] = useState([['Loading...']]);
    const [prd, setPrd] = useState(null);
    const [validOUs, setValidOUs] = useState(
        JSON.parse(localStorage.getItem('validOUs'))
    );
    const [oun, setOun] = useState(null);
    const [hds, setHds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [oulvl, setOulvl] = useState(5);
    const [commodity_url, setCommodity] = useState(endpoints[0][process.env.REACT_APP_ENV == "dev" ? "local_url" : "url"]);
    const [err, setErr] = useState({ error: false, msg: '' });
    let [minmax, setMinMax] = useState(mnmx);
    let title = `Stock Status`;

    const lgnd = [
        { label: 'Stocked out', class: 'cell-darkred' },
        { label: 'MOS < ' + minmax[0], class: 'cell-red' },
        { label: 'MOS ' + minmax[0] + ' - ' + minmax[1], class: 'cell-green' },
        { label: 'MOS > ' + minmax[1], class: 'cell-amber' }
    ];

    const updateData = (rws, priod, ogu, levl) => {
        // console.log(`updateData = pe: ${prd}, ou:${oun}, lv:${oulvl}`)
        setSSData(rws);
        // setPrd(priod)
        // setOun(ogu)
        // setOulvl(levl)
    };

    let fetchAL = async the_url => {
        setLoading(true);
        setSSData([['Loading...']]);
        // console.log(url)
        try {
            //   fetch(the_url, { signal: abortRequests.signal })
            justFetch(the_url, { signal: abortRequests.signal })
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
                        setErr({ error: false, msg: '' });
                        //check if error here
                        let rows_data = [];
                        const rows = reply.fetchedData.rows;
                        let all_ous = [];

                        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`
                        setHds([]);
                        const heds = [];
                        // 
                        reply.fetchedData.metaData.dimensions.dx.map((dxh, indxh) => {
                            let headline = reply.fetchedData.metaData.items[dxh].name.replace('HCD - ', '').replace(' - HF', '').replace('MOH 743', '').replace('Rev2020_', '').replace('PMI', '').replace('_', ' ').replace('MoH 730B', '')
                                .replace('TB/ HIV DRUGS ', '')
                                .replace('Revision 2017', '')
                                .replace('MCD_', '')
                                .replace('MCD ', '')
                                .replace('MOH 647', '')
                                .replace('Medicines for OIs ', '')
                                .replace('FP_', '')
                                .replace('FP', '')
                                .replace('HIV-', '')
                                .replace(', FP', '')
                                .replace('Revision', '')
                                .replace('Rev ', '')
                                .replace('2016', '')
                                .replace('24s','24')
                                .replace('6s','6')
                                .replace('12s','12')
                                .replace('2017', '')
                                .replace('2018', '')
                                .replace('2019', '')
                                .replace('2020', '')
                                .replace('Adjusted Consumption', 'AMC')
                                .replace('HF', '')
                                .replace('Paediatric preparations', '')
                                .replace('Adult preparations', '')
                                .replace('End of Month', '')
                                .replace('Physical Stock Count', '')
                                .replace('MOH 647_', '')
                                .replace('MOH 743 Rev2020_', '')
                                .replace('Physical Count', 'SOH')
                                .replace('Ending Balance', '')
                                .replace('Closing Balance', '')
                                .replace('Artemether-Lumefantrine ','AL')
                                .replace('20/120','')
                                .replace('Tabs','')
                                .replace('TB FCDRR', '')
                                .replace('HCD TB', '')
                            if (headline.toLocaleLowerCase().includes("reporting")) { if(headline.toLocaleLowerCase().includes('time')){headline = "Reporting rate on time"}else{ headline = "Reporting rate"} }
                            heds.push(headline)
                        })
                        setHds(heds);
                        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`
                        reply.fetchedData.metaData.dimensions.ou.map((o_ou, ix) => {
                            // if (rows.length > 0) {
                            if (validOUs && validOUs.includes(o_ou) && rows.length > 0) {
                                let ou_rows = rows.filter(o_r => o_r[reply.fetchedData.headers.findIndex(jk => jk.name == "ou")] == o_ou);
                                let ro_w = [];
                                ro_w.push(
                                    reply.fetchedData.metaData.items[o_ou].name.replace('HCD - ', '').replace(' - HF', '').replace('MOH 743', '').replace('Rev2020_', '').replace('PMI', '').replace('_', ' ').replace('MoH 730B', '')
                                        .replace('TB/ HIV DRUGS ', '')
                                        .replace('Revision 2017', '')
                                        .replace('MCD_', '')
                                        .replace('MCD ', '')
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
                                        .replace('TB FCDRR', '')
                                        .replace('HCD TB', '')


                                );
                                ro_w.push(<MFLcell dhis_code={o_ou} />);
                                all_ous.push([
                                    reply.fetchedData.metaData.items[o_ou].name,
                                    o_ou
                                ]);
                                reply.fetchedData.metaData.dimensions.dx.map((o_dx, inx) => {
                                    let dx_rows = ou_rows.filter(o_dx_rw => o_dx_rw[reply.fetchedData.headers.findIndex(jk => jk.name == "dx")] == o_dx);
                                    if (dx_rows.length > 0) {
                                        let dxval = dx_rows[0][reply.fetchedData.headers.findIndex(jk => jk.name == "value")];
                                        let n_cell;
                                        if (dxval < 0) {
                                            n_cell = <ShadedCell classes="cell-fill cell-red" val={dxval} />
                                        }
                                        if (dxval >= 0 && dxval < 3) {
                                            n_cell = <ShadedCell classes="cell-fill cell-red" val={dxval} />
                                        }
                                        if (dxval >= 3 && dxval <= 6) {
                                            n_cell = <ShadedCell classes="cell-fill cell-green" val={dxval} />
                                        }
                                        if (dxval > 6) {
                                            n_cell = <ShadedCell classes="cell-fill cell-amber" val={dxval} />
                                        }
                                        dxval = n_cell;
                                        ro_w.push(dxval);
                                    } else {
                                        ro_w.push('None');
                                    }
                                });
                                rows_data.push(ro_w);
                            }
                        });
                        let o_gu;
                        if (filter_params.ou) {
                            o_gu = filter_params.ou;
                        } else {
                            o_gu = '';
                        }
                        updateData(
                            rows_data,
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
                        console.log("Cancelling fetchAL requests");
                    }
                });
        } catch (er) {
            setErr({ error: true, msg: 'Error fetching data' });
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
                    // setOulvl(new_filter_params.level);
                    setOulvl(5);
                }
                let new_url = filterUrlConstructor(
                    new_filter_params.pe,
                    new_filter_params.ou,
                    '5',//new_filter_params.level,
                    base_url
                );
                fetchAL(new_url);
            }
        });
    };

    useEffect(() => {
        let mounted = true
        if (mounted) {

            fetchAL(url);
            const act_comm_url =
                localStorage.getItem('active_commodity_url') || endpoints[0][process.env.REACT_APP_ENV == "dev" ? "local_url" : "url"];
            onUrlChange(act_comm_url);
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
            console.log(`SS:AL: aborting requests...`);
            abortRequests.abort();
        };
    }, []);

    let data = {};
    data.theads = ['Name', 'MFL Code'];
    data.theads = [...data.theads, ...hds];
    data.rows = sdata;

    return (
        <div className={classes.root}>
            <Grid container spacing={1} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <Grid item xs={12} sm={6}>
                    {err.error ? (
                        <></>
                    ) : (
                        <Select
                            className={(classes.gridchild, 'text-bold p-0')}
                            variant="standard"
                            autoWidth={true}
                            style={{ fontSize: '1rem', padding: '5px' }}
                            defaultValue={endpoints[0][process.env.REACT_APP_ENV == "dev" ? "local_url" : "url"]}
                            onChange={chp => {
                                sessionStorage.setItem(
                                    'active_commodity_url',
                                    chp.target.value
                                );
                                setCommodity(sessionStorage.getItem('active_commodity_url'));
                                fetchAL(
                                    filterUrlConstructor(
                                        filter_params.pe,
                                        filter_params.ou,
                                        '5',//filter_params.level,
                                        sessionStorage.getItem('active_commodity_url')
                                    )
                                );
                            }}>
                            {endpoints.map((sp, kyy) => {
                                return (
                                    <MenuItem
                                        key={kyy}
                                        className="text-bold"
                                        value={sp[process.env.REACT_APP_ENV == "dev" ? "local_url" : "url"]}>
                                        {sp.name}
                                    </MenuItem>
                                );
                            })}
                        </Select>
                    )}
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Toolbar
                        className={classes.gridchild}                        
                        title={title}
                        pe={prd}
                        ou={oun}
                        lvl={oulvl}
                        legends={lgnd}
                        filter_params={filter_params}                        
                    />
                </Grid>
            </Grid>
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

export default StockStatusOne;
