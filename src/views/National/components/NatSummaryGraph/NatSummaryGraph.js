import React from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { makeStyles, useTheme } from '@material-ui/styles';
import { Card, CardHeader, CardContent, CardActions, Divider, Button, Typography, CircularProgress } from '@material-ui/core';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';

import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
require('highcharts/modules/exporting')(Highcharts);


const useStyles = makeStyles(() => ({
  root: {},
  chartContainer: {
    height: 400,
    position: 'relative',
    textAlign: 'center'
  },
  actions: {
    justifyContent: 'flex-end'
  }
}));

const MOSbyCommodity = props => {
  const { className, data, ...rest } = props;
  let {pending, facility, kemsa} = data;
  const theme = useTheme();
  // console.log(`theme: ${JSON.stringify(theme.palette.secondary, '', 1)}`)

  const options = {
    chart: {
        type: 'bar'
    },
    title: {
        text: ''
    },
      credits: {
      enabled: false
    },
    xAxis: {				
        title: {
            text: 'Commodities'
        },
        categories: ['AL 6s', 'AL 12s', 'AL 18s', 'AL 24s', 'AS inj', 'SP tabs', 'RDT']
    },
    yAxis: {
        min: 0,
        max: 24,
        title: {
            text: 'Months of Stock (MOS)'
        },
        stackLabels: {
            enabled: true,
            style: {
                fontWeight: 'bold',
                color: 'gray'
            }
        },
        plotLines: [{
                    color: '#FF0000',
                    width: 2,
                    value: 9,
                    label: {
                        text: 'Min',
                        align: 'right'
                    }
                },
                {
                    color: '#00FF00',
                    width: 2,
                    value: 18,
                    label: {
                        text: 'Max',
                        align: 'right'
                    }
                }]
    },
    legend: {
        align: 'right',
        x: -200,
        verticalAlign: 'Top',
        y: -15,
        floating: true,
        backgroundColor: 'white',
        borderColor: '#CCC',
        borderWidth: 1,
        shadow: false,
        reversed: true
    },
    tooltip: {
        headerFormat: '<b>{point.x}</b><br/>',
        pointFormat: '{series.name}: {point.y}'
    },
    plotOptions: {
        series: {
            stacking: 'normal',
            dataLabels: {
                enabled: true,
                color: 'white',
                style: {
                    textShadow: '0 0 10px black'
                }
            }
        }
    },
    colors: ['#8497b0', '#c55a11', '#92d050'],
    series: [{
        name: 'Pending Stock',
        data: pending
    }, {
        name: 'KEMSA Stock',
        data: kemsa
    }, {
        name: 'Facility Stock',
        data: facility
    }]
  }

  const classes = useStyles();

  return (
    <Card
      {...rest}
      className={clsx(classes.root, className)}
    >
      <CardHeader
        title="National Summary" />
      <Divider />
      <CardContent>
        <div className={classes.chartContainer}>
          { data.length < 7 ? (
            <div style={{padding: '3rem 1rem'}}>
              <CircularProgress color="secondary" />
            </div>
          ) : ( 
            <HighchartsReact highcharts={Highcharts} options={options} />
          ) }
        </div>
      </CardContent>
      {/* <Divider /> */}
    </Card>
  );
};

MOSbyCommodity.propTypes = {
  className: PropTypes.string
};

export default MOSbyCommodity;
