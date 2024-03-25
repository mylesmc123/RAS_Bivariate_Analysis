# Purpose: For a set of points get WSE timeseries from multiple HEC-RAS HDF Plan files and output to a JSON file for each RAS simulation event.
# Create a JSON file for each for each event that contains the WSE timeseries for each QAQC point.


# %%
import pandas as pd
import numpy as np
import h5py
import geopandas as gpd
from scipy.spatial import cKDTree
# import plotly.express as px
import plotly.graph_objects as go
import json

# Helper function to get the nearest cell to the QAQC point.
def ckdnearest(gdfA, gdfB):

    nA = np.array(list(gdfA.geometry.apply(lambda x: (x.x, x.y))))
    nB = np.array(list(gdfB.geometry.apply(lambda x: (x.x, x.y))))
    btree = cKDTree(nB)
    dist, idx = btree.query(nA, k=1)
    gdfB_nearest = gdfB.iloc[idx].drop(columns="geometry").reset_index(drop=True)
    gdf = pd.concat(
        [
            gdfA.reset_index(drop=True),
            gdfB_nearest,
            pd.Series(dist, name='dist')
        ], 
        axis=1)

    return gdf

# %%
# HEC-RAS HDF plan files to process.
# df_plan = pd.read_csv('GLO RAS Model Runs Distribution to Modelers.csv', header=0, skipinitialspace = True).drop(0).reset_index().drop(columns=['index'])
# Cleanup naming and drop the columns we don't need.
# df_plan = df_plan.drop(columns=['Modeler   ',
    #    'Model Location                                                                                                    ',
    #    'U Flow File ID ', 'Geometry'])
# df_plan = df_plan.rename(columns={
    # 'GLO RAS Events              ':'GLO RAS Events',
    # 'PlanID ':'PlanID',
    # })
# df_plan['PlanID'] = df_plan['PlanID'].str.strip()

hdf_files = [
    r"S:\For_Myles\LWI\HDFs_03.20.2024\LWI_Coastwide_TZ_RASV61.p01.hdf", 
    r"S:\For_Myles\LWI\HDFs_03.20.2024\LWI_Coastwide_TZ_RASV61.p02.hdf"
]

# Open QAQC points as a geodataframe.
gdf_qaqc = gpd.read_file(r"V:\projects\p00832_ocd_2023_latz_hr\01_processing\GIS\Collected_HWMs\LA_high_water_mark_data_USGS\Laura 2020 4326.geojson")
gdf_qaqc = gdf_qaqc[["geometry", "site_no", "elev_ft", "hwmQuality", "verticalDa"]]


# df_plan
# gdf_qaqc

# %%

