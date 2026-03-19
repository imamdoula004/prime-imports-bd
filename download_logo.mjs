import fs from 'fs';
import https from 'https';

const url = 'https://lh3.googleusercontent.com/aida/AOfcidW0kT6SK8Epw9UOfIfKvweYoqTOLi47C9WvLoJ0FvtAgahOGcmk0AtjjWwSvWVBSu5dfh0MkFXJKPzeSuxrIaJ8KSMqwZ2KNh700eV1nhXQoLxVBiyoqQf1iDdcIVk-BcFXTAOV-XbmI9s64M0niNkk7oZ44KbImeuCCs6T88eWHOc1m_fZpa0fhx24R1cgsFz4685VI81MUM-ap6E1kyYyfT1wJV3X1DsKFjbJ2iScvyd_4TiMCTI40bxRpKTqmpYFEeKGPbFC8g';
const dest = 'public/brand_logo.png';

https.get(url, (res) => {
    const fileStream = fs.createWriteStream(dest);
    res.pipe(fileStream);
    fileStream.on('finish', () => {
        fileStream.close();
        console.log('Logo downloaded successfully to ' + dest);
    });
}).on('error', (err) => {
    console.error('Error downloading logo:', err.message);
});
