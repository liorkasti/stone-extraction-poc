window.onload = function() {
    cv['onRuntimeInitialized'] = () => {
        console.log('OpenCV.js is ready.');
    };

    document.getElementById('imageInput').addEventListener('change', function(e) {
        let imgElement = document.createElement('img');
        imgElement.src = URL.createObjectURL(e.target.files[0]);

        imgElement.onload = function() {
            let src = cv.imread(imgElement);
            let gray = new cv.Mat();
            let blurred = new cv.Mat();
            let edges = new cv.Mat();
            let contours = new cv.MatVector();
            let hierarchy = new cv.Mat();

            // Convert to grayscale
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

            // Apply Gaussian Blur to reduce noise and improve edge detection
            cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

            // Edge detection
            cv.Canny(blurred, edges, 50, 150);

            // Find contours
            cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

            // Draw contours on the original image
            for (let i = 0; i < contours.size(); i++) {
                let color = new cv.Scalar(0, 255, 0); // Green color for contours
                cv.drawContours(src, contours, i, color, 2, cv.LINE_8, hierarchy, 100);
            }

            // Resize and display the processed mosaic image
            let dst = new cv.Mat();
            let dsize = new cv.Size(1200, 1200);
            cv.resize(src, dst, dsize, 0, 0, cv.INTER_AREA);
            cv.imshow('processedImage', dst);

            // Clear the previous container content
            document.getElementById('gridContainer').innerHTML = '';

            // Create an array to hold the bounding boxes
            let boundingBoxes = [];
            for (let i = 0; i < contours.size(); i++) {
                let rect = cv.boundingRect(contours.get(i));
                boundingBoxes.push(rect);
            }

            // Sort the bounding boxes by y-coordinate first, then by x-coordinate
            boundingBoxes.sort((a, b) => {
                if (a.y === b.y) {
                    return a.x - b.x;
                }
                return a.y - b.y;
            });

            // Loop through the sorted bounding boxes and crop the stone images
            boundingBoxes.forEach((rect, i) => {
                let cropped = src.roi(rect);

                // Resize each cropped image to 150x150
                let resized = new cv.Mat();
                let stoneSize = new cv.Size(150, 150);
                cv.resize(cropped, resized, stoneSize, 0, 0, cv.INTER_AREA);

                // Create a canvas element for the resized image
                let canvas = document.createElement('canvas');
                canvas.width = 150;
                canvas.height = 150;
                let ctx = canvas.getContext('2d');

                // Convert Mat to ImageData
                let imgData = new ImageData(new Uint8ClampedArray(resized.data), resized.cols, resized.rows);
                ctx.putImageData(imgData, 0, 0);

                // Append the canvas to the grid container
                document.getElementById('gridContainer').appendChild(canvas);

                // Clean up
                cropped.delete();
                resized.delete();
            });

            // Clean up
            src.delete();
            gray.delete();
            blurred.delete();
            edges.delete();
            contours.delete();
            hierarchy.delete();
            dst.delete();

            console.log('Stone extraction complete.');
        };
    });
};
