# Importing Data to GEE Asset

In this section, we will learn how to import data from our computer to GEE Asset.

Go to Assets tab on the left pane of your GEE JavaScript code interface, Google allow the following data type to import into the GEE Asset.

![image-20240724145651544](images/image-20240724145651544.png)

Image : Raster GeoTiff format or TFRecord format.

Table: CSV, ESRI Shapefile or zip file

## 1. Prepare data in local machine

What if I have a digitize smaple in Google KML/KMZ format?

If you have sample point/polygon in Google KML format, you can convert them to ESRI Shapefile format as below.

![image-20240724150834819](images/image-20240724150834819.png)

1.1. Convert Google KML file to ESRI Shapefile

Use QGIS to convert KML file to ESRI Shapefile.

Drag and drop your KML file into the QGIS map template.

Select the KML layer file name and Save as.

![image-20240724151804704](images/image-20240724151804704.png)

Save the 

![image-20240724151413755](images/image-20240724151413755.png)

GEE Asset folder path: 

## 2. Upload Data to GEE Asset

We will upload ESRI Shapefile from local computer to Google Asset. 

2.1. Create Folder in Google Asset.

Firstly, we need to create a folder in your GEE Asset to store the file.

Go to Assets tab on the left pane of your GEE JavaScript code interface, -> Click on New -> Select Folder

![image-20240724160023725](images/image-20240724160023725.png)

Select the root folder with your name under users/ 

![image-20240724160405761](images/image-20240724160405761.png)

Enter the new folder name, e.g. **mmCropData** and click on OK. 

![image-20240724160642094](images/image-20240724160642094.png)

Now, click on the Refresh button and check your newly created folder.

It should appear under the LEAGCY ASSETS.

![image-20240724161104905](images/image-20240724161104905.png)



2.2. Uploading ESRI Shapefile

 Go to Assets tab on the left pane of your GEE JavaScript code interface, -> Click on New -> Select Shape files

![image-20240724155256747](images/image-20240724155256747.png)

Select your Shape files from your local computer.

![image-20240724161410918](images/image-20240724161410918.png)

Select your asset root (**users/your_name/**), enter your data folder name (**mmCropData/**) followed by your new file name (**summerrice2024**).

Click on Upload.

A new task would appear.

![image-20240724161910940](images/image-20240724161910940.png)

Once the ingesting task is done successfully, click on **View asset** in the Tasks list.

![image-20240724162139090](images/image-20240724162139090.png)

.

Asset details window will pop up. You can see the Table ID of your objects. You can always use this Asset ID in your script.

![image-20240724164203742](images/image-20240724164203742.png)

## 3. Importing datasets from GEE Asset to JavaScript Code

Text.

Navigate to your GEE Assets tab, Expand the LEGACY ASSETS. Under your users/your_name/ and the asset ID.  

![image-20240724163822904](images/image-20240724163822904.png) 

Click on **IMPORT** on the upper right, To import the the newly created file into your GEE JavaScript editor, 

![image-20240724162508212](images/image-20240724162508212.png)

Now, you should see the asset table in the **Imports** section.

![image-20240724165721102](images/image-20240724165721102.png)

![image-20240724162928108](images/image-20240724162928108.png)

You can rename the table into '**summerrice24**'.

3.1. Merging new sample with existing samples.

Let's say you have an existing rice sample and you want to add new sample in it to combine into one file.

I will assume my existing file in GEE Asset is ''summerrice24''.

```javascript
var summerrice24 = ee.FeatureCollection("users/khunsanaung_gis/mmCropData/summerrice24");

Map.addLayer(summerrice24,{color:'yellow'},'rice Polygon');
Map.centerObject(summerrice24)
```

![image-20240724170350780](images/image-20240724170350780.png)

3.2. Creating a new polygon form the Geometry tools and name it as 'newPolygon'.

![image-20240724170615622](images/image-20240724170615622.png)

### 3.3. Combining two FeatureCollecton into one FeatureCollection file.

We can create a new FeatureCollection on the fly using list and then apply the  **.flatten( )** method.

```javascript
//// combine existing file with new file.
var combined = ee.FeatureCollection([summerrice24,newPolygon]).flatten();

Map.addLayer(combined,{color:'cyan'},'combined');
```

Example of combined output.

![image-20240724172259028](images/image-20240724172259028.png)

You can combine existing rice point file with new rice point file.

```javascript
//// combine existing file with new file.
var combinedRicePoints = ee.FeatureCollection([oldRicePoints,newRicePoints]).flatten();
```

You can combine non-rice assets into one non-rice file.

```javascript
//// combine existing file with new file.
var combinedNotRicePoints = ee.FeatureCollection([water,builtup,forest,shrubland,grassland,]).flatten();
```

**Note:** Using feature.merge( ) is not efficient for big data size.  



**[Link to GEE Code](https://code.earthengine.google.com/cfc08dad274de565c8a3023024963c0c).**



သီဟိုဠ်မှ ဉာဏ်ကြီးရှင်သည် အာယုဝဍ်ဎနဆေးညွှန်းစာကို ဇလွန်ဈေးဘေးဗာဒံပင်ထက် အဓိဋ္ဌာန်လျက် ဂဃနဏဖတ်ခဲ့သည်။ယေဓမ္မာ ဟေတုပ္ပဘဝါ တေသံ ဟေတုံ တထာဂတော အာဟ တေသဉ္စ ယောနိရောဓေါ ဧဝံ ဝါဒီ မဟာသမဏော။(မြန်မာပြန်)မြတ်စွာဘုရားရှင်သည် ရှေးကပြုခဲ့ဖူးသော အကြောင်းတရားကြောင့် ဖြစ်ပေါ်လာကြသော အကျိုးတရားကို ဟောကြားတော်မူသည်။ထိုအကြောင်းတရားတို့၏ ချုပ်ငြိမ်းရာတရားတို့ကိုလည်း ဟောတော်မူ၏။ရဟန်းကြီးဖြစ်သော ဗုဒ္ဓမြတ်စွာဘုရားသည် ဤသို့သောအယူရှိတော်မူ၏။

---------

Next: 04-Sentinel-2 Image and NDVI Time-series Profile

startJscript

```javascript
var image = ee.Image('LANDSAT/LC08/C02/T1_TOA/LC08_133045_20140113');
```

endJscript

End of this session