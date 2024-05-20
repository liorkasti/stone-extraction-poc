async function loadImage(imgElement) {
    const tensor = tf.browser.fromPixels(imgElement).toFloat();
    return tensor.expandDims(0).div(tf.scalar(255.0));
}

async function predictAndDisplay(imgElement, model) {
    const tensor = await loadImage(imgElement);
    const predictions = await model.executeAsync(tensor);
    
    // Processing and displaying predictions
    // This part will depend on the model and how the predictions are formatted
    // Here we assume the predictions give bounding boxes for each stone

    const processedCanvas = document.getElementById('processedImage');
    const ctx = processedCanvas.getContext('2d');
    ctx.drawImage(imgElement, 0, 0, processedCanvas.width, processedCanvas.height);

    // Drawing bounding boxes on the image
    predictions.array().then(predictions => {
        predictions.forEach(pred => {
            const [y1, x1, y2, x2] = pred;  // Assuming the format is [y1, x1, y2, x2]
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x1 * processedCanvas.width, y1 * processedCanvas.height, 
                           (x2 - x1) * processedCanvas.width, (y2 - y1) * processedCanvas.height);
        });
    });

    // Clear the previous container content
    document.getElementById('gridContainer').innerHTML = '';

    // Display each stone separately in the grid container
    predictions.array().then(predictions => {
        predictions.forEach((pred, i) => {
            const [y1, x1, y2, x2] = pred;
            const width = (x2 - x1) * processedCanvas.width;
            const height = (y2 - y1) * processedCanvas.height;

            const canvas = document.createElement('canvas');
            canvas.width = 150;
            canvas.height = 150;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imgElement, x1 * processedCanvas.width, y1 * processedCanvas.height, width, height, 
                          0, 0, canvas.width, canvas.height);

            document.getElementById('gridContainer').appendChild(canvas);
        });
    });
}

window.onload = async function() {
    // Load the pre-trained model (replace with the actual model URL or path)
    const model = await tf.loadGraphModel('http://localhost:8080/model/model.json');
    console.log('Model loaded.');

    document.getElementById('imageInput').addEventListener('change', function(e) {
        let imgElement = document.createElement('img');
        imgElement.src = URL.createObjectURL(e.target.files[0]);

        imgElement.onload = function() {
            predictAndDisplay(imgElement, model);
        };
    });
};
