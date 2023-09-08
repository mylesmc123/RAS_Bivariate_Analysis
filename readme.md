
# RAS QualComp

### A RAS 2D QA/QC Visualization Tool

https://github.com/mylesmc123/RAS_2d_qaqc.git

#### Author: Myles McManus, TWI mmcmanus@thewaterinstitute.org
#### Date: 2023-09-01

## Background

For the RAS 2D GLO Model, a bivariate compound flood modeling approach is used. This involves using historical surge data combined with propabalistic based rainfall.

AEP Rainfall has been run for three different flood drivers: Most Likely, Surge Dominant, and Precip Dominant. Precipation data has been run for these 3 drivers for each AEP event.

The AEP events run include: 10, 50, 100, and 500 year return events.

In addition to the bivariate AEP events, Atlas 14 Everywhere Precip events were run for the same AEPs.

Historic events associated with the historic bivariate surge data was also run.

A summary of the events is shown below:

![Alt text](image.png)

Initial uncalibrated results, suggest some discrepancies between AEP events and expected results as shown in the figure below:

![Alt text](image-1.png)

## Purpose

The purpose of this QAQC is to compare the results of the bivariate compound flood modeling approach to the Atlas 14 and historic events. This will be done by comparing the water surface elevations at the same locations and looking at a animation of the precipitation as it occurs over the watershed.

## Methodology

The QAQC will be done using the following steps:

1. Create a grid of points to pull timeseries WSE data from within the model domain.
2. Pull timeseries data for each point location.
3. Plot the timeseries data for each point location along with a reference to the location on a map.
4. Create an animation of the precipitation as it occurs over the watershed.
5. Compare the results of the bivariate compound flood modeling approach to the Atlas 14 and historic events.