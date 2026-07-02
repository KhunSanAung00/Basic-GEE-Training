/***************************************
 * 11. Machine Learning - Random Forest Model
 * Machine Learning Land Cover Mapping
 * First Random Forest model
 * Target class vs non-target classes
 ***************************************/
/***************************************
 * Machine Learning Land Cover Mapping
 * First Random Forest model
 * Target class vs non-target classes
 ***************************************/

// ======================================================
// FUNCTION SECTION
// Put all callable functions first.
// ======================================================

function setClassCode(featureCollection, classCode, className) {
  return ee.FeatureCollection(featureCollection).map(function(feature) {
    return feature.set({
      source_class: feature.get('class'),
      'class': classCode,
      class_name: className
    });
  });
}

function mergeTrainingGroups(targetSamples, nonTargetSamples) {
  return ee.FeatureCollection(targetSamples)
    .merge(ee.FeatureCollection(nonTargetSamples));
}

function sampleImage(image, trainingData, classProperty, scale) {
  return image.sampleRegions({
    collection: trainingData,
    properties: [classProperty, 'class_name', 'source_class'],
    scale: scale,
    geometries: true,
    tileScale: 4
  });
}

function splitSamples(samples, split, seed) {
  var withRandom = samples.randomColumn('random', seed);

  return {
    training: withRandom.filter(ee.Filter.lt('random', split)),
    validation: withRandom.filter(ee.Filter.gte('random', split))
  };
}

function trainRandomForest(trainingSamples, imageBands, classProperty, numberOfTrees, outputMode) {
  var classifier = ee.Classifier.smileRandomForest({
    numberOfTrees: numberOfTrees,
    seed: 100
  });

  if (outputMode) {
    classifier = classifier.setOutputMode(outputMode);
  }

  return classifier.train({
    features: trainingSamples,
    classProperty: classProperty,
    inputProperties: imageBands
  });
}

function classifyImage(image, classifier) {
  return image.classify(classifier);
}

function classifyTargetProbability(image, probabilityClassifier, targetClassIndex) {
  return image.classify(probabilityClassifier)
    .arrayGet([targetClassIndex])
    .rename('target_probability');
}

function thresholdProbability(probabilityImage, threshold) {
  return probabilityImage.gte(threshold).rename('target_class');
}

function assessAccuracy(validationSamples, classifier, classProperty) {
  var validated = validationSamples.classify(classifier);
  var matrix = validated.errorMatrix(classProperty, 'classification');

  return {
    validated: validated,
    matrix: matrix,
    overallAccuracy: matrix.accuracy(),
    kappa: matrix.kappa(),
    producerAccuracy: matrix.producersAccuracy(),
    consumerAccuracy: matrix.consumersAccuracy()
  };
}

function addBinaryLegend() {
  var legend = ui.Panel({
    style: {
      position: 'bottom-left',
      padding: '8px 15px',
      backgroundColor: 'white'
    }
  });

  legend.add(ui.Label({
    value: 'Random Forest class',
    style: {
      fontWeight: 'bold',
      fontSize: '14px',
      margin: '0 0 6px 0'
    }
  }));

  var rows = [
    {label: '0 - Non-target', color: '#9e9e9e'},
    {label: '1 - Target', color: '#fff013'}
  ];

  rows.forEach(function(row) {
    var colorBox = ui.Label({
      style: {
        backgroundColor: row.color,
        padding: '8px',
        margin: '0 0 4px 0'
      }
    });

    var label = ui.Label({
      value: row.label,
      style: {
        margin: '0 0 4px 6px',
        fontSize: '12px'
      }
    });

    legend.add(ui.Panel(
      [colorBox, label],
      ui.Panel.Layout.Flow('horizontal')
    ));
  });

  Map.add(legend);
}



/// Main
// Combined raw training data geometry for display and checking.
// Empty optional groups can stay in the geometry section and be added later.
var trainingDataGeometry = ee.FeatureCollection([
  Rice,
  Shrubland,
  Forest,
  Bareland,
  Builtup,
  Water
]).flatten();

// ======================================================
// MAIN SECTION
// Call the functions using INPUT, PROCESS, OUTPUT.
// ======================================================

// ------------------------------------------------------
// 1. INPUT
// ------------------------------------------------------

var image = ee.Image('users/servirmekong/mmCrop2024/S2_Oktwin_2024Summer');

var classProperty = 'class';
var targetCode = 1;
var nonTargetCode = 0;
var scale = 10;
var split = 0.7;
var seed = 100;
var numberOfTrees = 100;
var probabilityThreshold = 0.5;

// Compile target and non-target land cover groups from the Geometry Section.
var targetLandCover = ee.FeatureCollection(Rice);

