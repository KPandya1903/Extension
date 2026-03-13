const tf = require('@tensorflow/tfjs');
const path = require('path');
const fs = require('fs');
const { generateVariations } = require('../dataGen');

const CATEGORIES = [
  'firstName', 'lastName', 'over18', 'sponsorship', 'authorized', 
  'officeWilling', 'gender', 'ethnicity', 'veteranStatus', 
  'disabilityStatus', 'salaryExpectation', 'noticePeriod', 'yearsOfExperience'
];

const CHARS = " abcdefghijklmnopqrstuvwxyz0123456789?,.:!(*)@#";
const MAX_LEN = 64;

async function train() {
  const data = generateVariations();
  console.log(`Training on ${data.length} samples...`);

  const numCategories = CATEGORIES.length;
  const vocabSize = CHARS.length + 1;

  const xData = [];
  const yData = [];

  for (const sample of data) {
    const sequence = new Int32Array(MAX_LEN);
    const text = sample.input.slice(0, MAX_LEN);
    for (let i = 0; i < text.length; i++) {
      const charIdx = CHARS.indexOf(text[i]);
      sequence[i] = charIdx !== -1 ? charIdx + 1 : 0;
    }
    xData.push(sequence);
    yData.push(CATEGORIES.indexOf(sample.output));
  }

  const xs = tf.tensor2d(xData, [xData.length, MAX_LEN]);
  const ys = tf.oneHot(tf.tensor1d(yData, 'int32'), numCategories);

  const model = tf.sequential();
  model.add(tf.layers.embedding({
    inputDim: vocabSize,
    outputDim: 32,
    inputLength: MAX_LEN
  }));
  model.add(tf.layers.conv1d({
    filters: 64, kernelSize: 5, activation: 'relu'
  }));
  model.add(tf.layers.globalMaxPooling1d());
  model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: numCategories, activation: 'softmax' }));

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });

  console.log('Starting training...');
  await model.fit(xs, ys, {
    epochs: 20,
    batchSize: 32,
    validationSplit: 0.1
  });

  const modelDir = path.join(__dirname, '../../models');
  if (!fs.existsSync(modelDir)) fs.mkdirSync(modelDir, { recursive: true });

  console.log('Saving model...');
  await model.save(tf.io.withSaveHandler(async (artifacts) => {
    // Save model.json
    const modelJson = {
      modelTopology: artifacts.modelTopology,
      format: artifacts.format,
      generatedBy: artifacts.generatedBy,
      convertedBy: artifacts.convertedBy,
      weightsManifest: [{
        paths: ['./neural_model.weights.bin'],
        weights: artifacts.weightSpecs
      }]
    };
    fs.writeFileSync(path.join(modelDir, 'neural_model.json'), JSON.stringify(modelJson, null, 2));
    
    // Save weights.bin
    fs.writeFileSync(path.join(modelDir, 'neural_model.weights.bin'), Buffer.from(artifacts.weightData));
    
    return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } };
  }));

  console.log('Model saved successfully!');
}

train().catch(console.error);
