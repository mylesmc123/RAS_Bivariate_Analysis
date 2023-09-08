# Purpose: For a set of points get WSE timeseries from multiple HEC-RAS H files and output to a JSON file for each point location.


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

# HEC-RAS H plan files to process.
df_plan = pd.read_csv('GLO RAS Model Runs Distribution to Modelers.csv', header=0, skipinitialspace = True).drop(0).reset_index().drop(columns=['index'])
# Cleanup naming and drop the columns we don't need.
df_plan = df_plan.drop(columns=['Modeler   ',
       'Model Location                                                                                                    ',
       'U Flow File ID ', 'Geometry'])
df_plan = df_plan.rename(columns={
    'GLO RAS Events              ':'GLO RAS Events',
    'PlanID ':'PlanID',
    })
df_plan['PlanID'] = df_plan['PlanID'].str.strip()

# Open QAQC points as a geodataframe.
gdf_qaqc = gpd.read_file(r"points.geojson")

# df_plan
# gdf_qaqc

# %%

# Loop through the plan files and get the WSE timeseries and output to a JSON file for each event
for index, row in df_plan.iterrows():

    plan_number = row['PlanID'].strip()
    with h5py.File(fr"V:\projects\p00659_dec_glo_phase3\01_processing\merge_ras_50_runs\merged\HECRASV6.3.1_BaseModel\East_Galveston_Bay.{plan_number}.hdf", 'r') as hdf_file:
        planName = hdf_file['/Plan Data/Plan Information'].attrs['Plan Name'].decode('utf-8').replace('_', ' ')
        wse = hdf_file['Results/Unsteady/Output/Output Blocks/Base Output/Unsteady Time Series/2D Flow Areas/Model_Domain/Water Surface']
        
        # The shape of the WSE data is 2D (time, cell). The cell is related to the geometry of the 2d mesh and can be related to the a coordinate using: /Geometry/2D Flow Areas/2D_Area/Cells Center Coordinate
        cell_coords  = hdf_file['/Geometry/2D Flow Areas/Model_Domain/Cells Center Coordinate']
        
        proj = hdf_file.attrs['Projection'].decode('utf-8')
        
        # Get time in an array of datetime strings.
        timestamps = [t.decode('utf-8') for t in hdf_file['/Results/Unsteady/Output/Output Blocks/Base Output/Unsteady Time Series/Time Date Stamp']]
        
        # Get time data referenced as days since start time.
        time = np.array(hdf_file['/Results/Unsteady/Output/Output Blocks/Base Output/Unsteady Time Series/Time'])

        startTime = timestamps[0]
        plan_data_json_output_file = f"./output/{planName}_{plan_number}_data.json"
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
    
    # pull out the h geometry to a geodataframe.
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
            "qaqc_pointID": row['id'],
            "ras_cellID": cell,
            "wse": list(wse_data[:,cell].astype(np.float64))
        })

    # output plan wse data for qaqc points to JSON file
    print (f'outputting Json Data to file: {plan_data_json_output_file}')
    with open(plan_data_json_output_file, 'w') as outfile:
        json.dump(plan_data_dict, outfile)

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
