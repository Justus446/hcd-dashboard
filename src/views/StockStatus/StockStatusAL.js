import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/styles';

import Toolbar from './components/Toolbar/Toolbar';
import ALTable from './components/Table/ALTable';
import mockData from './data';

import moment from 'moment';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3)
  },
  content: {
    marginTop: theme.spacing(1)
  }
}));


const StockStatusAL = () => {
  const classes = useStyles();

  // const [sdata, setSSData] = useState(mockData);
  const [sdata, setSSData] = useState([['Loading...']]);
  const [prd, setPrd] = useState('');
  const [oun, setOun] = useState('');
  const [oulvl, setOulvl] = useState('');
  const [err, setErr] = useState({error: false, msg: ''});
  // let title = "Stock Status: Artemether Lumefantrine. - "+prd+", "+oun
  let title = `Stock Status: Artemether Lumefantrine. ${prd==""||prd==null?"":" - "+prd+", "}${oun==""||oun==null?"":oun}`

  useEffect( () => {
    let fetchAL = async ()=>{
      try {
        fetch("http://0.0.0.0:3000/api/county/stockstatus/al/~/2/202001").then(ad=>ad.json()).then(reply=>{
          //check if error here
          setSSData(reply.fetchedData.rows)
          setPrd(reply.fetchedData.period)
          setOun(reply.fetchedData.ou)
          setOulvl(reply.fetchedData.lvl)
        })
      } catch (er) {
        setErr({error: true, msg: 'Error fetching data'})
      }
    }
    fetchAL()
  }, [])

  let data = {}
  data.theads = [ "Name", "MFL Code", "RR%", "OT RR%", "AL6 SOH", "AL6 MOS", "AL12 SOH", "AL12 MOS", "AL18 SOH", "AL18 MOS", "AL24 SOH", "AL24 MOS", "ACT MOS", ]
  data.rows = sdata
  
  return (
    <div className={classes.root}>
      <Toolbar title={title} pe={prd} ou={oun} lvl={oulvl} />
      <div className={classes.content}>
        <ALTable pageTitle={title} theads={data.theads} rows={data.rows}/>
      </div>
    </div>
  );
};

export default StockStatusAL;
