const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (filePath, folder = 'products') => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: `sourcecomputer/${folder}`,
            resource_type: 'auto',
            transformation: [
                { quality: 'auto:best', fetch_format: 'auto' }
            ]
        });
        return {
                success: true,
                url: result.secure_url,
                publicId: result.public_id
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return { success: false, error: error.message };
    }
};

const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
        return { success: true };
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        return { success: false, error: error.message };
    }
};

const deleteMultipleFromCloudinary = async (publicIds) => {
    try {
        const publicIdStrings = publicIds.filter(id => typeof id === 'string' && id.includes('/'));
        if (publicIdStrings.length === 0) return { success: true };
        
        await cloudinary.api.delete_resources(publicIdStrings);
        return { success: true };
    } catch (error) {
        console.error('Cloudinary bulk delete error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    cloudinary,
    uploadToCloudinary,
    deleteFromCloudinary,
    deleteMultipleFromCloudinary
};