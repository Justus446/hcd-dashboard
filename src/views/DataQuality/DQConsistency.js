import React, { useState } from 'react';
import { makeStyles } from '@material-ui/styles';

import mockData from './data';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3)
  },
  content: {
    marginTop: theme.spacing(1)
  }
}));

const DQConsistency = () => {
  const classes = useStyles();

  const [users] = useState(mockData);

  return (
    <div className={classes.root}>
      <div className={classes.content}>
      </div>
    </div>
  );
};

export default DQConsistency;
