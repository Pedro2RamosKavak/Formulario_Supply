# Placeholder Images for Development

This directory contains placeholder images and videos used for local development.

## Placeholders

- `placeholder.jpg` - Default placeholder image used for any image type
- `crlv_placeholder.jpg` - Placeholder for CRLV (Vehicle Registration Document)
- `frontal_placeholder.jpg` - Placeholder for front view of vehicle 
- `trasera_placeholder.jpg` - Placeholder for rear view of vehicle
- `lateral_izquierdo_placeholder.jpg` - Placeholder for left side view
- `lateral_derecho_placeholder.jpg` - Placeholder for right side view
- `interior_frontal_placeholder.jpg` - Placeholder for front interior
- `interior_trasero_placeholder.jpg` - Placeholder for rear interior
- `sample_video.mp4` - Sample video file used for video previews

## Usage

These placeholders are served by the mock file endpoint when testing the application
in development mode without AWS S3 credentials.

You can add additional placeholder images here and update the `imagePlaceholders` object
in the `/api/mock-file/:filename` endpoint in `app.js` to use them. 