/**
 * Neural Trainer for QuickFill
 * Uses TensorFlow.js to train a deep learning classifier.
 */

const CATEGORIES = [
  'firstName', 'lastName', 'over18', 'sponsorship', 'authorized', 
  'officeWilling', 'gender', 'ethnicity', 'veteranStatus', 
  'disabilityStatus', 'salaryExpectation', 'noticePeriod', 'yearsOfExperience'
];

// Character set for tokenization
const CHARS = " abcdefghijklmnopqrstuvwxyz0123456789?,.:!(*)@#";
const MAX_LEN = 64;

async function trainModel(data) {
  console.log('Preparing data for TensorFlow...');
  
  const vocabSize = CHARS.length + 1;
  const numCategories = CATEGORIES.length;

  // Vectorize inputs
  const xData = [];
  const yData = [];

  for (const sample of data) {
    const sequence = new Int32Array(MAX_LEN);
    const text = sample.i.slice(0, MAX_LEN);
    for (let i = 0; i < text.length; i++) {
      const charIdx = CHARS.indexOf(text[i]);
      sequence[i] = charIdx !== -1 ? charIdx + 1 : 0;
    }
    xData.push(sequence);
    yData.push(CATEGORIES.indexOf(sample.o));
  }

  const xs = tf.tensor2d(xData, [xData.length, MAX_LEN]);
  const ys = tf.oneHot(tf.tensor1d(yData, 'int32'), numCategories);

  console.log('Building Neural Network...');
  const model = tf.sequential();
  
  model.add(tf.layers.embedding({
    inputDim: vocabSize,
    outputDim: 32,
    inputLength: MAX_LEN
  }));
  
  model.add(tf.layers.conv1d({
    filters: 64,
    kernelSize: 5,
    activation: 'relu'
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

  console.log('Starting Training (10 epochs)...');
  await model.fit(xs, ys, {
    epochs: 10,
    batchSize: 128,
    validationSplit: 0.1,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch + 1}: Loss = ${logs.loss.toFixed(4)}, Acc = ${logs.acc.toFixed(4)}`);
      }
    }
  });

  console.log('Training complete. Exporting model via HTTP...');
  
  // Custom saver because TF.js http handler might be tricky in this env
  const saveResult = await model.save(tf.io.withSaveHandler(async (artifacts) => {
    // 1. Save model.json
    await fetch('http://localhost:8000/save-model', {
      method: 'POST',
      body: JSON.stringify({
        name: 'neural_model.json',
        data: {
          modelTopology: artifacts.modelTopology,
          format: artifacts.format,
          generatedBy: artifacts.generatedBy,
          convertedBy: artifacts.convertedBy,
          weightsManifest: [{
            paths: ['./neural_model.weights.bin'],
            weights: artifacts.weightSpecs
          }]
        }
      })
    });

    // 2. Save weights.bin
    await fetch('http://localhost:8000/save-model', {
      method: 'POST',
      body: JSON.stringify({
        name: 'neural_model.weights.bin',
        data: btoa(String.fromCharCode(...new Uint8Array(artifacts.weightData)))
      })
    });

    return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } };
  }));

  console.log('Model uploaded to server successfully!');
}

// Global hook for browser trainer
window.runTraining = async () => {
  try {
    const response = await fetch('data/training_data.json');
    const data = await response.json();
    await trainModel(data);
  } catch (err) {
    console.error('Training Error:', err);
  }
};