# Loop through the plan files and get the WSE timeseries and output to a JSON file for each event
for hdf_fn in hdf_files:

    # get plan number by splitting by "." and getting the second to last element and dropping the first character.
    plan_number = hdf_fn.split(".")[-2]
    print(f'Processing plan number: {plan_number}')
    with h5py.File(hdf_fn, 'r') as hdf_file:
        planName = hdf_file['/Plan Data/Plan Information'].attrs['Plan Name'].decode('utf-8')
        wse = hdf_file['Results/Unsteady/Output/Output Blocks/Base Output/Unsteady Time Series/2D Flow Areas/CoastWide_Area/Water Surface']
        
        # The shape of the WSE data is 2D (time, cell). The cell is related to the geometry of the 2d mesh and can be related to the a coordinate using: /Geometry/2D Flow Areas/2D_Area/Cells Center Coordinate
        cell_coords  = hdf_file['/Geometry/2D Flow Areas/CoastWide_Area/Cells Center Coordinate']
        
        proj = hdf_file.attrs['Projection'].decode('utf-8')
        
        # Get time in an array of datetime strings.
        timestamps = [t.decode('utf-8') for t in hdf_file['/Results/Unsteady/Output/Output Blocks/Base Output/Unsteady Time Series/Time Date Stamp']]
        
        # Get time data referenced as days since start time.
        time = np.array(hdf_file['/Results/Unsteady/Output/Output Blocks/Base Output/Unsteady Time Series/Time'])

        startTime = timestamps[0]
        plan_data_json_output_file = f"../output/mapByHWM/{planName}_{plan_number}_data.json"
        # plan_data_json_output_file = fr"output/mapByHWM/{planName}_{plan_number}_data.json"
        # output\mapByHWM
        wse_data = np.array(wse)
        cell_coords_data = np.array(cell_coords)
        cellIds = [item for item in range(0, len(cell_coords_data))]


    # init plan data dictionary
    plan_data_dict = {
        "planID": plan_number,
        "planName": planName,
        "datetime": list(timestamps),
        "pointData": [
            # {
            #     "qaqc_pointID": row['id'],
            #     "ras_cellID": cell,
            #     "wse": wse_data[:,cell]
            # }
        ]

    }
    
    # pull out the hdf geometry to a geodataframe.
    x = np.array(cell_coords_data[:,0])
    y = np.array(cell_coords_data[:,1])

    gdf_hdf = pd.DataFrame()
    gdf_hdf = gpd.GeoDataFrame(gdf_hdf, geometry=gpd.points_from_xy(x, y), crs=proj)
    gdf_hdf.reset_index(inplace=True)
    gdf_hdf.rename(columns={'index':'cell'}, inplace=True)

    gdf_hdf.to_crs(4326, inplace=True)
    gdf_qaqc.to_crs(4326, inplace=True)

    # Get nearest cell to the QAQC points
    gdf_nearest = ckdnearest(gdf_qaqc, gdf_hdf)

    # For each QAQC point, use the nearest cellID to get the WSE timeseries by cell value.
    gdf_nearest['wse_ts'] = None
    for i, row in gdf_nearest.iterrows():
        cell = row['cell']
        gdf_nearest.at[i,'wse_ts'] = wse_data[:,cell]

        # append point data to plan data dictionary
        plan_data_dict['pointData'].append({
            "id": row['site_no'],
            "elev": row['elev_ft'],
            "quality": row['hwmQuality'],
            "verticalDatum": row['verticalDa'],
            "ras_cellID": cell,
            "wse": list(wse_data[:,cell].astype(np.float64))

        })

    # output plan wse data for qaqc points to JSON file
    print (f'outputting Json Data to file: {plan_data_json_output_file}')
    with open(plan_data_json_output_file, 'w') as outfile:
        json.dump(plan_data_dict, outfile)
# %%
# get the event-based *.json files from ./output
import glob
import os
event_wse_json_files = glob.glob('../output/mapByHWM/*.json')
# event_wse_json_files = glob.glob('../../output/mapByHWM/*.json')
print(event_wse_json_files)
# Create a json file for each point
pt_json_output_dir = '../output/mapByHWM/point_jsons'
if not os.path.exists(pt_json_output_dir):
    os.makedirs(pt_json_output_dir)

# For each HWM point, get the WSE timeseries and write to a point json file.
for i, row in gdf_qaqc.iterrows():
    # print (f'Processing point: {row["site_no"]}')
    pt_dict = {}
    pt_dict['site_no'] = row['site_no']
    pt_dict['elev'] = row['elev_ft']
    pt_dict['quality'] = row['hwmQuality']
    pt_dict['verticalDatum'] = row['verticalDa']
    for wse_json_file in event_wse_json_files:
        wse_json = json.load(open(wse_json_file, 'r'))
        for pointData in wse_json['pointData']:
            print (f'Processing plan: {pointData["id"]}')
            if pointData['id'] == row['site_no']:
                planName = wse_json['planName']
                pt_dict[planName] = {}
                pt_dict[planName]['datetime'] = wse_json['datetime']
                pt_dict[planName]['wse'] = pointData['wse']
                json.dump(pt_dict, open(f"{pt_json_output_dir}/{row['site_no']}.json", 'w'))
# %%
# set up plotly figure
fig = go.Figure()

# add line / trace 1 to figure
fig.add_trace(go.Scatter(
    x=timestamps, y=g_nearest['wse_ts'][0],
    hovertext=g_nearest['id'], hoverinfo="text",
    # marker=dict(
    #     color="blue"
    # ),
    showlegend=True, name="QAQC Point 1"
))

# %%
# fig.show()