var nonTargetLandCover = ee.FeatureCollection(Water)
  .merge(Builtup)
  .merge(Bareland)
  .merge(Forest)
  .merge(Shrubland);

// Grams and OtherCrops are kept in the Geometry Section.
// Add them here later if they contain real non-target samples.
// nonTargetLandCover = nonTargetLandCover
//   .merge(ee.FeatureCollection([Grams]))
//   .merge(OtherCrops);

// ------------------------------------------------------
// 2. PROCESS
// ------------------------------------------------------

// Prepare binary training data for the model.
var targetSamples = setClassCode(targetLandCover, targetCode, 'target');
var nonTargetSamples = setClassCode(nonTargetLandCover, nonTargetCode, 'non_target');
var trainingData = mergeTrainingGroups(targetSamples, nonTargetSamples);

// Read all bands from the prepared image.
var imageBands = image.bandNames();

// Extract image band values at the training sample locations.
var samples = sampleImage(image, trainingData, classProperty, scale);

// Split the sampled pixels into training and validation data.
var sampleSplit = splitSamples(samples, split, seed);

// Train the first Random Forest model.
var rfClassifier = trainRandomForest(
  sampleSplit.training,
  imageBands,
  classProperty,
  numberOfTrees,
  'CLASSIFICATION'
);

// Train a second Random Forest model with probability output.
var rfProbabilityClassifier = trainRandomForest(
  sampleSplit.training,
  imageBands,
  classProperty,
  numberOfTrees,
  'MULTIPROBABILITY'
);

// Classify the prepared image.
var classified = classifyImage(image, rfClassifier);

// Create a continuous target probability layer.
// MULTIPROBABILITY returns probabilities in class order: [0, 1].
// Index 1 is the probability of the target class.
var targetProbability = classifyTargetProbability(
  image,
  rfProbabilityClassifier,
  targetCode
);

// Optional binary map from the probability layer.
var thresholdedTarget = thresholdProbability(
  targetProbability,
  probabilityThreshold
);

// Assess model accuracy using the validation samples.
var accuracy = assessAccuracy(
  sampleSplit.validation,
  rfClassifier,
  classProperty
);

// ------------------------------------------------------
// 3. OUTPUT
// ------------------------------------------------------

print('Input image', image);
print('Image bands', imageBands);
print('Raw training data geometry', trainingDataGeometry);
print('Target land cover compilation', targetLandCover);
print('Non-target land cover compilation', nonTargetLandCover);
print('Target samples, class = 1', targetSamples);
print('Non-target samples, class = 0', nonTargetSamples);
print('Merged binary training data', trainingData);
print('Sampled image values', samples);
print('Training sample count', sampleSplit.training.size());
print('Validation sample count', sampleSplit.validation.size());
print('Random Forest model information', rfClassifier.explain());
print('Random Forest probability model information', rfProbabilityClassifier.explain());
print('Confusion matrix', accuracy.matrix);
print('Overall accuracy', accuracy.overallAccuracy);
print('Kappa', accuracy.kappa);
print('Producer accuracy', accuracy.producerAccuracy);
print('Consumer accuracy', accuracy.consumerAccuracy);
print('Target probability layer', targetProbability);
print('Probability threshold', probabilityThreshold);

Map.centerObject(trainingDataGeometry, 9);
Map.setOptions('HYBRID');

var probability = {"opacity":1,"bands":["target_probability"],"min":0,"max":1,"palette":["0a9121","00ffff","ffff00","ff7f00","ff0000"]};


Map.addLayer(
  image,
  imageVis,
  'Prepared composite image'
);

Map.addLayer(
  targetLandCover,
  {color: 'fff013'},
  'Target land cover geometry'
);

Map.addLayer(
  nonTargetLandCover,
  {color: '9e9e9e'},
  'Non-target land cover geometry',
  false
);

Map.addLayer(
  trainingData,
  {color: 'yellow'},
  'Binary training data',
  false
);

Map.addLayer(
  targetProbability,
  probability,
  'RF target probability'
);

Map.addLayer(
  thresholdedTarget,
  {
    min: 0,
    max: 1,
    palette: ['9e9e9e', 'fff013']
  },
  'RF target classification from probability threshold'
);

Map.addLayer(
  classified,
  {
    min: 0,
    max: 1,
    palette: ['9e9e9e', 'fff013']
  },
  'RF hard classification',
  false
);

addBinaryLegend();

// Optional export.
// Export.image.toDrive({
//   image: targetProbability.toFloat(),
//   description: 'RF_Target_Probability',
//   folder: 'GEE_Exports',
//   fileNamePrefix: 'rf_target_probability',
//   region: trainingDataGeometry.geometry().bounds(),
//   scale: scale,
//   maxPixels: 1e13
// });
